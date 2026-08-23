/**
 * Tests for the Task 5 TopicsScreen: the per-track topic list that replaces the
 * flat LevelMap section (Issue 4). Presentational and fixture-data driven — no
 * navigation, storage, or reducers — so each test renders it with explicit
 * props.
 *
 * Coverage maps to the Task 5 acceptance criteria: only the selected track's
 * topics, in level-number order; status badges (passed / current / needs-review)
 * when progress exists; every topic available and tappable (all levels unlocked
 * — no lock badges, no disabled rows) with or without progress; tapping a topic
 * calls `onSelectLevel`; no bottom Back button.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { Level, Question, TopicRule, Track } from '../../content/types';
import type { Progress, WeaknessEntry } from '../../state/types';
import { renderScreen } from '../../test-utils';
import { TopicsScreen } from '../TopicsScreen';

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
const b04 = makeLevel('basic', 'b04', 4, []);
const i01 = makeLevel('intermediate', 'i01', 1, []);

const TRACKS: Track[] = [
  {
    id: 'basic',
    order: 1,
    name: 'Basic',
    label: 'Beginner',
    eligibleStartingPoint: true,
    levels: [b01, b02, b03, b04],
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
  return renderScreen(ui);
}

function textOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  const children = tree.root.findByProps({ testID }).props.children;
  if (Array.isArray(children)) {
    return children.map(child => String(child)).join('');
  }
  return String(children);
}

/** Host (native) nodes carrying a testID — avoids composite+host double counting. */
function hostNodes(
  tree: ReactTestRenderer.ReactTestRenderer,
  testID: string | RegExp,
): Array<ReactTestRenderer.ReactTestInstance> {
  return tree.root.findAll(
    node =>
      typeof node.type === 'string' &&
      typeof node.props.testID === 'string' &&
      (typeof testID === 'string'
        ? node.props.testID === testID
        : testID.test(node.props.testID)),
  );
}

describe('TopicsScreen — rendering', () => {
  it('shows the track name, label, and only that track’s levels in number order', async () => {
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress()}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(textOf(tree, 'topics-heading')).toBe('Basic');
    expect(tree.root.findByProps({ testID: 'topics-heading' }).props.accessibilityRole).toBe('header');
    expect(textOf(tree, 'topics-track-label')).toBe('Beginner');

    // Only Basic's levels, in level-number order — no other track's levels.
    const levelIds = hostNodes(tree, /^topics-level-/).map(node => node.props.testID);
    expect(levelIds).toEqual([
      'topics-level-b01',
      'topics-level-b02',
      'topics-level-b03',
      'topics-level-b04',
    ]);
    expect(tree.root.findAllByProps({ testID: 'topics-title-i01' })).toHaveLength(0);
  });

  it('renders the level title and its topic under each row', async () => {
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress()}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(textOf(tree, 'topics-title-b01')).toBe('Level b01');
    expect(textOf(tree, 'topics-topic-b01')).toBe('Topic b01');
    expect(textOf(tree, 'topics-title-b04')).toBe('Level b04');
    expect(textOf(tree, 'topics-topic-b04')).toBe('Topic b04');
  });

  it('renders a defensive message for an unknown track id', async () => {
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="nope"
        progress={makeProgress()}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(hostNodes(tree, 'topics-screen')).toHaveLength(1);
    expect(tree.root.findAllByProps({ testID: 'topics-heading' })).toHaveLength(0);
    expect(hostNodes(tree, /^topics-level-/)).toHaveLength(0);
  });
});

describe('TopicsScreen — status badges with progress', () => {
  it('highlights the current level with a Current badge', async () => {
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress({ currentLevelId: 'b02' })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(textOf(tree, 'topics-current-b02')).toBe('Current');
    expect(tree.root.findAllByProps({ testID: 'topics-current-b01' })).toHaveLength(0);
  });

  it('shows a pass indicator on passed levels', async () => {
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress({ currentLevelId: 'b02', completedLevelIds: ['b01'] })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(textOf(tree, 'topics-passed-b01')).toContain('Passed');
    expect(tree.root.findAllByProps({ testID: 'topics-passed-b02' })).toHaveLength(0);
  });

  it('renders no lock badges — every level is tappable even beyond the frontier', async () => {
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress({ currentLevelId: 'b01' })}
        onSelectLevel={jest.fn()}
      />,
    );

    // Levels past the old frontier (b02+) carry no lock badge and stay enabled.
    expect(hostNodes(tree, /^topics-locked-/)).toHaveLength(0);
    for (const id of [
      'topics-level-b01',
      'topics-level-b02',
      'topics-level-b03',
      'topics-level-b04',
    ]) {
      const row = tree.root.findByProps({ testID: id });
      expect(row.props.accessibilityRole).toBe('button');
      expect(row.props.disabled).not.toBe(true);
    }
  });

  it('flags a level whose bank contains a queued rule with a Review badge', async () => {
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress({
          currentLevelId: 'b03',
          weaknessQueue: { [RULE_FUTURE]: queuedEntry(RULE_FUTURE) },
        })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(textOf(tree, 'topics-review-b03')).toBe('Review');
    expect(tree.root.findAllByProps({ testID: 'topics-review-b01' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'topics-review-b02' })).toHaveLength(0);
  });

  it('renders an unlocked-but-not-passed level with no status badge', async () => {
    // b02 is neither completed nor current — the mercy-ended / skipped-earlier
    // state. No badges at all, and the row stays tappable (all levels unlocked).
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress({ currentLevelId: 'b03', completedLevelIds: ['b01'] })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(tree.root.findAllByProps({ testID: 'topics-passed-b02' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'topics-current-b02' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'topics-locked-b02' })).toHaveLength(0);
    const unlocked = tree.root.findByProps({ testID: 'topics-level-b02' });
    expect(unlocked.props.disabled).not.toBe(true);
  });
});

