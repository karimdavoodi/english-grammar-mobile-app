import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { FillBlankQuestion } from '../content/types';
import { normalizeText, type AnswerResponse } from '../game/scoring';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { ReportButton } from './ReportButton';
import { TypedFeedback } from './TypedFeedback';

export function FillBlankCard({
  question,
  response,
  revealed,
  onAnswer,
  onReport,
}: {
  question: FillBlankQuestion;
  response: AnswerResponse | null;
  revealed: boolean;
  onAnswer: (response: AnswerResponse) => void;
  onReport?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const [text, setText] = useState('');
  const submittedText = response?.type === 'text' ? response.text : '';
  const mistake = question.commonMistakes?.find(
    item => normalizeText(item.mistake) === normalizeText(submittedText),
  );

  return (
    <View style={styles.card} testID="fill-blank-card">
      <Text style={styles.prompt} accessibilityRole="header" testID="question-prompt">
        {question.prompt}
      </Text>
      <TextInput
        testID="fill-blank-input"
        accessibilityLabel={`Answer for: ${question.prompt}`}
        value={revealed ? submittedText : text}
        onChangeText={setText}
        editable={!revealed}
        autoCapitalize="none"
        returnKeyType="done"
        style={styles.input}
      />
      <Pressable
        testID="fill-blank-submit"
        accessibilityRole="button"
        accessibilityLabel="Submit answer"
        accessibilityState={{ disabled: revealed || normalizeText(text).length === 0 }}
        disabled={revealed || normalizeText(text).length === 0}
        onPress={() => onAnswer({ type: 'text', text: normalizeText(text) })}
        style={styles.submit}
      >
        <Text style={styles.submitLabel}>Check answer</Text>
      </Pressable>
      {revealed ? (
        <>
          <TypedFeedback
            correctAnswer={question.correctAnswer}
            explanation={question.explanation}
            commonMistakeFeedback={mistake?.feedback}
          />
          {onReport ? <ReportButton onPress={onReport} /> : null}
        </>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { padding: 16 },
    prompt: { color: colors.textPrimary, fontSize: 18, lineHeight: 26, fontWeight: '600', marginBottom: 16 },
    input: { borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: 10, color: colors.textPrimary, padding: 12, fontSize: 16 },
    submit: { alignSelf: 'flex-start', marginTop: 12, borderRadius: 8, backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16 },
    submitLabel: { color: colors.textOnAccent, fontWeight: '700' },
  });
