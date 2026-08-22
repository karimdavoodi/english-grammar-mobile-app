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
 * The full provider wiring / load-time validation story (Task 13) builds on
 * this. Content is the validated bundled `tracks` (content/index.ts validates
 * at import); the `tracks` prop is injectable for tests.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { tracks as contentTracks } from '../content';
import type { Track } from '../content/types';
import { createInitialProgress, resolveBootProgress } from '../state/reducers';
import {
  DEFAULT_STORE,
  loadProgress,
  loadSettings,
  saveProgress,
  type StorageLike,
} from '../state/storage';
import { DEFAULT_SETTINGS, type Progress, type Settings } from '../state/types';
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
      const initialProgress = resolveBootProgress(tracks, savedProgress);
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

  const value = useMemo<AppContextValue>(
    () => ({
      tracks,
      settings: settings ?? DEFAULT_SETTINGS,
      progress,
      ready,
      chooseStartingPoint,
      applyProgress,
    }),
    [tracks, settings, progress, ready, chooseStartingPoint, applyProgress],
  );

  return (
    <AppContext.Provider value={value}>
      {ready ? children : <LoadingView />}
    </AppContext.Provider>
  );
}

function LoadingView() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator testID="app-loading" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
