/**
 * Tests for the level-play reducers (`reducers.ts`): starting/resuming a
 * session, applying one answer across the whole progress slice, and abandoning.
 *
 * Coverage maps to the Task 7B acceptance criteria: resume, abandon,
 * wrong-answer persistence, and the remediation-versus-review rule (only
 * pre-queued Review answers advance `reviewStreak`).
 */

// The reducers import the state types (which share the storage module surface),
// and the progress factory reads the current schema version from storage.ts.
// Mock the native async-storage module so its top-level import resolves in Node.
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

import type { Level, Question, Track } from '../../content/types';
import type { FillBlankQuestion } from '../../content/types';
import { DEFAULT_PASS_CONFIG } from '../../game/levelMachine';
import { CURRENT_PROGRESS_VERSION } from '../storage';
import type { Progress } from '../types';
import {
  abandonSession,
  applyAnswer,
  completeLevel,
  flattenedLevelIds,
  nextLevelId,
  queuedRuleSet,
  recordPlay,
  REVIEW_CLEAR_STREAK,
  startLevelSession,
} from '../reducers';

const RULE_A = 'past_perfect_form';
const RULE_B = 'present_simple_form';

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    levelId: 'b10',
    rule: RULE_A,
    prompt: 'By the time we arrived, the movie ___ .',
    choices: ['starts', 'had started', 'started', 'was started'],
    correctIndex: 1,
    choiceExplanations: ['why wrong', 'why right', 'why wrong', 'why wrong'],
    ...overrides,
  };
}

const qA1 = makeQuestion({ id: 'b10q01' });
const qA2 = makeQuestion({ id: 'b10q02' });
const qB1 = makeQuestion({ id: 'b10q03', rule: RULE_B, correctIndex: 2 });

describe('recordPlay', () => {
  it('starts a streak and records the best streak', () => {
    const next = recordPlay(makeProgress(), '2026-08-22');
    expect(next).toMatchObject({ dailyStreak: 1, bestStreak: 1, lastPlayedDate: '2026-08-22' });
  });

  it('keeps the streak on the same day', () => {
    const progress = makeProgress({ dailyStreak: 3, bestStreak: 3, lastPlayedDate: '2026-08-22' });
    expect(recordPlay(progress, '2026-08-22')).toBe(progress);
  });

  it('increments on the next calendar day, including month boundaries', () => {
    const progress = makeProgress({ dailyStreak: 3, bestStreak: 4, lastPlayedDate: '2026-08-31' });
    expect(recordPlay(progress, '2026-09-01')).toMatchObject({ dailyStreak: 4, bestStreak: 4 });
  });

  it('resets after a gap while preserving the best streak', () => {
    const progress = makeProgress({ dailyStreak: 5, bestStreak: 5, lastPlayedDate: '2026-08-20' });
    expect(recordPlay(progress, '2026-08-22')).toMatchObject({ dailyStreak: 1, bestStreak: 5 });
  });
});

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

/** A progress slice with an active session for the fixture level. */
function progressWithSession(
  overrides: Partial<Progress> = {},
  sessionOverrides: Record<string, unknown> = {},
): Progress {
  return makeProgress({
    activeSession: {
      levelId: 'b10',
      askedIds: [],
      correctCount: 0,
      streak: 0,
      totalAnswered: 0,
      missCounts: {},
      lastWrongRule: null,
      ...sessionOverrides,
    },
    ...overrides,
  });
}

describe('startLevelSession', () => {
  it('creates a fresh session when none is active', () => {
    const next = startLevelSession(makeProgress(), 'b10');
    expect(next.activeSession).toEqual({
      levelId: 'b10',
      askedIds: [],
      correctCount: 0,
      streak: 0,
      totalAnswered: 0,
      missCounts: {},
      lastWrongRule: null,
    });
    expect(next).not.toBe(makeProgress()); // new progress object
  });

  it('resumes a saved session for the same level without touching it', () => {
    const progress = progressWithSession({}, { askedIds: ['b10q01'], streak: 2, correctCount: 2 });
    const next = startLevelSession(progress, 'b10');
    expect(next).toBe(progress);
  });

  it('starts fresh when the active session belongs to another level', () => {
    const progress = progressWithSession({}, { levelId: 'b01', askedIds: ['b01q01'] });
    const next = startLevelSession(progress, 'b10');
    expect(next.activeSession?.levelId).toBe('b10');
    expect(next.activeSession?.askedIds).toEqual([]);
  });
});

