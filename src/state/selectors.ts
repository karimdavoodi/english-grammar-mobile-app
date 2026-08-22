/**
 * Derived state views — pure functions over content + progress.
 *
 * Implements the schema's "unlock is derived, never stored" rule
 * (docs/schema/english-grammar-game.md §2): a level is unlocked when it occurs
 * at or before the saved frontier, or its id is in `completedLevelIds`. Passed
 * levels show a pass mark; mercy-ended and skipped-earlier levels are unlocked
 * but not passed (no separate persisted state exists for them).
 *
 * Also provides:
 *   - `repairProgress` — the persisted-ID repair: unknown historical question
 *     ids are omitted from Review, while an unknown current level advances to
 *     the first valid level (or stays in the completion state when no levels
 *     remain);
 *   - `reviewGroups` — the wrong-answer history grouped by rule that the Review
 *     screen renders (state never duplicates question text, only references ids,
 *     so the grouping resolves ids back into the bundled content).
 *
 * Pure by construction: every function returns new data, never mutates inputs.
 */

import type { Level, Question, TopicRule, Track } from '../content/types';
import type { Progress, WeaknessEntry, WrongAnswerEntry } from './types';

/**
 * The flattened level sequence across all tracks: tracks by ascending
 * `track.order`, then levels by ascending `level.number` — the single ordering
 * the frontier, the map, and the review all follow.
 */
export function orderedLevels(tracks: readonly Track[]): Level[] {
  return [...tracks]
    .sort((a, b) => a.order - b.order)
    .flatMap(track => [...track.levels].sort((a, b) => a.number - b.number));
}

/**
 * The level ids unlocked for play: every level at or before the saved frontier,
 * plus any level in `completedLevelIds` (a passed level stays unlocked when the
 * frontier has moved on — replay never re-locks).
 */
export function unlockedLevelIds(
  tracks: readonly Track[],
  progress: Progress,
): ReadonlySet<string> {
  const order = orderedLevels(tracks);
  const frontierIndex = order.findIndex(level => level.id === progress.currentLevelId);
  const completed = new Set(progress.completedLevelIds);
  const unlocked = new Set<string>();
  order.forEach((level, index) => {
    if (completed.has(level.id) || (frontierIndex >= 0 && index <= frontierIndex)) {
      unlocked.add(level.id);
    }
  });
  return unlocked;
}

/** Whether a single level is unlocked for play (see `unlockedLevelIds`). */
export function isLevelUnlocked(
  tracks: readonly Track[],
  progress: Progress,
  levelId: string,
): boolean {
  return unlockedLevelIds(tracks, progress).has(levelId);
}

/**
 * "Needs review" signal for a level: any question in its bank is tagged with a
 * rule that is currently in the Weakness Queue — the level is where that queued
 * rule resurfaces, so the map flags it for the player.
 */
export function levelNeedsReview(level: Level, queuedRules: ReadonlySet<string>): boolean {
  return level.questions.some(question => queuedRules.has(question.rule));
}

/** The map-relevant status of one level. */
export interface LevelStatus {
  levelId: string;
  level: Level;
  /** Playable (at-or-before the frontier, or passed). */
  unlocked: boolean;
  /** In `completedLevelIds` — the level was passed. */
  completed: boolean;
  /** The current frontier level. */
  isCurrent: boolean;
  /** A queued rule has a question in this level's bank — map "needs review" flag. */
  needsReview: boolean;
}

/** Per-level status for every level in the flattened sequence (the map view). */
export function levelStatuses(
  tracks: readonly Track[],
  progress: Progress,
): LevelStatus[] {
  const order = orderedLevels(tracks);
  const unlocked = unlockedLevelIds(tracks, progress);
  const completed = new Set(progress.completedLevelIds);
  const queued = new Set(Object.keys(progress.weaknessQueue));
  return order.map(level => ({
    levelId: level.id,
    level,
    unlocked: unlocked.has(level.id),
    completed: completed.has(level.id),
    isCurrent: level.id === progress.currentLevelId,
    needsReview: levelNeedsReview(level, queued),
  }));
}

/**
 * The first level id in the flattened sequence — the repair target for an
 * unknown current level, and the completion-state fallback when no level exists
 * (returns null).
 */
export function firstValidLevelId(tracks: readonly Track[]): string | null {
  const order = orderedLevels(tracks);
  return order.length > 0 ? order[0].id : null;
}

/**
 * Persistence repair per docs/schema §2 ("Content lookups always go by id ..."):
 * unknown historical question ids are omitted from Review (handled by
 * `reviewGroups`); an unknown current level advances to the first valid level —
 * or stays put in the completion state when no levels exist. Completed level ids
 * that no longer resolve are dropped, and an active session for a level that no
 * longer exists is cleared (it cannot be resumed). Returns the same reference
 * when nothing needs repairing.
 */
