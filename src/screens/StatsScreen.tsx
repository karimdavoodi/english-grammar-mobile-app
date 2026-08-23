/**
 * StatsScreen — the player's overall accuracy summary (docs/ui-plan-1.md Task 2).
 *
 * A designed layout replaces the old plain-text list: a 2×2 grid of themed
 * summary tiles (Answers / Accuracy / Time played / Practice days) and an
 * "Accuracy by rule" section whose rows show the human `TopicRule.title`
 * (resolved via `findRule`, falling back to the raw tag for unknown/test tags),
 * the `correct/total` fraction, an accuracy bar, and the percentage.
 *
 * Rule rows sort alphabetically by their resolved display title (then by the
 * raw tag) so the order is stable, testable, and independent of event insertion
 * order. The screen stays presentational: it takes `stats` + a callback as
 * props, no navigation or storage imports.
 */

import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { findRule } from '../content';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { tokens } from '../theme/tokens';
import type { StatsSummary } from '../state/events';

export interface StatsScreenProps {
  stats: StatsSummary;
  onOpenReview: () => void;
}

/** One "Accuracy by rule" row, resolved and sorted for display. */
interface RuleRow {
  tag: string;
  title: string;
  correct: number;
  total: number;
  accuracy: number;
}

/** Resolve each rule tag to its human title and sort by title (then tag). */
function buildRuleRows(accuracyByRule: StatsSummary['accuracyByRule']): RuleRow[] {
  return Object.entries(accuracyByRule)
    .map(([tag, value]) => ({
      tag,
      title: findRule(tag)?.title ?? tag,
      correct: value.correct,
      total: value.total,
      accuracy: value.accuracy,
    }))
    .sort((a, b) => {
      const byTitle = a.title.localeCompare(b.title);
      return byTitle !== 0 ? byTitle : a.tag.localeCompare(b.tag);
    });
}

export function StatsScreen({ stats, onOpenReview }: StatsScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const minutes = Math.floor(stats.timePlayedSeconds / 60);
  const accuracyPercent = Math.round(stats.accuracy * 100);
  const ruleRows = useMemo(
    () => buildRuleRows(stats.accuracyByRule),
    [stats.accuracyByRule],
  );

  return (
    <ScreenShell testID="stats-screen">
      <View style={styles.body}>
        <Text style={styles.heading} accessibilityRole="header" testID="stats-heading">
          Your stats
        </Text>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.tileGrid}>
            <View style={styles.tile} testID="stats-total-tile">
              <Text style={styles.tileValue} testID="stats-total">
                {stats.totalAnswers}
              </Text>
              <Text style={styles.tileLabel} testID="stats-total-label">
                Answers
              </Text>
            </View>
            <View style={styles.tile} testID="stats-accuracy-tile">
              <Text style={styles.tileValue} testID="stats-accuracy">
                {`${accuracyPercent}%`}
              </Text>
              <Text style={styles.tileLabel} testID="stats-accuracy-label">
                Accuracy
              </Text>
            </View>
            <View style={styles.tile} testID="stats-time-tile">
              <Text style={styles.tileValue} testID="stats-time">
                {`${minutes} min`}
              </Text>
              <Text style={styles.tileLabel} testID="stats-time-label">
                Time played
              </Text>
            </View>
            <View style={styles.tile} testID="stats-days-tile">
              <Text style={styles.tileValue} testID="stats-days">
                {stats.practiceDates.length}
              </Text>
              <Text style={styles.tileLabel} testID="stats-days-label">
                Practice days
              </Text>
            </View>
          </View>

          <Text style={styles.section} accessibilityRole="header" testID="stats-rules-heading">
            Accuracy by rule
          </Text>

          {ruleRows.map(row => (
            <View
              key={row.tag}
              style={styles.ruleCard}
              testID={`stats-rule-${row.tag}`}
              accessibilityLabel={`${row.title}, ${row.correct} of ${row.total} correct, ${Math.round(
                row.accuracy * 100,
              )} percent`}
            >
              <View style={styles.ruleHeader}>
                <Text
                  style={styles.ruleTitle}
                  testID={`stats-rule-title-${row.tag}`}
                >
                  {row.title}
                </Text>
                <Text
                  style={styles.rulePercent}
                  testID={`stats-rule-percent-${row.tag}`}
                >
                  {`${Math.round(row.accuracy * 100)}%`}
                </Text>
              </View>
              <Text
                style={styles.ruleFraction}
                testID={`stats-rule-fraction-${row.tag}`}
              >
                {`${row.correct}/${row.total} correct`}
              </Text>
              <View
                style={styles.barTrack}
                testID={`stats-rule-bar-${row.tag}`}
                accessibilityElementsHidden
              >
                <View
                  style={[styles.barFill, { width: `${Math.round(row.accuracy * 100)}%` }]}
                />
              </View>
            </View>
          ))}

          <Pressable
            testID="stats-review"
            accessibilityRole="button"
            onPress={onOpenReview}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonLabel}>Review mistakes</Text>
          </Pressable>
        </ScrollView>
      </View>
    </ScreenShell>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    body: { flex: 1, padding: tokens.spacing.lg },
    heading: {
      fontSize: tokens.typography.heading,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: tokens.spacing.md,
    },
    content: { paddingBottom: tokens.spacing.lg },
    tileGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    tile: {
      width: '48%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: tokens.radii.xl,
      padding: tokens.spacing.md,
      marginBottom: tokens.spacing.md,
    },
    tileValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    tileLabel: {
      fontSize: tokens.typography.small,
      color: colors.textMuted,
    },
    section: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: tokens.typography.caption,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: tokens.spacing.md,
      marginBottom: tokens.spacing.sm,
    },
    ruleCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: tokens.radii.xl,
      padding: tokens.spacing.md,
      marginBottom: tokens.spacing.sm,
    },
    ruleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    ruleTitle: {
      flex: 1,
      fontSize: tokens.typography.bodyLarge,
      fontWeight: '600',
      color: colors.textPrimary,
      marginRight: tokens.spacing.sm,
    },
    rulePercent: {
      fontSize: tokens.typography.bodyLarge,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    ruleFraction: {
      fontSize: tokens.typography.small,
      color: colors.textMuted,
      marginBottom: tokens.spacing.sm,
    },
    barTrack: {
      height: 8,
      borderRadius: tokens.radii.pill,
      backgroundColor: colors.surfacePressed,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: tokens.radii.pill,
      backgroundColor: colors.primary,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: tokens.radii.md,
      padding: 14,
      alignItems: 'center',
      marginTop: tokens.spacing.md,
    },
    buttonPressed: {
      backgroundColor: colors.primaryPressed,
    },
    buttonLabel: {
      color: colors.textOnAccent,
      fontWeight: '700',
      fontSize: tokens.typography.bodyLarge,
    },
  });
