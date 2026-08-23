/**
 * Tests for the AsyncStorage persistence layer (`storage.ts`) and the
 * persisted-session adapters (`types.ts`).
 *
 * Storage functions are injectable, so every test runs against an in-memory
 * Map-backed store — no native AsyncStorage needed. The real AsyncStorage
 * module is still jest-mocked so its top-level import in `storage.ts`
 * (the `DEFAULT_STORE` default) resolves cleanly in Node.
 */

// Self-contained factory (no out-of-scope refs, no ESM require): replaces the
// async-storage module so storage.ts's top-level DEFAULT_STORE import loads in
// Node. Every storage call in these tests injects its own memory store anyway.
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
      getMany: async (keys: string[]) =>
        Object.fromEntries(keys.map(k => [k, store.get(k) ?? null])),
      setMany: async (entries: Record<string, string>) => {
        for (const [key, value] of Object.entries(entries)) {
          store.set(key, value);
        }
      },
      removeMany: async (keys: string[]) => {
        for (const key of keys) {
          store.delete(key);
        }
      },
      getAllKeys: async () => [...store.keys()],
      clear: async () => {
        store.clear();
      },
    },
  };
});

import {
  hydrateSession,
  persistSession,
  type PersistedLevelSession,
  type Progress,
  type WeaknessEntry,
  type WrongAnswerEntry,
} from '../types';
import {
  CURRENT_PROGRESS_VERSION,
  loadProgress,
  loadSettings,
  migrateProgress,
  PROGRESS_KEY,
  resetProgress,
  saveProgress,
  saveSettings,
  SETTINGS_KEY,
  type StorageLike,
} from '../storage';
import { createSession, type LevelSession } from '../../game/levelMachine';

/** In-memory AsyncStorage-compatible store for tests. */
function createMemoryStore(initial: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initial));
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

function makeProgress(overrides: Partial<Progress> = {}): Progress {
  return {
    version: CURRENT_PROGRESS_VERSION,
    startingPoint: { trackId: 'basic', levelNumber: 1 },
    completedLevelIds: [],
    currentLevelId: 'b01',
    activeSession: null,
    weaknessQueue: {},
    wrongAnswers: {},
    ...overrides,
  };
}

function makeSession(overrides: Partial<LevelSession> = {}): LevelSession {
  return {
    ...createSession('b03'),
    ...overrides,
  };
}

// ── Persisted-session adapters ─────────────────────────────────────

describe('persistSession / hydrateSession', () => {
  it('drops the machine-only status but keeps every counter and asked id', () => {
    const session = makeSession({
      askedIds: ['b03q01', 'b03q02'],
      correctCount: 5,
      streak: 2,
      totalAnswered: 7,
      missCounts: { past_perfect_form: 1 },
      lastWrongRule: 'past_perfect_form',
      status: 'passed',
    });

    const persisted = persistSession(session);

    expect(persisted).toEqual({
      levelId: 'b03',
      askedIds: ['b03q01', 'b03q02'],
      correctCount: 5,
      streak: 2,
      totalAnswered: 7,
      missCounts: { past_perfect_form: 1 },
      lastWrongRule: 'past_perfect_form',
    });
    expect(persisted).not.toHaveProperty('status');
  });

  it('rehydrates a saved session as an always-in-progress machine session', () => {
    const persisted: PersistedLevelSession = {
      levelId: 'b03',
      askedIds: ['b03q01'],
      correctCount: 1,
      streak: 1,
      totalAnswered: 1,
      missCounts: {},
      lastWrongRule: null,
    };

    expect(hydrateSession(persisted)).toEqual({
      ...persisted,
      status: 'in_progress',
    });
  });

  it('round-trips a session without dropping counters or asked ids', () => {
    const session = makeSession({
      askedIds: ['b03q01', 'b03q03', 'b03q02'],
      correctCount: 6,
      streak: 0,
      totalAnswered: 9,
      missCounts: { past_perfect_form: 2, past_perfect_vs_past_simple: 1 },
      lastWrongRule: 'past_perfect_form',
    });

    expect(hydrateSession(persistSession(session))).toEqual({
      ...session,
      status: 'in_progress',
    });
  });
});

// ── Settings ───────────────────────────────────────────────────────

describe('settings persistence', () => {
  it('returns the device-theme default when nothing is stored', async () => {
    const store = createMemoryStore();
    expect(await loadSettings(store)).toEqual({ theme: 'device' });
  });

  it('round-trips saved settings', async () => {
    const store = createMemoryStore();
    await saveSettings({ theme: 'dark' }, store);

    expect(await loadSettings(store)).toEqual({ theme: 'dark' });
    expect(JSON.parse((await store.getItem(SETTINGS_KEY)) ?? '')).toEqual({ theme: 'dark' });
  });

  it('falls back to the default on malformed JSON', async () => {
    const store = createMemoryStore({ [SETTINGS_KEY]: 'not-json{' });
    expect(await loadSettings(store)).toEqual({ theme: 'device' });
  });

  it('falls back to the default on an unknown theme value', async () => {
    const store = createMemoryStore({ [SETTINGS_KEY]: '{"theme":"neon"}' });
    expect(await loadSettings(store)).toEqual({ theme: 'device' });
  });
});

