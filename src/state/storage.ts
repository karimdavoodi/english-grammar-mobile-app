/**
 * AsyncStorage persistence for runtime state.
 *
 * Two keys, one concern each:
 *   egg:settings — Settings (survives a progress reset)
 *   egg:progress — Progress (version-gated; reset clears this)
 *
 * Every function takes an injectable AsyncStorage-compatible store so tests
 * run against an in-memory mock with no native module; callers that don't
 * inject one use the real AsyncStorage (`DEFAULT_STORE`).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, type Progress, type Settings } from './types';

export const SETTINGS_KEY = 'egg:settings';
export const PROGRESS_KEY = 'egg:progress';

/** Current Progress schema version — bump and register a migration when the shape changes. */
export const CURRENT_PROGRESS_VERSION = 4;

/** Minimal AsyncStorage-compatible surface the storage layer depends on. */
export interface StorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Default store: the real AsyncStorage, used when callers don't inject one. */
export const DEFAULT_STORE: StorageLike = AsyncStorage;

// ── Version migration gate ─────────────────────────────────────────
// key: the version being migrated FROM; value: (state) => the next version.
// migrateProgress() walks the chain from the saved version up to
// CURRENT_PROGRESS_VERSION. Append an entry whenever the shape changes.
const MIGRATIONS: Record<number, (progress: Progress) => Progress> = {
  // 0 → 1: initial shape. Nothing changed structurally; stamp the version.
  0: progress => ({ ...progress, version: 1 }),
  // 1 → 2: typed answers are optional, so existing choice-based history is
  // already valid and only needs the new schema stamp.
  1: progress => ({ ...progress, version: 2 }),
  // 2 → 3: mixed-session metadata is optional, so old level sessions remain valid.
  2: progress => ({ ...progress, version: 3 }),
  // 3 → 4: add the local daily-streak summary without changing learning data.
  3: progress => ({
    ...progress,
    version: 4,
    dailyStreak: 0,
    bestStreak: 0,
    lastPlayedDate: null,
  }),
};

/**
 * Normalize raw stored progress: validate it, then walk the migration chain
 * to the current version. Throws on malformed or newer-than-supported data —
 * the app fails fast rather than silently running on broken saved state.
 */
export function migrateProgress(raw: unknown): Progress {
  if (raw === null || typeof raw !== 'object') {
    throw new Error('Stored progress is not an object.');
  }
  const progress = raw as Partial<Progress>;
  if (typeof progress.version !== 'number') {
    throw new Error('Stored progress is missing a numeric version.');
  }
  if (progress.version > CURRENT_PROGRESS_VERSION) {
    throw new Error(
      `Stored progress version ${progress.version} is newer than supported version ${CURRENT_PROGRESS_VERSION}.`,
    );
  }
  let current = progress as Progress;
  while (current.version < CURRENT_PROGRESS_VERSION) {
    const step = MIGRATIONS[current.version];
    if (step === undefined) {
      throw new Error(`No migration registered from progress version ${current.version}.`);
    }
    current = step(current);
  }
  return current;
}

// ── Settings ───────────────────────────────────────────────────────
export async function loadSettings(store: StorageLike = DEFAULT_STORE): Promise<Settings> {
  const raw = await store.getItem(SETTINGS_KEY);
  if (raw === null) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS };
    const candidate = parsed as { theme?: unknown; notifications?: unknown };
    const theme = candidate.theme === 'light' || candidate.theme === 'dark' || candidate.theme === 'device'
      ? candidate.theme : DEFAULT_SETTINGS.theme;
    const saved = candidate.notifications;
    const notification = saved !== null && typeof saved === 'object'
      ? saved as Partial<Settings['notifications']> : {};
    return {
      theme,
      notifications: {
        enabled: typeof notification.enabled === 'boolean' ? notification.enabled : DEFAULT_SETTINGS.notifications.enabled,
        hour: typeof notification.hour === 'number' && Number.isInteger(notification.hour) && notification.hour >= 0 && notification.hour <= 23
          ? notification.hour : DEFAULT_SETTINGS.notifications.hour,
        minute: typeof notification.minute === 'number' && Number.isInteger(notification.minute) && notification.minute >= 0 && notification.minute <= 59
          ? notification.minute : DEFAULT_SETTINGS.notifications.minute,
      },
    };
  } catch {
    // malformed JSON — fall through to the default
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(
  settings: Settings | Partial<Settings>,
  store: StorageLike = DEFAULT_STORE,
): Promise<void> {
  await store.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Progress ───────────────────────────────────────────────────────
export async function loadProgress(store: StorageLike = DEFAULT_STORE): Promise<Progress | null> {
  const raw = await store.getItem(PROGRESS_KEY);
  if (raw === null) {
    return null;
  }
  return migrateProgress(JSON.parse(raw));
}

export async function saveProgress(
  progress: Progress,
  store: StorageLike = DEFAULT_STORE,
): Promise<void> {
  await store.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/**
 * Reset the game: clear egg:progress only. Settings survive. On the next
 * launch the app re-enters the starting-point choice.
 */
export async function resetProgress(store: StorageLike = DEFAULT_STORE): Promise<void> {
  await store.removeItem(PROGRESS_KEY);
}
