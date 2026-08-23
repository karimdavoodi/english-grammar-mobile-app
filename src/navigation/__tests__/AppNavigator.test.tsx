/**
 * AppNavigator — route-wiring integration tests (docs/ui-plan.md Task 6).
 *
 * Renders the REAL AppProvider + AppNavigator (native-stack) over the real
 * validated content corpus, closing the integration seams the unit/component
 * suites leave open:
 *   - the Home-first boot decision is exercised at the route level: a new
 *     player (no progress) and a returning player (saved progress) both land on
 *     Home — StartPoint is never rendered;
 *   - Home → Topics → LevelPlay → Result → next level runs end-to-end through a
 *     real pass-by-streak, with the first topic tap creating the starting point;
 *   - a returning player resumes into their current level from Home's Resume
 *     button, and can also pick a track → Topics → replay an unlocked level;
 *   - a Settings reset replaces the stack with Home (never StartPoint).
 *
 * Requires the Jest `transformIgnorePatterns` override in jest.config.js so
 * @react-navigation / react-native-screens ESM transform for a real render.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
}));

import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { AppProvider } from '../../app/AppProvider';
import { findLevelById, tracks } from '../../content';
import type { QuestionUnion } from '../../content/types';
import { createInitialProgress } from '../../state/reducers';
import { loadProgress, saveProgress, type StorageLike } from '../../state/storage';
import { wrapInSafeArea } from '../../test-utils';
import { AppNavigator } from '../AppNavigator';

function createStore(): StorageLike {
  const data = new Map<string, string>();
  return {
    async getItem(key) {
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
}

async function renderApp(store: StorageLike) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      wrapInSafeArea(
        <AppProvider store={store}>
          <AppNavigator />
        </AppProvider>,
      ),
    );
  });
  // Let the async boot (load + auto-start persist) and the fresh session
  // persistence drain before the first assertion.
  for (let i = 0; i < 3; i++) {
    await ReactTestRenderer.act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });
  }
  return tree;
}

async function press(tree: ReactTestRenderer.ReactTestRenderer, testID: string) {
  await ReactTestRenderer.act(() => {
    tree.root.findByProps({ testID }).props.onPress();
  });
  for (let i = 0; i < 2; i++) {
    await ReactTestRenderer.act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });
  }
}

function textOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  const children = tree.root.findByProps({ testID }).props.children;
  if (Array.isArray(children)) {
    return children.map(child => String(child)).join('');
  }
  return String(children);
}

function countHostByTestID(tree: ReactTestRenderer.ReactTestRenderer, testID: string): number {
  return tree.root.findAll(node => typeof node.type === 'string' && node.props.testID === testID)
    .length;
}

function renderedQuestionBelongsTo(tree: ReactTestRenderer.ReactTestRenderer, levelId: string): boolean {
  const level = findLevelById(tracks, levelId)!;
  const prompt = textOf(tree, 'question-prompt');
  if (tree.root.findAllByProps({ testID: 'word-order-card' }).length > 0) {
    return level.questions.some(q => (q as QuestionUnion).type === 'word_order');
  }
  if (tree.root.findAllByProps({ testID: 'fix-sentence-card' }).length > 0) {
    return level.questions.some(q => (q as QuestionUnion).type === 'fix_sentence');
  }
  return level.questions.some(q => q.prompt === prompt);
}

/** Submit the correct response for whatever question is currently rendered. */
async function pressCorrectAnswer(
  tree: ReactTestRenderer.ReactTestRenderer,
  levelId: string,
): Promise<void> {
  const prompt = textOf(tree, 'question-prompt');
  const level = findLevelById(tracks, levelId)!;
  const question = level.questions.find(q => q.prompt === prompt) ??
    (tree.root.findAllByProps({ testID: 'word-order-card' }).length > 0
      ? level.questions.find(q => (q as QuestionUnion).type === 'word_order')
      : tree.root.findAllByProps({ testID: 'fix-sentence-card' }).length > 0
        ? level.questions.find(q => (q as QuestionUnion).type === 'fix_sentence')
        : undefined);
  if (!question) {
    throw new Error(`No question in ${levelId} matches the rendered prompt "${prompt}".`);
  }
  const typed = question as QuestionUnion;
  if (typed.type === 'fill_blank') {
    tree.root.findByProps({ testID: 'fill-blank-input' }).props.onChangeText(typed.correctAnswer);
    await press(tree, 'fill-blank-submit');
  } else if (typed.type === 'word_order') {
    for (let index = 0; index < typed.sentenceWords.length; index += 1) {
      await press(tree, `word-order-word-${index}`);
    }
    await press(tree, 'word-order-submit');
  } else {
    await press(tree, `choice-button-${typed.correctIndex}`);
  }
}

