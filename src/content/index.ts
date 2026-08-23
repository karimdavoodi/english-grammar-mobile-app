/**
 * Content loader — assembles all bundled tracks and validates them at load.
 *
 * Content is pure data: the tracks live in `./data/*.json`, bundled into the
 * app by Metro and imported once at load. Importing this module runs
 * `validateContent()` (fail-fast): a malformed track throws before it can ever
 * reach the app. The exported `tracks` array is the single source of truth for
 * the map sequence and onboarding choices — per the governing principle, adding
 * a level or track is a content edit in `./data`, never a code change.
 */

import { validateContent } from './validate';
import { normalizeTrack } from './types';
import type { Level, Track, TopicRule, TrackInput } from './types';
import basicData from './data/basic.json';
import intermediateData from './data/intermediate.json';
import advancedData from './data/advanced.json';

/** All bundled tracks, ordered by `track.order` on the map. */
export const tracks: Track[] = [
  normalizeTrack(basicData as TrackInput),
  normalizeTrack(intermediateData as TrackInput),
  normalizeTrack(advancedData as TrackInput),
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
