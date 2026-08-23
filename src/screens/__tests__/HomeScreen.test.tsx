/**
 * Tests for the Task 4 HomeScreen: the main screen that replaces the flat
 * LevelMap as the hub. Presentational and fixture-data driven — no navigation,
 * storage, or reducers — so each test renders it with explicit props.
 *
 * Coverage maps to the Task 4 acceptance criteria: the progress summary
 * ("Basic: 1/3 · …" / "Pick a level to begin"), Resume visibility (only with
 * progress), per-action callbacks (Settings / Resume / Wrong answers / Mixed
 * Review / Stats / track select), no bottom Back button, and accessibility.
 * The Android exit-confirm moved to the Home route (docs/ui-plan-1.md Task 1),
 * so it is covered in AppNavigator.test.tsx, not here.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { Level, Question, TopicRule, Track } from '../../content/types';
import type { Progress } from '../../state/types';
import { renderScreen } from '../../test-utils';
import { HomeScreen } from '../HomeScreen';

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

async function render(
  ui: React.ReactElement,
): Promise<ReactTestRenderer.ReactTestRenderer> {
  return renderScreen(ui);
}

async function press(tree: ReactTestRenderer.ReactTestRenderer, testID: string) {
  await ReactTestRenderer.act(() => {
    tree.root.findByProps({ testID }).props.onPress();
  });
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
  testID: string,
): Array<ReactTestRenderer.ReactTestInstance> {
  return tree.root.findAll(
    node => typeof node.type === 'string' && node.props.testID === testID,
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('HomeScreen — rendering', () => {
  it('renders the heading, settings, action buttons, and track cards', async () => {
    const tree = await render(
      <HomeScreen
        tracks={TRACKS}
        progress={makeProgress()}
        onSelectTrack={jest.fn()}
        onOpenSettings={jest.fn()}
        onResume={jest.fn()}
        onOpenReview={jest.fn()}
        onOpenMixedReview={jest.fn()}
        onOpenStats={jest.fn()}
      />,
    );

    expect(textOf(tree, 'home-heading')).toBe('Home');
    expect(tree.root.findByProps({ testID: 'home-heading' }).props.accessibilityRole).toBe('header');
    expect(hostNodes(tree, 'home-settings')).toHaveLength(1);
    expect(hostNodes(tree, 'home-resume')).toHaveLength(1);
    expect(hostNodes(tree, 'home-review')).toHaveLength(1);
    expect(hostNodes(tree, 'home-mixed-review')).toHaveLength(1);
    expect(hostNodes(tree, 'home-stats')).toHaveLength(1);
    expect(textOf(tree, 'home-track-name-basic')).toBe('Basic');
    expect(textOf(tree, 'home-track-label-basic')).toBe('Beginner');
    expect(textOf(tree, 'home-track-name-intermediate')).toBe('Intermediate');
  });

  it('shows per-track pass counts and the streak in the summary', async () => {
    const tree = await render(
      <HomeScreen
        tracks={TRACKS}
        progress={makeProgress({
          currentLevelId: 'b02',
          completedLevelIds: ['b01'],
          dailyStreak: 4,
          bestStreak: 7,
        })}
        onSelectTrack={jest.fn()}
      />,
    );

    expect(textOf(tree, 'home-progress-summary')).toBe('Basic: 1/3 · Intermediate: 0/1');
    expect(textOf(tree, 'home-streak-summary')).toBe('Daily streak: 4 · Best: 7');
  });

  it('shows an encouraging pick-a-level message for a first-time player', async () => {
    const tree = await render(
      <HomeScreen tracks={TRACKS} progress={null} onSelectTrack={jest.fn()} />,
    );

    expect(textOf(tree, 'home-progress-summary')).toBe('Pick a level to begin');
    // No streak, Resume, or Wrong answers for a player with no progress.
    expect(hostNodes(tree, 'home-streak-summary')).toHaveLength(0);
    expect(hostNodes(tree, 'home-resume')).toHaveLength(0);
    expect(hostNodes(tree, 'home-review')).toHaveLength(0);
  });
});

describe('HomeScreen — Resume visibility', () => {
  it('shows Resume only when progress exists', async () => {
    const withProgress = await render(
      <HomeScreen tracks={TRACKS} progress={makeProgress()} onSelectTrack={jest.fn()} onResume={jest.fn()} />,
    );
    expect(hostNodes(withProgress, 'home-resume')).toHaveLength(1);

    const withoutProgress = await render(
      <HomeScreen tracks={TRACKS} progress={null} onSelectTrack={jest.fn()} onResume={jest.fn()} />,
    );
    expect(hostNodes(withoutProgress, 'home-resume')).toHaveLength(0);
  });
});

describe('HomeScreen — action callbacks', () => {
  it('calls onOpenSettings when the Settings button is pressed', async () => {
    const onOpenSettings = jest.fn();
    const tree = await render(
      <HomeScreen tracks={TRACKS} progress={makeProgress()} onSelectTrack={jest.fn()} onOpenSettings={onOpenSettings} />,
    );
    await press(tree, 'home-settings');
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onResume when Resume is pressed', async () => {
    const onResume = jest.fn();
    const tree = await render(
      <HomeScreen tracks={TRACKS} progress={makeProgress()} onSelectTrack={jest.fn()} onResume={onResume} />,
    );
    await press(tree, 'home-resume');
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenReview when Review mistakes is pressed', async () => {
    const onOpenReview = jest.fn();
    const tree = await render(
      <HomeScreen tracks={TRACKS} progress={makeProgress()} onSelectTrack={jest.fn()} onOpenReview={onOpenReview} />,
    );
    await press(tree, 'home-review');
    expect(onOpenReview).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenMixedReview when Review / Practice is pressed', async () => {
    const onOpenMixedReview = jest.fn();
    const tree = await render(
      <HomeScreen tracks={TRACKS} progress={makeProgress()} onSelectTrack={jest.fn()} onOpenMixedReview={onOpenMixedReview} />,
    );
    await press(tree, 'home-mixed-review');
    expect(onOpenMixedReview).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenStats when Stats is pressed', async () => {
    const onOpenStats = jest.fn();
    const tree = await render(
      <HomeScreen tracks={TRACKS} progress={makeProgress()} onSelectTrack={jest.fn()} onOpenStats={onOpenStats} />,
    );
    await press(tree, 'home-stats');
    expect(onOpenStats).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectTrack with the track id when a track card is pressed', async () => {
    const onSelectTrack = jest.fn();
    const tree = await render(
      <HomeScreen tracks={TRACKS} progress={makeProgress()} onSelectTrack={onSelectTrack} />,
    );
    await press(tree, 'home-track-basic');
    expect(onSelectTrack).toHaveBeenCalledTimes(1);
    expect(onSelectTrack).toHaveBeenCalledWith('basic');
    await press(tree, 'home-track-intermediate');
    expect(onSelectTrack).toHaveBeenCalledWith('intermediate');
  });
});

describe('HomeScreen — no bottom Back button', () => {
  it('renders no bottom Back button (back is the system gesture)', async () => {
    const tree = await render(
      <HomeScreen tracks={TRACKS} progress={makeProgress()} onSelectTrack={jest.fn()} />,
    );
    expect(hostNodes(tree, 'home-back')).toHaveLength(0);
  });
});

describe('HomeScreen — accessibility', () => {
  it('exposes header roles, button roles, and descriptive track labels', async () => {
    const tree = await render(
      <HomeScreen
        tracks={TRACKS}
        progress={makeProgress()}
        onSelectTrack={jest.fn()}
        onOpenSettings={jest.fn()}
        onResume={jest.fn()}
      />,
    );

    expect(tree.root.findByProps({ testID: 'home-heading' }).props.accessibilityRole).toBe('header');
    expect(tree.root.findByProps({ testID: 'home-tracks-label' }).props.accessibilityRole).toBe('header');
    expect(hostNodes(tree, 'home-settings')[0].props.accessibilityRole).toBe('button');
    expect(hostNodes(tree, 'home-settings')[0].props.accessibilityLabel).toBe('Settings');
    expect(hostNodes(tree, 'home-resume')[0].props.accessibilityRole).toBe('button');
    expect(hostNodes(tree, 'home-resume')[0].props.accessibilityLabel).toBe('Resume');
    expect(hostNodes(tree, 'home-track-basic')[0].props.accessibilityRole).toBe('button');
    expect(hostNodes(tree, 'home-track-basic')[0].props.accessibilityLabel).toBe('Basic, Beginner');
  });
});
