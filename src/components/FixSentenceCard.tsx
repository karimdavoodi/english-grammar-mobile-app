import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FixSentenceQuestion } from '../content/types';
import type { AnswerResponse } from '../game/scoring';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { ChoiceButton, type ChoiceStatus } from './ChoiceButton';
import { ReportButton } from './ReportButton';

export function FixSentenceCard({
  question,
  response,
  revealed,
  onAnswer,
  onReport,
}: {
  question: FixSentenceQuestion;
  response: AnswerResponse | null;
  revealed: boolean;
  onAnswer: (response: AnswerResponse) => void;
  onReport?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const selectedIndex = response?.type === 'index' ? response.index : null;
  const statusFor = (index: number): ChoiceStatus => {
    if (!revealed) return index === selectedIndex ? 'selected' : 'idle';
    if (index === question.correctIndex) return 'correct';
    if (index === selectedIndex) return 'wrong';
    return 'dimmed';
  };
  return (
    <View style={styles.card} testID="fix-sentence-card">
      <Text style={styles.prompt} accessibilityRole="header" testID="question-prompt">Choose the correction.</Text>
      <Text style={styles.faulty} testID="faulty-sentence">{question.faultySentence}</Text>
      <View testID="question-choices">
        {question.choices.map((choice, index) => (
          <ChoiceButton
            key={index}
            choice={choice}
            index={index}
            revealed={revealed}
            status={statusFor(index)}
            onPress={choiceIndex => onAnswer({ type: 'index', index: choiceIndex })}
            explanation={question.choiceExplanations[index]}
          />
        ))}
      </View>
      {revealed && onReport ? <ReportButton onPress={onReport} /> : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { padding: 16 },
    prompt: { color: colors.textPrimary, fontSize: 18, lineHeight: 26, fontWeight: '600', marginBottom: 10 },
    faulty: { color: colors.dangerText, fontSize: 16, lineHeight: 24, marginBottom: 16 },
  });
