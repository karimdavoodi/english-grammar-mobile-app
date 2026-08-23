/**
 * SettingsScreen — appearance (theme) and game reset.
 *
 * Per docs/use-cases "Settings — Theme" and "Settings — Reset Progress":
 *   - the theme preference is offered as Device / Light / Dark, with the current
 *     choice marked; picking one calls `onChangeTheme`;
 *   - "Review mistakes" and "Review / Practice" open their respective study screens;
 *   - "Reset game" requires confirmation (a dialog appears before anything is
 *     erased) and only then calls `onReset` — progress is wiped, settings survive.
 *
 * Presentational: no navigation, storage, or reducer imports — it takes state +
 * callbacks as props, so it tests with fixture data like the other presentational
 * screens. The reset confirmation uses the same native Alert pattern as the
 * LevelPlayScreen abandon dialog.
 */

import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ThemePreference } from '../state/types';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { tokens } from '../theme/tokens';

/** The offered theme options, in display order. */
const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string; hint: string }> = [
  { value: 'device', label: 'Device', hint: 'Follow your device appearance' },
  { value: 'light', label: 'Light', hint: 'Always use the light palette' },
  { value: 'dark', label: 'Dark', hint: 'Always use the dark palette' },
];

export interface SettingsScreenProps {
  /** The current theme preference — the matching option is marked selected. */
  themePreference: ThemePreference;
  /** Called with the new preference when the player picks a theme. */
  onChangeTheme: (preference: ThemePreference) => void;
  /** Called when the player confirms the reset in the confirmation dialog. */
  onReset: () => void;
  /** Called when the player taps "Review mistakes" (navigates to Review). */
  onOpenReview: () => void;
  onOpenStats?: () => void;
  onOpenMixedReview?: () => void;
  /** Called when the player taps Back. */
  onBack?: () => void;
}

