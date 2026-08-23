/**
 * Tests for the Task 9 AppProvider boot flow: load → auto-start (single eligible
 * track), start choice (multiple eligible tracks), and returning-player resume.
 *
 * The navigator is not rendered — a Probe child reads the AppContext so the boot
 * decision (which route the app will mount) is observable without native
 * navigation dependencies. Storage functions are injectable, so every test runs
 * against an in-memory Map-backed store.
 */

// Replaces the async-storage module so storage.ts's top-level DEFAULT_STORE
// import loads in Node. Every storage call in these tests injects its own memory
// store anyway.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
      clear: async () => {
        store.clear();
      },
    },
  };
});

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { Level, Track } from '../../content/types';
import {
  CURRENT_PROGRESS_VERSION,
  PROGRESS_KEY,
  loadProgress,
  loadSettings,
  saveSettings,
  type StorageLike,
} from '../../state/storage';
import type { Progress } from '../../state/types';
import { useApp } from '../AppContext';
import { AppProvider } from '../AppProvider';

function makeLevel(id: string, number: number): Level {
  return {
    id,
    trackId: id.startsWith('i') ? 'intermediate' : 'basic',
    number,
    title: `Level ${id}`,
    topic: { title: 'Topic', summary: 'summary', rules: [] },
    questions: [],
  };
}

function makeTrack(id: string, order: number, eligible: boolean, levels: Level[]): Track {
  return { id, order, name: id, label: id, eligibleStartingPoint: eligible, levels };
}

const BASIC = makeTrack('basic', 1, true, [makeLevel('b01', 1), makeLevel('b02', 2)]);
const INTERMEDIATE = makeTrack('intermediate', 2, true, [makeLevel('i01', 1)]);
const ADVANCED = makeTrack('advanced', 3, false, [makeLevel('a01', 1)]);

function createMemoryStore(): StorageLike {
  const data = new Map<string, string>();
  return {
    async getItem(key) {
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
}

/**
 * Reports the boot decision and exposes the Task 12 settings/reset actions so
 * the provider wiring is observable: the resolved current level id (or 'null'
 * for the start choice), the active theme preference, and the resolved reset
 * outcome (the auto-started level id, or 'null' for the start choice).
 */
function Probe() {
  const { progress, settings, applySettings, resetGame } = useApp();
  const [resetResult, setResetResult] = React.useState<string>('none');
  return (
    <View>
      <Text testID="boot-current">{progress ? progress.currentLevelId : 'null'}</Text>
      <Text testID="settings-theme">{settings.theme}</Text>
      <Text testID="reset-result">{resetResult}</Text>
      <Pressable
        testID="set-theme-dark"
        onPress={() => {
          applySettings({ theme: 'dark' }).catch(() => {});
        }}
      />
      <Pressable
        testID="reset-game"
        onPress={() => {
          resetGame().then(next => setResetResult(next ? next.currentLevelId : 'null'));
        }}
      />
    </View>
  );
}

async function renderApp(tracks: Track[], store: StorageLike) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <AppProvider store={store} tracks={tracks}>
        <Probe />
      </AppProvider>,
    );
  });
  // Give the async load (and any auto-start persist) time to land its writes.
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
  });
  return tree;
}

/** Press a Probe button and let its async effect settle. */
async function press(tree: ReactTestRenderer.ReactTestRenderer, testID: string) {
  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID }).props.onPress();
    await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
  });
}

function textOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  const children = tree.root.findByProps({ testID }).props.children;
  if (Array.isArray(children)) {
    return children.map(child => String(child)).join('');
  }
  return String(children);
}

describe('AppProvider — first launch', () => {
  it('auto-starts at the single eligible track and persists it', async () => {
    const store = createMemoryStore();
    const tree = await renderApp([BASIC, ADVANCED], store);

    expect(textOf(tree, 'boot-current')).toBe('b01');
    const persisted = await loadProgress(store);
    expect(persisted?.currentLevelId).toBe('b01');
    expect(persisted?.startingPoint).toEqual({ trackId: 'basic', levelNumber: 1 });
  });

  it('shows the start choice when multiple tracks are eligible', async () => {
    const store = createMemoryStore();
    const tree = await renderApp([BASIC, INTERMEDIATE], store);

    expect(textOf(tree, 'boot-current')).toBe('null');
    const persisted = await loadProgress(store);
    expect(persisted).toBeNull();
  });

  it('resumes a saved progress as-is (returning player skips the choice)', async () => {
    const store = createMemoryStore();
    const saved: Progress = {
      version: CURRENT_PROGRESS_VERSION,
      startingPoint: { trackId: 'basic', levelNumber: 1 },
      completedLevelIds: ['b01'],
      currentLevelId: 'b02',
      activeSession: null,
      weaknessQueue: {},
      wrongAnswers: {},
    };
    await store.setItem('egg:progress', JSON.stringify(saved));

    const tree = await renderApp([BASIC, INTERMEDIATE], store);

    expect(textOf(tree, 'boot-current')).toBe('b02');
  });
});

// ── Task 13: load-time wiring ───────────────────────────────────────

