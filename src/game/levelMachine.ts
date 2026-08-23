/**
 * Level-play state machine — the pure, testable brain of the game.
 *
 * Faithful to the design in:
 *   docs/use-cases/english-grammar-review.md
 *   docs/schema/english-grammar-review.md
 *
 * Pure by construction: every function returns new state, never mutates inputs.
 */

import type { QuestionInput, QuestionUnion } from '../content/types';
import { normalizeQuestion } from '../content/types';
import { scoreAnswer, type AnswerResponse, type ScoreResult } from './scoring';

export { scoreAnswer } from './scoring';
export type { AnswerResponse } from './scoring';

/** Legacy multiple-choice view retained for the existing UI until Task 9. */
export interface Question {
  id: string;
  levelId: string;
  rule: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  choiceExplanations: string[];
}

/** Questions accepted at the machine boundary; legacy questions are normalized. */
export type QuestionLike = Question | QuestionUnion | QuestionInput;

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
  /** Rule of the last wrong answer (null if none or last was correct) — resumes remediation. */
  lastWrongRule: string | null;
  status: SessionStatus;
  /** Mixed Review metadata; absent for legacy level sessions. */
  kind?: 'level' | 'mixed' | 'mastery';
  bankQuestionIds?: string[];
  /**
   * Continued practice after a pass: the session was resumed from a finished
   * level and is answered with pass/mercy rules suspended, so it never passes
   * or mercy-ends again (the caller applies an ∞ pass config). The player keeps
   * answering the remaining questions until they leave.
   */
  practice?: boolean;
}

/** What happened as a result of one answer. */
export interface AnswerOutcome {
  isCorrect: boolean;
  correctIndex?: number;
  correctAnswer?: string;
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
    lastWrongRule: null,
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
  question: QuestionLike,
  response: AnswerResponse | number,
  config: PassConfig = DEFAULT_PASS_CONFIG,
): { session: LevelSession; outcome: AnswerOutcome } {
  if (session.status !== 'in_progress') {
    throw new FinishedLevelError(session.status);
  }
  const normalized = normalizeQuestion(question);
  const answer: AnswerResponse =
    typeof response === 'number' ? { type: 'index', index: response } : response;
  if (answer.type === 'index' &&
      (normalized.type !== 'multiple_choice' && normalized.type !== 'fix_sentence' ||
        answer.index < 0 || answer.index >= normalized.choices.length)) {
    throw new RangeError(
      `answer index ${answer.index} out of range for question with ${
        'choices' in normalized ? normalized.choices.length : 0
      } choices`,
    );
  }

  const score: ScoreResult = scoreAnswer(normalized, answer);
  const isCorrect = score.isCorrect;
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
    lastWrongRule: isCorrect ? null : question.rule,
    status: passed ? 'passed' : endedByMercy ? 'mercy_ended' : 'in_progress',
  };

  const outcome: AnswerOutcome = {
    isCorrect,
    correctIndex: score.correctIndex,
    correctAnswer: score.correctAnswer,
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
export function pickNextQuestion<T extends QuestionLike>(
  bank: T[],
  askedIds: ReadonlySet<string>,
  lastWrongRule: string | null,
  options: PickOptions = {},
): T | null {
  const rand = options.random ?? Math.random;
  const unasked = bank.filter(q => !askedIds.has(q.id));
  if (unasked.length === 0) {
    return null;
  }
  const pickRandom = (pool: T[]) => pool[Math.floor(rand() * pool.length)];

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
