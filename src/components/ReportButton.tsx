import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';

export function ReportButton({ onPress }: { onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      testID="report-button"
      accessibilityRole="button"
      accessibilityLabel="Report a problem with this question"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>Report a problem</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 8, paddingHorizontal: 4 },
    pressed: { opacity: 0.65 },
    label: { color: colors.textMuted, fontSize: 13, textDecorationLine: 'underline' },
  });
