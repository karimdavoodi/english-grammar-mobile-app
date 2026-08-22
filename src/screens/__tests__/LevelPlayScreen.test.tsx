/**
 * Tests for the LevelPlayScreen loop: serve → answer → feedback → next, with
 * persistence after every answer and the level-end handoff.
 *
 * Coverage maps to the Task 7B acceptance criteria: resume, abandon,
 * wrong-answer persistence, and the remediation-versus-review mode rule. The
 * screen is driven through a fixture level with an injectable deterministic
 * `random` (always the first item of any pool) and a memory store, so serving
 * order and persisted progress are both predictable.
 */

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
    },
  };
});

import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { Level, Question } from '../../content/types';
import {
  CURRENT_PROGRESS_VERSION,
  loadProgress,
  type StorageLike,
} from '../../state/storage';
import type { Progress } from '../../state/types';
import { LevelPlayScreen } from '../LevelPlayScreen';

const RULE_A = 'past_perfect_form';
const RULE_B = 'past_perfect_vs_past_simple';

function makeQ(id: string, rule: string, correctIndex: number): Question {
  return {
    id,
    levelId: 'b10',
    rule,
    prompt: `Prompt ${id}`,
    choices: ['alpha', 'bravo', 'charlie', 'delta'],
    correctIndex,
    choiceExplanations: ['why alpha', 'why bravo', 'why charlie', 'why delta'],
  };
}

const QUESTIONS: Question[] = [
  makeQ('b10q01', RULE_A, 0),
  makeQ('b10q02', RULE_A, 1),
  makeQ('b10q03', RULE_A, 2),
  makeQ('b10q04', RULE_B, 0),
  makeQ('b10q05', RULE_B, 1),
  makeQ('b10q06', RULE_B, 2),
];

const LEVEL: Level = {
  id: 'b10',
  trackId: 'basic',
  number: 10,
  title: 'Past Perfect',
  topic: {
    title: 'Past Perfect',
    summary: 'The past perfect describes an action completed before another past action.',
    rules: [
      {
        rule: RULE_A,
        title: 'Form: had + past participle',
        explanation: "Formed with 'had' + the past participle.",
        example: 'They had finished dinner before we arrived.',
      },
      {
        rule: RULE_B,
        title: 'Past Perfect vs Past Simple',
        explanation: 'Use past simple for the later action and past perfect for the earlier one.',
        example: 'The train had left by the time we arrived.',
      },
    ],
  },
  questions: QUESTIONS,
};

/**
 * A 12-question fixture bank — the real mercy cap needs a bank ≥ 12 so the
 * screen never runs dry before the cap (validateContent enforces this for the
 * real corpus; here it lets a screen-level test drive the real 12-answer cap).
 */
const TWELVE_QUESTIONS: Question[] = Array.from({ length: 12 }, (_, i) =>
  makeQ(`b10q${String(i + 1).padStart(2, '0')}`, i < 6 ? RULE_A : RULE_B, i % 4),
);

const TWELVE_LEVEL: Level = { ...LEVEL, questions: TWELVE_QUESTIONS };

function makeProgress(overrides: Partial<Progress> = {}): Progress {
  return {
    version: CURRENT_PROGRESS_VERSION,
    startingPoint: { trackId: 'basic', levelNumber: 1 },
    completedLevelIds: [],
    currentLevelId: 'b10',
    activeSession: null,
    weaknessQueue: {},
    wrongAnswers: {},
    ...overrides,
  };
}

function createMemoryStore(): StorageLike {
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

/** Give the serialized persistence drain time to land its writes. */
async function flushAsync() {
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
  });
}

interface RenderOptions {
  initialProgress: Progress;
  level?: Level;
  onLevelEnd?: jest.Mock;
  onExit?: jest.Mock;
  passConfig?: { passStreak: number; passVolume: number; mercyCap: number };
  random?: () => number;
  store?: StorageLike;
}

async function renderScreen({
  initialProgress,
  level = LEVEL,
  onLevelEnd = jest.fn(),
  onExit = jest.fn(),
  passConfig,
  random = () => 0,
  store = createMemoryStore(),
}: RenderOptions) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <LevelPlayScreen
        level={level}
        initialProgress={initialProgress}
        store={store}
        random={random}
        passConfig={passConfig}
        onLevelEnd={onLevelEnd}
        onExit={onExit}
      />,
    );
  });
  await flushAsync();
  return { tree, store, onLevelEnd, onExit };
}

