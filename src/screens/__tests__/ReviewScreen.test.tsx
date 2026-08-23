/**
 * Tests for the Task 11 ReviewScreen: the wrong-answer study history grouped by
 * rule. Presentational and fixture-data driven — no navigation, storage, or
 * reducers — so each test renders it with explicit props.
 *
 * Coverage maps to the Task 11 acceptance criteria: the empty state, grouping by
 * rule, per-entry details (last wrong choice, correct answer, miss count, both
 * "why" explanations), the still-queued flag, and the back affordance.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { Level, Question, Track } from '../../content/types';
import type { WeaknessEntry, WrongAnswerEntry } from '../../state/types';
import { renderScreen } from '../../test-utils';
import { ReviewScreen } from '../ReviewScreen';

const RULE_PRESENT = 'present_simple_form';
const RULE_PAST = 'past_simple_form';

function makeQuestion(
  levelId: string,
  id: string,
  rule: string,
  overrides: Partial<Question> = {},
): Question {
  return {
    id,
    levelId,
    rule,
    prompt: `Prompt ${id}`,
    choices: ['alpha', 'beta', 'gamma', 'delta'],
    correctIndex: 0,
    choiceExplanations: [
      'correct: alpha',
      'wrong: beta',
      'wrong: gamma',
      'wrong: delta',
    ],
    ...overrides,
  };
}

function makeLevel(
  id: string,
  number: number,
  questions: Question[],
  rules: Track['levels'][number]['topic']['rules'] = [],
): Level {
  return {
    id,
    trackId: 'basic',
    number,
    title: `Level ${id}`,
    topic: { title: `Topic ${id}`, summary: 'summary', rules },
    questions,
  };
}

const b01q01 = makeQuestion('b01', 'b01q01', RULE_PRESENT);
const b01q02 = makeQuestion('b01', 'b01q02', RULE_PRESENT);
const b02q01 = makeQuestion('b02', 'b02q01', RULE_PAST);

const TRACKS: Track[] = [
  {
    id: 'basic',
    order: 1,
    name: 'Basic',
    label: 'Beginner',
    eligibleStartingPoint: true,
    levels: [
      makeLevel('b01', 1, [b01q01, b01q02], [
        { rule: RULE_PRESENT, title: 'Present Simple', explanation: 'Present explanation.', example: 'She works.' },
      ]),
      makeLevel('b02', 2, [b02q01], [
        { rule: RULE_PAST, title: 'Past Simple', explanation: 'Past explanation.', example: 'She worked.' },
      ]),
    ],
  },
];

const WRONG_ANSWERS: Record<string, WrongAnswerEntry> = {
  'b01q01': {
    questionId: 'b01q01',
    count: 2,
    lastChosenIndex: 2,
    lastMissedAt: '2026-08-01T10:00:00.000Z',
  },
  'b01q02': {
    questionId: 'b01q02',
    count: 1,
    lastChosenIndex: 1,
    lastMissedAt: '2026-08-02T10:00:00.000Z',
  },
  'b02q01': {
    questionId: 'b02q01',
    count: 3,
    lastChosenIndex: 2,
    lastMissedAt: '2026-08-03T10:00:00.000Z',
  },
};

function queuedEntry(rule: string, overrides: Partial<WeaknessEntry> = {}): WeaknessEntry {
  return { rule, missCount: 1, reviewStreak: 0, lastMissedAt: 'x', ...overrides };
}

async function render(
  ui: React.ReactElement,
): Promise<ReactTestRenderer.ReactTestRenderer> {
  return renderScreen(ui);
}

function textOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  const children = tree.root.findByProps({ testID }).props.children;
  if (Array.isArray(children)) {
    return children.map(child => String(child)).join('');
  }
  return String(children);
}

describe('ReviewScreen — empty state', () => {
  it('shows a friendly message when no mistakes exist', async () => {
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={{}} weaknessQueue={{}} />,
    );

    expect(textOf(tree, 'review-empty-title')).toBe('No mistakes yet');
    expect(textOf(tree, 'review-empty-body')).toContain('Keep going');
    expect(tree.root.findAllByProps({ testID: 'review-group-present_simple_form' })).toHaveLength(
      0,
    );
  });
});

describe('ReviewScreen — grouping', () => {
  it('lists every missed question grouped by rule', async () => {
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={WRONG_ANSWERS} weaknessQueue={{}} />,
    );

    expect(textOf(tree, 'review-rule-title-present_simple_form')).toBe('Present Simple');
    expect(textOf(tree, 'review-rule-title-past_simple_form')).toBe('Past Simple');
    expect(tree.root.findByProps({ testID: 'review-question-b01q01' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'review-question-b01q02' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'review-question-b02q01' })).toBeTruthy();
  });

  it('shows the question, both answers, the miss count, and both "why" explanations', async () => {
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={WRONG_ANSWERS} weaknessQueue={{}} />,
    );

    expect(textOf(tree, 'review-prompt-b01q02')).toBe('Prompt b01q02');
    expect(textOf(tree, 'review-chosen-b01q02')).toBe('Your answer: beta');
    expect(textOf(tree, 'review-correct-b01q02')).toBe('Correct answer: alpha');
    expect(textOf(tree, 'review-miss-count-b01q02')).toBe('Missed 1 time');
    expect(textOf(tree, 'review-why-wrong-b01q02')).toBe('wrong: beta');
    expect(textOf(tree, 'review-why-right-b01q02')).toBe('correct: alpha');
  });

  it('pluralizes the miss count and uses the cumulative count', async () => {
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={WRONG_ANSWERS} weaknessQueue={{}} />,
    );
    expect(textOf(tree, 'review-miss-count-b01q01')).toBe('Missed 2 times');
    expect(textOf(tree, 'review-miss-count-b02q01')).toBe('Missed 3 times');
  });

  it('shows the rule teaching in the group header', async () => {
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={WRONG_ANSWERS} weaknessQueue={{}} />,
    );
    expect(textOf(tree, 'review-rule-teaching-past_simple_form')).toBe('Past explanation.');
    expect(textOf(tree, 'review-rule-example-past_simple_form')).toBe('She worked.');
  });

  it('flags a rule that is still in the Weakness Queue', async () => {
    const tree = await render(
      <ReviewScreen
        tracks={TRACKS}
        wrongAnswers={WRONG_ANSWERS}
        weaknessQueue={{ [RULE_PRESENT]: queuedEntry(RULE_PRESENT) }}
      />,
    );

    expect(tree.root.findByProps({ testID: 'review-weak-present_simple_form' })).toBeTruthy();
    expect(
      tree.root.findAllByProps({ testID: 'review-weak-past_simple_form' }),
    ).toHaveLength(0);
  });

  it('keeps history visible even after a weakness is cleared (not queued)', async () => {
    // The rule's questions still appear in the history; only the badge is gone.
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={WRONG_ANSWERS} weaknessQueue={{}} />,
    );
    expect(textOf(tree, 'review-rule-title-present_simple_form')).toBe('Present Simple');
    expect(
      tree.root.findAllByProps({ testID: 'review-weak-present_simple_form' }),
    ).toHaveLength(0);
  });
});

describe('ReviewScreen — back affordance (Task 3)', () => {
  it('renders no bottom Back button — back is the system gesture', async () => {
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={WRONG_ANSWERS} weaknessQueue={{}} />,
    );
    expect(tree.root.findAllByProps({ testID: 'review-back' })).toHaveLength(0);
  });
});

describe('ReviewScreen — accessibility', () => {
  it('exposes header roles and a summary screen container', async () => {
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={WRONG_ANSWERS} weaknessQueue={{}} />,
    );
    expect(tree.root.findByProps({ testID: 'review-heading' }).props.accessibilityRole).toBe(
      'header',
    );
    expect(
      tree.root.findByProps({ testID: 'review-rule-title-present_simple_form' }).props
        .accessibilityRole,
    ).toBe('header');
  });
});
