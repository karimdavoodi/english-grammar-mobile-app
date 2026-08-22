/**
 * ChoiceButton — a single multiple-choice answer.
 *
 * Presentational only: it renders one choice, reports presses, and reflects the
 * feedback state the parent assigns via `status`. Once `revealed`, the button is
 * locked (disabled) so the answer cannot change until feedback is dismissed, and
 * it shows the positionally-aligned per-choice "why" explanation.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

/**
 * Visual/announcement state of one choice:
 *  - 'idle'     before the answer is submitted;
 *  - 'selected' the user's tapped choice before submission is confirmed;
 *  - 'correct'  the right answer, revealed after submission;
 *  - 'wrong'    the user's chosen answer when it was not the right one;
 *  - 'dimmed'   every other (not chosen) choice after submission.
 */
export type ChoiceStatus = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

export interface ChoiceButtonProps {
  /** The choice text, e.g. 'had left'. */
  choice: string;
  /** 0-based position (0–3) — drives the A/B/C/D letter and the onPress payload. */
  index: number;
  /** True once the answer is submitted and feedback is shown — locks the button. */
  revealed: boolean;
  /** Which visual/announcement state this choice is in. */
  status: ChoiceStatus;
  /** Called with the 0-based index on press (ignored once revealed). */
  onPress: (index: number) => void;
  /** Positionally-aligned per-choice explanation, shown once revealed. */
  explanation?: string;
}

const STATUS_STYLE: Record<ChoiceStatus, ViewStyle> = {
  idle: {},
  selected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  correct: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  wrong: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  dimmed: { opacity: 0.5 },
};

const STATUS_LABEL: Record<ChoiceStatus, string> = {
  idle: '',
  selected: '',
  correct: ' — correct',
  wrong: ' — your answer, incorrect',
  dimmed: ' — not chosen',
};

export function ChoiceButton({
  choice,
  index,
  revealed,
  status,
  onPress,
  explanation,
}: ChoiceButtonProps) {
  const handlePress = () => {
    if (!revealed) {
      onPress(index);
    }
  };

  return (
    <View style={styles.container} testID={`choice-${index}`}>
      <Pressable
        testID={`choice-button-${index}`}
        accessibilityRole="button"
        accessibilityLabel={`Option ${index + 1}: ${choice}${
          revealed ? STATUS_LABEL[status] : ''
        }`}
        accessibilityState={{ disabled: revealed }}
        disabled={revealed}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          STATUS_STYLE[status],
          pressed && !revealed && styles.pressed,
        ]}
      >
        <Text style={styles.letter} testID={`choice-letter-${index}`}>
          {String.fromCharCode(65 + index)}
        </Text>
        <Text style={styles.choice} testID={`choice-text-${index}`}>
          {choice}
        </Text>
      </Pressable>
      {revealed && explanation ? (
        <Text
          testID={`choice-explanation-${index}`}
          accessibilityLiveRegion="polite"
          style={[styles.explanation, status === 'correct' && styles.explanationCorrect]}
        >
          {explanation}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  pressed: {
    backgroundColor: '#f3f4f6',
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 10,
    fontWeight: '700',
  },
  choice: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  explanation: {
    marginTop: 6,
    paddingHorizontal: 14,
    fontSize: 13,
    lineHeight: 18,
    color: '#4b5563',
  },
  explanationCorrect: {
    color: '#166534',
    fontWeight: '600',
  },
});