/** Map the currently rendered question prompt back to its fixture question. */
function servedQuestion(tree: ReactTestRenderer.ReactTestRenderer, bank: Question[]): Question {
  const prompt = textOf(tree, 'question-prompt');
  const question = bank.find(q => q.prompt === prompt);
  if (!question) {
    throw new Error(`No fixture question for prompt "${prompt}".`);
  }
  return question;
}

/** A deterministic wrong choice for a question (any non-correct index). */
function wrongIndexOf(question: Question): number {
  return (question.correctIndex + 1) % question.choices.length;
}

async function press(tree: ReactTestRenderer.ReactTestRenderer, testID: string) {
  await ReactTestRenderer.act(() => {
    tree.root.findByProps({ testID }).props.onPress();
  });
  await flushAsync();
}

function textOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  const children = tree.root.findByProps({ testID }).props.children;
  if (Array.isArray(children)) {
    return children.map(child => String(child)).join('');
  }
  return String(children);
}

/** Count rendered host components with a testID (filters composite proxies). */
function countHostByTestID(tree: ReactTestRenderer.ReactTestRenderer, testID: string): number {
  return tree.root.findAll(node => typeof node.type === 'string' && node.props.testID === testID)
    .length;
}

describe('LevelPlayScreen — fresh level', () => {
  it('serves the first question from the bank and shows the header', async () => {
    const { tree } = await renderScreen({ initialProgress: makeProgress() });
    expect(textOf(tree, 'question-prompt')).toBe('Prompt b10q01');
    expect(textOf(tree, 'progress-streak')).toBe('Streak: 0');
    expect(textOf(tree, 'progress-correct')).toBe('Correct: 0');
    expect(textOf(tree, 'progress-answered')).toBe('Answered: 0/12');
    expect(countHostByTestID(tree, 'lesson-card')).toBe(0);
  });

  it('confirms a correct answer with feedback and advances to the next question', async () => {
    const { tree } = await renderScreen({ initialProgress: makeProgress() });
    await press(tree, 'choice-button-0'); // q1 correctIndex 0

    const correct = tree.root.findByProps({ testID: 'choice-button-0' });
    expect(correct.props.accessibilityLabel).toContain('correct');
    expect(countHostByTestID(tree, 'lesson-card')).toBe(0);

    await press(tree, 'next-question');
    expect(textOf(tree, 'question-prompt')).toBe('Prompt b10q02');
    expect(textOf(tree, 'progress-streak')).toBe('Streak: 1');
  });
});

describe('LevelPlayScreen — wrong answers', () => {
  it('shows the lesson card, reveals the rationale, and persists the weakness', async () => {
    const store = createMemoryStore();
    const { tree } = await renderScreen({ initialProgress: makeProgress(), store });

    await press(tree, 'choice-button-1'); // q1 correctIndex 0 → wrong

    // Lesson card + revealed question with the correct choice highlighted
    expect(countHostByTestID(tree, 'lesson-card')).toBe(1);
    expect(tree.root.findByProps({ testID: 'choice-button-0' }).props.accessibilityLabel).toContain(
      'correct',
    );
    expect(tree.root.findByProps({ testID: 'choice-button-1' }).props.accessibilityLabel).toContain(
      'incorrect',
    );

    // Persisted immediately: weakness queue + wrong-answer history
    const persisted = await loadProgress(store);
    expect(persisted?.weaknessQueue[RULE_A]).toMatchObject({
      rule: RULE_A,
      missCount: 1,
      reviewStreak: 0,
    });
    expect(persisted?.wrongAnswers.b10q01).toMatchObject({
      questionId: 'b10q01',
      count: 1,
      lastChosenIndex: 1,
    });
    expect(persisted?.activeSession?.lastWrongRule).toBe(RULE_A);
  });

  it('serves the next question adaptively (remediation) after dismissing the lesson', async () => {
    const store = createMemoryStore();
    const { tree } = await renderScreen({ initialProgress: makeProgress(), store });

    await press(tree, 'choice-button-1'); // q1 wrong
    await press(tree, 'lesson-continue');

    // Same-rule unasked variant, served as remediation (never Review)
    expect(textOf(tree, 'question-prompt')).toBe('Prompt b10q02');
    await press(tree, 'choice-button-1'); // q2 correctIndex 1 → correct

    const persisted = await loadProgress(store);
    // The correct remediation answer must NOT advance reviewStreak
    expect(persisted?.weaknessQueue[RULE_A]).toMatchObject({
      rule: RULE_A,
      missCount: 1,
      reviewStreak: 0,
    });
  });
});