describe('applyAnswer — correct answers', () => {
  it('advances the session counters and leaves weakness data untouched', () => {
    const progress = progressWithSession();
    const { progress: next, session, outcome } = applyAnswer({
      progress,
      question: qA1,
      chosenIndex: qA1.correctIndex,
      mode: 'normal',
      now: '2026-08-22T10:00:00.000Z',
    });

    expect(outcome.isCorrect).toBe(true);
    expect(outcome.streak).toBe(1);
    expect(outcome.correctCount).toBe(1);
    expect(session.askedIds).toEqual([qA1.id]);
    expect(next.activeSession).toEqual({
      levelId: 'b10',
      askedIds: ['b10q01'],
      correctCount: 1,
      streak: 1,
      totalAnswered: 1,
      missCounts: {},
      lastWrongRule: null,
    });
    expect(next.weaknessQueue).toEqual({});
    expect(next.wrongAnswers).toEqual({});
  });

  it('clears activeSession when the level passes by streak', () => {
    const config = { ...DEFAULT_PASS_CONFIG, passStreak: 2 };
    let progress = progressWithSession();
    for (const question of [qA1, qA2]) {
      const result = applyAnswer({
        progress,
        question,
        chosenIndex: question.correctIndex,
        mode: 'normal',
        config,
      });
      progress = result.progress;
    }
    expect(progress.activeSession).toBeNull();
  });

  it('clears activeSession when the level mercy-ends', () => {
    const config = { ...DEFAULT_PASS_CONFIG, mercyCap: 3 };
    let progress = progressWithSession();
    for (let i = 0; i < 3; i += 1) {
      const result = applyAnswer({
        progress,
        question: makeQuestion({ id: `b10q${i}` }),
        chosenIndex: 0, // always wrong (correctIndex is 1)
        mode: 'normal',
        config,
      });
      progress = result.progress;
    }
    expect(progress.activeSession).toBeNull();
  });
});

describe('applyAnswer — wrong answers', () => {
  it('upserts the Weakness Queue and records the wrong answer immediately', () => {
    const progress = progressWithSession();
    const { progress: next, outcome } = applyAnswer({
      progress,
      question: qA1,
      chosenIndex: 0,
      mode: 'normal',
      now: '2026-08-22T10:00:00.000Z',
    });

    expect(outcome.isCorrect).toBe(false);
    expect(outcome.streak).toBe(0);
    expect(next.weaknessQueue[RULE_A]).toEqual({
      rule: RULE_A,
      missCount: 1,
      reviewStreak: 0,
      lastMissedAt: '2026-08-22T10:00:00.000Z',
    });
    expect(next.wrongAnswers[qA1.id]).toEqual({
      questionId: qA1.id,
      count: 1,
      lastChosenIndex: 0,
      lastMissedAt: '2026-08-22T10:00:00.000Z',
    });
    // the machine session tracks the miss too
    expect(next.activeSession?.missCounts).toEqual({ [RULE_A]: 1 });
    expect(next.activeSession?.lastWrongRule).toBe(RULE_A);
  });

  it('increments missCount and resets reviewStreak when an already-queued rule is missed', () => {
    const progress = progressWithSession({
      weaknessQueue: {
        [RULE_A]: { rule: RULE_A, missCount: 2, reviewStreak: 1, lastMissedAt: 'x' },
      },
    });
    const { progress: next } = applyAnswer({
      progress,
      question: qA1,
      chosenIndex: 0,
      mode: 'review',
    });

    expect(next.weaknessQueue[RULE_A]).toEqual({
      rule: RULE_A,
      missCount: 3,
      reviewStreak: 0,
      lastMissedAt: expect.any(String),
    });
  });

  it('records a typed response alongside the legacy index field', () => {
    const question: FillBlankQuestion = {
      type: 'fill_blank',
      id: 'b10typed01',
      levelId: 'b10',
      rule: RULE_A,
      prompt: 'She ___ already left.',
      correctAnswer: 'had',
      acceptedAnswers: ['had'],
      explanation: 'Use had for the past perfect.',
    };

    const { progress: next, outcome } = applyAnswer({
      progress: progressWithSession(),
      question,
      response: { type: 'text', text: 'has' },
      mode: 'normal',
      now: '2026-08-22T10:00:00.000Z',
    });

    expect(outcome.isCorrect).toBe(false);
    expect(next.wrongAnswers[question.id]).toEqual({
      questionId: question.id,
      count: 1,
      lastChosenIndex: -1,
      lastResponse: { type: 'text', text: 'has' },
      lastMissedAt: '2026-08-22T10:00:00.000Z',
    });
  });
});

