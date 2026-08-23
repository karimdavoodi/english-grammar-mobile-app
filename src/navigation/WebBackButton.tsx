/**
 * WebBackButton — the back affordance for the browser preview.
 *
 * The app's back navigation is the native system gesture (Android hardware
 * back, iOS swipe) with headers hidden, so a browser has no way back once a
 * screen is pushed. On web this renders a small iOS-style ‹ button whenever
 * the root stack has a screen to pop, and pops it on press.
 *
 * The navigator (AppNavigator) places this button inside a dedicated top bar
 * that is only rendered on pushed web screens, so it NEVER overlaps the
 * screen's own header — the screen content sits below the bar. Native
 * platforms render nothing — their system back already works.
 *
 * Presentational on purpose: whether a back is available (`canGoBack`) and
 * what popping does (`onGoBack`) are decided by the navigator, so the button
 * tests with plain props.
 */

import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';

export interface WebBackButtonProps {
  /** Whether the root stack has a screen to pop. */
  canGoBack: boolean;
  /** Pop the stack (or whatever "back" means for the active screen). */
  onGoBack: () => void;
}

export function WebBackButton({ canGoBack, onGoBack }: WebBackButtonProps) {
  const styles = useThemedStyles(makeStyles);

  if (Platform.OS !== 'web' || !canGoBack) {
    return null;
  }

  return (
    <Pressable
      testID="web-back-button"
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onGoBack}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.chevron}>‹</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chevron: {
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 28,
      // The ‹ glyph sits above its line box — nudge for optical centering.
      marginTop: -2,
    },
    pressed: {
      backgroundColor: colors.surfacePressed,
    },
  });
