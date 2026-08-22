/**
 * QuestionCard — a level question: prompt + exactly 4 choices.
 *
 * Presentational and controlled: the screen owns whether an answer has been
 * submitted (`revealed`) and which choice was picked (`selectedIndex`). Once
 * revealed the choices are locked and each one shows its positionally-aligned
 * "why" — the correct answer is highlighted, the wrong chosen answer is marked,
 * and the rest are dimmed. No navigation, storage, or reducer imports.
 *
 * Task 12: the prompt color comes from the theme palette.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Question } from '../content/types';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { ChoiceButton, type ChoiceStatus } from './ChoiceButton';

export interface QuestionCardProps {
  /** The question being served. */
  question: Question;
  /** The user's chosen index — null until an answer is submitted. */
  selectedIndex: number | null;
  /** True once the answer is submitted and feedback is being shown. */
  revealed: boolean;
  /** Called with the 0-based chosen index (never once revealed). */
  onAnswer: (index: number) => void;
}

function statusFor(
  index: number,
  selectedIndex: number | null,
  correctIndex: number,
  revealed: boolean,
): ChoiceStatus {
  if (revealed) {
    if (index === correctIndex) {
      return 'correct';
    }
    if (index === selectedIndex) {
      return 'wrong';
    }
    return 'dimmed';
  }
  return index === selectedIndex ? 'selected' : 'idle';
}

export function QuestionCard({
  question,
  selectedIndex,
  revealed,
  onAnswer,
}: QuestionCardProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.card} testID="question-card">
      <Text style={styles.prompt} accessibilityRole="header" testID="question-prompt">
        {question.prompt}
      </Text>
      <View style={styles.choices} testID="question-choices">
        {question.choices.map((choice, index) => (
          <ChoiceButton
            key={index}
            index={index}
            choice={choice}
            revealed={revealed}
            status={statusFor(index, selectedIndex, question.correctIndex, revealed)}
            onPress={onAnswer}
            explanation={question.choiceExplanations[index]}
          />
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      padding: 16,
    },
    prompt: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    choices: {
      marginTop: 0,
    },
  });
