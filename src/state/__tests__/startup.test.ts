/**
 * Tests for the Task 9 first-launch boot helpers in state/reducers.ts:
 * resolving a starting point to a level id, building the initial Progress slice,
 * and the boot decision (auto-start vs. start choice vs. returning player).
 */

// reducers.ts reads the current schema version from storage.ts, which imports
// the native async-storage module at its top level. Mock it so the import
// resolves in Node (the boot helpers themselves never touch storage).
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
    },
  };
});

import { CURRENT_PROGRESS_VERSION } from '../storage';
import {
  createInitialProgress,
  resolveBootProgress,
  startingLevelId,
} from '../reducers';
import type { Progress } from '../types';
import type { Level, Track } from '../../content/types';

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

describe('startingLevelId', () => {
  it('resolves a starting point to its level id', () => {
    expect(startingLevelId([BASIC], { trackId: 'basic', levelNumber: 1 })).toBe('b01');
    expect(startingLevelId([BASIC], { trackId: 'basic', levelNumber: 2 })).toBe('b02');
  });

  it('returns null for an unknown track or level number', () => {
    expect(startingLevelId([BASIC], { trackId: 'nope', levelNumber: 1 })).toBeNull();
    expect(startingLevelId([BASIC], { trackId: 'basic', levelNumber: 9 })).toBeNull();
  });
});

describe('createInitialProgress', () => {
  it('builds an empty progress slice at the starting level', () => {
    const progress = createInitialProgress([BASIC, INTERMEDIATE], {
      trackId: 'intermediate',
      levelNumber: 1,
    });
    expect(progress).toEqual({
      version: CURRENT_PROGRESS_VERSION,
      startingPoint: { trackId: 'intermediate', levelNumber: 1 },
      completedLevelIds: [],
      currentLevelId: 'i01',
      activeSession: null,
      weaknessQueue: {},
      wrongAnswers: {},
      dailyStreak: 0,
      bestStreak: 0,
      lastPlayedDate: null,
    });
  });

  it('falls back to the first flattened level for an unknown starting point', () => {
    const progress = createInitialProgress([BASIC], { trackId: 'nope', levelNumber: 1 });
    expect(progress.currentLevelId).toBe('b01');
  });
});

describe('resolveBootProgress', () => {
  it('returns a saved progress as-is (returning players are not re-asked)', () => {
    const saved: Progress = {
      version: CURRENT_PROGRESS_VERSION,
      startingPoint: { trackId: 'basic', levelNumber: 1 },
      completedLevelIds: ['b01'],
      currentLevelId: 'b02',
      activeSession: null,
      weaknessQueue: {},
      wrongAnswers: {},
    };
    expect(resolveBootProgress([BASIC, INTERMEDIATE], saved)).toBe(saved);
  });

  it('auto-starts at the single eligible track when only one is bundled', () => {
    const progress = resolveBootProgress([BASIC, ADVANCED], null);
    expect(progress?.startingPoint).toEqual({ trackId: 'basic', levelNumber: 1 });
    expect(progress?.currentLevelId).toBe('b01');
    expect(progress?.completedLevelIds).toEqual([]);
  });

  it('leaves progress null (show the start choice) when multiple tracks are eligible', () => {
    expect(resolveBootProgress([BASIC, INTERMEDIATE], null)).toBeNull();
  });
});
