import type {
  FillBlankQuestion,
  FixSentenceQuestion,
  MultipleChoiceQuestion,
  QuestionUnion,
  WordOrderQuestion,
} from '../content/types';

/** The answer shapes produced by the question-specific UI components. */
export type AnswerResponse =
  | { type: 'index'; index: number }
  | { type: 'text'; text: string }
  | { type: 'sequence'; indexes: number[] };

export type ChoiceQuestion = MultipleChoiceQuestion | FixSentenceQuestion;

export interface ScoreResult {
  isCorrect: boolean;
  /** Present for choice questions so feedback can highlight the right choice. */
  correctIndex?: number;
  /** Present for typed questions so feedback can show the canonical answer. */
  correctAnswer?: string;
}

/**
 * Normalize answers for forgiving fill-in-the-blank matching. Punctuation is
 * ignored, while word boundaries are preserved so "has left" and "hasleft"
 * do not accidentally become equivalent.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreChoice(question: ChoiceQuestion, response: AnswerResponse): ScoreResult {
  const correctIndex = question.correctIndex;
  return {
    isCorrect: response.type === 'index' && response.index === correctIndex,
    correctIndex,
  };
}

function scoreFillBlank(question: FillBlankQuestion, response: AnswerResponse): ScoreResult {
  const correctAnswer = question.correctAnswer;
  const accepted = [correctAnswer, ...question.acceptedAnswers].map(normalizeText);
  return {
    isCorrect: response.type === 'text' && accepted.includes(normalizeText(response.text)),
    correctAnswer,
  };
}

function scoreWordOrder(question: WordOrderQuestion, response: AnswerResponse): ScoreResult {
  const expected = question.sentenceWords.map((_, index) => index);
  const indexes = response.type === 'sequence' ? response.indexes : [];
  const isCorrect =
    indexes.length === expected.length && indexes.every((index, position) => index === expected[position]);
  return { isCorrect, correctAnswer: question.sentenceWords.join(' ') };
}

/** Score an answer without mutating content or session state. */
export function scoreAnswer(question: QuestionUnion, response: AnswerResponse): ScoreResult {
  switch (question.type) {
    case 'multiple_choice':
    case 'fix_sentence':
      return scoreChoice(question, response);
    case 'fill_blank':
      return scoreFillBlank(question, response);
    case 'word_order':
      return scoreWordOrder(question, response);
  }
}
