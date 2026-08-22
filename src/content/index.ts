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
import { basicTrack } from './tracks/basic';
import type { Track } from './types';

/** All bundled tracks, ordered by `track.order` on the map. */
export const tracks: Track[] = [basicTrack];

// Fail-fast at load: malformed AI-generated content must never reach the app.
validateContent(tracks);

export { validateContent } from './validate';
export { ContentValidationError, DEFAULT_MERCY_CAP } from './validate';
export type { Track, TrackId, Level, Topic, TopicRule, Question } from './types';
