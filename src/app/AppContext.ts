// App-wide context: content + state + progress actions, provided by AppProvider.
//
// Split from AppProvider so the navigator (which consumes the context) can
// import it without a provider↔navigator circular import.

import { createContext, useContext } from 'react';
import type { Track } from '../content/types';
import type { Progress, Settings } from '../state/types';
import type { ContentReport } from '../state/reports';

export interface AppContextValue {
  /** The validated bundled tracks (content). */
  tracks: Track[];
  /** Loaded settings (theme, …). */
  settings: Settings;
  reports: ContentReport[];
  /** The progress slice, or null until a starting point is chosen. */
  progress: Progress | null;
  /** true once settings + progress have loaded — the boot decision is final. */
  ready: boolean;
  /** Persist a fresh progress slice from a first-launch starting-point choice. */
  chooseStartingPoint: (trackId: string, levelNumber: number) => Promise<void>;
  /** Replace + persist the progress slice (frontier advance, level end, …). */
  applyProgress: (next: Progress) => Promise<void>;
  /** Replace + persist the settings (theme, …) — settings survive a reset. */
  applySettings: (next: Settings) => Promise<void>;
  /**
   * Reset the game (Task 12): clears persisted progress, then re-runs the
   * first-launch boot decision — with a single eligible track it auto-starts a
   * fresh progress at level 1, with several it leaves progress null so the
   * StartPoint choice shows. Settings survive. Resolves to the new progress
   * (or null for the start choice) so the caller can route to it.
   */
  resetGame: () => Promise<Progress | null>;
  createReport: (questionId: string) => Promise<void>;
  updateReport: (id: string, note: string) => Promise<void>;
  exportReports: () => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used within an AppProvider.');
  }
  return value;
}
