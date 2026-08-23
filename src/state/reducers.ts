/**
 * Pure state transitions for the level-play loop: starting/resuming a level
 * session, applying one answer to the whole progress slice (session counters,
 * Weakness Queue, wrong-answer history), deliberate abandonment, and the
 * end-of-level pass/mercy transition (frontier advance + completion marks).
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

import type { Track } from '../content/types';
import { mixedBank } from '../game/mixed';
import {
  answerQuestion,
  createSession,
  DEFAULT_PASS_CONFIG,
  type AnswerOutcome,
  type LevelSession,
  type PassConfig,
  type QuestionLike,
  type AnswerResponse,
} from '../game/levelMachine';
import type { ServingMode } from '../game/serving';
import { CURRENT_PROGRESS_VERSION } from './storage';
import {
  hydrateSession,
  persistSession,
  type Progress,
  type StartingPoint,
} from './types';

/** Consecutive correct Review answers that clear a rule from the Weakness Queue. */
export const REVIEW_CLEAR_STREAK = 2;

/** Return the number of whole calendar days between two local YYYY-MM-DD dates. */
function calendarDayDifference(previous: string, current: string): number {
  const parse = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return (parse(current) - parse(previous)) / 86_400_000;
}

/** Record one practice day without relying on the device clock. */
export function recordPlay(progress: Progress, date: string): Progress {
  const currentStreak = progress.dailyStreak ?? 0;
  const bestStreak = progress.bestStreak ?? 0;
  const lastPlayedDate = progress.lastPlayedDate ?? null;

  if (lastPlayedDate === date) return progress;

  const dailyStreak = lastPlayedDate && calendarDayDifference(lastPlayedDate, date) === 1
    ? currentStreak + 1
    : 1;
  return {
    ...progress,
    dailyStreak,
    bestStreak: Math.max(bestStreak, dailyStreak),
    lastPlayedDate: date,
  };
}

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
export function startLevelSession(progress: Progress, levelId: string, date?: string): Progress {
  const played = date === undefined ? progress : recordPlay(progress, date);
  if (progress.activeSession && progress.activeSession.kind !== 'mixed' && progress.activeSession.levelId === levelId) {
    return played;
  }
  return { ...played, activeSession: persistSession(createSession(levelId)) };
}

/** Start or resume a deterministic Mixed Review session without moving the frontier. */
export function startMixedSession(
  progress: Progress,
  tracks: readonly Track[],
  options: { size: number; random?: () => number },
): Progress {
  if (progress.activeSession?.kind === 'mixed') return progress;
  const bankQuestionIds = mixedBank(tracks, progress, options).map(question => question.id);
  if (bankQuestionIds.length === 0) return { ...progress, activeSession: null };
  return {
    ...progress,
    activeSession: {
      ...persistSession(createSession('mixed')),
      kind: 'mixed',
      bankQuestionIds,
    },
  };
}

/** One submitted answer plus its immutable pre-answer serve mode. */
export interface ApplyAnswerInput {
  /** The progress slice containing the in-progress session. */
  progress: Progress;
  /** The question that was served and is now being answered. */
  question: QuestionLike;
  /** The chosen 0-based choice index (legacy multiple-choice callers). */
  chosenIndex?: number;
  /** A typed response for production question types. */
  response?: AnswerResponse;
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
  const { progress, question, mode } = input;
  if (!progress.activeSession) {
    throw new Error('Cannot apply an answer without an active session.');
  }
  const response = input.response ?? input.chosenIndex;
  if (response === undefined) {
    throw new Error('Cannot apply an answer without a response.');
  }

  const session = hydrateSession(progress.activeSession);
  const mixed = session.kind === 'mixed';
  const { session: nextSession, outcome } = answerQuestion(
    session,
    question,
    response,
    mixed
      ? { ...(input.config ?? DEFAULT_PASS_CONFIG), passStreak: Number.POSITIVE_INFINITY }
      : input.config ?? DEFAULT_PASS_CONFIG,
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
        lastChosenIndex:
          typeof response === 'number'
            ? response
            : response.type === 'index'
              ? response.index
              : entry?.lastChosenIndex ?? -1,
        ...(typeof response === 'number' ? {} : { lastResponse: response }),
        lastMissedAt: now,
      },
    };
  }

  const mixedBankExhausted = mixed && nextSession.askedIds.length >= (session.bankQuestionIds?.length ?? 0);
  const ended = nextSession.status !== 'in_progress' || mixedBankExhausted;
  const endedSession = mixedBankExhausted && nextSession.status === 'in_progress'
    ? { ...nextSession, status: 'mercy_ended' as const }
    : nextSession;
  const nextProgress: Progress = {
    ...progress,
    weaknessQueue,
    wrongAnswers,
    activeSession: ended ? null : persistSession(endedSession),
  };

  return { progress: nextProgress, session: ended ? endedSession : nextSession, outcome };
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

