/**
 * ResultScreen — the pass / mercy-end result shown when a level ends.
 *
 * Detects the machine outcome and explains it per the Gherkin "pass screen"
 * scenario:
 *   - passed by streak   → "Streak!" (3 correct in a row)
 *   - passed by volume   → "Mastery reached" (enough total correct)
 *   - mercy-ended        → the level ends at the answer cap, stays unlocked
 *
 * The frontier advance and `completedLevelIds` are handled by the caller's
 * reducer (`completeLevel`); this screen only reports the outcome and offers to
 * jump to the next level — or to the completion/map state when the track has no
 * next level. Presentational: no navigation, storage, or reducer imports, so it
 * tests with fixture data like the Task 7A components.
 *
 * Task 12: all colors come from the theme palette (the success family).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Level } from '../content/types';
import { ScreenShell } from '../components/ScreenShell';
import type { AnswerOutcome } from '../game/levelMachine';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';

export interface ResultScreenProps {
  /** The level that just ended (pass or mercy). */
  level: Level;
  /** The machine outcome that ended it — its reason drives the message. */
  outcome: AnswerOutcome;
  /** The next level to continue to, or null in the completion state. */
  nextLevel: Level | null;
  /** Called when the player taps Jump to next level / Go to map. */
  onContinue: () => void;
  /** Continue the just-ended topic instead of advancing (optional alt to Jump). */
  onKeepPracticing?: () => void;
}

export function ResultScreen({
  level,
  outcome,
  nextLevel,
  onContinue,
  onKeepPracticing,
}: ResultScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const { passed, passReason, endedByMercy, correctCount, streak, totalAnswered } = outcome;

  let heading: string;
  let explanation: string;
  if (passed && passReason === 'streak') {
    heading = 'Streak!';
    explanation = 'You passed this level with three correct answers in a row.';
  } else if (passed && passReason === 'volume') {
    heading = 'Mastery reached';
    explanation = 'You reached the correct-answer target for this level.';
  } else if (endedByMercy) {
    heading = 'Level complete';
    explanation =
      `You answered ${totalAnswered} questions without meeting the pass target. ` +
      'This level stays unlocked — review the lesson and try again anytime.';
  } else {
    // Defensive: an outcome that is neither passed nor mercy-ended should not
    // reach here; treat it as a neutral completion.
    heading = 'Level complete';
    explanation = 'This level is done. Continue when you are ready.';
  }

  const jumpLabel = nextLevel ? `Jump to ${nextLevel.title}` : 'Go to map';

  return (
    <ScreenShell testID="result-screen">
      <View style={styles.content}>
        <View style={styles.card} accessibilityRole="summary">
          <Text style={styles.heading} accessibilityRole="header" testID="result-heading">
            {heading}
          </Text>
          <Text style={styles.levelTitle} testID="result-level-title">
            {level.title}
          </Text>
          <Text style={styles.explanation} testID="result-explanation">
            {explanation}
          </Text>
          <Text style={styles.summary} testID="result-summary">
            Correct: {correctCount} · Streak: {streak} · Answered: {totalAnswered}
          </Text>
        </View>

        <Pressable
          testID="result-continue"
          accessibilityRole="button"
          accessibilityLabel={jumpLabel}
          onPress={onContinue}
          style={({ pressed }) => [styles.continue, pressed && styles.continuePressed]}
        >
          <Text style={styles.jumpLabel}>{jumpLabel}</Text>
        </Pressable>

        {onKeepPracticing && passed && nextLevel ? (
          <Pressable
            testID="result-keep-practicing"
            accessibilityRole="button"
            accessibilityLabel="Keep practicing"
            onPress={onKeepPracticing}
            style={({ pressed }) => [
              styles.keepPracticing,
              pressed && styles.keepPracticingPressed,
            ]}
          >
            <Text style={styles.keepPracticingLabel}>Keep practicing</Text>
          </Pressable>
        ) : null}
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
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.successBorder,
      padding: 24,
      marginBottom: 24,
    },
    heading: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.successOnContainerStrong,
      marginBottom: 4,
    },
    levelTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.successOnContainer,
      marginBottom: 12,
    },
    explanation: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.successOnContainerStrong,
      marginBottom: 12,
    },
    summary: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.success,
    },
    continue: {
      alignSelf: 'stretch',
      backgroundColor: colors.success,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
    },
    continuePressed: {
      backgroundColor: colors.successPressed,
    },
    jumpLabel: {
      color: colors.textOnAccent,
      fontWeight: '600',
      fontSize: 16,
    },
    keepPracticing: {
      alignSelf: 'stretch',
      marginTop: 10,
      borderColor: colors.successBorder,
      borderRadius: 8,
      borderWidth: 1,
      paddingVertical: 13,
      alignItems: 'center',
    },
    keepPracticingPressed: {
      backgroundColor: colors.successContainer,
    },
    keepPracticingLabel: {
      color: colors.successOnContainerStrong,
      fontWeight: '600',
      fontSize: 16,
    },
  });
