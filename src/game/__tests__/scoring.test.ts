import { scoreAnswer, normalizeText, type AnswerResponse } from '../scoring';
import type { QuestionUnion } from '../../content/types';

const choice: QuestionUnion = {
  type: 'multiple_choice', id: 'q1', levelId: 'b01', rule: 'rule', prompt: 'Choose',
  choices: ['A', 'B', 'C', 'D'], correctIndex: 1,
  choiceExplanations: ['wrong', 'right', 'wrong', 'wrong'],
};

describe('scoreAnswer', () => {
  it('scores choice responses by index', () => {
    expect(scoreAnswer(choice, { type: 'index', index: 1 })).toEqual({
      isCorrect: true, correctIndex: 1,
    });
    expect(scoreAnswer(choice, { type: 'index', index: 0 }).isCorrect).toBe(false);
  });

  it('normalizes case, whitespace, and punctuation for fill-blank answers', () => {
    const question: QuestionUnion = {
      type: 'fill_blank', id: 'q2', levelId: 'b01', rule: 'rule', prompt: 'Fill',
      correctAnswer: 'Had left', acceptedAnswers: ['had  left!'], explanation: 'reason',
    };
    expect(normalizeText('  HAD-left! ')).toBe('had left');
    expect(scoreAnswer(question, { type: 'text', text: ' HAD-left! ' }).isCorrect).toBe(true);
    expect(scoreAnswer(question, { type: 'text', text: 'has left' }).isCorrect).toBe(false);
  });

  it('matches word-order sequences exactly', () => {
    const question: QuestionUnion = {
      type: 'word_order', id: 'q3', levelId: 'b01', rule: 'rule',
      sentenceWords: ['She', 'has', 'left'], explanation: 'reason',
    };
    const response: AnswerResponse = { type: 'sequence', indexes: [0, 1, 2] };
    expect(scoreAnswer(question, response).isCorrect).toBe(true);
    expect(scoreAnswer(question, { type: 'sequence', indexes: [1, 0, 2] }).isCorrect).toBe(false);
  });
});
