jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { selectStats, type AnswerEvent } from '../../state/events';
import { renderScreen, wrapInSafeArea } from '../../test-utils';
import { StatsScreen } from '../StatsScreen';

/** A valid answer event; override any field per assertion. */
function answer(overrides: Partial<AnswerEvent> = {}): AnswerEvent {
  return {
    kind: 'answer',
    questionId: 'q1',
    rule: 'tense',
    questionType: 'multiple_choice',
    isCorrect: true,
    levelId: 'b01',
    timestamp: '2026-08-23T10:00:00Z',
    ...overrides,
  };
}

/** The rule-card host nodes in rendered order (skips the title/fraction/bar children). */
function ruleCards(tree: ReactTestRenderer.ReactTestRenderer) {
  return tree.root.findAll(
    node =>
      typeof node.type === 'string' &&
      typeof node.props.testID === 'string' &&
      /^stats-rule-[a-z_]+$/.test(node.props.testID),
  );
}

it('renders fixture stats and links to Review', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      wrapInSafeArea(
        <StatsScreen
          stats={selectStats([answer()])}
          onOpenReview={jest.fn()}
        />,
      ),
    );
  });
  expect(String(tree.root.findByProps({ testID: 'stats-total' }).props.children)).toContain('1');
  expect(tree.root.findByProps({ testID: 'stats-rule-tense' })).toBeDefined();
  const onOpenReview = jest.fn();
  await ReactTestRenderer.act(() => {
    tree.update(wrapInSafeArea(<StatsScreen stats={selectStats([])} onOpenReview={onOpenReview} />));
  });
  await ReactTestRenderer.act(() => tree.root.findByProps({ testID: 'stats-review' }).props.onPress());
  expect(onOpenReview).toHaveBeenCalledTimes(1);
});

it('renders no bottom Back button (Task 3) — back is the system gesture', async () => {
  const tree = await renderScreen(
    <StatsScreen stats={selectStats([])} onOpenReview={jest.fn()} />,
  );
  expect(tree.root.findAllByProps({ testID: 'stats-back' })).toHaveLength(0);
});

it('renders the four summary metric tiles as themed values', async () => {
  const stats = selectStats([
    answer({ isCorrect: true }),
    answer({ isCorrect: false, questionId: 'q2' }),
    answer({ isCorrect: true, questionId: 'q3', rule: 'present_simple_form' }),
    { kind: 'session_start', sessionId: 's1', timestamp: '2026-08-23T09:00:00Z' },
    { kind: 'session_end', sessionId: 's1', timestamp: '2026-08-23T09:10:00Z' },
  ]);
  const tree = await renderScreen(<StatsScreen stats={stats} onOpenReview={jest.fn()} />);
  expect(String(tree.root.findByProps({ testID: 'stats-total' }).props.children)).toBe('3');
  expect(String(tree.root.findByProps({ testID: 'stats-accuracy' }).props.children)).toBe('67%');
  expect(String(tree.root.findByProps({ testID: 'stats-time' }).props.children)).toBe('10 min');
  expect(String(tree.root.findByProps({ testID: 'stats-days' }).props.children)).toBe('1');
  expect(tree.root.findByProps({ testID: 'stats-accuracy-tile' })).toBeDefined();
});

it('shows the human rule title via findRule and falls back to the raw tag', async () => {
  const tree = await renderScreen(
    <StatsScreen
      stats={selectStats([
        answer({ rule: 'past_simple_form' }),
        answer({ rule: 'tense', questionId: 'q2' }),
      ])}
      onOpenReview={jest.fn()}
    />,
  );
  const knownTitle = tree.root.findByProps({ testID: 'stats-rule-title-past_simple_form' });
  expect(String(knownTitle.props.children)).toBe('Form: regular -ed and irregular verbs');
  expect(String(knownTitle.props.children)).not.toContain('_');
  const fallbackTitle = tree.root.findByProps({ testID: 'stats-rule-title-tense' });
  expect(String(fallbackTitle.props.children)).toBe('tense');
});

it('sorts rule rows by resolved title (then tag), independent of insertion order', async () => {
  // Insert in reverse of the alphabetical-by-title order.
  const tree = await renderScreen(
    <StatsScreen
      stats={selectStats([
        answer({ rule: 'present_simple_vs_continuous', questionId: 'q1' }),
        answer({ rule: 'past_simple_form', questionId: 'q2' }),
      ])}
      onOpenReview={jest.fn()}
    />,
  );
  expect(ruleCards(tree).map(card => card.props.testID)).toEqual([
    'stats-rule-past_simple_form',
    'stats-rule-present_simple_vs_continuous',
  ]);
});

it('renders correct/total fraction, accuracy bar, and percentage per rule', async () => {
  // 50 correct / 100 answered for the 'tense' rule → 50%.
  const events = Array.from({ length: 100 }, (_, i) =>
    answer({ rule: 'tense', questionId: `q${i}`, isCorrect: i % 2 === 0 }),
  );
  const tree = await renderScreen(
    <StatsScreen stats={selectStats(events)} onOpenReview={jest.fn()} />,
  );
  expect(String(tree.root.findByProps({ testID: 'stats-rule-percent-tense' }).props.children)).toBe('50%');
  expect(String(tree.root.findByProps({ testID: 'stats-rule-fraction-tense' }).props.children)).toBe('50/100 correct');
  expect(tree.root.findByProps({ testID: 'stats-rule-bar-tense' })).toBeDefined();
});
