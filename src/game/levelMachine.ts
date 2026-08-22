/**
 * Level-play state machine — the pure, testable brain of the game.
 *
 * Faithful to the design in:
 *   docs/use-cases/english-grammar-game.md
 *   docs/schema/english-grammar-game.md
 *
 * Pure by construction: every function returns new state, never mutates inputs.
 */

/** A multiple-choice grammar question (content schema, minimal subset). */
export interface Question {
  id: string;
  levelId: string;
  /** Narrow rule tag — the key that powers adaptive serving & the Weakness Queue. */
  rule: string;
  prompt: string;
  /** Exactly 4 choices. */
  choices: string[];
  correctIndex: number;
  /** Aligned with choices: [correctIndex] explains why it's right, the rest why each is wrong. */
  choiceExplanations: string[];
}

/** Tuning parameters — all decided values, adjustable from real play. */
export interface PassConfig {
  /** Correct-in-a-row needed to pass by streak. */
  passStreak: number;
  /** Total correct needed to pass by volume. */
  passVolume: number;
  /** Max questions answered before an unfinished level mercy-ends. */
  mercyCap: number;
}

export const DEFAULT_PASS_CONFIG: PassConfig = {
  passStreak: 3,
  passVolume: 8,
  mercyCap: 12,
};

export type SessionStatus = 'in_progress' | 'passed' | 'mercy_ended';

/** Per-level play state. */
export interface LevelSession {
  levelId: string;
  /** Question ids served so far, in order. */
  askedIds: string[];
  /** Total correct answers (volume pass rule). */
  correctCount: number;
  /** Current consecutive-correct streak (streak pass rule). */
  streak: number;
  /** Total answers submitted (mercy cap rule). */
  totalAnswered: number;
  /** Rule → times missed this session. Keys feed the Weakness Queue; counts drive re-teach. */
  missCounts: Record<string, number>;
  status: SessionStatus;
}

/** What happened as a result of one answer. */
export interface AnswerOutcome {
  isCorrect: boolean;
  correctIndex: number;
  streak: number;
  correctCount: number;
  totalAnswered: number;
  passed: boolean;
  /** Why the level passed, when it did. */
  passReason: 'streak' | 'volume' | null;
  endedByMercy: boolean;
}

export function createSession(levelId: string): LevelSession {
  return {
    levelId,
    askedIds: [],
    correctCount: 0,
    streak: 0,
    totalAnswered: 0,
    missCounts: {},
    status: 'in_progress',
  };
}

/** Thrown when the machine is asked to score an answer on a finished level. */
export class FinishedLevelError extends Error {
  constructor(status: SessionStatus) {
    super(`Cannot answer a question on a level that is ${status}.`);
    this.name = 'FinishedLevelError';
  }
}

/**
 * Score one answer and advance the session.
 *
 * Pass rules (whichever hits first):
 *   - streak:  passStreak correct-in-a-row
 *   - volume:  passVolume total correct
 *   - mercy:   mercyCap total answers without passing → level ends, rules stay queued
 */
export function answerQuestion(
  session: LevelSession,
  question: Question,
  chosenIndex: number,
  config: PassConfig = DEFAULT_PASS_CONFIG,
): { session: LevelSession; outcome: AnswerOutcome } {
  if (session.status !== 'in_progress') {
    throw new FinishedLevelError(session.status);
  }
  if (chosenIndex < 0 || chosenIndex >= question.choices.length) {
    throw new RangeError(
      `chosenIndex ${chosenIndex} out of range for question with ${question.choices.length} choices`,
    );
  }

  const isCorrect = chosenIndex === question.correctIndex;
  const streak = isCorrect ? session.streak + 1 : 0;
  const correctCount = isCorrect ? session.correctCount + 1 : session.correctCount;
  const totalAnswered = session.totalAnswered + 1;

  const passedByStreak = streak >= config.passStreak;
  const passedByVolume = correctCount >= config.passVolume;
  const passed = passedByStreak || passedByVolume;
  const endedByMercy = !passed && totalAnswered >= config.mercyCap;

  const nextSession: LevelSession = {
    ...session,
    askedIds: [...session.askedIds, question.id],
    streak,
    correctCount,
    totalAnswered,
    missCounts: isCorrect
      ? session.missCounts
      : {
          ...session.missCounts,
          [question.rule]: (session.missCounts[question.rule] ?? 0) + 1,
        },
    status: passed ? 'passed' : endedByMercy ? 'mercy_ended' : 'in_progress',
  };

  const outcome: AnswerOutcome = {
    isCorrect,
    correctIndex: question.correctIndex,
    streak,
    correctCount,
    totalAnswered,
    passed,
    passReason: passedByStreak ? 'streak' : passedByVolume ? 'volume' : null,
    endedByMercy,
  };

  return { session: nextSession, outcome };
}

export interface PickOptions {
  /** Injectable randomness (defaults to Math.random) — makes selection testable. */
  random?: () => number;
  /** Rules currently in the Weakness Queue — prioritized for review resurfacing. */
  queuedRules?: ReadonlySet<string>;
}

/**
 * Choose the next question to serve, by priority:
 *   1. another unasked variant of the rule just missed (lastWrongRule) — the
 *      teach-on-failure re-test;
 *   2. any unasked question whose rule is in the Weakness Queue — served
 *      "Review" by the caller;
 *   3. otherwise a random unasked question from the bank.
 * Returns null when the bank is exhausted.
 */
export function pickNextQuestion(
  bank: Question[],
  askedIds: ReadonlySet<string>,
  lastWrongRule: string | null,
  options: PickOptions = {},
): Question | null {
  const rand = options.random ?? Math.random;
  const unasked = bank.filter(q => !askedIds.has(q.id));
  if (unasked.length === 0) {
    return null;
  }
  const pickRandom = (pool: Question[]) => pool[Math.floor(rand() * pool.length)];

  if (lastWrongRule !== null) {
    const sameRule = unasked.filter(q => q.rule === lastWrongRule);
    if (sameRule.length > 0) {
      return pickRandom(sameRule);
    }
  }
  if (options.queuedRules && options.queuedRules.size > 0) {
    const review = unasked.filter(q => options.queuedRules!.has(q.rule));
    if (review.length > 0) {
      return pickRandom(review);
    }
  }
  return pickRandom(unasked);
}
