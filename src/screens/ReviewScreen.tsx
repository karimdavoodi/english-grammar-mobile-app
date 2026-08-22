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
 */

import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Track } from '../content/types';
import { reviewGroups } from '../state/selectors';
import type { WeaknessEntry, WrongAnswerEntry } from '../state/types';

export interface ReviewScreenProps {
  /** The bundled tracks — wrong-answer ids resolve back into this content. */
  tracks: Track[];
  /** Wrong-answer history keyed by question id (persisted, monotonic counts). */
  wrongAnswers: Record<string, WrongAnswerEntry>;
  /** The active Weakness Queue keyed by rule tag — flags rules still being studied. */
  weaknessQueue: Record<string, WeaknessEntry>;
  /** Called when the player taps Back (the navigator routes it). */
  onBack?: () => void;
}

export function ReviewScreen({
  tracks,
  wrongAnswers,
  weaknessQueue,
  onBack,
}: ReviewScreenProps) {
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1e40af',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
    textAlign: 'center',
  },
  group: {
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 16,
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
    color: '#111827',
    marginRight: 8,
  },
  weakBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  weakBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  ruleTeaching: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 2,
  },
  ruleExample: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    color: '#6b7280',
    marginBottom: 12,
  },
  entry: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginTop: 12,
  },
  prompt: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    color: '#111827',
    marginBottom: 6,
  },
  answerRow: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  missCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b45309',
    marginTop: 4,
    marginBottom: 6,
  },
  why: {
    marginTop: 6,
  },
  whyWrong: {
    fontSize: 13,
    lineHeight: 19,
    color: '#b91c1c',
    marginBottom: 4,
  },
  whyRight: {
    fontSize: 13,
    lineHeight: 19,
    color: '#15803d',
  },
  back: {
    margin: 16,
    alignSelf: 'stretch',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backPressed: {
    backgroundColor: '#1d4ed8',
  },
  backLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
