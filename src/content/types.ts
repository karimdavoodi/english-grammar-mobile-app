/**
 * Content schema types — the static, bundled, read-only "database".
 *
 * Field-for-field mirror of `docs/schema/english-grammar-game.md` §1 (Content).
 * The app is a player, the content is a database: tracks, levels, topics,
 * rules, and questions are all plain data. `validateContent()` (validate.ts)
 * is the fail-fast safety net for AI-generated content.
 */

/** Content-defined stable track id, e.g. 'basic'. */
export type TrackId = string;

/** A chapter of levels; ordered on the map by `order`. */
export interface Track {
  id: TrackId;
  /** 1..n — defines chapter order on the map. */
  order: number;
  /** e.g. 'Basic'. */
  name: string;
  /** User-facing label, e.g. 'Beginner'. */
  label: string;
  /** Ordered by level.number. */
  levels: Level[];
  /** Controls onboarding choices; Basic is true in the MVP. */
  eligibleStartingPoint: boolean;
}

/** One grammar level inside a track. */
export interface Level {
  /** e.g. 'b03' — globally unique. */
  id: string;
  trackId: TrackId;
  /** 1-based, sequential within the track. */
  number: number;
  /** e.g. 'Past Perfect'. */
  title: string;
  /** The single grammar topic this level teaches. */
  topic: Topic;
  /** The bank (≥ mercy cap; recommended target ~12). */
  questions: Question[];
}

/** The teaching card for a level's single topic. */
export interface Topic {
  /** e.g. 'Past Perfect'. */
  title: string;
  /** One-paragraph teaching blurb (shown on the lesson card). */
  summary: string;
  /** The sub-rules of this topic. */
  rules: TopicRule[];
}

/**
 * A sub-rule of a topic. `rule` is the GLOBAL tag linking questions to their
 * teaching — defined exactly once, in the level where the rule is introduced.
 * Later (recurring) levels tag questions with it but never re-define it.
 */
export interface TopicRule {
  /** Global tag — the key of the whole design; links to Question.rule. */
  rule: string;
  /** Human title, e.g. 'Past Perfect vs Past Simple'. */
  title: string;
  /** The teaching: form + use. */
  explanation: string;
  /** Example sentence(s). */
  example: string;
}

/** A multiple-choice grammar question. */
export interface Question {
  /** e.g. 'b03q01' — globally unique. */
  id: string;
  /** Owning level. */
  levelId: string;
  /** Narrow rule tag (may belong to this topic OR an earlier topic). */
  rule: string;
  prompt: string;
  /** Exactly 4 choices. */
  choices: string[];
  /** 0–3. */
  correctIndex: number;
  /**
   * Exactly 4, positionally aligned with choices:
   *   [correctIndex] = why that choice is RIGHT
   *   the other 3   = why each choice is WRONG
   */
  choiceExplanations: string[];
}
