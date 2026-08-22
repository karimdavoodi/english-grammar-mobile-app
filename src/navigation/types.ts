// Navigation route param types.
//
// Task 9 builds the actual navigator; these types pin the data each known route
// carries so screens and callers compile against a stable contract before the
// navigator lands.

/** Params for the end-of-level result route (Task 8). */
export interface ResultScreenParams {
  /** The level that just ended (pass or mercy). */
  levelId: string;
  /** true when the level passed (adds to `completedLevelIds`); false on a mercy-end. */
  passed: boolean;
  /** Why the level passed — 'streak' | 'volume' | null. */
  passReason: 'streak' | 'volume' | null;
  /** true when the level ended at the answer cap without passing. */
  endedByMercy: boolean;
  /** Next level id in the flattened sequence, or null when the track is complete. */
  nextLevelId: string | null;
}

/**
 * Root stack routes known so far. Task 9 adds StartPoint, LevelMap, Review, and
 * Settings.
 */
export type RootStackParamList = {
  LevelPlay: { levelId: string };
  Result: ResultScreenParams;
};
