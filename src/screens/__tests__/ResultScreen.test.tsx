/**
 * Tests for the Task 8 ResultScreen: the pass / mercy-end messages, the
 * continue affordance (next level vs completion state), and the callback.
 *
 * The screen is presentational and fixture-data driven — no navigation,
 * storage, or reducers — so each test renders it with explicit props.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { Level } from '../../content/types';
import type { AnswerOutcome } from '../../game/levelMachine';
import { renderScreen } from '../../test-utils';
import { ResultScreen } from '../ResultScreen';

const LEVEL: Level = {
  id: 'b10',
  trackId: 'basic',
  number: 10,
  title: 'Past Perfect',
  topic: {
    title: 'Past Perfect',
    summary: 'The past perfect describes an action completed before another past action.',
    rules: [],
  },
  questions: [],
};

const NEXT_LEVEL: Level = {
  ...LEVEL,
  id: 'b11',
  number: 11,
  title: 'Prepositions of time',
};

function makeOutcome(overrides: Partial<AnswerOutcome> = {}): AnswerOutcome {
  return {
    isCorrect: false,
    correctIndex: 1,
    streak: 0,
    correctCount: 0,
    totalAnswered: 12,
    passed: false,
    passReason: null,
    endedByMercy: false,
    ...overrides,
  };
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

/** The accessible label of an interactive element (the button label lives there). */
function labelOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  return tree.root.findByProps({ testID }).props.accessibilityLabel;
}

describe('ResultScreen — pass messages', () => {
  it('states the streak pass reason and offers to continue to the next level', async () => {
    const onContinue = jest.fn();
    const tree = await render(
      <ResultScreen
        level={LEVEL}
        outcome={makeOutcome({ passed: true, passReason: 'streak', streak: 3, correctCount: 3 })}
        nextLevel={NEXT_LEVEL}
        onContinue={onContinue}
      />,
    );

    expect(textOf(tree, 'result-heading')).toBe('Streak!');
    expect(textOf(tree, 'result-level-title')).toBe('Past Perfect');
    expect(labelOf(tree, 'result-continue')).toBe('Jump to Prepositions of time');
    expect(textOf(tree, 'result-summary')).toContain('Correct: 3');
    expect(textOf(tree, 'result-summary')).toContain('Streak: 3');
  });

  it('states the volume pass reason ("Mastery reached")', async () => {
    const tree = await render(
      <ResultScreen
        level={LEVEL}
        outcome={makeOutcome({ passed: true, passReason: 'volume', correctCount: 8 })}
        nextLevel={NEXT_LEVEL}
        onContinue={jest.fn()}
      />,
    );

    expect(textOf(tree, 'result-heading')).toBe('Mastery reached');
  });
});

describe('ResultScreen — mercy message', () => {
  it('explains the answer cap and that the level stays unlocked', async () => {
    const tree = await render(
      <ResultScreen
        level={LEVEL}
        outcome={makeOutcome({ passed: false, endedByMercy: true, totalAnswered: 12 })}
        nextLevel={NEXT_LEVEL}
        onContinue={jest.fn()}
      />,
    );

    expect(textOf(tree, 'result-heading')).toBe('Level complete');
    expect(textOf(tree, 'result-explanation')).toContain('12');
    expect(textOf(tree, 'result-explanation')).toContain('stays unlocked');
  });
});

describe('ResultScreen — completion state', () => {
  it('offers to go to the map when there is no next level', async () => {
    const tree = await render(
      <ResultScreen
        level={LEVEL}
        outcome={makeOutcome({ passed: true, passReason: 'volume', correctCount: 8 })}
        nextLevel={null}
        onContinue={jest.fn()}
      />,
    );

    expect(labelOf(tree, 'result-continue')).toBe('Go to map');
  });
});

describe('ResultScreen — keep practicing', () => {
  it('offers to replay the topic after a streak pass (with a next level)', async () => {
    const onKeepPracticing = jest.fn();
    const tree = await render(
      <ResultScreen
        level={LEVEL}
        outcome={makeOutcome({ passed: true, passReason: 'streak', streak: 3 })}
        nextLevel={NEXT_LEVEL}
        onContinue={jest.fn()}
        onKeepPracticing={onKeepPracticing}
      />,
    );

    const button = tree.root.findByProps({ testID: 'result-keep-practicing' });
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Keep practicing');

    await ReactTestRenderer.act(() => {
      button.props.onPress();
    });
    expect(onKeepPracticing).toHaveBeenCalledTimes(1);
  });

  it('is hidden on a mercy end', async () => {
    const tree = await render(
      <ResultScreen
        level={LEVEL}
        outcome={makeOutcome({ passed: false, endedByMercy: true, totalAnswered: 12 })}
        nextLevel={NEXT_LEVEL}
        onContinue={jest.fn()}
        onKeepPracticing={jest.fn()}
      />,
    );

    expect(tree.root.findAllByProps({ testID: 'result-keep-practicing' })).toHaveLength(0);
  });

  it('is hidden in the completion state (no next level)', async () => {
    const tree = await render(
      <ResultScreen
        level={LEVEL}
        outcome={makeOutcome({ passed: true, passReason: 'volume', correctCount: 8 })}
        nextLevel={null}
        onContinue={jest.fn()}
        onKeepPracticing={jest.fn()}
      />,
    );

    expect(tree.root.findAllByProps({ testID: 'result-keep-practicing' })).toHaveLength(0);
  });
});

describe('ResultScreen — continue action', () => {
  it('calls onContinue when the button is pressed', async () => {
    const onContinue = jest.fn();
    const tree = await render(
      <ResultScreen
        level={LEVEL}
        outcome={makeOutcome({ passed: true, passReason: 'streak', streak: 3 })}
        nextLevel={NEXT_LEVEL}
        onContinue={onContinue}
      />,
    );

    const button = tree.root.findByProps({ testID: 'result-continue' });
    expect(button.props.accessibilityRole).toBe('button');
    await ReactTestRenderer.act(() => {
      button.props.onPress();
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
