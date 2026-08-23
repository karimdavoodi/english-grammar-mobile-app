import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import type { StatsSummary } from '../state/events';

export interface StatsScreenProps {
  stats: StatsSummary;
  onOpenReview: () => void;
}

export function StatsScreen({ stats, onOpenReview }: StatsScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const minutes = Math.floor(stats.timePlayedSeconds / 60);
  return (
    <ScreenShell testID="stats-screen">
      <View style={styles.body}>
        <Text style={styles.heading} accessibilityRole="header" testID="stats-heading">
          Your stats
        </Text>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summary}>
            <Text style={styles.metric} testID="stats-total">Answers: {stats.totalAnswers}</Text>
            <Text style={styles.metric} testID="stats-accuracy">Accuracy: {Math.round(stats.accuracy * 100)}%</Text>
            <Text style={styles.metric} testID="stats-time">Time played: {minutes} min</Text>
            <Text style={styles.metric} testID="stats-days">Practice days: {stats.practiceDates.length}</Text>
          </View>
          <Text style={styles.section} accessibilityRole="header">Accuracy by rule</Text>
          {Object.entries(stats.accuracyByRule).map(([rule, value]) => (
            <Text style={styles.row} key={rule} testID={`stats-rule-${rule}`}>
              {rule}: {value.correct}/{value.total} ({Math.round(value.accuracy * 100)}%)
            </Text>
          ))}
          <Pressable testID="stats-review" accessibilityRole="button" onPress={onOpenReview} style={styles.button}>
            <Text style={styles.buttonLabel}>Review mistakes</Text>
          </Pressable>
        </ScrollView>
      </View>
    </ScreenShell>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  body: { flex: 1, padding: 16 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  content: { paddingBottom: 16 },
  summary: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 16 },
  metric: { color: colors.textPrimary, fontSize: 16, marginBottom: 6 },
  section: { color: colors.textMuted, fontWeight: '700', marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
  row: { color: colors.textPrimary, paddingVertical: 6 },
  button: { backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  buttonLabel: { color: colors.textOnAccent, fontWeight: '700' },
});
