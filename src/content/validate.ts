/**
 * Load/dev-time content validator — the fail-fast safety net for AI-generated
 * content. Every documented rule in `docs/schema/english-grammar-game.md` §1
 * ("Content validation") throws here; a malformed track can never reach the app.
 *
 * Design notes:
 * - Checks accumulate into one `ContentValidationError` listing every problem,
 *   so an author sees all violations in a single run.
 * - `TopicRule.rule` is treated as a GLOBAL registry: each `rule` tag is
 *   defined exactly once (in its home level/topic). Recurring levels reference
 *   the canonical definition via tagged questions and never re-define it — that
 *   is why question resolution runs in a second pass over the full registry.
 * - "Rules that recur across levels exist in both their home topic and the
 *   recurring level's bank" is enforced by that resolution: a question's `rule`
 *   must resolve to a unique `TopicRule` (home-topic half), and the question
 *   itself sits in the recurring level's bank (bank half).
 */

import type { Question, Track } from './types';

/** v1 level mercy cap — also the minimum question-bank size per level. */
export const DEFAULT_MERCY_CAP = 12;

export interface ValidateOptions {
  /** Minimum bank size per level; v1 = 12 so a level never recycles mid-session. */
  mercyCap: number;
}

/** Thrown by `validateContent` when the corpus violates any fail-fast rule. */
export class ContentValidationError extends Error {
  /** Every individual violation found, in encounter order. */
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(
      `Content validation failed (${problems.length} problem${problems.length === 1 ? '' : 's'}):\n` +
        problems.map(p => `- ${p}`).join('\n'),
    );
    this.name = 'ContentValidationError';
    this.problems = problems;
  }
}

/**
 * Validate the whole content corpus. Throws `ContentValidationError` listing
 * every violation; returns normally when the content is shippable.
 */
export function validateContent(
  tracks: Track[],
  options: ValidateOptions = { mercyCap: DEFAULT_MERCY_CAP },
): void {
  const { mercyCap } = options;
  const problems: string[] = [];
  const push = (message: string) => problems.push(message);

  // ── global uniqueness sets ────────────────────────────────────────────────
  const trackIds = new Set<string>();
  const trackOrders = new Set<number>();
  const levelIds = new Set<string>();
  const questionIds = new Set<string>();
  /** Global rule registry: rule tag → id of the level that canonically defines it. */
  const ruleRegistry = new Map<string, string>();
  /** All questions, collected for rule resolution after the registry is built. */
  const allQuestions: Array<{ question: Question; levelId: string }> = [];

  let eligibleTracks = 0;

  // ── Pass 1: structural checks + build the global rule registry ───────────
  for (const track of tracks) {
    if (trackIds.has(track.id)) {
      push(`duplicate track.id '${track.id}'`);
    } else {
      trackIds.add(track.id);
    }

    if (trackOrders.has(track.order)) {
      push(`duplicate track.order ${track.order} (track '${track.id}')`);
    } else {
      trackOrders.add(track.order);
    }

    if (track.eligibleStartingPoint) {
      eligibleTracks++;
      if (!track.levels.some(level => level.number === 1)) {
        push(`eligible starting-point track '${track.id}' has no level 1`);
      }
    }

    // Level numbers must be 1, 2, 3, … with no gaps or repeats within a track.
    const numbers = [...track.levels].map(level => level.number).sort((a, b) => a - b);
    const expected = numbers.map((_, i) => i + 1);
    if (numbers.length > 0 && numbers.some((n, i) => n !== expected[i])) {
      push(
        `track '${track.id}' level.number not sequential (got [${numbers.join(', ')}], expected [${expected.join(', ')}])`,
      );
    }

    for (const level of track.levels) {
      if (levelIds.has(level.id)) {
        push(`duplicate level.id '${level.id}'`);
      } else {
        levelIds.add(level.id);
      }

      if (level.trackId !== track.id) {
        push(`level '${level.id}' trackId '${level.trackId}' does not match containing track '${track.id}'`);
      }

      if (level.questions.length < mercyCap) {
        push(
          `level '${level.id}' bank size ${level.questions.length} < mercy cap ${mercyCap}` +
            ` (a level must never recycle questions mid-session)`,
        );
      }

      for (const rule of level.topic.rules) {
        const owner = ruleRegistry.get(rule.rule);
        if (owner !== undefined) {
          push(`duplicate TopicRule.rule '${rule.rule}' (canonical definition is in level '${owner}'; level '${level.id}' re-defines it)`);
        } else {
          ruleRegistry.set(rule.rule, level.id);
        }
      }

      for (const question of level.questions) {
        if (questionIds.has(question.id)) {
          push(`duplicate question.id '${question.id}'`);
        } else {
          questionIds.add(question.id);
        }

        if (question.levelId !== level.id) {
          push(`question '${question.id}' levelId '${question.levelId}' does not match containing level '${level.id}'`);
        }

        allQuestions.push({ question, levelId: level.id });
      }
    }
  }

  if (eligibleTracks < 1) {
    push('no track is marked eligibleStartingPoint (at least one is required)');
  }

  // ── Pass 2: per-question fail-fast rules (resolution needs the full registry) ─
  for (const { question } of allQuestions) {
    if (!ruleRegistry.has(question.rule)) {
      push(`question '${question.id}' references rule '${question.rule}' which resolves to no TopicRule anywhere in the corpus`);
    }

    if (question.choices.length !== 4) {
      push(`question '${question.id}' has ${question.choices.length} choices; exactly 4 are required`);
    }

    if (
      !Number.isInteger(question.correctIndex) ||
      question.correctIndex < 0 ||
      question.correctIndex > 3
    ) {
      push(`question '${question.id}' correctIndex ${question.correctIndex} is out of range 0..3`);
    }

    if (question.choiceExplanations.length !== 4) {
      push(
        `question '${question.id}' has ${question.choiceExplanations.length} choiceExplanations; ` +
          `exactly 4, positionally aligned with choices, are required`,
      );
    } else {
      question.choiceExplanations.forEach((explanation, i) => {
        if (explanation.trim().length === 0) {
          push(`question '${question.id}' choiceExplanation[${i}] is empty — a choice with no "why" ships broken teaching`);
        }
      });
    }
  }

  if (problems.length > 0) {
    throw new ContentValidationError(problems);
  }
}
