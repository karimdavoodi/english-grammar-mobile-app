/**
 * LessonCard — the teach-on-failure card.
 *
 * Shown after a wrong answer (and re-shown before re-testing a rule missed twice,
 * per the re-teach rule in serving.ts). It teaches the level's single topic:
 * the topic summary plus the TopicRule whose `rule` matches the missed question.
 * For a Review question the card labels the rule as a review of an earlier topic
 * so the two contexts are not confused (docs/schema §1).
 *
 * The card is dismissed with the action button — the question appears only after
 * the player continues.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Topic, TopicRule } from '../content/types';

export interface LessonCardProps {
  /** The current level's single topic. */
  topic: Topic;
  /**
   * The TopicRule matching the missed/reviewed question. When null (no match —
   * should not happen with validated content), every topic rule is listed.
   */
  rule: TopicRule | null;
  /** True when the rule is a Review of an earlier topic — labels the context. */
  review?: boolean;
  /** Label for the dismiss/continue action (default 'Continue'). */
  actionLabel?: string;
  /** Dismiss the card and reveal the question. */
  onContinue: () => void;
}

export function LessonCard({
  topic,
  rule,
  review = false,
  actionLabel = 'Continue',
  onContinue,
}: LessonCardProps) {
  const rules = rule ? [rule] : topic.rules;

  return (
    <View
      testID="lesson-card"
      accessibilityRole="summary"
      accessibilityLabel={`Lesson: ${topic.title}`}
      style={styles.card}
    >
      <Text style={styles.kicker} accessibilityRole="header" testID="lesson-heading">
        {review ? 'Review — earlier topic' : 'Lesson'}
      </Text>
      <Text style={styles.title} testID="lesson-topic-title">
        {topic.title}
      </Text>
      <Text style={styles.summary} testID="lesson-summary">
        {topic.summary}
      </Text>

      {rules.map(ruleItem => (
        <View key={ruleItem.rule} style={styles.ruleBlock} testID={`lesson-rule-${ruleItem.rule}`}>
          <Text style={styles.ruleTitle}>{ruleItem.title}</Text>
          <Text style={styles.ruleExplanation}>{ruleItem.explanation}</Text>
          <Text style={styles.ruleExample}>“{ruleItem.example}”</Text>
        </View>
      ))}

      <Pressable
        testID="lesson-continue"
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onContinue}
        style={({ pressed }) => [styles.continue, pressed && styles.continuePressed]}
      >
        <Text style={styles.continueLabel}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 16,
    marginBottom: 16,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9a3412',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#431407',
    marginBottom: 4,
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    color: '#7c2d12',
    marginBottom: 12,
  },
  ruleBlock: {
    marginBottom: 12,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#431407',
    marginBottom: 2,
  },
  ruleExplanation: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7c2d12',
  },
  ruleExample: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    color: '#9a3412',
    marginTop: 4,
  },
  continue: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#ea580c',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  continuePressed: {
    backgroundColor: '#c2410c',
  },
  continueLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
