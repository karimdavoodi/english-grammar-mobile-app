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
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { Level, Track } from '../../content/types';
import { CURRENT_PROGRESS_VERSION, loadProgress, type StorageLike } from '../../state/storage';
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

/** Reports the boot decision: the resolved current level id, or 'null' for the start choice. */
function Probe() {
  const { progress } = useApp();
  return <Text testID="boot-current">{progress ? progress.currentLevelId : 'null'}</Text>;
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
