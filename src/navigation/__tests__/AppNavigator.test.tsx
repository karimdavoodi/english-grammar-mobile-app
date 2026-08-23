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
import { Alert, BackHandler, Platform } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { AppProvider } from '../../app/AppProvider';
import { findLevelById, tracks } from '../../content';
import type { QuestionUnion } from '../../content/types';
import { createInitialProgress } from '../../state/reducers';
import { loadProgress, saveProgress, type StorageLike } from '../../state/storage';
import { loadReports } from '../../state/reports';
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

  it('continues the same session from Result via "Keep practicing" (not a restart)', async () => {
    const store = createStore();
    const tree = await renderApp(store);

    // Pick the Basic track → open b01 and pass it by streak.
    await press(tree, 'home-track-basic');
    await press(tree, 'topics-level-b01');
    for (let i = 0; i < 3; i++) {
      await pressCorrectAnswer(tree, 'b01');
      await press(tree, 'next-question');
    }

    // Result: the streak message with the alternate keep-practicing action.
    expect(textOf(tree, 'result-heading')).toBe('Streak!');
    expect(countHostByTestID(tree, 'result-keep-practicing')).toBe(1);

    // Keep practicing → replaces into LevelPlay for the SAME level (b01),
    // CONTINUING the session — the streak / correct / answered counters survive.
    await press(tree, 'result-keep-practicing');
    expect(countHostByTestID(tree, 'level-play-screen')).toBe(1);
    expect(countHostByTestID(tree, 'result-screen')).toBe(0);
    expect(renderedQuestionBelongsTo(tree, 'b01')).toBe(true);
    expect(textOf(tree, 'progress-streak')).toBe('Streak: 3');
    expect(textOf(tree, 'progress-correct')).toBe('Correct: 3');
    expect(textOf(tree, 'progress-answered')).toBe('Answered: 3/12');

    // Practice mode never re-passes: another correct answer keeps the level
    // playing (streak 4, answered 4) instead of bouncing back to Result.
    await pressCorrectAnswer(tree, 'b01');
    await press(tree, 'next-question');
    expect(countHostByTestID(tree, 'result-screen')).toBe(0);
    expect(textOf(tree, 'progress-streak')).toBe('Streak: 4');
    expect(textOf(tree, 'progress-answered')).toBe('Answered: 4/12');

    // The level stays completed, the frontier stays put, and the practice
    // session is persisted as resumable.
    const afterPractice = await loadProgress(store);
    expect(afterPractice?.completedLevelIds).toEqual(['b01']);
    expect(afterPractice?.currentLevelId).toBe('b02');
    expect(afterPractice?.activeSession).toMatchObject({ practice: true });

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

describe('AppNavigator — Review general-feedback report (Task 4)', () => {
  it('Review → "Report a problem" creates an editable general-feedback draft and opens Report', async () => {
    const store = createStore();
    await saveProgress(
      {
        ...createInitialProgress(tracks, { trackId: 'basic', levelNumber: 1 }),
        wrongAnswers: {
          b01q01: {
            questionId: 'b01q01',
            count: 1,
            lastChosenIndex: 2,
            lastMissedAt: '2026-08-01T10:00:00.000Z',
          },
        },
      },
      store,
    );
    const tree = await renderApp(store);

    // Home → Review (the review shortcut renders because progress exists).
    await press(tree, 'home-review');
    expect(countHostByTestID(tree, 'review-screen')).toBe(1);

    // The single report action opens Report with an editable general-feedback
    // draft — no per-question report, no empty outbox, no fake question id.
    await press(tree, 'review-report-problem');
    expect(countHostByTestID(tree, 'report-screen')).toBe(1);
    expect(textOf(tree, 'report-question-general-review-feedback')).toBe('General feedback');
    expect(countHostByTestID(tree, 'report-general-review-feedback')).toBe(1);

    // The draft is persisted so the note editor / export flow can use it.
    const reports = await loadReports(store);
    expect(reports.map(report => report.questionId)).toEqual(['general-review-feedback']);
    expect(reports[0].note).toBe('');

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

describe('AppNavigator — Android exit-confirm is Home-scoped', () => {
  /** Shape of the native hardware-back event (RN does not re-export the type). */
  interface HardwareBackPressEvent {
    readonly type: string;
    readonly timeStamp: number;
  }
  interface BackSubscription {
    listener: (event: HardwareBackPressEvent) => boolean | undefined;
    remove: () => void;
  }
  let listeners: BackSubscription[];
  let exitAppSpy: jest.SpyInstance;
  let alertSpy: jest.SpyInstance;

  /** Dispatch a hardware-back press like RN: newest listener first, stop on true. */
  function emitBackPress(): boolean {
    let consumed = false;
    for (let i = listeners.length - 1; i >= 0; i -= 1) {
      if (listeners[i].listener({ type: 'hardwareBackPress', timeStamp: 0 }) === true) {
        consumed = true;
        break;
      }
    }
    return consumed;
  }

  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
    listeners = [];
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation(
      (_event: string, listener: (event: HardwareBackPressEvent) => boolean | undefined) => {
        const entry: BackSubscription = {
          listener,
          remove: () => {
            const index = listeners.indexOf(entry);
            if (index >= 0) {
              listeners.splice(index, 1);
            }
          },
        };
        listeners.push(entry);
        return { remove: entry.remove };
      },
    );
    exitAppSpy = jest.spyOn(BackHandler, 'exitApp').mockImplementation(() => {});
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // restoreAllMocks also restores replaced properties, but pin iOS so
    // 'android' can never leak into a sibling describe.
    jest.replaceProperty(Platform, 'OS', 'ios');
  });

  it('shows the exit-confirm on Home and removes it once a screen is pushed', async () => {
    const store = createStore();
    const tree = await renderApp(store);

    // Home is focused on boot → at least the exit-confirm listener is active
    // (the container's own back handler registers one too, so count > 0).
    expect(listeners.length).toBeGreaterThan(0);

    // Hardware back on Home → consumed, exit-confirm dialog.
    let consumed = false;
    await ReactTestRenderer.act(() => {
      consumed = emitBackPress();
    });
    expect(consumed).toBe(true);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe('Exit app?');
    expect(alertSpy.mock.calls[0][1]).toBe('Do you want to leave the game?');

    // "No" just closes the dialog; "Yes" exits the app.
    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      style?: string;
      onPress?: () => void;
    }>;
    expect(buttons.find(b => b.text === 'No')?.style).toBe('cancel');
    await ReactTestRenderer.act(() => {
      buttons.find(b => b.text === 'Yes')!.onPress!();
    });
    expect(exitAppSpy).toHaveBeenCalledTimes(1);

    // Push Topics → Home blurs → the Home exit listener is removed.
    const beforePush = listeners.length;
    await press(tree, 'home-track-basic');
    expect(countHostByTestID(tree, 'topics-screen')).toBe(1);
    expect(listeners.length).toBeLessThan(beforePush);

    // Hardware back on Topics → the container's handler pops the stack and no
    // exit dialog appears (the Home listener is no longer active).
    await ReactTestRenderer.act(() => {
      consumed = emitBackPress();
    });
    expect(consumed).toBe(true);
    expect(alertSpy).toHaveBeenCalledTimes(1); // no second dialog

    await ReactTestRenderer.act(() => tree.unmount());
  });

  it('registers no exit-confirm handler on iOS', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const store = createStore();
    const tree = await renderApp(store);

    let consumed = false;
    await ReactTestRenderer.act(() => {
      consumed = emitBackPress();
    });
    // No exit dialog on iOS — the only listener is the container's own back
    // handler, which has nothing to pop at the root (returns false).
    expect(consumed).toBe(false);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(exitAppSpy).not.toHaveBeenCalled();

    await ReactTestRenderer.act(() => tree.unmount());
  });
});

describe('AppNavigator — web back button', () => {
  afterEach(() => {
    // restoreAllMocks also restores replaced properties; pin iOS so 'web' can
    // never leak into a sibling describe.
    jest.restoreAllMocks();
    jest.replaceProperty(Platform, 'OS', 'ios');
  });

  it('shows the floating back arrow on pushed screens and pops back to Home', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const store = createStore();
    const tree = await renderApp(store);

    // Home is the root — no back arrow.
    expect(countHostByTestID(tree, 'home-screen')).toBe(1);
    expect(countHostByTestID(tree, 'web-back-button')).toBe(0);

    // Push Topics → a back exists → the arrow appears.
    await press(tree, 'home-track-basic');
    expect(countHostByTestID(tree, 'topics-screen')).toBe(1);
    expect(countHostByTestID(tree, 'web-back-button')).toBe(1);

    // Tap the arrow → pops back to Home → the arrow disappears.
    await press(tree, 'web-back-button');
    expect(countHostByTestID(tree, 'topics-screen')).toBe(0);
    expect(countHostByTestID(tree, 'home-screen')).toBe(1);
    expect(countHostByTestID(tree, 'web-back-button')).toBe(0);

    await ReactTestRenderer.act(() => tree.unmount());
  });
});