describe('AppProvider — load-time repair', () => {
  it('repairs stale saved progress at load and persists the repaired slice', async () => {
    const store = createMemoryStore();
    const stale: Progress = {
      version: CURRENT_PROGRESS_VERSION,
      startingPoint: { trackId: 'basic', levelNumber: 1 },
      completedLevelIds: ['b01', 'ghost-level'],
      currentLevelId: 'ghost-level',
      activeSession: {
        levelId: 'ghost-level',
        askedIds: [],
        correctCount: 0,
        streak: 0,
        totalAnswered: 0,
        missCounts: {},
        lastWrongRule: null,
      },
      weaknessQueue: {},
      wrongAnswers: {},
    };
    await store.setItem('egg:progress', JSON.stringify(stale));

    const tree = await renderApp([BASIC, ADVANCED], store);

    // The unknown current level is repaired to the first valid level before the
    // navigator boots — an invalid route is never mounted.
    expect(textOf(tree, 'boot-current')).toBe('b01');
    // The repaired slice is persisted so the fix is durable across launches.
    const persisted = await loadProgress(store);
    expect(persisted?.currentLevelId).toBe('b01');
    expect(persisted?.completedLevelIds).toEqual(['b01']);
    expect(persisted?.activeSession).toBeNull();
  });

  it('leaves a valid saved progress untouched (no write when nothing changed)', async () => {
    const store = createMemoryStore();
    const saved: Progress = {
      version: CURRENT_PROGRESS_VERSION,
      startingPoint: { trackId: 'basic', levelNumber: 1 },
      completedLevelIds: ['b01'],
      currentLevelId: 'b02',
      activeSession: null,
      weaknessQueue: {},
      wrongAnswers: {},
    };
    await store.setItem('egg:progress', JSON.stringify(saved));

    const tree = await renderApp([BASIC, ADVANCED], store);

    expect(textOf(tree, 'boot-current')).toBe('b02');
    // A fully-valid progress resumes unchanged and is not rewritten.
    expect(await loadProgress(store)).toEqual(saved);
  });
});

describe('AppProvider — boot gate (no invalid-route flash)', () => {
  it('shows the loading view (children unmounted) until the boot decision is final', async () => {
    const store = createMemoryStore();
    // Block the progress load so the boot decision stays unresolved: while it
    // is pending the loading view is shown and the navigator (children) is not
    // mounted — the app cannot flash an invalid route mid-boot.
    let release!: (value: string | null) => void;
    const gate = new Promise<string | null>(resolve => {
      release = resolve;
    });
    const originalGetItem = store.getItem.bind(store);
    store.getItem = async key =>
      key === PROGRESS_KEY ? gate : originalGetItem(key);

    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <AppProvider store={store} tracks={[BASIC]}>
          <Probe />
        </AppProvider>,
      );
    });

    expect(tree.root.findByProps({ testID: 'app-loading' })).toBeTruthy();
    expect(tree.root.findAllByProps({ testID: 'boot-current' })).toHaveLength(0);

    // Release the load; boot completes with the correct Basic-only starting
    // state and default settings in place.
    await ReactTestRenderer.act(async () => {
      release(null);
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });
    expect(textOf(tree, 'boot-current')).toBe('b01');
    expect(textOf(tree, 'settings-theme')).toBe('device');
  });
});

// ── Task 12: settings + reset ──────────────────────────────────────

describe('AppProvider — applySettings', () => {
  it('updates the context theme and persists it', async () => {
    const store = createMemoryStore();
    const tree = await renderApp([BASIC], store);

    expect(textOf(tree, 'settings-theme')).toBe('device');

    await press(tree, 'set-theme-dark');

    expect(textOf(tree, 'settings-theme')).toBe('dark');
    expect(await loadSettings(store)).toEqual({ theme: 'dark', notifications: { enabled: false, hour: 9, minute: 0 } });
  });
});

describe('AppProvider — resetGame', () => {
  it('clears progress and re-auto-starts at the single eligible track (settings survive)', async () => {
    const store = createMemoryStore();
    // A returning player with real progress and a saved light-theme setting.
    const saved: Progress = {
      version: CURRENT_PROGRESS_VERSION,
      startingPoint: { trackId: 'basic', levelNumber: 1 },
      completedLevelIds: ['b01'],
      currentLevelId: 'b02',
      activeSession: null,
      weaknessQueue: { past_perfect_form: { rule: 'x', missCount: 2, reviewStreak: 0, lastMissedAt: 't' } },
      wrongAnswers: {},
    };
    await store.setItem('egg:progress', JSON.stringify(saved));
    await saveSettings({ theme: 'light' }, store);

    const tree = await renderApp([BASIC, ADVANCED], store);
    expect(textOf(tree, 'boot-current')).toBe('b02');

    await press(tree, 'reset-game');

    // Progress is erased and re-initialized at Basic level 1 (auto-start).
    expect(textOf(tree, 'boot-current')).toBe('b01');
    expect(textOf(tree, 'reset-result')).toBe('b01');
    const persisted = await loadProgress(store);
    expect(persisted?.currentLevelId).toBe('b01');
    expect(persisted?.startingPoint).toEqual({ trackId: 'basic', levelNumber: 1 });
    expect(persisted?.completedLevelIds).toEqual([]);
    // Settings survive a reset.
    expect(await loadSettings(store)).toEqual({ theme: 'light', notifications: { enabled: false, hour: 9, minute: 0 } });
  });

  it('leaves progress null (start choice) when multiple tracks are eligible', async () => {
    const store = createMemoryStore();
    // Simulate a started game by booting with saved progress, then reset.
    const saved: Progress = {
      version: CURRENT_PROGRESS_VERSION,
      startingPoint: { trackId: 'basic', levelNumber: 1 },
      completedLevelIds: ['b01'],
      currentLevelId: 'b02',
      activeSession: null,
      weaknessQueue: {},
      wrongAnswers: {},
    };
    await store.setItem('egg:progress', JSON.stringify(saved));
    const tree2 = await renderApp([BASIC, INTERMEDIATE], store);
    expect(textOf(tree2, 'boot-current')).toBe('b02');

    await press(tree2, 'reset-game');

    // With two eligible tracks the reset re-enters the StartPoint choice.
    expect(textOf(tree2, 'boot-current')).toBe('null');
    expect(textOf(tree2, 'reset-result')).toBe('null');
    expect(await loadProgress(store)).toBeNull();
  });
});
