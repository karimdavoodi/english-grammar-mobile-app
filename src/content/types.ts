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
  /** When enabled, add a small sample of questions from earlier levels. */
  interleave?: boolean;
  /** The bank (≥ mercy cap; recommended target ~12). */
  // Loaded MVP levels remain choice-based; QuestionInput allows future typed
  // source questions before the machine/UI upgrades consume them.
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

/** Fields shared by every question interaction. */
interface BaseQuestion {
  /** e.g. 'b03q01' — globally unique. */
  id: string;
  /** Owning level. */
  levelId: string;
  /** Narrow rule tag (may belong to this topic OR an earlier topic). */
  rule: string;
}

/** A standard four-choice grammar question. */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
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

/** A four-choice question that presents a faulty sentence for correction. */
export type FixSentenceQuestion = Omit<MultipleChoiceQuestion, 'type'> & {
  type: 'fix_sentence';
  faultySentence: string;
}

/** A question answered by typing an accepted normalized form. */
export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill_blank';
  prompt: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation: string;
  commonMistakes?: Array<{ mistake: string; feedback: string }>;
}

/** A question answered by arranging the words into canonical order. */
export interface WordOrderQuestion extends BaseQuestion {
  type: 'word_order';
  sentenceWords: string[];
  prompt?: string;
  explanation: string;
}

/** The runtime content union. Every loaded question has an explicit type. */
export type QuestionUnion =
  | MultipleChoiceQuestion
  | FixSentenceQuestion
  | FillBlankQuestion
  | WordOrderQuestion;

/** Backward-compatible authoring/consumer view for the existing MVP MC flow. */
export interface Question extends Omit<MultipleChoiceQuestion, 'type'> {
  type?: 'multiple_choice';
}

/** Legacy source shape accepted by the loader and normalized to multiple_choice. */
export type LegacyMultipleChoiceQuestion = Omit<MultipleChoiceQuestion, 'type'>;
export type QuestionInput = QuestionUnion | Question | LegacyMultipleChoiceQuestion;

export type LevelInput = Omit<Level, 'questions'> & { questions: QuestionInput[] };
export type TrackInput = Omit<Track, 'levels'> & { levels: LevelInput[] };

/** Add the explicit discriminator required by the runtime union. */
export function normalizeQuestion(question: QuestionInput): QuestionUnion {
  if (!('type' in question)) {
    return { ...question, type: 'multiple_choice' };
  }
  return question as QuestionUnion;
}

export function normalizeTrack(track: TrackInput): Track {
  return {
    ...track,
    levels: track.levels.map(level => ({
      ...level,
      questions: level.questions.map(normalizeQuestion) as Question[],
    })),
  };
}
