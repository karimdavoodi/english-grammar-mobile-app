/**
 * AppProvider — the composition root: loads content + state and boots the app.
 *
 * Task 9 wires the boot flow per docs/use-cases "First Launch":
 *   - loads settings + saved progress from AsyncStorage;
 *   - with no saved progress, a single eligible starting track auto-starts at
 *     its level 1 (Basic-only in v1 — the choice screen is never shown); with
 *     more than one eligible track, progress stays null and the StartPoint
 *     choice screen shows;
 *   - a saved progress resumes straight at the current level (returning players
 *     are never re-asked);
 *   - exposes `chooseStartingPoint` / `applyProgress` so screens can persist
 *     progress transitions.
 *
 * Task 12 adds the theme system and settings/reset:
 *   - the resolved theme (device | light | dark) is provided to the navigator
 *     through ThemeProvider, with a themed StatusBar;
 *   - `applySettings` replaces + persists settings (survive a reset);
 *   - `resetGame` clears `egg:progress`, re-runs the first-launch boot decision
 *     (auto-start for Basic-only v1, StartPoint choice for multi-track), and
 *     resolves to the new progress so the caller can route to it.
 *
 * Task 13 completes the composition root:
 *   - load-time validation is the content loader's import-time
 *     `validateContent()` — a malformed corpus throws before the app can boot
 *     (content/index.ts validates at import; the `tracks` prop is injectable
 *     for tests);
 *   - persisted-ID repair (`repairProgress`) runs on any saved progress at load:
 *     an unknown current level, completed level id, or active session is
 *     repaired against the bundled tracks before boot, and the repaired slice
 *     is persisted so the fix is durable — the navigator never boots into an
 *     invalid route;
 *   - the `ready` gate keeps the navigator (children) unmounted until the boot
 *     decision is final — no invalid-route flash on first launch.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { tracks as contentTracks } from '../content';
import type { Track } from '../content/types';
import { createInitialProgress, resolveBootProgress } from '../state/reducers';
import { repairProgress } from '../state/selectors';
import {
  DEFAULT_STORE,
  loadProgress,
  loadSettings,
  resetProgress,
  saveProgress,
  saveSettings,
  type StorageLike,
} from '../state/storage';
import { DEFAULT_SETTINGS, type Progress, type Settings } from '../state/types';
import { darkColors, lightColors } from '../theme/themes';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { AppContext, type AppContextValue } from './AppContext';

export interface AppProviderProps {
  /** AsyncStorage-compatible store; inject a memory store in tests. */
  store?: StorageLike;
  /** Bundled tracks; defaults to the validated content corpus (Basic-only in v1). */
  tracks?: Track[];
  /** Rendered once boot completes (the navigator). */
  children: React.ReactNode;
}

export function AppProvider({
  store = DEFAULT_STORE,
  tracks = contentTracks,
  children,
}: AppProviderProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loadedSettings, savedProgress] = await Promise.all([
        loadSettings(store),
        loadProgress(store),
      ]);
      if (cancelled) {
        return;
      }
      // Persisted-ID repair (Task 13): a saved current level, completed level
      // id, or active session that no longer resolves in the bundled content
      // (e.g. content changed between versions) is repaired against the tracks
      // before boot, so the navigator never routes to an invalid level. The
      // repaired slice is persisted so the fix is durable across launches
      // (the write is a no-op when nothing changed).
      const repaired =
        savedProgress === null ? null : repairProgress(tracks, savedProgress);
      const initialProgress = resolveBootProgress(tracks, repaired);
      if (repaired !== null && repaired !== savedProgress) {
        await saveProgress(repaired, store);
      }
      // An auto-start writes its fresh progress once so a relaunch finds it
      // (the write is idempotent and only happens when nothing was saved).
      if (initialProgress !== null && savedProgress === null) {
        await saveProgress(initialProgress, store);
      }
      if (cancelled) {
        return;
      }
      setSettings(loadedSettings);
      setProgress(initialProgress);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [store, tracks]);

  const chooseStartingPoint = useCallback(
    async (trackId: string, levelNumber: number) => {
      const next = createInitialProgress(tracks, { trackId, levelNumber });
      setProgress(next);
      await saveProgress(next, store);
    },
    [tracks, store],
  );

  const applyProgress = useCallback(
    async (next: Progress) => {
      setProgress(next);
      await saveProgress(next, store);
    },
    [store],
  );

  const applySettings = useCallback(
    async (next: Settings) => {
      setSettings(next);
      await saveSettings(next, store);
    },
    [store],
  );

  const resetGame = useCallback(async (): Promise<Progress | null> => {
    await resetProgress(store);
    // Re-run the first-launch boot decision against no saved progress: Basic-only
    // v1 auto-starts a fresh progress at level 1 (and persists it so a relaunch
    // finds it); multiple eligible tracks leave progress null → StartPoint choice.
    const next = resolveBootProgress(tracks, null);
    if (next !== null) {
      setProgress(next);
      await saveProgress(next, store);
    } else {
      setProgress(null);
    }
    return next;
  }, [tracks, store]);

  const value = useMemo<AppContextValue>(
    () => ({
      tracks,
      settings: settings ?? DEFAULT_SETTINGS,
      progress,
      ready,
      chooseStartingPoint,
      applyProgress,
      applySettings,
      resetGame,
    }),
    [tracks, settings, progress, ready, chooseStartingPoint, applyProgress, applySettings, resetGame],
  );

  return (
    <AppContext.Provider value={value}>
      {ready ? (
        <ThemeProvider preference={settings?.theme ?? 'device'}>
          <ThemedStatusBar />
          {children}
        </ThemeProvider>
      ) : (
        <LoadingView />
      )}
    </AppContext.Provider>
  );
}

/** Status bar matching the resolved theme (light icons on dark, dark on light). */
function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />;
}

function LoadingView() {
  const dark = useColorScheme() === 'dark';
  const colors = dark ? darkColors : lightColors;
  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <ActivityIndicator testID="app-loading" size="large" color={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
