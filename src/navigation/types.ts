// Navigation route param types.
//
// The Home-first root stack (docs/ui-plan.md Task 6): the app always boots to
// Home, which lists the three tracks plus the study shortcuts. Tapping a track
// opens Topics for that track; tapping a topic pushes a fresh LevelPlay. This
// replaces the old StartPoint first-launch choice and the flat LevelMap.

import type { AnswerOutcome, LevelSession } from '../game/levelMachine';

/** Params for the end-of-level result route (Task 8). */
export interface ResultScreenParams {
  /** The level that just ended (pass or mercy). */
  levelId: string;
  /**
   * The full machine outcome that ended it — the ResultScreen derives its
   * message ("Streak!" / "Mastery reached" / mercy) and score summary from it.
   */
  outcome: AnswerOutcome;
  /** Next level id in the flattened sequence, or null when the track is complete. */
  nextLevelId: string | null;
  /**
   * The ended session, kept so "Keep practicing" can continue it (preserving
   * streak / correct count / asked questions) instead of restarting the level.
   */
  practiceSession?: LevelSession;
}

/**
 * Root stack routes. The app boots to Home unconditionally; every other screen
 * is pushed on top. `Topics` carries the selected track id; `LevelPlay` the
 * level id to play (a fresh mount per replay).
 */
export type RootStackParamList = {
  /** The main screen — track list + progress summary + study shortcuts (Task 4). */
  Home: undefined;
  /** One track's topic list — lists that track's levels with derived statuses (Task 5). */
  Topics: { trackId: string };
  LevelPlay: { levelId: string; practiceSession?: LevelSession };
  Result: ResultScreenParams;
  Graduation: undefined;
  /** Wrong-answer study history grouped by rule (reachable from Home). */
  Review: undefined;
  /** Appearance (theme), Growth (notifications), and reset. */
  Settings: undefined;
  MixedReview: undefined;
  Report: { questionId?: string };
  Stats: undefined;
};