describe('applyAnswer — review-streak rule', () => {
  it('a correct Review answer advances reviewStreak but not missCount', () => {
    const progress = progressWithSession({
      weaknessQueue: {
        [RULE_B]: { rule: RULE_B, missCount: 1, reviewStreak: 0, lastMissedAt: 'x' },
      },
    });
    const { progress: next } = applyAnswer({
      progress,
      question: qB1,
      chosenIndex: qB1.correctIndex,
      mode: 'review',
    });

    expect(next.weaknessQueue[RULE_B]).toEqual({
      rule: RULE_B,
      missCount: 1,
      reviewStreak: 1,
      lastMissedAt: 'x',
    });
  });

  it('a correct Review answer reaching the clear threshold removes the rule', () => {
    let progress = progressWithSession({
      weaknessQueue: {
        [RULE_B]: { rule: RULE_B, missCount: 1, reviewStreak: REVIEW_CLEAR_STREAK - 1, lastMissedAt: 'x' },
      },
    });
    progress = applyAnswer({
      progress,
      question: qB1,
      chosenIndex: qB1.correctIndex,
      mode: 'review',
    }).progress;

    expect(progress.weaknessQueue[RULE_B]).toBeUndefined();
    expect(Object.keys(progress.weaknessQueue)).toHaveLength(0);
  });

  it('a correct remediation answer never touches reviewStreak (remediation is not Review)', () => {
    const progress = progressWithSession({
      activeSession: {
        levelId: 'b10',
        askedIds: [qA1.id],
        correctCount: 0,
        streak: 0,
        totalAnswered: 1,
        missCounts: { [RULE_A]: 1 },
        lastWrongRule: RULE_A,
      },
      weaknessQueue: {
        [RULE_A]: { rule: RULE_A, missCount: 1, reviewStreak: 0, lastMissedAt: 'x' },
      },
    });
    const { progress: next } = applyAnswer({
      progress,
      question: qA2,
      chosenIndex: qA2.correctIndex,
      mode: 'remediation',
    });

    // reviewStreak stays at its pre-answer value despite the correct answer
    expect(next.weaknessQueue[RULE_A].reviewStreak).toBe(0);
    expect(next.weaknessQueue[RULE_A].missCount).toBe(1);
  });

  it('throws without an active session', () => {
    expect(() =>
      applyAnswer({
        progress: makeProgress(),
        question: qA1,
        chosenIndex: 0,
        mode: 'normal',
      }),
    ).toThrow(/without an active session/);
  });
});

describe('abandonSession', () => {
  it('clears only the active session and keeps everything else', () => {
    const progress = progressWithSession(
      {
        completedLevelIds: ['b01'],
        currentLevelId: 'b10',
        weaknessQueue: {
          [RULE_A]: { rule: RULE_A, missCount: 1, reviewStreak: 0, lastMissedAt: 'x' },
        },
        wrongAnswers: {
          b10q01: { questionId: 'b10q01', count: 1, lastChosenIndex: 0, lastMissedAt: 'x' },
        },
      },
      { askedIds: ['b10q01'] },
    );

    const next = abandonSession(progress);

    expect(next.activeSession).toBeNull();
    expect(next.completedLevelIds).toEqual(['b01']);
    expect(next.currentLevelId).toBe('b10');
    expect(next.weaknessQueue).toEqual(progress.weaknessQueue);
    expect(next.wrongAnswers).toEqual(progress.wrongAnswers);
  });

  it('is a no-op when no session is active', () => {
    const progress = makeProgress();
    expect(abandonSession(progress)).toBe(progress);
  });
});

describe('queuedRuleSet', () => {
  it('exposes the queued rule tags for adaptive serving', () => {
    const progress = makeProgress({
      weaknessQueue: {
        [RULE_A]: { rule: RULE_A, missCount: 1, reviewStreak: 0, lastMissedAt: 'x' },
        [RULE_B]: { rule: RULE_B, missCount: 1, reviewStreak: 0, lastMissedAt: 'x' },
      },
    });
    expect(queuedRuleSet(progress)).toEqual(new Set([RULE_A, RULE_B]));
    expect(queuedRuleSet(makeProgress())).toEqual(new Set());
  });
});

// ── Task 8: end-of-level transition ────────────────────────────────

function makeLevel(id: string, number: number, trackId: string): Level {
  return {
    id,
    trackId,
    number,
    title: `Level ${id}`,
    topic: { title: 'Topic', summary: 'Summary', rules: [] },
    questions: [],
  };
}

