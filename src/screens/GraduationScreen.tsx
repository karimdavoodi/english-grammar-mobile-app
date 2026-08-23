/** Completion celebration shown after the final level in the corpus. */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';

export interface GraduationScreenProps {
  completedLevels: number;
  totalLevels: number;
  dailyStreak: number;
  accuracy: number;
  onKeepPracticing: () => void;
  onOpenMap: () => void;
}

export function GraduationScreen({
  completedLevels,
  totalLevels,
  dailyStreak,
  accuracy,
  onKeepPracticing,
  onOpenMap,
}: GraduationScreenProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <ScreenShell testID="graduation-screen">
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Congratulations</Text>
          <Text style={styles.heading} accessibilityRole="header" testID="graduation-heading">
            You&apos;ve mastered all {totalLevels} levels
          </Text>
          <Text style={styles.message}>
            You completed {completedLevels} levels and finished the full English grammar journey.
          </Text>
          <View style={styles.summary}>
            <Text style={styles.metric} testID="graduation-streak">Daily streak: {dailyStreak}</Text>
            <Text style={styles.metric} testID="graduation-accuracy">
              Accuracy: {Math.round(accuracy * 100)}%
            </Text>
          </View>
        </View>

        <Pressable
          testID="graduation-practice"
          accessibilityRole="button"
          onPress={onKeepPracticing}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryLabel}>Keep practicing</Text>
        </Pressable>
        <Pressable
          testID="graduation-map"
          accessibilityRole="button"
          onPress={onOpenMap}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryLabel}>Go to level map</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      padding: 16,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.successContainer,
      borderColor: colors.successBorder,
      borderRadius: 12,
      borderWidth: 1,
      padding: 24,
      marginBottom: 24,
    },
    eyebrow: { color: colors.success, fontSize: 14, fontWeight: '700', marginBottom: 8 },
    heading: { color: colors.successOnContainerStrong, fontSize: 28, fontWeight: '700', marginBottom: 12 },
    message: { color: colors.successOnContainerStrong, fontSize: 16, lineHeight: 23, marginBottom: 20 },
    summary: { borderTopColor: colors.successBorder, borderTopWidth: 1, paddingTop: 16 },
    metric: { color: colors.successOnContainer, fontSize: 16, fontWeight: '600', marginBottom: 6 },
    primaryButton: { backgroundColor: colors.success, borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 10 },
    primaryLabel: { color: colors.textOnAccent, fontSize: 16, fontWeight: '700' },
    secondaryButton: { borderColor: colors.border, borderRadius: 8, borderWidth: 1, padding: 13, alignItems: 'center' },
    secondaryLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  });
