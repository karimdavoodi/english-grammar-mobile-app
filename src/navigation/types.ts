// Navigation route param types.
//
// Task 9 builds the navigator; these types pin the data each known route
// carries so screens and callers compile against a stable contract.

import type { AnswerOutcome } from '../game/levelMachine';

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
}

/**
 * Root stack routes. Task 9 wires StartPoint (first-launch choice), LevelPlay,
 * and Result; Task 10 adds the LevelMap; Task 11 adds Review; Settings lands in
 * Task 12.
 */
export type RootStackParamList = {
  /** First-launch "Where do you want to start?" — shown only with no progress. */
  StartPoint: undefined;
  LevelPlay: { levelId: string };
  Result: ResultScreenParams;
  /** The level map — progress overview and free-play hub (Task 10). */
  LevelMap: undefined;
  /** Wrong-answer study history grouped by rule (reachable from Settings in Task 12). */
  Review: undefined;
  /** Appearance (theme) and reset — the Settings screen (Task 12). */
  Settings: undefined;
  MixedReview: undefined;
  Report: { questionId?: string };
  Stats: undefined;
};
