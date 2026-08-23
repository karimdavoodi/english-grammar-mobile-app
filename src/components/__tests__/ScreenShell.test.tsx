/**
 * Tests for the Task 1 ScreenShell: the shared screen root applies the theme
 * background and the device's safe-area insets as padding, so no screen content
 * renders under the status bar / notch or behind the home indicator.
 *
 * Rendered through the shared harness (`wrapInSafeArea`) with a custom metrics
 * object simulating a notched device.
 */

import React from 'react';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { Metrics } from 'react-native-safe-area-context';
import { TEST_SAFE_AREA_METRICS, wrapInSafeArea } from '../../test-utils';
import { ScreenShell } from '../ScreenShell';

/** A notched phone: a 47pt top inset (status bar + notch) and 34pt home bar. */
const NOTCHED_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 47, right: 0, bottom: 34, left: 0 },
};

async function renderShell(metrics: Metrics = TEST_SAFE_AREA_METRICS, style?: StyleProp<ViewStyle>) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      wrapInSafeArea(
        <ScreenShell testID="shell" style={style}>
          <Text>Content</Text>
        </ScreenShell>,
        metrics,
      ),
    );
  });
  return tree;
}

function flatShellStyle(tree: ReactTestRenderer.ReactTestRenderer) {
  // Match the host View (not the composite ScreenShell, which also carries the
  // testID prop) so the merged style array is what the shell actually renders.
  const host = tree.root.find(
    node => typeof node.type === 'string' && node.props.testID === 'shell',
  );
  return StyleSheet.flatten(host.props.style);
}

describe('ScreenShell', () => {
  it('renders children on the themed screen background', async () => {
    const tree = await renderShell();
    const style = flatShellStyle(tree);
    expect(style.backgroundColor).toBe('#ffffff'); // light theme default
    expect(style.flex).toBe(1);
    expect(tree.root.findAllByType(Text).length).toBeGreaterThan(0);
  });

  it('pads the top and bottom by the safe-area insets', async () => {
    const tree = await renderShell(NOTCHED_METRICS);
    const style = flatShellStyle(tree);
    expect(style.paddingTop).toBe(47);
    expect(style.paddingBottom).toBe(34);
  });

  it('leaves no safe-area padding when the device has zero insets', async () => {
    const tree = await renderShell();
    const style = flatShellStyle(tree);
    expect(style.paddingTop).toBe(0);
    expect(style.paddingBottom).toBe(0);
  });

  it('merges extra layout styles after the safe-area padding', async () => {
    const tree = await renderShell(TEST_SAFE_AREA_METRICS, { justifyContent: 'center' });
    const style = flatShellStyle(tree);
    expect(style.justifyContent).toBe('center');
    expect(style.paddingTop).toBe(0); // safe-area padding still applied
  });
});
