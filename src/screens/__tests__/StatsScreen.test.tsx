jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { selectStats } from '../../state/events';
import { wrapInSafeArea } from '../../test-utils';
import { StatsScreen } from '../StatsScreen';

it('renders fixture stats and links to Review', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      wrapInSafeArea(
        <StatsScreen
          stats={selectStats([{ kind: 'answer', questionId: 'q1', rule: 'tense', questionType: 'multiple_choice', isCorrect: true, levelId: 'b01', timestamp: '2026-08-23T10:00:00Z' }])}
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
