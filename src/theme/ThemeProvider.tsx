/**
 * Theme context honoring the `device | light | dark` setting.
 *
 * ThemeProvider resolves the `settings.theme` preference against the device
 * scheme (via `useColorScheme`) and provides a `Theme` value — the resolved
 * scheme ('light' | 'dark'), the semantic color palette, and the design tokens.
 * Screens and components consume it through `useTheme()` / `useThemedStyles()`.
 *
 * `useTheme()` deliberately falls back to the light theme when no provider is
 * present: the presentational screens are fixture-tested without a provider, and
 * a missing provider in a test fixture should render with sensible (light)
 * colors rather than throw.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { ThemePreference } from '../state/types';
import { darkColors, lightColors, type ThemeColors } from './themes';
import { tokens } from './tokens';

export interface Theme {
  /** The resolved scheme actually rendered — 'light' or 'dark'. */
  scheme: 'light' | 'dark';
  /** Semantic color palette for the resolved scheme. */
  colors: ThemeColors;
  /** Scheme-independent design tokens (spacing, typography, radii). */
  tokens: typeof tokens;
}

export interface ThemeProviderProps {
  /** The player's theme preference (settings.theme). */
  preference: ThemePreference;
  children: React.ReactNode;
}

const ThemeContext = createContext<Theme | null>(null);

/** The light theme used when no provider is present (test fixtures). */
const FALLBACK_THEME: Theme = { scheme: 'light', colors: lightColors, tokens };

export function ThemeProvider({ preference, children }: ThemeProviderProps) {
  const deviceScheme = useColorScheme();
  const scheme: 'light' | 'dark' =
    preference === 'device' ? (deviceScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<Theme>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      tokens,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const value = useContext(ThemeContext);
  return value ?? FALLBACK_THEME;
}

/**
 * Build styles from the current palette, memoized per scheme.
 *
 * `factory` must be module-level (stable) — pass a plain `makeStyles` function
 * defined next to the component. Returns the same style object for the lifetime
 * of a scheme, so it is safe to use in render paths without worrying about
 * recreating `StyleSheet.create` output every render.
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
