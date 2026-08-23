/**
 * ReviewScreen — the wrong-answer study history, grouped by rule.
 *
 * Per docs/use-cases "Review Screen" and docs/schema §2: every missed question
 * is listed grouped by its rule tag, showing the question, the player's last
 * wrong choice, the correct answer, the cumulative miss count, and both "why"
 * explanations (why the wrong choice is wrong, why the correct one is right).
 *
 * This is study history, not the active Weakness Queue: a rule still in the
 * queue is flagged ("In your Weakness Queue"), but clearing a weakness never
 * deletes this history. An empty state encourages the player when there are no
 * mistakes yet.
 *
 * Presentational: no navigation, storage, or reducer imports — it takes content
 * + state as props and resolves the grouping through the pure `reviewGroups`
 * selector, so it tests with fixture data like the Task 7A/8 presentational
 * screens. The back affordance is an `onBack` callback (the navigator provides
 * `goBack`).
 *
 * Task 12: all colors come from the theme palette.
 */

import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Track } from '../content/types';
import { reviewGroups } from '../state/selectors';
import type { WeaknessEntry, WrongAnswerEntry } from '../state/types';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { tokens } from '../theme/tokens';
import { ReportButton } from '../components/ReportButton';

export interface ReviewScreenProps {
  /** The bundled tracks — wrong-answer ids resolve back into this content. */
  tracks: Track[];
  /** Wrong-answer history keyed by question id (persisted, monotonic counts). */
  wrongAnswers: Record<string, WrongAnswerEntry>;
  /** The active Weakness Queue keyed by rule tag — flags rules still being studied. */
  weaknessQueue: Record<string, WeaknessEntry>;
  /** Called when the player taps Back (the navigator routes it). */
  onBack?: () => void;
  onReport?: (questionId: string) => void;
}

export function ReviewScreen({
  tracks,
  wrongAnswers,
  weaknessQueue,
  onBack,
  onReport,
}: ReviewScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const queuedRules = useMemo(
    () => new Set(Object.keys(weaknessQueue)),
    [weaknessQueue],
  );
  const groups = useMemo(
    () => reviewGroups(tracks, wrongAnswers, queuedRules),
    [tracks, wrongAnswers, queuedRules],
  );

  return (
    <View style={styles.screen} testID="review-screen">
      <View style={styles.header}>
        <Text style={styles.heading} accessibilityRole="header" testID="review-heading">
          Review
        </Text>
        <Text style={styles.subheading} testID="review-subheading">
          Every question you have missed, grouped by rule. Clearing a weakness
          does not delete this history.
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {groups.length === 0 ? (
          <View style={styles.empty} testID="review-empty" accessibilityRole="summary">
            <Text style={styles.emptyTitle} testID="review-empty-title">
              No mistakes yet
            </Text>
            <Text style={styles.emptyBody} testID="review-empty-body">
              Keep going — every rule you answer correctly builds toward mastery.
            </Text>
          </View>
        ) : (
          groups.map(group => (
            <View
              key={group.rule}
              style={styles.group}
              testID={`review-group-${group.rule}`}
            >
              <View style={styles.groupHeader}>
                <Text
                  style={styles.ruleTitle}
                  accessibilityRole="header"
                  testID={`review-rule-title-${group.rule}`}
                >
                  {group.ruleTitle}
                </Text>
                {group.stillQueued ? (
                  <View style={styles.weakBadge} testID={`review-weak-${group.rule}`}>
                    <Text style={styles.weakBadgeLabel}>In your Weakness Queue</Text>
                  </View>
                ) : null}
              </View>
              {group.ruleExplanation ? (
                <Text
                  style={styles.ruleTeaching}
                  testID={`review-rule-teaching-${group.rule}`}
                >
                  {group.ruleExplanation}
                </Text>
              ) : null}
              {group.ruleExample ? (
                <Text
                  style={styles.ruleExample}
                  testID={`review-rule-example-${group.rule}`}
                >
                  {group.ruleExample}
                </Text>
              ) : null}

              {group.missedQuestions.map(missed => (
                <View
                  key={missed.question.id}
                  style={styles.entry}
                  testID={`review-question-${missed.question.id}`}
                >
                  <Text
                    style={styles.prompt}
                    testID={`review-prompt-${missed.question.id}`}
                  >
                    {missed.question.prompt}
                  </Text>
                  <Text
                    style={styles.answerRow}
                    testID={`review-chosen-${missed.question.id}`}
                  >
                    Your answer: {missed.chosenAnswer}
                  </Text>
                  <Text
                    style={styles.answerRow}
                    testID={`review-correct-${missed.question.id}`}
                  >
                    Correct answer: {missed.correctAnswer}
                  </Text>
                  <Text
                    style={styles.missCount}
                    testID={`review-miss-count-${missed.question.id}`}
                  >
                    Missed {missed.count} time{missed.count === 1 ? '' : 's'}
                  </Text>
                  <View style={styles.why}>
                    <Text
                      style={styles.whyWrong}
                      testID={`review-why-wrong-${missed.question.id}`}
                    >
                      {missed.wrongExplanation}
                    </Text>
                    <Text
                      style={styles.whyRight}
                      testID={`review-why-right-${missed.question.id}`}
                    >
                      {missed.correctExplanation}
                    </Text>
                  </View>
                  {onReport ? <ReportButton onPress={() => onReport(missed.question.id)} /> : null}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {onBack ? (
        <Pressable
          testID="review-back"
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
    empty: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
      borderRadius: tokens.radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    emptyBody: {
      fontSize: tokens.typography.body,
      lineHeight: 20,
      color: colors.textMuted,
      textAlign: 'center',
    },
    group: {
      marginBottom: 20,
      borderRadius: tokens.radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: tokens.spacing.lg,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    ruleTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginRight: tokens.spacing.sm,
    },
    weakBadge: {
      backgroundColor: colors.warningBadge,
      borderRadius: tokens.radii.sm,
      paddingVertical: 3,
      paddingHorizontal: tokens.spacing.sm,
    },
    weakBadgeLabel: {
      fontSize: tokens.typography.caption,
      fontWeight: '600',
      color: colors.warningBadgeText,
    },
    ruleTeaching: {
      fontSize: tokens.typography.body,
      lineHeight: 20,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    ruleExample: {
      fontSize: tokens.typography.small,
      fontStyle: 'italic',
      lineHeight: 19,
      color: colors.textMuted,
      marginBottom: tokens.spacing.md,
    },
    entry: {
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      paddingTop: tokens.spacing.md,
      marginTop: tokens.spacing.md,
    },
    prompt: {
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 21,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    answerRow: {
      fontSize: tokens.typography.body,
      lineHeight: 20,
      color: colors.textTertiary,
    },
    missCount: {
      fontSize: tokens.typography.small,
      fontWeight: '600',
      color: colors.warningText,
      marginTop: 4,
      marginBottom: 6,
    },
    why: {
      marginTop: 6,
    },
    whyWrong: {
      fontSize: tokens.typography.small,
      lineHeight: 19,
      color: colors.dangerText,
      marginBottom: 4,
    },
    whyRight: {
      fontSize: tokens.typography.small,
      lineHeight: 19,
      color: colors.successPressed,
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
      fontSize: 15,
    },
  });
