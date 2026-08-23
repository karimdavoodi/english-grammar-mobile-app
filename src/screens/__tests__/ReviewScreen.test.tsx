/**
 * Tests for the Task 11 ReviewScreen: the wrong-answer study history grouped by
 * rule. Presentational and fixture-data driven — no navigation, storage, or
 * reducers — so each test renders it with explicit props.
 *
 * Coverage maps to the Task 11 acceptance criteria: the empty state, grouping by
 * rule, per-entry details (last wrong choice, correct answer, both "why"
 * explanations), the still-queued flag, and the back affordance. Task 4 (docs/
 * ui-plan-1.md) removes the per-entry miss count and per-question report button
 * and adds one "Report a problem" action at the end of a non-empty list.
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

  it('shows the question, both answers, and both "why" explanations', async () => {
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={WRONG_ANSWERS} weaknessQueue={{}} />,
    );

    expect(textOf(tree, 'review-prompt-b01q02')).toBe('Prompt b01q02');
    expect(textOf(tree, 'review-chosen-b01q02')).toBe('Your answer: beta');
    expect(textOf(tree, 'review-correct-b01q02')).toBe('Correct answer: alpha');
    expect(textOf(tree, 'review-why-wrong-b01q02')).toBe('wrong: beta');
    expect(textOf(tree, 'review-why-right-b01q02')).toBe('correct: alpha');
  });

  it('does not show a per-question miss-count line (Task 4)', async () => {
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={WRONG_ANSWERS} weaknessQueue={{}} />,
    );
    expect(tree.root.findAllByProps({ testID: 'review-miss-count-b01q01' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'review-miss-count-b02q01' })).toHaveLength(0);
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

describe('ReviewScreen — single report action (Task 4)', () => {
  /** Count host-rendered nodes carrying a testID (Pressable duplicates it on hosts). */
  function hostCount(tree: ReactTestRenderer.ReactTestRenderer, testID: string): number {
    return tree.root.findAll(
      node => typeof node.type === 'string' && node.props.testID === testID,
    ).length;
  }

  /** Count host-rendered text nodes whose children equal `text`. */
  function hostTextCount(tree: ReactTestRenderer.ReactTestRenderer, text: string): number {
    return tree.root.findAll(
      node => typeof node.type === 'string' && String(node.props.children) === text,
    ).length;
  }

  it('renders exactly one "Report a problem" action at the end of a non-empty list', async () => {
    const tree = await render(
      <ReviewScreen
        tracks={TRACKS}
        wrongAnswers={WRONG_ANSWERS}
        weaknessQueue={{}}
        onOpenReport={jest.fn()}
      />,
    );
    expect(hostCount(tree, 'review-report-problem')).toBe(1);
    expect(hostTextCount(tree, 'Report a problem')).toBe(1);
  });

  it('does not render the report action when the list is empty', async () => {
    const tree = await render(
      <ReviewScreen
        tracks={TRACKS}
        wrongAnswers={{}}
        weaknessQueue={{}}
        onOpenReport={jest.fn()}
      />,
    );
    expect(hostCount(tree, 'review-report-problem')).toBe(0);
  });

  it('omits the report action when no handler is provided', async () => {
    const tree = await render(
      <ReviewScreen tracks={TRACKS} wrongAnswers={WRONG_ANSWERS} weaknessQueue={{}} />,
    );
    expect(hostCount(tree, 'review-report-problem')).toBe(0);
  });

  it('renders no per-question Report button', async () => {
    const tree = await render(
      <ReviewScreen
        tracks={TRACKS}
        wrongAnswers={WRONG_ANSWERS}
        weaknessQueue={{}}
        onOpenReport={jest.fn()}
      />,
    );
    expect(hostCount(tree, 'report-button')).toBe(0);
  });

  it('calls onOpenReport (with no arguments) when pressed', async () => {
    const onOpenReport = jest.fn();
    const tree = await render(
      <ReviewScreen
        tracks={TRACKS}
        wrongAnswers={WRONG_ANSWERS}
        weaknessQueue={{}}
        onOpenReport={onOpenReport}
      />,
    );
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'review-report-problem' }).props.onPress();
    });
    expect(onOpenReport).toHaveBeenCalledTimes(1);
    expect(onOpenReport).toHaveBeenCalledWith();
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
