/**
 * Shared screen/component test harness (Task 1).
 *
 * Every screen renders inside `ScreenShell`, which reads safe-area insets via
 * `useSafeAreaInsets` — that hook throws when no `SafeAreaProvider` is mounted.
 * Screen tests therefore render inside one, using `initialMetrics` so insets are
 * deterministic (zero by default; pass `metrics` to simulate a notch or home
 * indicator). The app root provides the provider on device (App.tsx).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Metrics } from 'react-native-safe-area-context';

/** Zero insets on a 320×640 window — the default for every screen test. */
export const TEST_SAFE_AREA_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

/** Wrap `ui` in a `SafeAreaProvider` so screens can resolve their insets. */
export function wrapInSafeArea(
  ui: React.ReactElement,
  metrics: Metrics = TEST_SAFE_AREA_METRICS,
): React.ReactElement {
  return <SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>;
}

/** Render `ui` inside a `SafeAreaProvider`, returning the test renderer tree. */
export async function renderScreen(
  ui: React.ReactElement,
): Promise<ReactTestRenderer.ReactTestRenderer> {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(wrapInSafeArea(ui));
  });
  return tree;
}
