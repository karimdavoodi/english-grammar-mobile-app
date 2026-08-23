/**
 * Runtime state types — the persisted, device-local layer of the game.
 *
 * Field-for-field mirror of `docs/schema/english-grammar-review.md` §2 (State).
 * Content lookups always go by id into the bundled content — state never
 * duplicates question text, only references ids.
 */

import type { AnswerResponse, LevelSession } from '../game/levelMachine';
import type { TrackId } from '../content/types';

/** Theme preference honored by the ThemeProvider (Task 12). */
export type ThemePreference = 'device' | 'light' | 'dark';
export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

/** User settings — the only slice that survives a progress reset. */
export interface Settings {
  theme: ThemePreference;
  notifications: NotificationSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'device',
  notifications: { enabled: false, hour: 9, minute: 0 },
};

/** The player's chosen starting point (from the onboarding choice). */
export interface StartingPoint {
  trackId: TrackId;
  /** 1-based, within the chosen track. */
  levelNumber: number;
}

/**
 * Persisted snapshot of an in-progress level session.
 *
 * Deliberately excludes the machine-only `status` field: `activeSession` is
 * cleared the moment a level ends, so a saved session is always in progress.
 * See `persistSession` / `hydrateSession` for the explicit mapping to the
 * `levelMachine.LevelSession` the pure machine works with.
 */
export interface PersistedLevelSession {
  levelId: string;
  /** Questions already served, in order — never re-served. */
  askedIds: string[];
  /** Total correct (volume pass progress, 8 in v1). */
  correctCount: number;
  /** Consecutive correct (streak pass progress, 3 in v1). */
  streak: number;
  /** Answers submitted, correct or not (mercy cap, 12 in v1). */
  totalAnswered: number;
  /** Rule → times missed this session (drives re-teach). */
  missCounts: Record<string, number>;
  /** Rule of the last wrong answer (null if none or last was correct). */
  lastWrongRule: string | null;
  /** Mixed Review metadata; omitted from legacy level-session snapshots. */
  kind?: 'level' | 'mixed' | 'mastery';
  bankQuestionIds?: string[];
  /** Continued-practice session (pass rules suspended); see LevelSession.practice. */
  practice?: boolean;
}

/** One rule in the Weakness Queue — keyed by rule tag across levels. */
export interface WeaknessEntry {
  rule: string;
  /** Total wrong answers on this rule (monotonic — never decremented). */
  missCount: number;
  /** Consecutive correct review answers; ≥ 2 → cleared; resets to 0 on a miss. */
  reviewStreak: number;
  /** ISO timestamp of the most recent miss. */
  lastMissedAt: string;
}

/** One wrong-answer history record — keyed by question id. */
export interface WrongAnswerEntry {
  questionId: string;
  /** Times this question was missed. */
  count: number;
  lastChosenIndex: number;
  /** The submitted typed/ordered response; absent on pre-v2 saved answers. */
  lastResponse?: AnswerResponse;
  /** ISO timestamp. */
  lastMissedAt: string;
}

/** The full persisted progress slice. */
export interface Progress {
  /** Schema version — gate for migrations (see storage.ts). */
  version: number;
  startingPoint: StartingPoint;
  /** Passed levels — drives the map indicators. */
  completedLevelIds: string[];
  /** Frontier/next level; advances past passed AND mercy-ended levels. */
  currentLevelId: string;
  /** Resumable in-progress level, if any. */
  activeSession: PersistedLevelSession | null;
  /** Keyed by rule tag. */
  weaknessQueue: Record<string, WeaknessEntry>;
  /** Keyed by question id. */
  wrongAnswers: Record<string, WrongAnswerEntry>;
  /** Consecutive calendar days on which the player started practice. */
  dailyStreak?: number;
  /** Highest daily streak reached. */
  bestStreak?: number;
  /** Local calendar date of the most recent practice day (YYYY-MM-DD). */
  lastPlayedDate?: string | null;
}

/** Root app state: settings + progress (null until the start choice is made). */
export interface AppState {
  settings: Settings;
  progress: Progress | null;
}

// ── Persisted-session adapters ─────────────────────────────────────
// The pure machine works with a `LevelSession` that carries a transient
// `status`. Storage works with `PersistedLevelSession` (no status). These
// explicit adapters map between the two without dropping counters or ids.

/** Drop the machine-only `status` field for persistence. */
export function persistSession(session: LevelSession): PersistedLevelSession {
  const persisted: PersistedLevelSession = {
    levelId: session.levelId,
    askedIds: session.askedIds,
    correctCount: session.correctCount,
    streak: session.streak,
    totalAnswered: session.totalAnswered,
    missCounts: session.missCounts,
    lastWrongRule: session.lastWrongRule,
  };
  if (session.kind === 'mixed' || session.kind === 'mastery') {
    persisted.kind = session.kind;
    persisted.bankQuestionIds = [...new Set(session.bankQuestionIds ?? [])];
  }
  if (session.practice) {
    persisted.practice = true;
  }
  return persisted;
}

/** Rehydrate a saved session as an always-in-progress machine session. */
export function hydrateSession(persisted: PersistedLevelSession): LevelSession {
  return {
    levelId: persisted.levelId,
    askedIds: persisted.askedIds,
    correctCount: persisted.correctCount,
    streak: persisted.streak,
    totalAnswered: persisted.totalAnswered,
    missCounts: persisted.missCounts,
    lastWrongRule: persisted.lastWrongRule,
    status: 'in_progress',
    ...(persisted.kind ? { kind: persisted.kind } : {}),
    ...(persisted.bankQuestionIds ? { bankQuestionIds: [...new Set(persisted.bankQuestionIds)] } : {}),
    ...(persisted.practice ? { practice: true } : {}),
  };
}
