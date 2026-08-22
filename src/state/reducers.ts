/**
 * Pure state transitions for the level-play loop: starting/resuming a level
 * session, applying one answer to the whole progress slice (session counters,
 * Weakness Queue, wrong-answer history), and deliberate abandonment.
 *
 * Design: docs/use-cases/english-grammar-game.md (Level Play, Teach on Failure,
 * Weakness Queue) and docs/schema/english-grammar-game.md §2 (State).
 *
 * The machine (`levelMachine.answerQuestion`) scores one answer and advances the
 * session; these reducers wrap that with the persisted Progress transitions.
 * Per docs/schema §1, `reviewStreak` is advanced ONLY for a pre-queued Review
 * answer — same-level remediation is never a Review answer (serving.ts already
 * snapshots the mode before the answer; this module honors that snapshot).
 *
 * Pure by construction: every function returns a new Progress, never mutates.
 */

import {
  answerQuestion,
  createSession,
  DEFAULT_PASS_CONFIG,
  type AnswerOutcome,
  type LevelSession,
  type PassConfig,
  type Question,
} from '../game/levelMachine';
import type { ServingMode } from '../game/serving';
import { hydrateSession, persistSession, type Progress } from './types';

/** Consecutive correct Review answers that clear a rule from the Weakness Queue. */
export const REVIEW_CLEAR_STREAK = 2;

/** The rule tags currently in the Weakness Queue — the serving "queuedRules" set. */
export function queuedRuleSet(progress: Progress): Set<string> {
  return new Set(Object.keys(progress.weaknessQueue));
}

/**
 * Start (or resume) a level session in the progress slice.
 *
 * A saved session for the same level is resumed as-is (relaunch/resume path).
 * A session for any other level — or no session — is replaced by a fresh one
 * for `levelId`. Resuming never mutates the stored progress.
 */
export function startLevelSession(progress: Progress, levelId: string): Progress {
  if (progress.activeSession && progress.activeSession.levelId === levelId) {
    return progress;
  }
  return { ...progress, activeSession: persistSession(createSession(levelId)) };
}

/** One submitted answer plus its immutable pre-answer serve mode. */
export interface ApplyAnswerInput {
  /** The progress slice containing the in-progress session. */
  progress: Progress;
  /** The question that was served and is now being answered. */
  question: Question;
  /** The chosen 0-based choice index. */
  chosenIndex: number;
  /**
   * The immutable pre-answer serve snapshot from serving.ts — `remediation`
   * re-tests are never Review answers even when their rule is queued.
   */
  mode: ServingMode;
  /** Injectable ISO timestamp for deterministic tests (defaults to now). */
  now?: string;
  /** Pass/mercy tuning (defaults to the game defaults). */
  config?: PassConfig;
}

/** The outcome of applying one answer: the new progress + the machine result. */
export interface ApplyAnswerResult {
  progress: Progress;
  /** The resulting machine session — post-answer, possibly finished. */
  session: LevelSession;
  outcome: AnswerOutcome;
}

/**
 * Apply one answer to the progress slice.
 *
 * - Advances the machine session (counters, askedIds, missCounts, lastWrongRule).
 * - Wrong answers upsert the Weakness Queue immediately (missCount++,
 *   reviewStreak → 0) and record the wrong-answer history — regardless of
 *   whether the level later passes or mercy-ends.
 * - A correct answer served as `review` advances that rule's reviewStreak;
 *   reaching `REVIEW_CLEAR_STREAK` clears the rule from the queue. Correct
 *   answers served as `remediation`/`normal` never touch reviewStreak.
 * - When the session ends (pass or mercy) the active session is cleared so a
 *   finished level is never persisted as resumable.
 *
 * Throws when there is no active session to answer against.
 */
export function applyAnswer(input: ApplyAnswerInput): ApplyAnswerResult {
  const { progress, question, chosenIndex, mode } = input;
  if (!progress.activeSession) {
    throw new Error('Cannot apply an answer without an active session.');
  }

  const session = hydrateSession(progress.activeSession);
  const { session: nextSession, outcome } = answerQuestion(
    session,
    question,
    chosenIndex,
    input.config ?? DEFAULT_PASS_CONFIG,
  );
  const now = input.now ?? new Date().toISOString();

  // ── Weakness Queue ───────────────────────────────────────────────
  let weaknessQueue = progress.weaknessQueue;
  if (mode === 'review' && outcome.isCorrect) {
    const entry = weaknessQueue[question.rule];
    if (entry) {
      const reviewStreak = entry.reviewStreak + 1;
      if (reviewStreak >= REVIEW_CLEAR_STREAK) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [question.rule]: _cleared, ...rest } = weaknessQueue;
        weaknessQueue = rest;
      } else {
        weaknessQueue = {
          ...weaknessQueue,
          [question.rule]: { ...entry, reviewStreak },
        };
      }
    }
  } else if (!outcome.isCorrect) {
    const entry = weaknessQueue[question.rule];
    weaknessQueue = {
      ...weaknessQueue,
      [question.rule]: {
        rule: question.rule,
        missCount: (entry?.missCount ?? 0) + 1,
        reviewStreak: 0,
        lastMissedAt: now,
      },
    };
  }

  // ── Wrong-answer history ─────────────────────────────────────────
  let wrongAnswers = progress.wrongAnswers;
  if (!outcome.isCorrect) {
    const entry = wrongAnswers[question.id];
    wrongAnswers = {
      ...wrongAnswers,
      [question.id]: {
        questionId: question.id,
        count: (entry?.count ?? 0) + 1,
        lastChosenIndex: chosenIndex,
        lastMissedAt: now,
      },
    };
  }

  const ended = nextSession.status !== 'in_progress';
  const nextProgress: Progress = {
    ...progress,
    weaknessQueue,
    wrongAnswers,
    activeSession: ended ? null : persistSession(nextSession),
  };

  return { progress: nextProgress, session: nextSession, outcome };
}

/**
 * Deliberate abandonment: clear only the active session. Completed levels, the
 * Weakness Queue, and wrong-answer history all survive.
 */
export function abandonSession(progress: Progress): Progress {
  if (!progress.activeSession) {
    return progress;
  }
  return { ...progress, activeSession: null };
}
