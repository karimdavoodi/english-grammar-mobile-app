/**
 * Content loader — assembles all bundled tracks and validates them at load.
 *
 * Importing this module runs `validateContent()` (fail-fast): a malformed track
 * throws before it can ever reach the app. The exported `tracks` array is the
 * single source of truth for the map sequence and onboarding choices — per the
 * governing principle, adding a level or track is a content edit here, never a
 * code change.
 */

import { validateContent } from './validate';
import { basicCluster01 } from './tracks/basic/basic-01';
import { basicCluster02 } from './tracks/basic/basic-02';
import { basicCluster03 } from './tracks/basic/basic-03';
import { basicCluster04 } from './tracks/basic/basic-04';
import { normalizeTrack } from './types';
import type { Level, Track, TopicRule } from './types';

/** All bundled tracks, ordered by `track.order` on the map. */
export const tracks: Track[] = [
  normalizeTrack({
    id: 'basic',
    order: 1,
    name: 'Basic',
    label: 'Beginner',
    eligibleStartingPoint: true,
    levels: [...basicCluster01, ...basicCluster02, ...basicCluster03, ...basicCluster04],
  }),
];

// Fail-fast at load: malformed AI-generated content must never reach the app.
validateContent(tracks);

/**
 * Canonical rule registry — every `TopicRule.rule` tag in the corpus, mapped to
 * its single definition. The validator guarantees rule definitions are globally
 * unique, so this map is safe. Used to resolve a served/reviewed question's rule
 * tag to its teaching content even when the tag's home is an earlier level.
 */
const RULE_REGISTRY: ReadonlyMap<string, TopicRule> = new Map(
  tracks.flatMap(track =>
    track.levels.flatMap(level => level.topic.rules.map(rule => [rule.rule, rule] as const)),
  ),
);

/** Resolve a question's `rule` tag to its canonical `TopicRule`, if defined. */
export function findRule(ruleTag: string): TopicRule | undefined {
  return RULE_REGISTRY.get(ruleTag);
}

/** Find a level across all tracks by its globally unique id. */
export function findLevelById(
  allTracks: readonly Track[],
  levelId: string,
): Level | undefined {
  for (const track of allTracks) {
    const level = track.levels.find(l => l.id === levelId);
    if (level) {
      return level;
    }
  }
  return undefined;
}

export { validateContent } from './validate';
export { ContentValidationError, DEFAULT_MERCY_CAP } from './validate';
export type {
  Track,
  TrackId,
  Level,
  Topic,
  TopicRule,
  Question,
  QuestionUnion,
  QuestionInput,
  MultipleChoiceQuestion,
  FixSentenceQuestion,
  FillBlankQuestion,
  WordOrderQuestion,
} from './types';