describe('LevelPlayScreen — resume', () => {
  it('resumes the saved session counters and never re-serves asked questions', async () => {
    const initialProgress = makeProgress({
      activeSession: {
        levelId: 'b10',
        askedIds: ['b10q01', 'b10q02'],
        correctCount: 1,
        streak: 1,
        totalAnswered: 2,
        missCounts: {},
        lastWrongRule: null,
      },
    });
    const { tree } = await renderScreen({ initialProgress });

    expect(textOf(tree, 'question-prompt')).toBe('Prompt b10q03'); // first unasked
    expect(textOf(tree, 'progress-streak')).toBe('Streak: 1');
    expect(textOf(tree, 'progress-correct')).toBe('Correct: 1');
    expect(textOf(tree, 'progress-answered')).toBe('Answered: 2/12');
  });

  it('resumes missCounts + lastWrongRule: re-teaches then re-serves the missed rule (remediation)', async () => {
    const initialProgress = makeProgress({
      weaknessQueue: {
        [RULE_B]: { rule: RULE_B, missCount: 1, reviewStreak: 0, lastMissedAt: 'x' },
      },
      activeSession: {
        levelId: 'b10',
        askedIds: ['b10q01'],
        correctCount: 0,
        streak: 0,
        totalAnswered: 1,
        missCounts: { [RULE_A]: 2 }, // re-teach threshold reached in the saved session
        lastWrongRule: RULE_A,
      },
    });
    const { tree } = await renderScreen({ initialProgress });

    // Re-teach lesson shows before the next question (rule missed twice in-session).
    expect(countHostByTestID(tree, 'lesson-card')).toBe(1);
    await press(tree, 'lesson-continue');

    // The same-rule unasked variant is served (remediation resumes) — not the
    // queued Review question (b10q04+), because remediation wins the priority.
    expect(textOf(tree, 'question-prompt')).toBe('Prompt b10q02');
    expect(countHostByTestID(tree, 'lesson-card')).toBe(0);
  });
});

describe('LevelPlayScreen — abandon', () => {
  it('clears only the active session after confirmation', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onExit = jest.fn();
    const store = createMemoryStore();
    const initialProgress = makeProgress({
      completedLevelIds: ['b01'],
      weaknessQueue: {
        [RULE_A]: { rule: RULE_A, missCount: 1, reviewStreak: 0, lastMissedAt: 'x' },
      },
      activeSession: {
        levelId: 'b10',
        askedIds: ['b10q01'],
        correctCount: 0,
        streak: 0,
        totalAnswered: 1,
        missCounts: { [RULE_A]: 1 },
        lastWrongRule: RULE_A,
      },
    });
    const { tree } = await renderScreen({ initialProgress, store, onExit });

    await press(tree, 'abandon-level');
    expect(alertSpy).toHaveBeenCalledTimes(1);
    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      style?: string;
      onPress?: () => void;
    }>;
    const quit = buttons.find(b => b.text === 'Quit');
    await ReactTestRenderer.act(() => {
      quit!.onPress!();
    });
    await flushAsync();

    expect(onExit).toHaveBeenCalledTimes(1);
    const persisted = await loadProgress(store);
    expect(persisted?.activeSession).toBeNull();
    expect(persisted?.completedLevelIds).toEqual(['b01']);
    expect(persisted?.weaknessQueue[RULE_A].missCount).toBe(1);
    alertSpy.mockRestore();
  });
});

