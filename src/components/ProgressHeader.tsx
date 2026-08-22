/**
 * ProgressHeader — the level-play status strip: streak, total correct, and the
 * answered count over the mercy cap.
 *
 * Pure presentational: receives the session counters and renders them for the
 * LevelPlayScreen. The streak is the 3-in-a-row pass progress, correctCount the
 * 8-total pass progress, and answeredCount/mercyCap the cap progress.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface ProgressHeaderProps {
  /** Current consecutive-correct streak. */
  streak: number;
  /** Total correct answers this session. */
  correctCount: number;
  /** Total answers submitted this session. */
  answeredCount: number;
  /** Mercy cap — the max answered count before an unfinished level ends. */
  mercyCap: number;
}

export function ProgressHeader({
  streak,
  correctCount,
  answeredCount,
  mercyCap,
}: ProgressHeaderProps) {
  return (
    <View
      testID="progress-header"
      accessibilityRole="summary"
      accessibilityLabel={`Streak ${streak}, correct ${correctCount}, answered ${answeredCount} of ${mercyCap}`}
      style={styles.header}
    >
      <Text style={styles.stat} testID="progress-streak">
        Streak: {streak}
      </Text>
      <Text style={styles.stat} testID="progress-correct">
        Correct: {correctCount}
      </Text>
      <Text style={styles.stat} testID="progress-answered">
        Answered: {answeredCount}/{mercyCap}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  stat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
