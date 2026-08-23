/**
 * AppNavigator — route-wiring integration tests (Task 14).
 *
 * Renders the REAL AppProvider + AppNavigator (native-stack) over the real
 * validated content corpus, closing the integration seams the unit/component
 * suites leave open:
 *   - the boot route decision `progress ? LevelPlay : StartPoint` is exercised
 *     at the route level (not just the provider level);
 *   - the LevelPlay → Result handoff (`onLevelEnd` → `completeLevel` → Result
 *     params) is driven end-to-end through a real pass-by-streak;
 *   - Result's "Continue to <next level>" replaces into the next LevelPlay;
 *   - a returning player with saved progress resumes straight into their current
 *     level — StartPoint is never rendered.
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

describe('AppNavigator — route wiring', () => {
  it('chooses Basic from StartPoint and routes pass → Result → next level', async () => {
    const store = createStore();
    const tree = await renderApp(store);

    // Multiple eligible tracks show the existing first-launch choice flow.
    expect(countHostByTestID(tree, 'start-point-screen')).toBe(1);
    expect(countHostByTestID(tree, 'level-play-screen')).toBe(0);
    await press(tree, 'start-choice-basic');
    expect(countHostByTestID(tree, 'level-play-screen')).toBe(1);
    expect(countHostByTestID(tree, 'start-point-screen')).toBe(0);
    const boot = await loadProgress(store);
    expect(boot?.currentLevelId).toBe('b01');
    expect(boot?.completedLevelIds).toEqual([]);

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

    // Unmount so the NavigationContainer's timers/listeners release (Jest teardown).
    await ReactTestRenderer.act(() => tree.unmount());
  });

  it('resumes a returning player straight into their current level — StartPoint not shown', async () => {
    const store = createStore();
    await saveProgress(
      createInitialProgress(tracks, { trackId: 'basic', levelNumber: 5 }),
      store,
    );
    const tree = await renderApp(store);

    expect(countHostByTestID(tree, 'start-point-screen')).toBe(0);
    expect(countHostByTestID(tree, 'level-play-screen')).toBe(1);
    // The served question belongs to b05's bank — the resume target, not b01.
    expect(renderedQuestionBelongsTo(tree, 'b05')).toBe(true);

    await ReactTestRenderer.act(() => tree.unmount());
  });
});
