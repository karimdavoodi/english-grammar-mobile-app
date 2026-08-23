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
import { normalizeQuestion, type QuestionInput } from '../content/types';
import type { AnswerResponse } from '../game/scoring';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { ChoiceButton, type ChoiceStatus } from './ChoiceButton';
import { ReportButton } from './ReportButton';
import { FillBlankCard } from './FillBlankCard';
import { FixSentenceCard } from './FixSentenceCard';
import { WordOrderCard } from './WordOrderCard';

export interface QuestionCardProps {
  /** The question being served. */
  question: QuestionInput;
  /** The user's chosen index — null until an answer is submitted. */
  selectedIndex: number | null;
  /** True once the answer is submitted and feedback is being shown. */
  revealed: boolean;
  /** Called with the response for the question type (never once revealed). */
  onAnswer: (response: AnswerResponse) => void;
  /** The submitted typed response, when applicable. */
  selectedResponse?: AnswerResponse | null;
  /** Injectable serving randomness for deterministic word-order shuffles. */
  random?: () => number;
  onReport?: () => void;
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
  onReport,
  selectedResponse = null,
  random,
}: QuestionCardProps) {
  const styles = useThemedStyles(makeStyles);
  const normalized = normalizeQuestion(question);
  const response: AnswerResponse | null =
    selectedResponse ?? (selectedIndex === null ? null : { type: 'index', index: selectedIndex });

  if (normalized.type === 'fill_blank') {
    return <FillBlankCard question={normalized} response={response} revealed={revealed} onAnswer={onAnswer} onReport={onReport} />;
  }
  if (normalized.type === 'word_order') {
    return <WordOrderCard question={normalized} revealed={revealed} random={random} onAnswer={onAnswer} onReport={onReport} />;
  }
  if (normalized.type === 'fix_sentence') {
    return <FixSentenceCard question={normalized} response={response} revealed={revealed} onAnswer={onAnswer} onReport={onReport} />;
  }

  const selectedChoice = response?.type === 'index' ? response.index : selectedIndex;
  return (
    <View style={styles.card} testID="question-card">
      <Text style={styles.prompt} accessibilityRole="header" testID="question-prompt">
        {question.prompt}
      </Text>
      <View style={styles.choices} testID="question-choices">
        {normalized.choices.map((choice, index) => (
          <ChoiceButton
            key={index}
            index={index}
            choice={choice}
            revealed={revealed}
            status={statusFor(index, selectedChoice, normalized.correctIndex, revealed)}
            onPress={choiceIndex => onAnswer({ type: 'index', index: choiceIndex })}
            explanation={normalized.choiceExplanations[index]}
          />
        ))}
      </View>
      {revealed && onReport ? <ReportButton onPress={onReport} /> : null}
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
