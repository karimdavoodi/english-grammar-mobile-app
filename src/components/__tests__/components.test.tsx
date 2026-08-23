/**
 * Component tests for the Task 7A presentational components.
 *
 * The components are controlled and fixture-data driven, so each test renders
 * with explicit props (no navigation, storage, or reducers). Coverage targets
 * the acceptance criteria: four choices, correct/wrong feedback, disabled-after-
 * submission, lesson-card content, and accessible labels/roles.
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type {
  FillBlankQuestion,
  FixSentenceQuestion,
  Question,
  Topic,
  TopicRule,
  WordOrderQuestion,
} from '../../content/types';
import { ChoiceButton } from '../ChoiceButton';
import { LessonCard } from '../LessonCard';
import { ProgressHeader } from '../ProgressHeader';
import { QuestionCard } from '../QuestionCard';

const TOPIC: Topic = {
  title: 'Past Perfect',
  summary: 'The past perfect describes an action completed before another past action.',
  rules: [
    {
      rule: 'past_perfect_form',
      title: 'Form: had + past participle',
      explanation: "Formed with 'had' + the past participle (worked, gone, seen).",
      example: 'They had finished dinner before we arrived.',
    },
    {
      rule: 'past_perfect_vs_past_simple',
      title: 'Past Perfect vs Past Simple',
      explanation: 'Use past simple for the later action and past perfect for the earlier one.',
      example: 'The train had left (earlier) by the time we arrived (later).',
    },
  ],
};

const MATCHED_RULE: TopicRule = TOPIC.rules[0];

const QUESTION: Question = {
  id: 'b10q01',
  levelId: 'b10',
  rule: 'past_perfect_form',
  prompt: 'By the time we arrived, the movie ___ .',
  choices: ['starts', 'had started', 'started', 'was started'],
  correctIndex: 1,
  choiceExplanations: [
    "'Starts' is present simple — wrong tense for a past event.",
    "'Had started' is correct: past perfect ('had' + past participle) marks the action as completed before we arrived.",
    "'Started' is past simple — it does not mark the movie as finished before the later past action.",
    "'Was started' is passive voice — wrong; the movie began, it was not begun by someone.",
  ],
};

const FIX_SENTENCE: FixSentenceQuestion = {
  ...QUESTION,
  type: 'fix_sentence',
  faultySentence: 'She go to work every day.',
};

const FILL_BLANK: FillBlankQuestion = {
  id: 'b10q02',
  levelId: 'b10',
  rule: 'past_perfect_form',
  type: 'fill_blank',
  prompt: 'By noon, they ___ the report.',
  correctAnswer: 'had finished',
  acceptedAnswers: ['had completed'],
  explanation: 'Use had + the past participle for the earlier past action.',
  commonMistakes: [{ mistake: 'finished', feedback: 'The auxiliary had is needed here.' }],
};

const WORD_ORDER: WordOrderQuestion = {
  id: 'b10q03',
  levelId: 'b10',
  rule: 'past_perfect_form',
  type: 'word_order',
  prompt: 'Arrange the words.',
  sentenceWords: ['They', 'had', 'left'],
  explanation: 'The past perfect uses had before the past participle.',
};

async function render(
  ui: React.ReactElement,
): Promise<ReactTestRenderer.ReactTestRenderer> {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(ui);
  });
  return tree;
}

function textOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  const children = tree.root.findByProps({ testID }).props.children;
  if (Array.isArray(children)) {
    return children.map(child => String(child)).join('');
  }
  return String(children);
}

describe('ChoiceButton', () => {
  it('renders its letter and choice text', async () => {
    const tree = await render(
      <ChoiceButton choice="had started" index={1} revealed={false} status="idle" onPress={jest.fn()} />,
    );
    expect(textOf(tree, 'choice-letter-1')).toBe('B');
    expect(textOf(tree, 'choice-text-1')).toBe('had started');
  });

  it('calls onPress with its index when pressed', async () => {
    const onPress = jest.fn();
    const tree = await render(
      <ChoiceButton choice="starts" index={0} revealed={false} status="idle" onPress={onPress} />,
    );
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'choice-button-0' }).props.onPress();
    });
    expect(onPress).toHaveBeenCalledWith(0);
  });

  it('locks itself once revealed and ignores presses', async () => {
    const onPress = jest.fn();
    const tree = await render(
      <ChoiceButton choice="had started" index={1} revealed status="correct" onPress={onPress} />,
    );
    const button = tree.root.findByProps({ testID: 'choice-button-1' });
    expect(button.props.accessibilityState.disabled).toBe(true);
    await ReactTestRenderer.act(() => {
      button.props.onPress();
    });
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes a button role and an accessible label with its state', async () => {
    const tree = await render(
      <ChoiceButton choice="had started" index={1} revealed status="correct" onPress={jest.fn()} />,
    );
    const button = tree.root.findByProps({ testID: 'choice-button-1' });
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toContain('Option 2');
    expect(button.props.accessibilityLabel).toContain('had started');
    expect(button.props.accessibilityLabel).toContain('correct');
  });

  it('hides the explanation before reveal and shows it once revealed', async () => {
    const hidden = await render(
      <ChoiceButton choice="starts" index={0} revealed={false} status="idle" onPress={jest.fn()} explanation="Why" />,
    );
    expect(hidden.root.findAllByProps({ testID: 'choice-explanation-0' })).toHaveLength(0);

    const shown = await render(
      <ChoiceButton choice="starts" index={0} revealed status="wrong" onPress={jest.fn()} explanation="Why wrong" />,
    );
    expect(textOf(shown, 'choice-explanation-0')).toBe('Why wrong');
  });

  it('keeps the explanation hidden for dimmed choices even once revealed', async () => {
    const tree = await render(
      <ChoiceButton choice="starts" index={0} revealed status="dimmed" onPress={jest.fn()} explanation="Why" />,
    );
    expect(tree.root.findAllByProps({ testID: 'choice-explanation-0' })).toHaveLength(0);
  });

  it('shows the explanation for the correct choice once revealed', async () => {
    const tree = await render(
      <ChoiceButton choice="had started" index={1} revealed status="correct" onPress={jest.fn()} explanation="Why right" />,
    );
    expect(textOf(tree, 'choice-explanation-1')).toBe('Why right');
  });
});

describe('QuestionCard', () => {
  it('renders the prompt and exactly four choices', async () => {
    const tree = await render(
      <QuestionCard question={QUESTION} selectedIndex={null} revealed={false} onAnswer={jest.fn()} />,
    );
    expect(textOf(tree, 'question-prompt')).toBe(QUESTION.prompt);
    expect(tree.root.findAllByType(ChoiceButton)).toHaveLength(4);
    for (let i = 0; i < 4; i += 1) {
      expect(textOf(tree, `choice-text-${i}`)).toBe(QUESTION.choices[i]);
    }
  });

  it('reports the tapped choice before submission', async () => {
    const onAnswer = jest.fn();
    const tree = await render(
      <QuestionCard question={QUESTION} selectedIndex={null} revealed={false} onAnswer={onAnswer} />,
    );
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'choice-button-2' }).props.onPress();
    });
    expect(onAnswer).toHaveBeenCalledWith({ type: 'index', index: 2 });
  });

  it('confirms a correct answer: correct choice highlighted, choices locked, its "why" shown', async () => {
    const tree = await render(
      <QuestionCard question={QUESTION} selectedIndex={QUESTION.correctIndex} revealed onAnswer={jest.fn()} />,
    );
    const correct = tree.root.findByProps({ testID: 'choice-button-1' });
    const dimmed = tree.root.findByProps({ testID: 'choice-button-0' });
    expect(correct.props.accessibilityLabel).toContain('correct');
    expect(dimmed.props.accessibilityLabel).toContain('not chosen');

    for (let i = 0; i < 4; i += 1) {
      const button = tree.root.findByProps({ testID: `choice-button-${i}` });
      expect(button.props.accessibilityState.disabled).toBe(true);
    }
    // Only the correct choice explains itself — the dimmed choices get none.
    expect(textOf(tree, 'choice-explanation-1')).toBe(QUESTION.choiceExplanations[1]);
    expect(tree.root.findAllByProps({ testID: 'choice-explanation-0' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'choice-explanation-2' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'choice-explanation-3' })).toHaveLength(0);
  });

  it('marks the wrong chosen answer wrong and the correct answer correct', async () => {
    const tree = await render(
      <QuestionCard question={QUESTION} selectedIndex={0} revealed onAnswer={jest.fn()} />,
    );
    const wrong = tree.root.findByProps({ testID: 'choice-button-0' });
    const correct = tree.root.findByProps({ testID: 'choice-button-1' });
    const dimmed = tree.root.findByProps({ testID: 'choice-button-3' });
    expect(wrong.props.accessibilityLabel).toContain('incorrect');
    expect(correct.props.accessibilityLabel).toContain('correct');
    expect(dimmed.props.accessibilityLabel).toContain('not chosen');

    // Only the correct + chosen choices explain themselves.
    expect(textOf(tree, 'choice-explanation-0')).toBe(QUESTION.choiceExplanations[0]);
    expect(textOf(tree, 'choice-explanation-1')).toBe(QUESTION.choiceExplanations[1]);
    expect(tree.root.findAllByProps({ testID: 'choice-explanation-2' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'choice-explanation-3' })).toHaveLength(0);
  });

  it('dispatches fix-sentence questions to the choice renderer', async () => {
    const onAnswer = jest.fn();
    const tree = await render(
      <QuestionCard question={FIX_SENTENCE} selectedIndex={null} revealed={false} onAnswer={onAnswer} />,
    );
    expect(textOf(tree, 'faulty-sentence')).toBe(FIX_SENTENCE.faultySentence);
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'choice-button-1' }).props.onPress();
    });
    expect(onAnswer).toHaveBeenCalledWith({ type: 'index', index: 1 });
  });

  it('dispatches fill-blank questions and reports normalized text', async () => {
    const onAnswer = jest.fn();
    const tree = await render(
      <QuestionCard question={FILL_BLANK} selectedIndex={null} revealed={false} onAnswer={onAnswer} />,
    );
    expect(tree.root.findByProps({ testID: 'fill-blank-input' }).props.accessibilityLabel).toBe(
      'Answer for: By noon, they ___ the report.',
    );
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'fill-blank-input' }).props.onChangeText('  HAD finished!  ');
    });
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'fill-blank-submit' }).props.onPress();
    });
    expect(onAnswer).toHaveBeenCalledWith({ type: 'text', text: 'had finished' });
  });

  it('dispatches word-order questions with the tapped index sequence', async () => {
    const onAnswer = jest.fn();
    const tree = await render(
      <QuestionCard question={WORD_ORDER} selectedIndex={null} revealed={false} onAnswer={onAnswer} random={() => 0} />,
    );
    expect(tree.root.findByProps({ testID: 'word-order-word-0' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'word-order-word-1' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'word-order-word-2' })).toBeTruthy();
    await ReactTestRenderer.act(() => tree.root.findByProps({ testID: 'word-order-word-1' }).props.onPress());
    await ReactTestRenderer.act(() => tree.root.findByProps({ testID: 'word-order-word-2' }).props.onPress());
    await ReactTestRenderer.act(() => tree.root.findByProps({ testID: 'word-order-word-0' }).props.onPress());
    expect(tree.root.findByProps({ testID: 'word-order-builder' })).toBeTruthy();
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'word-order-submit' }).props.onPress();
    });
    expect(onAnswer).toHaveBeenCalledWith({ type: 'sequence', indexes: [1, 2, 0] });
  });

  it('shows typed feedback with the canonical answer and matched mistake guidance', async () => {
    const tree = await render(
      <QuestionCard
        question={FILL_BLANK}
        selectedIndex={null}
        selectedResponse={{ type: 'text', text: 'finished' }}
        revealed
        onAnswer={jest.fn()}
      />,
    );
    expect(textOf(tree, 'typed-correct-answer')).toBe('Correct answer: had finished');
    expect(textOf(tree, 'typed-explanation')).toBe(FILL_BLANK.explanation);
    expect(textOf(tree, 'typed-common-mistake')).toContain('The auxiliary had is needed here.');
  });
});

describe('LessonCard', () => {
  it('shows the topic summary and the matching rule content', async () => {
    const tree = await render(
      <LessonCard topic={TOPIC} rule={MATCHED_RULE} onContinue={jest.fn()} />,
    );
    expect(textOf(tree, 'lesson-topic-title')).toBe(TOPIC.title);
    expect(textOf(tree, 'lesson-summary')).toBe(TOPIC.summary);

    const block = tree.root.findByProps({ testID: `lesson-rule-${MATCHED_RULE.rule}` });
    const blockText = block.findAllByType(Text).map(t => String(t.props.children)).join(' ');
    expect(blockText).toContain(MATCHED_RULE.title);
    expect(blockText).toContain(MATCHED_RULE.explanation);
    expect(blockText).toContain(MATCHED_RULE.example);
  });

  it('lists every topic rule when no specific rule is matched', async () => {
    const tree = await render(
      <LessonCard topic={TOPIC} rule={null} onContinue={jest.fn()} />,
    );
    for (const rule of TOPIC.rules) {
      expect(tree.root.findByProps({ testID: `lesson-rule-${rule.rule}` })).toBeTruthy();
    }
  });

  it('labels the card as a review when the rule is from an earlier topic', async () => {
    const tree = await render(
      <LessonCard topic={TOPIC} rule={MATCHED_RULE} review onContinue={jest.fn()} />,
    );
    const heading = tree.root.findByProps({ testID: 'lesson-heading' });
    expect(String(heading.props.children)).toContain('Review');
  });

  it('exposes a summary role with the topic label', async () => {
    const tree = await render(
      <LessonCard topic={TOPIC} rule={MATCHED_RULE} onContinue={jest.fn()} />,
    );
    const card = tree.root.findByProps({ testID: 'lesson-card' });
    expect(card.props.accessibilityRole).toBe('summary');
    expect(card.props.accessibilityLabel).toBe(`Lesson: ${TOPIC.title}`);
  });

  it('dismisses via the continue button', async () => {
    const onContinue = jest.fn();
    const tree = await render(
      <LessonCard topic={TOPIC} rule={MATCHED_RULE} actionLabel="Next" onContinue={onContinue} />,
    );
    const button = tree.root.findByProps({ testID: 'lesson-continue' });
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Next');
    await ReactTestRenderer.act(() => {
      button.props.onPress();
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders without a continue button when the action label is null', async () => {
    const tree = await render(
      <LessonCard topic={TOPIC} rule={MATCHED_RULE} actionLabel={null} onContinue={jest.fn()} />,
    );
    expect(tree.root.findAllByProps({ testID: 'lesson-continue' })).toHaveLength(0);
  });
});

describe('ProgressHeader', () => {
  it('shows streak, correct count, and answered count over the cap', async () => {
    const tree = await render(
      <ProgressHeader streak={2} correctCount={7} answeredCount={9} mercyCap={12} />,
    );
    expect(textOf(tree, 'progress-streak')).toBe('Streak: 2');
    expect(textOf(tree, 'progress-correct')).toBe('Correct: 7');
    expect(textOf(tree, 'progress-answered')).toBe('Answered: 9/12');
  });

  it('exposes a summary role with a combined label', async () => {
    const tree = await render(
      <ProgressHeader streak={0} correctCount={1} answeredCount={3} mercyCap={12} />,
    );
    const header = tree.root.findByProps({ testID: 'progress-header' });
    expect(header.props.accessibilityRole).toBe('summary');
    expect(header.props.accessibilityLabel).toBe('Streak 0, correct 1, answered 3 of 12');
  });
});
