import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { wrapInSafeArea } from '../../test-utils';
import { GraduationScreen } from '../GraduationScreen';

async function render() {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      wrapInSafeArea(
        <GraduationScreen
          completedLevels={90}
          totalLevels={90}
          dailyStreak={6}
          accuracy={0.875}
          onKeepPracticing={jest.fn()}
          onOpenMap={jest.fn()}
        />,
      ),
    );
  });
  return tree;
}

function textOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  const children = tree.root.findByProps({ testID }).props.children;
  return Array.isArray(children) ? children.map(String).join('') : String(children);
}

describe('GraduationScreen', () => {
  it('shows completion summary and both onward paths', async () => {
    const tree = await render();

    expect(textOf(tree, 'graduation-heading')).toBe("You've mastered all 90 levels");
    expect(textOf(tree, 'graduation-streak')).toBe('Daily streak: 6');
    expect(textOf(tree, 'graduation-accuracy')).toBe('Accuracy: 88%');
    expect(tree.root.findByProps({ testID: 'graduation-practice' }).props.accessibilityRole).toBe('button');
    expect(tree.root.findByProps({ testID: 'graduation-map' }).props.accessibilityRole).toBe('button');
  });

  it('invokes the selected onward action', async () => {
    const onKeepPracticing = jest.fn();
    const onOpenMap = jest.fn();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        wrapInSafeArea(<GraduationScreen completedLevels={1} totalLevels={2} dailyStreak={0} accuracy={0} onKeepPracticing={onKeepPracticing} onOpenMap={onOpenMap} />),
      );
    });
    await ReactTestRenderer.act(() => tree.root.findByProps({ testID: 'graduation-practice' }).props.onPress());
    await ReactTestRenderer.act(() => tree.root.findByProps({ testID: 'graduation-map' }).props.onPress());
    expect(onKeepPracticing).toHaveBeenCalledTimes(1);
    expect(onOpenMap).toHaveBeenCalledTimes(1);
  });
});
