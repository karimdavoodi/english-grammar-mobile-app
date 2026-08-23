import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';

export function TypedFeedback({
  correctAnswer,
  explanation,
  commonMistakeFeedback,
}: {
  correctAnswer: string;
  explanation: string;
  commonMistakeFeedback?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Text style={styles.answer} testID="typed-correct-answer">
        Correct answer: {correctAnswer}
      </Text>
      <Text style={styles.explanation} testID="typed-explanation">
        {explanation}
      </Text>
      {commonMistakeFeedback ? (
        <Text style={styles.mistake} testID="typed-common-mistake">
          {commonMistakeFeedback}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { marginTop: 12, gap: 6 },
    answer: { color: colors.successOnContainer, fontWeight: '700' },
    explanation: { color: colors.textTertiary, lineHeight: 20 },
    mistake: { color: colors.warningText, lineHeight: 20 },
  });