describe('LevelPlayScreen — level end', () => {
  it('passes by streak and reports onLevelEnd', async () => {
    const onLevelEnd = jest.fn();
    const passConfig = { passStreak: 3, passVolume: 8, mercyCap: 12 };
    const { tree } = await renderScreen({ initialProgress: makeProgress(), onLevelEnd, passConfig });

    await press(tree, 'choice-button-0'); // q1 correct
    await press(tree, 'next-question');
    await press(tree, 'choice-button-1'); // q2 correct
    await press(tree, 'next-question');
    await press(tree, 'choice-button-2'); // q3 correct → passed by streak
    await press(tree, 'next-question');

    expect(onLevelEnd).toHaveBeenCalledTimes(1);
    const result = onLevelEnd.mock.calls[0][0];
    expect(result.outcome.passed).toBe(true);
    expect(result.outcome.passReason).toBe('streak');
  });

  it('mercy-ends and reports onLevelEnd', async () => {
    const onLevelEnd = jest.fn();
    const passConfig = { passStreak: 3, passVolume: 8, mercyCap: 3 };
    const { tree } = await renderScreen({ initialProgress: makeProgress(), onLevelEnd, passConfig });

    // 3 wrong answers in a row → mercy cap. Re-teach shows the lesson first from q3 on.
    await press(tree, 'choice-button-1'); // q1 wrong
    await press(tree, 'lesson-continue');
    await press(tree, 'choice-button-0'); // q2 wrong
    await press(tree, 'lesson-continue');
    await press(tree, 'lesson-continue'); // re-teach lesson before q3
    await press(tree, 'choice-button-3'); // q3 wrong → mercy
    await press(tree, 'lesson-continue'); // dismiss final feedback

    expect(onLevelEnd).toHaveBeenCalledTimes(1);
    const result = onLevelEnd.mock.calls[0][0];
    expect(result.outcome.endedByMercy).toBe(true);
    expect(result.outcome.passed).toBe(false);
  });

  it('mercy-ends at the real 12-question cap with the default pass config', async () => {
    const onLevelEnd = jest.fn();
    const { tree } = await renderScreen({
      initialProgress: makeProgress(),
      onLevelEnd,
      level: TWELVE_LEVEL,
    });

    // Answer every question wrong. A re-teach lesson shows before a question whose
    // rule has been missed twice in-session — dismiss it before each answer.
    for (let answered = 0; answered < 12; answered++) {
      if (countHostByTestID(tree, 'lesson-card') > 0) {
        await press(tree, 'lesson-continue');
      }
      const question = servedQuestion(tree, TWELVE_QUESTIONS);
      await press(tree, `choice-button-${wrongIndexOf(question)}`);
      await press(tree, 'lesson-continue'); // wrong-answer feedback lesson
    }

    expect(onLevelEnd).toHaveBeenCalledTimes(1);
    const result = onLevelEnd.mock.calls[0][0];
    expect(result.outcome.endedByMercy).toBe(true);
    expect(result.outcome.passed).toBe(false);
    expect(result.session.totalAnswered).toBe(12); // the real mercy cap
    expect(result.session.correctCount).toBe(0); // never passed on volume
    expect(result.session.streak).toBe(0); // never passed on streak
  });
});

describe('LevelPlayScreen — Review mode', () => {
  it('serves a pre-queued rule as Review; a correct answer advances reviewStreak and counts toward the level', async () => {
    const store = createMemoryStore();
    const initialProgress = makeProgress({
      weaknessQueue: {
        [RULE_B]: { rule: RULE_B, missCount: 1, reviewStreak: 0, lastMissedAt: 'x' },
      },
    });
    const { tree } = await renderScreen({ initialProgress, store });

    // The queued rule's question is served first, as Review
    expect(textOf(tree, 'question-prompt')).toBe('Prompt b10q04');
    await press(tree, 'choice-button-0'); // q4 correctIndex 0 → correct

    const persisted = await loadProgress(store);
    expect(persisted?.weaknessQueue[RULE_B]).toMatchObject({
      rule: RULE_B,
      missCount: 1,
      reviewStreak: 1,
    });
    // Review answers count normally toward level scoring
    expect(persisted?.activeSession?.correctCount).toBe(1);
    expect(persisted?.activeSession?.totalAnswered).toBe(1);
  });
});
