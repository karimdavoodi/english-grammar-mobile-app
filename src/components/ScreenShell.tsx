/**
 * ScreenShell — the shared screen root: themed background + safe-area insets.
 *
 * Every screen renders inside this shell (Issue 1) so no content sits under the
 * status bar / notch or behind the home indicator. The shell applies the theme
 * background and pads the top / bottom / left / right by the device's safe-area
 * insets (`useSafeAreaInsets`); screens provide their own layout as children —
 * a screen header therefore starts below the status bar, and bottom-anchored
 * controls (Next question, reset, send reports) clear the home indicator.
 *
 * `useSafeAreaInsets` throws when no `SafeAreaProvider` is mounted. The app root
 * (App.tsx) provides one; tests render inside the shared `renderScreen` harness
 * (src/test-utils.tsx).
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';

export interface ScreenShellProps {
  /** The screen's content — laid out within the safe-area-padded box. */
  children: React.ReactNode;
  /**
   * Extra layout styles merged AFTER the base + safe-area padding. Do not put
   * padding here — the shell's safe-area insets must win.
   */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ScreenShell({ children, style, testID }: ScreenShellProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        {
          paddingTop: insets.top,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
