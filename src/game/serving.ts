/**
 * Adaptive serving orchestrator — decides, from a `LevelSession` + the level's
 * question bank + the Weakness Queue, what to serve next and whether to re-teach.
 *
 * Design: docs/use-cases/english-grammar-game.md (Teach on Failure, Weakness Queue)
 *         docs/schema/english-grammar-game.md §1 (How the rule tag powers the mechanics)
 *
 * This module is the thin caller-side wrapper around `pickNextQuestion`. It
 * classifies each serve (remediation | review | normal) and applies the re-teach
 * rule, but never mutates anything: the returned `mode` is an immutable pre-answer
 * snapshot, and `reviewStreak` is exclusively the answer reducers' concern
 * (Task 11) — a `review` answer increments it, two consecutive correct review
 * answers clear the rule, and same-level remediation never counts as a Review.
 *
 * Pure by construction: every function returns new data, never mutates inputs.
 */

import {
  pickNextQuestion,
  type LevelSession,
  type QuestionLike,
} from './levelMachine';

/** Why a question is being served. Pre-answer snapshot — never recomputed after the answer. */
export type ServingMode = 'remediation' | 'review' | 'normal';

/**
 * A rule re-shows its lesson card before the next question on it once it has been
 * missed this many times in the current level (the re-teach rule).
 */
export const RE_TEACH_MISS_THRESHOLD = 2;

export interface ServeOptions {
  /** Injectable randomness, threaded through to `pickNextQuestion`. */
  random?: () => number;
}

export interface ServeResult<T extends QuestionLike = QuestionLike> {
  /** The question to serve next. */
  question: T;
  /**
   * Why it is served:
   *  - 'remediation' — a same-level re-test of the rule just missed (lastWrongRule);
   *  - 'review'      — the rule was in the Weakness Queue before this serve;
   *  - 'normal'      — otherwise, drawn at random from the bank.
   */
  mode: ServingMode;
  /**
   * Re-teach rule: true when the lesson card must re-show BEFORE the question,
   * because this rule has been missed >= `RE_TEACH_MISS_THRESHOLD` times this level.
   */
  showLesson: boolean;
}

/** Classify why a picked question is being served (see `ServingMode`). */
export function classifyMode(
  question: QuestionLike,
  lastWrongRule: string | null,
  queuedRules: ReadonlySet<string>,
): ServingMode {
  // Same-level remediation is never a Review answer, even if the rule is also queued.
  if (lastWrongRule !== null && question.rule === lastWrongRule) {
    return 'remediation';
  }
  if (queuedRules.has(question.rule)) {
    return 'review';
  }
  return 'normal';
}

/**
 * Re-teach rule: the lesson card re-shows before the question on this rule once
 * its in-level miss count has reached `RE_TEACH_MISS_THRESHOLD`.
 */
export function shouldReTeach(session: LevelSession, rule: string): boolean {
  return (session.missCounts[rule] ?? 0) >= RE_TEACH_MISS_THRESHOLD;
}

/**
 * Serve the next question for an in-progress level.
 *
 * Priority (delegated to `pickNextQuestion`): another unasked variant of the rule
 * just missed → an unasked question whose rule is in the Weakness Queue (Review) →
 * a random unasked question. The returned `mode` classifies which branch won, and
 * `showLesson` applies the re-teach rule to the served rule.
 *
 * Returns null when there is nothing left to serve — the session is no longer
 * in_progress, or the bank is exhausted.
 */
export function serveNextQuestion<T extends QuestionLike>(
  session: LevelSession,
  bank: T[],
  queuedRules: ReadonlySet<string>,
  options: ServeOptions = {},
): ServeResult<T> | null {
  if (session.status !== 'in_progress') {
    return null;
  }
  const question = pickNextQuestion(bank, new Set(session.askedIds), session.lastWrongRule, {
    random: options.random,
    queuedRules,
  });
  if (question === null) {
    return null;
  }
  return {
    question,
    mode: classifyMode(question, session.lastWrongRule, queuedRules),
    showLesson: shouldReTeach(session, question.rule),
  };
}