// ── Progress ───────────────────────────────────────────────────────

describe('progress persistence', () => {
  it('returns null when nothing is stored', async () => {
    const store = createMemoryStore();
    expect(await loadProgress(store)).toBeNull();
  });

  it('round-trips saved progress, including a nested active session', async () => {
    const store = createMemoryStore();
    const progress = makeProgress({
      startingPoint: { trackId: 'basic', levelNumber: 3 },
      completedLevelIds: ['b01', 'b02'],
      currentLevelId: 'b03',
      activeSession: {
        levelId: 'b03',
        askedIds: ['b03q01'],
        correctCount: 1,
        streak: 1,
        totalAnswered: 2,
        missCounts: { past_perfect_form: 1 },
        lastWrongRule: 'past_perfect_form',
      },
      weaknessQueue: {
        past_perfect_form: {
          rule: 'past_perfect_form',
          missCount: 1,
          reviewStreak: 0,
          lastMissedAt: '2026-08-22T10:00:00.000Z',
        } as WeaknessEntry,
      },
      wrongAnswers: {
        b03q01: {
          questionId: 'b03q01',
          count: 1,
          lastChosenIndex: 0,
          lastMissedAt: '2026-08-22T10:00:00.000Z',
        } as WrongAnswerEntry,
      },
    });

    await saveProgress(progress, store);
    expect(await loadProgress(store)).toEqual(progress);
  });

  it('stores the current version number so loads are version-gated', async () => {
    const store = createMemoryStore();
    await saveProgress(makeProgress(), store);

    const stored = JSON.parse((await store.getItem(PROGRESS_KEY)) ?? '');
    expect(stored.version).toBe(CURRENT_PROGRESS_VERSION);
  });

  it('migrates older-version state on load (0 → current)', async () => {
    const store = createMemoryStore({
      [PROGRESS_KEY]: JSON.stringify({
        version: 0,
        startingPoint: { trackId: 'basic', levelNumber: 1 },
        completedLevelIds: [],
        currentLevelId: 'b01',
        activeSession: null,
        weaknessQueue: {},
        wrongAnswers: {},
      }),
    });

    const loaded = await loadProgress(store);
    expect(loaded?.version).toBe(CURRENT_PROGRESS_VERSION);
    expect(loaded?.currentLevelId).toBe('b01'); // data survives the migration
  });

  it('migrates version 1 typed-response state to version 2 without changing history', () => {
    const legacy = {
      version: 1,
      startingPoint: { trackId: 'basic', levelNumber: 1 },
      completedLevelIds: [],
      currentLevelId: 'b01',
      activeSession: null,
      weaknessQueue: {},
      wrongAnswers: {
        b01q01: {
          questionId: 'b01q01',
          count: 2,
          lastChosenIndex: 3,
          lastMissedAt: '2026-08-22T10:00:00.000Z',
        },
      },
    };

    expect(migrateProgress(legacy)).toMatchObject({
      ...legacy,
      version: CURRENT_PROGRESS_VERSION,
      dailyStreak: 0,
      bestStreak: 0,
      lastPlayedDate: null,
    });
  });

  it('migrates version 2 mixed-session state to version 3', () => {
    const legacy = { version: 2, currentLevelId: 'b01', activeSession: null };
    expect(migrateProgress(legacy)).toMatchObject({
      ...legacy,
      version: CURRENT_PROGRESS_VERSION,
      dailyStreak: 0,
      bestStreak: 0,
      lastPlayedDate: null,
    });
  });

  it('throws on state newer than the supported version', async () => {
    const store = createMemoryStore({
      [PROGRESS_KEY]: JSON.stringify({ version: CURRENT_PROGRESS_VERSION + 1 }),
    });

    await expect(loadProgress(store)).rejects.toThrow(/newer than supported/);
  });

  it('throws when stored progress is not an object', () => {
    expect(() => migrateProgress('nope')).toThrow(/not an object/);
  });

  it('throws when stored progress has no numeric version', () => {
    expect(() => migrateProgress({ currentLevelId: 'b01' })).toThrow(/numeric version/);
  });

  it('throws when no migration is registered for a saved version', () => {
    // 0.5 is below current but has no step in the migration registry
    expect(() => migrateProgress({ version: 0.5 })).toThrow(/No migration registered/);
  });
});

// ── Reset ──────────────────────────────────────────────────────────

describe('resetProgress', () => {
  it('clears progress but preserves settings', async () => {
    const store = createMemoryStore({
      [PROGRESS_KEY]: JSON.stringify(makeProgress()),
      [SETTINGS_KEY]: JSON.stringify({ theme: 'light' }),
    });

    await resetProgress(store);

    expect(await store.getItem(PROGRESS_KEY)).toBeNull();
    expect(await loadSettings(store)).toEqual({ theme: 'light' });
  });
});