/** Two tracks — Basic levels b01/b02/b10 and an Intermediate level i01. */
const TRACKS: Track[] = [
  {
    id: 'basic',
    order: 1,
    name: 'Basic',
    label: 'Beginner',
    eligibleStartingPoint: true,
    levels: [
      makeLevel('b01', 1, 'basic'),
      makeLevel('b02', 2, 'basic'),
      makeLevel('b10', 10, 'basic'),
    ],
  },
  {
    id: 'intermediate',
    order: 2,
    name: 'Intermediate',
    label: 'Intermediate',
    eligibleStartingPoint: false,
    levels: [makeLevel('i01', 1, 'intermediate')],
  },
];

const LEVEL_ORDER = flattenedLevelIds(TRACKS);

describe('flattenedLevelIds', () => {
  it('flattens tracks by order and levels by number into one sequence', () => {
    expect(LEVEL_ORDER).toEqual(['b01', 'b02', 'b10', 'i01']);
  });

  it('returns an empty sequence for no tracks', () => {
    expect(flattenedLevelIds([])).toEqual([]);
  });
});

describe('nextLevelId', () => {
  it('returns the following level id in the sequence', () => {
    expect(nextLevelId(LEVEL_ORDER, 'b02')).toBe('b10');
    expect(nextLevelId(LEVEL_ORDER, 'b10')).toBe('i01');
  });

  it('returns null for the last level (completion state)', () => {
    expect(nextLevelId(LEVEL_ORDER, 'i01')).toBeNull();
  });

  it('returns null for an unknown level id', () => {
    expect(nextLevelId(LEVEL_ORDER, 'b99')).toBeNull();
  });
});

describe('completeLevel', () => {
  it('a pass marks the level completed, clears the session, and advances the frontier', () => {
    const next = completeLevel(
      makeProgress({
        currentLevelId: 'b01',
        activeSession: progressWithSession().activeSession,
      }),
      { levelId: 'b01', passed: true, levelOrder: LEVEL_ORDER },
    );

    expect(next.completedLevelIds).toEqual(['b01']);
    expect(next.currentLevelId).toBe('b02');
    expect(next.activeSession).toBeNull();
  });

  it('a mercy-end advances the frontier but never marks the level completed', () => {
    const next = completeLevel(makeProgress({ currentLevelId: 'b01' }), {
      levelId: 'b01',
      passed: false,
      levelOrder: LEVEL_ORDER,
    });

    expect(next.completedLevelIds).toEqual([]);
    expect(next.currentLevelId).toBe('b02');
    expect(next.activeSession).toBeNull();
  });

  it('does not duplicate an already-completed level on a replay pass', () => {
    const next = completeLevel(
      makeProgress({ completedLevelIds: ['b01'], currentLevelId: 'b02' }),
      { levelId: 'b01', passed: true, levelOrder: LEVEL_ORDER },
    );

    expect(next.completedLevelIds).toEqual(['b01']);
    // replaying an earlier level must not pull the frontier backward
    expect(next.currentLevelId).toBe('b02');
    expect(next.activeSession).toBeNull();
  });

  it('completing the last level keeps the frontier (completion state)', () => {
    const next = completeLevel(makeProgress({ currentLevelId: 'i01' }), {
      levelId: 'i01',
      passed: true,
      levelOrder: LEVEL_ORDER,
    });

    expect(next.completedLevelIds).toEqual(['i01']);
    expect(next.currentLevelId).toBe('i01');
    expect(next.activeSession).toBeNull();
  });

  it('advances across tracks along the flattened sequence', () => {
    const next = completeLevel(makeProgress({ currentLevelId: 'b10' }), {
      levelId: 'b10',
      passed: true,
      levelOrder: LEVEL_ORDER,
    });

    expect(next.completedLevelIds).toEqual(['b10']);
    expect(next.currentLevelId).toBe('i01');
  });

  it('is safe with no active session (defensive; works on a plain progress slice)', () => {
    const next = completeLevel(makeProgress({ currentLevelId: 'b01' }), {
      levelId: 'b01',
      passed: true,
      levelOrder: LEVEL_ORDER,
    });
    expect(next.completedLevelIds).toEqual(['b01']);
    expect(next.currentLevelId).toBe('b02');
  });

  it('clears the active session even when the ended level is not the frontier', () => {
    const next = completeLevel(
      makeProgress({
        currentLevelId: 'b10',
        activeSession: progressWithSession({}, { levelId: 'b01' }).activeSession,
      }),
      { levelId: 'b01', passed: true, levelOrder: LEVEL_ORDER },
    );

    expect(next.activeSession).toBeNull();
    expect(next.completedLevelIds).toEqual(['b01']);
    expect(next.currentLevelId).toBe('b10');
  });
});