describe('TopicsScreen — first-time player (progress null)', () => {
  it('shows every topic as available with no status badges', async () => {
    const tree = await render(
      <TopicsScreen tracks={TRACKS} trackId="basic" progress={null} onSelectLevel={jest.fn()} />,
    );

    const levelIds = hostNodes(tree, /^topics-level-/).map(node => node.props.testID);
    expect(levelIds).toEqual([
      'topics-level-b01',
      'topics-level-b02',
      'topics-level-b03',
      'topics-level-b04',
    ]);
    expect(hostNodes(tree, /^topics-passed-/)).toHaveLength(0);
    expect(hostNodes(tree, /^topics-current-/)).toHaveLength(0);
    expect(hostNodes(tree, /^topics-locked-/)).toHaveLength(0);
    expect(hostNodes(tree, /^topics-review-/)).toHaveLength(0);

    // Every row is tappable.
    for (const id of levelIds) {
      const row = tree.root.findByProps({ testID: id });
      expect(row.props.disabled).not.toBe(true);
    }
  });

  it('calls onSelectLevel when an available topic is tapped', async () => {
    const onSelectLevel = jest.fn();
    const tree = await render(
      <TopicsScreen tracks={TRACKS} trackId="basic" progress={null} onSelectLevel={onSelectLevel} />,
    );

    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'topics-level-b03' }).props.onPress();
    });
    expect(onSelectLevel).toHaveBeenCalledTimes(1);
    expect(onSelectLevel).toHaveBeenCalledWith('b03');
  });
});

describe('TopicsScreen — tapping topics', () => {
  it('calls onSelectLevel with the tapped topic id', async () => {
    const onSelectLevel = jest.fn();
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress({ currentLevelId: 'b02', completedLevelIds: ['b01'] })}
        onSelectLevel={onSelectLevel}
      />,
    );

    // Replay a passed topic — it stays tappable.
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'topics-level-b01' }).props.onPress();
    });
    expect(onSelectLevel).toHaveBeenCalledTimes(1);
    expect(onSelectLevel).toHaveBeenCalledWith('b01');

    // Also tap the current topic.
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'topics-level-b02' }).props.onPress();
    });
    expect(onSelectLevel).toHaveBeenCalledWith('b02');
  });

  it('taps a level beyond the old frontier — no lock gate', async () => {
    const onSelectLevel = jest.fn();
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress({ currentLevelId: 'b01' })}
        onSelectLevel={onSelectLevel}
      />,
    );

    // b04 is past the old frontier but is now a normal, enabled button.
    const ahead = tree.root.findByProps({ testID: 'topics-level-b04' });
    expect(ahead.props.accessibilityRole).toBe('button');
    expect(ahead.props.disabled).not.toBe(true);

    await ReactTestRenderer.act(() => {
      ahead.props.onPress();
    });
    expect(onSelectLevel).toHaveBeenCalledTimes(1);
    expect(onSelectLevel).toHaveBeenCalledWith('b04');
  });
});

describe('TopicsScreen — no bottom Back button', () => {
  it('renders no bottom Back button (back is the system gesture)', async () => {
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress()}
        onSelectLevel={jest.fn()}
      />,
    );
    expect(hostNodes(tree, 'topics-back')).toHaveLength(0);
  });
});

describe('TopicsScreen — accessibility', () => {
  it('exposes a header role and descriptive topic labels', async () => {
    const tree = await render(
      <TopicsScreen
        tracks={TRACKS}
        trackId="basic"
        progress={makeProgress({
          currentLevelId: 'b03',
          completedLevelIds: ['b01'],
          weaknessQueue: { [RULE_FUTURE]: queuedEntry(RULE_FUTURE) },
        })}
        onSelectLevel={jest.fn()}
      />,
    );

    expect(tree.root.findByProps({ testID: 'topics-heading' }).props.accessibilityRole).toBe('header');

    expect(tree.root.findByProps({ testID: 'topics-level-b01' }).props.accessibilityLabel).toBe(
      'Level 1, Level b01, Passed',
    );
    expect(tree.root.findByProps({ testID: 'topics-level-b03' }).props.accessibilityLabel).toBe(
      'Level 3, Level b03, Current level, needs review',
    );
    expect(tree.root.findByProps({ testID: 'topics-level-b04' }).props.accessibilityLabel).toBe(
      'Level 4, Level b04, Available',
    );
    expect(tree.root.findByProps({ testID: 'topics-level-b04' }).props.accessibilityRole).toBe(
      'button',
    );
  });

  it('labels first-time-player topics as available', async () => {
    const tree = await render(
      <TopicsScreen tracks={TRACKS} trackId="basic" progress={null} onSelectLevel={jest.fn()} />,
    );
    expect(tree.root.findByProps({ testID: 'topics-level-b01' }).props.accessibilityLabel).toBe(
      'Level 1, Level b01, Available',
    );
    expect(tree.root.findByProps({ testID: 'topics-level-b01' }).props.accessibilityRole).toBe('button');
  });
});