export function SettingsScreen({
  themePreference,
  onChangeTheme,
  onReset,
  onOpenReview,
  onOpenStats,
  onOpenMixedReview,
  onBack,
}: SettingsScreenProps) {
  const styles = useThemedStyles(makeStyles);

  const handleResetPress = () => {
    // The confirmation must appear before anything is erased (Gherkin: "Reset
    // requires confirmation"). Only the confirm button routes to onReset.
    Alert.alert(
      'Reset game?',
      'All progress, mistakes, and weaknesses will be erased. Your appearance setting is kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: onReset },
      ],
    );
  };

  return (
    <View style={styles.screen} testID="settings-screen">
      <View style={styles.header}>
        <Text style={styles.heading} accessibilityRole="header" testID="settings-heading">
          Settings
        </Text>
        <Text style={styles.subheading} testID="settings-subheading">
          Choose the app’s appearance. Resetting erases your progress but keeps
          your appearance choice.
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <Text style={styles.sectionLabel} accessibilityRole="header" testID="settings-theme-label">
          Appearance
        </Text>
        {THEME_OPTIONS.map(option => {
          const selected = option.value === themePreference;
          return (
            <Pressable
              key={option.value}
              testID={`settings-theme-${option.value}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label} theme${selected ? ', selected' : ''}`}
              onPress={() => onChangeTheme(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionLabel} testID={`settings-theme-label-${option.value}`}>
                  {option.label}
                </Text>
                <Text style={styles.optionHint} testID={`settings-theme-hint-${option.value}`}>
                  {option.hint}
                </Text>
              </View>
              {selected ? (
                <Text style={styles.check} testID={`settings-theme-check-${option.value}`}>
                  ✓
                </Text>
              ) : null}
            </Pressable>
          );
        })}

        <Text style={styles.sectionLabel} accessibilityRole="header" testID="settings-support-label">
          Support
        </Text>
        <Pressable
          testID="settings-review"
          accessibilityRole="button"
          accessibilityLabel="Review mistakes"
          onPress={onOpenReview}
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
        >
          <View style={styles.optionText}>
            <Text style={styles.optionLabel} testID="settings-review-label">
              Review mistakes
            </Text>
            <Text style={styles.optionHint} testID="settings-review-hint">
              Study every question you have missed, grouped by rule
            </Text>
          </View>
        </Pressable>

        {onOpenMixedReview ? <Pressable
          testID="settings-mixed-review"
          accessibilityRole="button"
          accessibilityLabel="Review and practice"
          onPress={onOpenMixedReview}
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
        >
          <View style={styles.optionText}>
            <Text style={styles.optionLabel} testID="settings-mixed-review-label">
              Review / Practice
            </Text>
            <Text style={styles.optionHint}>
              Practice weaknesses and passed levels in one short session
            </Text>
          </View>
        </Pressable> : null}

        {onOpenStats ? <Pressable
          testID="settings-stats"
          accessibilityRole="button"
          accessibilityLabel="View stats"
          onPress={onOpenStats}
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
        >
          <View style={styles.optionText}>
            <Text style={styles.optionLabel}>Stats</Text>
            <Text style={styles.optionHint}>See your accuracy, practice days, and time played</Text>
          </View>
        </Pressable> : null}

        <Pressable
          testID="settings-reset"
          accessibilityRole="button"
          accessibilityLabel="Reset game"
          onPress={handleResetPress}
          style={({ pressed }) => [styles.reset, pressed && styles.resetPressed]}
        >
          <Text style={styles.resetLabel} testID="settings-reset-label">
            Reset game
          </Text>
        </Pressable>
        <Text style={styles.resetNote} testID="settings-reset-note">
          Erases all progress, the Weakness Queue, and wrong-answer history. Your
          appearance setting is kept.
        </Text>
      </ScrollView>

      {onBack ? (
        <Pressable
          testID="settings-back"
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: tokens.spacing.lg,
      backgroundColor: colors.primaryContainer,
      borderBottomWidth: 1,
      borderBottomColor: colors.primaryBorder,
    },
    heading: {
      fontSize: tokens.typography.heading,
      fontWeight: '700',
      color: colors.primaryOnContainer,
      marginBottom: 4,
    },
    subheading: {
      fontSize: tokens.typography.body,
      lineHeight: 20,
      color: colors.primaryOnContainerMuted,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: tokens.spacing.lg,
    },
    sectionLabel: {
      fontSize: tokens.typography.caption,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: colors.textMuted,
      marginBottom: tokens.spacing.sm,
      marginTop: tokens.spacing.md,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: tokens.radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.lg,
      marginBottom: tokens.spacing.sm,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer,
    },
    optionPressed: {
      backgroundColor: colors.surfacePressed,
    },
    optionText: {
      flex: 1,
      marginRight: tokens.spacing.sm,
    },
    optionLabel: {
      fontSize: tokens.typography.bodyLarge,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    optionHint: {
      fontSize: tokens.typography.small,
      lineHeight: 19,
      color: colors.textMuted,
      marginTop: 1,
    },
    check: {
      fontSize: tokens.typography.title,
      fontWeight: '700',
      color: colors.primary,
    },
    reset: {
      marginTop: tokens.spacing.md,
      alignSelf: 'stretch',
      backgroundColor: colors.danger,
      borderRadius: tokens.radii.md,
      paddingVertical: tokens.spacing.md,
      alignItems: 'center',
    },
    resetPressed: {
      backgroundColor: colors.dangerPressed,
    },
    resetLabel: {
      color: colors.textOnAccent,
      fontWeight: '700',
      fontSize: tokens.typography.bodyLarge,
    },
    resetNote: {
      fontSize: tokens.typography.small,
      lineHeight: 18,
      color: colors.textMuted,
      marginTop: tokens.spacing.sm,
    },
    back: {
      margin: tokens.spacing.lg,
      alignSelf: 'stretch',
      backgroundColor: colors.primary,
      borderRadius: tokens.radii.md,
      paddingVertical: tokens.spacing.md,
      alignItems: 'center',
    },
    backPressed: {
      backgroundColor: colors.primaryPressed,
    },
    backLabel: {
      color: colors.textOnAccent,
      fontWeight: '600',
      fontSize: tokens.typography.bodyLarge,
    },
  });