export function repairProgress(tracks: readonly Track[], progress: Progress): Progress {
  const order = orderedLevels(tracks);
  const validIds = new Set(order.map(level => level.id));
  const firstId = firstValidLevelId(tracks);

  const completedLevelIds = progress.completedLevelIds.filter(id => validIds.has(id));
  const completedChanged = completedLevelIds.length !== progress.completedLevelIds.length;

  const currentValid = validIds.has(progress.currentLevelId);
  const currentLevelId = currentValid
    ? progress.currentLevelId
    : firstId ?? progress.currentLevelId;
  const currentChanged = currentLevelId !== progress.currentLevelId;

  const sessionValid =
    progress.activeSession === null || validIds.has(progress.activeSession.levelId);
  const activeSession = sessionValid ? progress.activeSession : null;
  const sessionChanged = activeSession !== progress.activeSession;

  if (!completedChanged && !currentChanged && !sessionChanged) {
    return progress;
  }
  return { ...progress, completedLevelIds, currentLevelId, activeSession };
}

/** Due reviews: the Weakness Queue entries as an array (object values order). */
export function weaknessEntries(progress: Progress): WeaknessEntry[] {
  return Object.values(progress.weaknessQueue);
}

// ── Review grouping ─────────────────────────────────────────────────
// The Review screen is study history, not the active Weakness Queue: it lists
// every missed question grouped by rule, keyed by id in state and resolved back
// into content here. Clearing a weakness never deletes wrong-answer history.

/** One missed question in a review group, with the study details resolved. */
export interface ReviewMissedQuestion {
  question: Question;
  /** Cumulative times this question was missed (monotonic). */
  count: number;
  /** The most recent wrong choice for this question. */
  lastChosenIndex: number;
  /** ISO timestamp of the most recent miss. */
  lastMissedAt: string;
  /** The correct answer's text. */
  correctAnswer: string;
  /** The text of the most recent wrong choice. */
  chosenAnswer: string;
  /** Why the correct answer is right ([correctIndex] explanation). */
  correctExplanation: string;
  /** Why the chosen wrong answer is wrong ([lastChosenIndex] explanation). */
  wrongExplanation: string;
}

/** A rule group on the Review screen. */
export interface ReviewGroup {
  /** The rule tag — the grouping key. */
  rule: string;
  /** Human title from the canonical TopicRule (falls back to the tag). */
  ruleTitle: string;
  /** Teaching explanation from the canonical TopicRule. */
  ruleExplanation: string;
  /** Example sentence from the canonical TopicRule. */
  ruleExample: string;
  /** True when the rule is still in the Weakness Queue. */
  stillQueued: boolean;
  /** Missed questions in this group, most recently missed first. */
  missedQuestions: ReviewMissedQuestion[];
}

/**
 * Build the Review groups from the wrong-answer history + content.
 *
 * Unknown historical question ids (entries whose question is no longer in the
 * bundled content) are omitted per the persistence rule. Groups are ordered by
 * the most recent miss in the group (freshest mistakes first), tie-broken by
 * rule tag; questions within a group are most-recently-missed first.
 */
export function reviewGroups(
  tracks: readonly Track[],
  wrongAnswers: Record<string, WrongAnswerEntry>,
  queuedRules: ReadonlySet<string> = new Set<string>(),
): ReviewGroup[] {
  const ruleInfo = new Map<string, TopicRule>();
  const byRule = new Map<string, ReviewMissedQuestion[]>();

  for (const track of tracks) {
    for (const level of track.levels) {
      for (const rule of level.topic.rules) {
        if (!ruleInfo.has(rule.rule)) {
          ruleInfo.set(rule.rule, rule);
        }
      }
      for (const question of level.questions) {
        const entry = wrongAnswers[question.id];
        if (!entry) {
          continue; // not missed (or unknown historical id — omitted)
        }
        const missed: ReviewMissedQuestion = {
          question,
          count: entry.count,
          lastChosenIndex: entry.lastChosenIndex,
          lastMissedAt: entry.lastMissedAt,
          correctAnswer: question.choices[question.correctIndex] ?? '',
          chosenAnswer: question.choices[entry.lastChosenIndex] ?? '',
          correctExplanation: question.choiceExplanations[question.correctIndex] ?? '',
          wrongExplanation: question.choiceExplanations[entry.lastChosenIndex] ?? '',
        };
        const group = byRule.get(question.rule) ?? [];
        group.push(missed);
        byRule.set(question.rule, group);
      }
    }
  }

  const groups: ReviewGroup[] = [];
  for (const [rule, missedQuestions] of byRule) {
    const info = ruleInfo.get(rule);
    const sorted = [...missedQuestions].sort((a, b) =>
      b.lastMissedAt.localeCompare(a.lastMissedAt),
    );
    groups.push({
      rule,
      ruleTitle: info?.title ?? rule,
      ruleExplanation: info?.explanation ?? '',
      ruleExample: info?.example ?? '',
      stillQueued: queuedRules.has(rule),
      missedQuestions: sorted,
    });
  }

  groups.sort((a, b) => {
    const aLatest = a.missedQuestions[0]?.lastMissedAt ?? '';
    const bLatest = b.missedQuestions[0]?.lastMissedAt ?? '';
    return bLatest.localeCompare(aLatest) || a.rule.localeCompare(b.rule);
  });

  return groups;
}
