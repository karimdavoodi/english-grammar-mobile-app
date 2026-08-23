/**
 * Tests for the Task 9 StartPointScreen: the first-launch "Where do you want to
 * start?" choice. Presentational and fixture-data driven — no navigation,
 * storage, or reducers. The AppProvider decides when this screen shows (multiple
 * eligible tracks); the component just renders the choices and reports the pick.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { Track } from '../../content/types';
import { renderScreen } from '../../test-utils';
import { StartPointScreen } from '../StartPointScreen';

const BASIC: Track = {
  id: 'basic',
  order: 1,
  name: 'Basic',
  label: 'Beginner',
  eligibleStartingPoint: true,
  levels: [],
};

const INTERMEDIATE: Track = {
  ...BASIC,
  id: 'intermediate',
  order: 2,
  name: 'Intermediate',
  label: 'Some English',
};

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

function labelOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  return tree.root.findByProps({ testID }).props.accessibilityLabel;
}

/** Count rendered host components with a testID (filters composite proxies). */
function countHostByTestID(tree: ReactTestRenderer.ReactTestRenderer, testID: string): number {
  return tree.root.findAll(node => typeof node.type === 'string' && node.props.testID === testID)
    .length;
}

describe('StartPointScreen', () => {
  it('renders a heading and one choice per eligible track', async () => {
    const tree = await render(
      <StartPointScreen tracks={[BASIC, INTERMEDIATE]} onChoose={jest.fn()} />,
    );

    expect(textOf(tree, 'start-point-heading')).toBe('Where do you want to start?');
    expect(countHostByTestID(tree, 'start-choice-basic')).toBe(1);
    expect(countHostByTestID(tree, 'start-choice-intermediate')).toBe(1);
    expect(textOf(tree, 'start-choice-name-basic')).toBe('Basic');
    expect(labelOf(tree, 'start-choice-basic')).toBe('Start at Beginner level 1');
  });

  it('reports the chosen track (its level 1) on press', async () => {
    const onChoose = jest.fn();
    const tree = await render(<StartPointScreen tracks={[BASIC]} onChoose={onChoose} />);

    const button = tree.root.findByProps({ testID: 'start-choice-basic' });
    expect(button.props.accessibilityRole).toBe('button');
    await ReactTestRenderer.act(() => {
      button.props.onPress();
    });
    expect(onChoose).toHaveBeenCalledWith('basic', 1);
  });

  it('offers a choice for every eligible track, regardless of count', async () => {
    const tree = await render(<StartPointScreen tracks={[BASIC]} onChoose={jest.fn()} />);
    expect(countHostByTestID(tree, 'start-choice-basic')).toBe(1);
    expect(countHostByTestID(tree, 'start-choice-intermediate')).toBe(0);
  });
});