// ── End-of-level transition (pass / mercy-end) ─────────────────────
// The flattened sequence (tracks by order, levels by number) is the single
// ordering the frontier advances along. These helpers are pure and content-free
// at the call site: the caller passes the content-derived ordered id list, so
// the reducer never imports the bundle itself.

/**
 * The ordered level ids across all tracks: tracks by ascending `track.order`,
 * then levels by ascending `level.number` — the flattening defined in
 * docs/schema §2 ("Unlock is derived, never stored").
 */
export function flattenedLevelIds(tracks: readonly Track[]): string[] {
  return [...tracks]
    .sort((a, b) => a.order - b.order)
    .flatMap(track =>
      [...track.levels].sort((a, b) => a.number - b.number).map(level => level.id),
    );
}

/**
 * The level after `levelId` in the ordered sequence, or `null` when it is the
 * last level (the caller shows the completion state). Unknown ids resolve to
 * `null` — a defensive completion, matching the persistence repair rule.
 */
export function nextLevelId(levelOrder: readonly string[], levelId: string): string | null {
  const index = levelOrder.indexOf(levelId);
  if (index < 0 || index >= levelOrder.length - 1) {
    return null;
  }
  return levelOrder[index + 1];
}

export interface CompleteLevelInput {
  /** The level that just ended (pass or mercy). */
  levelId: string;
  /** true when the level passed (marks completed); false for a mercy-end (unlocked, not passed). */
  passed: boolean;
  /** Ordered level ids across all tracks — the frontier advances along this sequence. */
  levelOrder: readonly string[];
}

/**
 * End-of-level transition: clear the active session, mark a passed level
 * completed, and advance the frontier.
 *
 * - A pass adds `levelId` to `completedLevelIds`; a mercy-end never does
 *   (a mercy-ended level is unlocked-but-not-passed, per docs/use-cases).
 * - Both clear the active session so a finished level is never resumable.
 * - The frontier advances to the next level in the flattened sequence only when
 *   the ended level is the current frontier (or later) — replaying an earlier,
 *   already-unlocked level must never pull the frontier backward.
 * - When the ended level is the last one, the frontier stays put: the caller
 *   shows the completion state ("Continue" leads back to the map).
 */
export function completeLevel(progress: Progress, input: CompleteLevelInput): Progress {
  const { levelId, passed, levelOrder } = input;

  const completedLevelIds =
    passed && !progress.completedLevelIds.includes(levelId)
      ? [...progress.completedLevelIds, levelId]
      : progress.completedLevelIds;

  const endedIndex = levelOrder.indexOf(levelId);
  const currentIndex = levelOrder.indexOf(progress.currentLevelId);
  const advances = endedIndex >= 0 && endedIndex >= currentIndex;
  const currentLevelId =
    advances && endedIndex < levelOrder.length - 1
      ? levelOrder[endedIndex + 1]
      : progress.currentLevelId;

  return { ...progress, completedLevelIds, currentLevelId, activeSession: null };
}

// ── First-launch starting-point helpers ────────────────────────────
// docs/use-cases "First Launch": the player picks where to begin (or the app
// auto-starts when only one track is eligible). These are pure and content-free
// at the call site: the caller passes the bundled tracks, so the reducer never
// imports the bundle itself.

/** The id of the level a starting point resolves to, or null if unknown. */
export function startingLevelId(
  tracks: readonly Track[],
  startingPoint: StartingPoint,
): string | null {
  const track = tracks.find(t => t.id === startingPoint.trackId);
  if (!track) {
    return null;
  }
  const level = track.levels.find(l => l.number === startingPoint.levelNumber);
  return level ? level.id : null;
}

/**
 * A fresh, empty Progress slice beginning at a chosen starting point. The
 * frontier (`currentLevelId`) is the starting level; earlier levels are
 * unlocked by derivation (Task 11 selectors), never stored.
 */
export function createInitialProgress(
  tracks: readonly Track[],
  startingPoint: StartingPoint,
): Progress {
  const currentLevelId = startingLevelId(tracks, startingPoint) ?? flattenedLevelIds(tracks)[0] ?? '';
  return {
    version: CURRENT_PROGRESS_VERSION,
    startingPoint,
    completedLevelIds: [],
    currentLevelId,
    activeSession: null,
    weaknessQueue: {},
    wrongAnswers: {},
    dailyStreak: 0,
    bestStreak: 0,
    lastPlayedDate: null,
  };
}

/**
 * The boot decision on launch: a saved progress resumes as-is (returning
 * players are never re-asked); with no saved progress, a single eligible
 * starting track auto-starts at its level 1, and multiple eligible tracks leave
 * progress null so the StartPoint choice screen shows.
 */
export function resolveBootProgress(
  tracks: readonly Track[],
  saved: Progress | null,
): Progress | null {
  if (saved) {
    return saved;
  }
  const eligible = tracks.filter(t => t.eligibleStartingPoint);
  if (eligible.length === 1) {
    return createInitialProgress(tracks, { trackId: eligible[0].id, levelNumber: 1 });
  }
  return null;
}