describe('AppNavigator — Home-first boot', () => {
  it('boots a new player to Home (never StartPoint) with no Resume', async () => {
    const store = createStore();
    const tree = await renderApp(store);

    expect(countHostByTestID(tree, 'home-screen')).toBe(1);
    expect(countHostByTestID(tree, 'home-resume')).toBe(0);
    expect(countHostByTestID(tree, 'start-point-screen')).toBe(0);
    expect(textOf(tree, 'home-progress-summary')).toBe('Pick a level to begin');

    await ReactTestRenderer.act(() => tree.unmount());
  });

  it('flows a new player Home → Topics → LevelPlay → Result → next level', async () => {
    const store = createStore();
    const tree = await renderApp(store);

    // Pick the Basic track → Topics lists its topics (all available first-time).
    await press(tree, 'home-track-basic');
    expect(countHostByTestID(tree, 'topics-screen')).toBe(1);

    // First topic tap creates the starting point and opens LevelPlay.
    await press(tree, 'topics-level-b01');
    expect(countHostByTestID(tree, 'level-play-screen')).toBe(1);
    const boot = await loadProgress(store);
    expect(boot?.currentLevelId).toBe('b01');
    expect(boot?.startingPoint).toEqual({ trackId: 'basic', levelNumber: 1 });

    // Pass b01 by streak: 3 correct answers in a row.
    const b01 = findLevelById(tracks, 'b01')!;
    for (let i = 0; i < 3; i++) {
      await pressCorrectAnswer(tree, 'b01');
      await press(tree, 'next-question');
    }

    // Result route: pass-by-streak message + the frontier advanced underneath.
    expect(countHostByTestID(tree, 'result-screen')).toBe(1);
    expect(textOf(tree, 'result-heading')).toBe('Streak!');
    expect(textOf(tree, 'result-level-title')).toBe(b01.title);
    const afterPass = await loadProgress(store);
    expect(afterPass?.completedLevelIds).toEqual(['b01']);
    expect(afterPass?.currentLevelId).toBe('b02');
    expect(afterPass?.activeSession).toBeNull();

    // Continue → replaces into LevelPlay for the next level (b02).
    await press(tree, 'result-continue');
    expect(countHostByTestID(tree, 'level-play-screen')).toBe(1);
    expect(countHostByTestID(tree, 'result-screen')).toBe(0);
    expect(renderedQuestionBelongsTo(tree, 'b02')).toBe(true);

    await ReactTestRenderer.act(() => tree.unmount());
  });
});

describe('AppNavigator — returning player', () => {
  it('lands on Home and resumes into the current level via the Resume button', async () => {
    const store = createStore();
    await saveProgress(
      createInitialProgress(tracks, { trackId: 'basic', levelNumber: 5 }),
      store,
    );
    const tree = await renderApp(store);

    expect(countHostByTestID(tree, 'home-screen')).toBe(1);
    expect(countHostByTestID(tree, 'home-resume')).toBe(1);
    expect(countHostByTestID(tree, 'start-point-screen')).toBe(0);

    await press(tree, 'home-resume');
    expect(countHostByTestID(tree, 'level-play-screen')).toBe(1);
    // The served question belongs to b05's bank — the resume target, not b01.
    expect(renderedQuestionBelongsTo(tree, 'b05')).toBe(true);

    await ReactTestRenderer.act(() => tree.unmount());
  });

  it('replays an unlocked earlier level via Home → Topics', async () => {
    const store = createStore();
    await saveProgress(
      createInitialProgress(tracks, { trackId: 'basic', levelNumber: 5 }),
      store,
    );
    const tree = await renderApp(store);

    await press(tree, 'home-track-basic');
    expect(countHostByTestID(tree, 'topics-screen')).toBe(1);

    // b03 is before the b05 frontier, so it is unlocked and tappable.
    await press(tree, 'topics-level-b03');
    expect(countHostByTestID(tree, 'level-play-screen')).toBe(1);
    expect(renderedQuestionBelongsTo(tree, 'b03')).toBe(true);

    await ReactTestRenderer.act(() => tree.unmount());
  });
});

describe('AppNavigator — reset', () => {
  it('lands on Home (never StartPoint) after a Settings reset', async () => {
    const store = createStore();
    await saveProgress(
      createInitialProgress(tracks, { trackId: 'basic', levelNumber: 1 }),
      store,
    );
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      // Settings' reset is confirmed through a native Alert — confirm it.
      const reset = buttons?.find(button => button.text === 'Reset');
      reset?.onPress?.();
    });

    try {
      const tree = await renderApp(store);
      expect(countHostByTestID(tree, 'home-screen')).toBe(1);

      await press(tree, 'home-settings');
      expect(countHostByTestID(tree, 'settings-screen')).toBe(1);

      await press(tree, 'settings-reset');

      // After a reset with multiple eligible tracks progress is null and the
      // stack lands on the empty Home state — never StartPoint.
      expect(countHostByTestID(tree, 'home-screen')).toBe(1);
      expect(countHostByTestID(tree, 'start-point-screen')).toBe(0);
      expect(textOf(tree, 'home-progress-summary')).toBe('Pick a level to begin');
      expect(await loadProgress(store)).toBeNull();

      await ReactTestRenderer.act(() => tree.unmount());
    } finally {
      alertSpy.mockRestore();
    }
  });
});
