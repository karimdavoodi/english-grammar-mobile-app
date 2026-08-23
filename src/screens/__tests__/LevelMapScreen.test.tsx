/**
 * Tests for the Task 10 LevelMapScreen: the progress overview and free-play hub.
 * Presentational and fixture-data driven — no navigation, storage, or reducers —
 * so each test renders it with explicit props.
 *
 * Coverage maps to the Task 10 acceptance criteria: correct lock/pass/current
 * indicators, the "needs review" indicator, replaying an unlocked level without
 * re-locking (tap → onSelectLevel; locked levels are non-tappable), the back
 * affordance, and accessibility roles/states.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { Level, Question, TopicRule, Track } from '../../content/types';
import type { Progress, WeaknessEntry } from '../../state/types';
import { LevelMapScreen } from '../LevelMapScreen';

const RULE_PRESENT = 'present_simple_form';
const RULE_PAST = 'past_simple_form';
const RULE_FUTURE = 'future_will';

const PRESENT_RULE: TopicRule = {
  rule: RULE_PRESENT,
  title: 'Present Simple',
  explanation: 'Present explanation.',
  example: 'She works.',
};
const PAST_RULE: TopicRule = {
  rule: RULE_PAST,
  title: 'Past Simple',
  explanation: 'Past explanation.',
  example: 'She worked.',
};
const FUTURE_RULE: TopicRule = {
  rule: RULE_FUTURE,
  title: 'Future will',
  explanation: 'Future explanation.',
  example: 'She will work.',
};

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
  trackId: string,
  id: string,
  number: number,
  rules: TopicRule[],
  questions: Question[] = [],
): Level {
  return {
    id,
    trackId,
    number,
    title: `Level ${id}`,
    topic: { title: `Topic ${id}`, summary: 'summary', rules },
    questions,
  };
}

const b01q01 = makeQuestion('b01', 'b01q01', RULE_PRESENT);
const b02q01 = makeQuestion('b02', 'b02q01', RULE_PAST);
const b03q01 = makeQuestion('b03', 'b03q01', RULE_FUTURE);

const b01 = makeLevel('basic', 'b01', 1, [PRESENT_RULE], [b01q01]);
const b02 = makeLevel('basic', 'b02', 2, [PAST_RULE], [b02q01]);
const b03 = makeLevel('basic', 'b03', 3, [FUTURE_RULE], [b03q01]);
const i01 = makeLevel('intermediate', 'i01', 1, []);

const TRACKS: Track[] = [
  {
    id: 'basic',
    order: 1,
    name: 'Basic',
    label: 'Beginner',
    eligibleStartingPoint: true,
    levels: [b01, b02, b03],
  },
  {
    id: 'intermediate',
    order: 2,
    name: 'Intermediate',
    label: 'Some English',
    eligibleStartingPoint: false,
    levels: [i01],
  },
];

function makeProgress(overrides: Partial<Progress> = {}): Progress {
  return {
    version: 1,
    startingPoint: { trackId: 'basic', levelNumber: 1 },
    completedLevelIds: [],
    currentLevelId: 'b01',
    activeSession: null,
    weaknessQueue: {},
    wrongAnswers: {},
    ...overrides,
  };
}

function queuedEntry(rule: string, overrides: Partial<WeaknessEntry> = {}): WeaknessEntry {
  return { rule, missCount: 1, reviewStreak: 0, lastMissedAt: 'x', ...overrides };
}

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

describe('LevelMapScreen — track and level rendering', () => {
  it('shows the current and best daily streak', async () => {
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress({ dailyStreak: 4, bestStreak: 7 })}
        onSelectLevel={jest.fn()}
      />,
    );
    expect(textOf(tree, 'level-map-streak-summary')).toContain('Daily streak: 4 · Best: 7');
  });

  it('renders every track section and every level title', async () => {
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress({ currentLevelId: 'b01' })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(textOf(tree, 'level-map-track-basic')).toBe('Basic');
    expect(textOf(tree, 'level-map-track-label-basic')).toBe('Beginner');
    expect(textOf(tree, 'level-map-track-intermediate')).toBe('Intermediate');
    expect(textOf(tree, 'level-map-title-b01')).toBe('Level b01');
    expect(textOf(tree, 'level-map-title-b02')).toBe('Level b02');
    expect(textOf(tree, 'level-map-title-b03')).toBe('Level b03');
    expect(textOf(tree, 'level-map-title-i01')).toBe('Level i01');
  });

  it('renders the level topic under each title', async () => {
    const tree = await render(
      <LevelMapScreen tracks={TRACKS} progress={makeProgress()} onSelectLevel={jest.fn()} />,
    );
    expect(textOf(tree, 'level-map-topic-b01')).toBe('Topic b01');
  });
});

describe('LevelMapScreen — status indicators', () => {
  it('highlights the current level with a Current badge', async () => {
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress({ currentLevelId: 'b02' })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(textOf(tree, 'level-map-current-b02')).toBe('Current');
    // b01 is not current — no Current badge.
    expect(tree.root.findAllByProps({ testID: 'level-map-current-b01' })).toHaveLength(0);
  });

  it('shows a pass indicator on passed levels', async () => {
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress({ currentLevelId: 'b02', completedLevelIds: ['b01'] })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(textOf(tree, 'level-map-passed-b01')).toContain('Passed');
    expect(tree.root.findAllByProps({ testID: 'level-map-passed-b02' })).toHaveLength(0);
  });

  it('shows locked levels and marks them disabled', async () => {
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress({ currentLevelId: 'b01' })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(textOf(tree, 'level-map-locked-b02')).toContain('Locked');
    const locked = tree.root.findByProps({ testID: 'level-map-level-b02' });
    expect(locked.props.disabled).toBe(true);
    expect(locked.props.accessibilityState).toEqual({ disabled: true });
  });

  it('renders an unlocked-but-not-passed level with no pass or locked mark', async () => {
    // b02 is at-or-before the frontier (unlocked) but neither completed nor
    // current — the mercy-ended / skipped-earlier state. No badges at all.
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress({ currentLevelId: 'b03', completedLevelIds: ['b01'] })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(tree.root.findAllByProps({ testID: 'level-map-passed-b02' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'level-map-current-b02' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'level-map-locked-b02' })).toHaveLength(0);
    const unlocked = tree.root.findByProps({ testID: 'level-map-level-b02' });
    expect(unlocked.props.disabled).not.toBe(true);
  });

  it('flags a level whose bank contains a queued rule with a Review badge', async () => {
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress({
          currentLevelId: 'b02',
          weaknessQueue: { [RULE_PAST]: queuedEntry(RULE_PAST) },
        })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(textOf(tree, 'level-map-review-b02')).toBe('Review');
    expect(tree.root.findAllByProps({ testID: 'level-map-review-b01' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'level-map-review-b03' })).toHaveLength(0);
  });
});

describe('LevelMapScreen — tapping levels', () => {
  it('calls onSelectLevel with the tapped unlocked level id (replay)', async () => {
    const onSelectLevel = jest.fn();
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress({ currentLevelId: 'b02', completedLevelIds: ['b01'] })}
        onSelectLevel={onSelectLevel}
      />,
    );

    // Replay a passed level — it stays unlocked and is tappable.
    const passed = tree.root.findByProps({ testID: 'level-map-level-b01' });
    expect(passed.props.disabled).not.toBe(true);
    await ReactTestRenderer.act(() => {
      passed.props.onPress();
    });
    expect(onSelectLevel).toHaveBeenCalledTimes(1);
    expect(onSelectLevel).toHaveBeenCalledWith('b01');

    // Also replay the current level.
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'level-map-level-b02' }).props.onPress();
    });
    expect(onSelectLevel).toHaveBeenCalledWith('b02');
  });

  it('marks locked levels disabled so tapping cannot re-lock or replay them', async () => {
    const onSelectLevel = jest.fn();
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress({ currentLevelId: 'b01' })}
        onSelectLevel={onSelectLevel}
      />,
    );

    const locked = tree.root.findByProps({ testID: 'level-map-level-b03' });
    expect(locked.props.accessibilityRole).toBeUndefined();
    expect(locked.props.accessibilityState).toEqual({ disabled: true });
    // A disabled Pressable ignores presses natively; the callback is never wired
    // to fire for a locked level in the rendered tree.
    expect(onSelectLevel).not.toHaveBeenCalled();
  });
});

describe('LevelMapScreen — settings entry', () => {
  it('calls onOpenSettings when the settings button is pressed', async () => {
    const onOpenSettings = jest.fn();
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress()}
        onSelectLevel={jest.fn()}
        onOpenSettings={onOpenSettings}
      />,
    );

    const button = tree.root.findByProps({ testID: 'level-map-settings' });
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Settings');
    await ReactTestRenderer.act(() => {
      button.props.onPress();
    });
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('omits the settings button when no onOpenSettings is provided', async () => {
    const tree = await render(
      <LevelMapScreen tracks={TRACKS} progress={makeProgress()} onSelectLevel={jest.fn()} />,
    );
    expect(tree.root.findAllByProps({ testID: 'level-map-settings' })).toHaveLength(0);
  });
});

describe('LevelMapScreen — back affordance', () => {
  it('calls onBack when the back button is pressed', async () => {
    const onBack = jest.fn();
    const tree = await render(
      <LevelMapScreen tracks={TRACKS} progress={makeProgress()} onSelectLevel={jest.fn()} onBack={onBack} />,
    );

    const button = tree.root.findByProps({ testID: 'level-map-back' });
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Back');
    await ReactTestRenderer.act(() => {
      button.props.onPress();
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('omits the back button when no onBack is provided', async () => {
    const tree = await render(
      <LevelMapScreen tracks={TRACKS} progress={makeProgress()} onSelectLevel={jest.fn()} />,
    );
    expect(tree.root.findAllByProps({ testID: 'level-map-back' })).toHaveLength(0);
  });
});

describe('LevelMapScreen — accessibility', () => {
  it('exposes header roles and descriptive level labels', async () => {
    const tree = await render(
      <LevelMapScreen
        tracks={TRACKS}
        progress={makeProgress({
          currentLevelId: 'b02',
          completedLevelIds: ['b01'],
          weaknessQueue: { [RULE_PAST]: queuedEntry(RULE_PAST) },
        })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(tree.root.findByProps({ testID: 'level-map-heading' }).props.accessibilityRole).toBe(
      'header',
    );
    expect(
      tree.root.findByProps({ testID: 'level-map-track-basic' }).props.accessibilityRole,
    ).toBe('header');

    expect(tree.root.findByProps({ testID: 'level-map-level-b01' }).props.accessibilityLabel).toBe(
      'Level 1, Level b01, Passed',
    );
    expect(tree.root.findByProps({ testID: 'level-map-level-b02' }).props.accessibilityLabel).toBe(
      'Level 2, Level b02, Current level, needs review',
    );
    expect(tree.root.findByProps({ testID: 'level-map-level-b03' }).props.accessibilityLabel).toBe(
      'Level 3, Level b03, Locked',
    );
  });
});
