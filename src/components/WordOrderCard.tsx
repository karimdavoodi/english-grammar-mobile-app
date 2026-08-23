import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WordOrderQuestion } from '../content/types';
import type { AnswerResponse } from '../game/scoring';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { ReportButton } from './ReportButton';
import { TypedFeedback } from './TypedFeedback';

function shuffledIndexes(length: number, random: () => number): number[] {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [indexes[index], indexes[swap]] = [indexes[swap], indexes[index]];
  }
  return indexes;
}

export function WordOrderCard({
  question,
  revealed,
  random = Math.random,
  onAnswer,
  onReport,
}: {
  question: WordOrderQuestion;
  revealed: boolean;
  random?: () => number;
  onAnswer: (response: AnswerResponse) => void;
  onReport?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const [available, setAvailable] = useState(() => shuffledIndexes(question.sentenceWords.length, random));
  const [selected, setSelected] = useState<number[]>([]);

  const wordCount = question.sentenceWords.length;
  useEffect(() => {
    setAvailable(shuffledIndexes(wordCount, random));
    setSelected([]);
  }, [question.id, random, wordCount]);

  const choose = (index: number) => {
    if (revealed || !available.includes(index)) return;
    setAvailable(current => current.filter(item => item !== index));
    setSelected(current => [...current, index]);
  };

  return (
    <View style={styles.card} testID="word-order-card">
      <Text style={styles.prompt} accessibilityRole="header" testID="question-prompt">
        {question.prompt ?? 'Arrange the words in the correct order.'}
      </Text>
      <View style={styles.builder} testID="word-order-builder">
        {selected.map(index => <Text key={index} style={styles.builderWord}>{question.sentenceWords[index]}</Text>)}
      </View>
      <View style={styles.words}>
        {available.map(index => (
          <Pressable
            key={index}
            testID={`word-order-word-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`Word: ${question.sentenceWords[index]}`}
            accessibilityState={{ disabled: revealed }}
            disabled={revealed}
            onPress={() => choose(index)}
            style={styles.word}
          >
            <Text style={styles.wordLabel}>{question.sentenceWords[index]}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        testID="word-order-submit"
        accessibilityRole="button"
        accessibilityLabel="Submit word order"
        accessibilityState={{ disabled: revealed || selected.length !== question.sentenceWords.length }}
        disabled={revealed || selected.length !== question.sentenceWords.length}
        onPress={() => onAnswer({ type: 'sequence', indexes: selected })}
        style={styles.submit}
      >
        <Text style={styles.submitLabel}>Check order</Text>
      </Pressable>
      {revealed ? (
        <>
          <TypedFeedback
            correctAnswer={question.sentenceWords.join(' ')}
            explanation={question.explanation}
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
    builder: { minHeight: 48, flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderWidth: 1, borderColor: colors.primaryBorder, borderRadius: 10, padding: 10, backgroundColor: colors.primaryContainer },
    builderWord: { color: colors.primaryOnContainer, fontSize: 16, fontWeight: '700' },
    words: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    word: { borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: 8, backgroundColor: colors.surface, paddingVertical: 10, paddingHorizontal: 12 },
    wordLabel: { color: colors.textPrimary, fontSize: 16 },
    submit: { alignSelf: 'flex-start', marginTop: 16, borderRadius: 8, backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16 },
    submitLabel: { color: colors.textOnAccent, fontWeight: '700' },
  });
