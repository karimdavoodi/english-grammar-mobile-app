import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import type { ContentReport } from '../state/reports';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';

export interface ReportScreenProps {
  reports: ContentReport[];
  onUpdate: (id: string, note: string) => Promise<void>;
  onExport: () => Promise<void>;
}

export function ReportScreen({ reports, onUpdate, onExport }: ReportScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const [notes, setNotes] = useState<Record<string, string>>({});
  useEffect(() => {
    setNotes(Object.fromEntries(reports.map(report => [report.id, report.note])));
  }, [reports]);
  const saveNote = useCallback(
    async (report: ContentReport) => {
      const note = notes[report.id] ?? '';
      if (note !== report.note) await onUpdate(report.id, note);
    },
    [notes, onUpdate],
  );

  return (
    <ScreenShell testID="report-screen">
      <View style={styles.header}>
        <Text style={styles.heading} accessibilityRole="header">Report a problem</Text>
        <Text style={styles.subheading}>Help us improve questions that look incorrect or unclear.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {reports.length === 0 ? (
          <Text style={styles.empty} testID="reports-empty">No pending reports.</Text>
        ) : (
          reports.map(report => (
            <View key={report.id} style={styles.report} testID={`report-${report.questionId}`}>
              <Text style={styles.question}>Question: {report.questionId}</Text>
              <TextInput
                testID={`report-note-${report.questionId}`}
                accessibilityLabel={`Note for ${report.questionId}`}
                value={notes[report.id] ?? report.note}
                onChangeText={note => setNotes(current => ({ ...current, [report.id]: note }))}
                onBlur={() => saveNote(report)}
                placeholder="Optional note"
                placeholderTextColor={colorsPlaceholder}
                multiline
                style={styles.input}
              />
            </View>
          ))
        )}
      </ScrollView>
      {reports.length > 0 ? (
        <Pressable testID="export-reports" accessibilityRole="button" onPress={onExport} style={styles.export}>
          <Text style={styles.exportLabel}>Send reports</Text>
        </Pressable>
      ) : null}
    </ScreenShell>
  );
}

const colorsPlaceholder = '#68727d';
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  header: { padding: 20, backgroundColor: colors.primaryContainer },
  heading: { color: colors.primaryOnContainer, fontSize: 24, fontWeight: '700' },
  subheading: { color: colors.primaryOnContainerMuted, marginTop: 6, lineHeight: 20 },
  content: { padding: 20, flexGrow: 1 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  report: { padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface },
  question: { color: colors.textPrimary, fontWeight: '600', marginBottom: 8 },
  input: { minHeight: 64, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 6, padding: 8, color: colors.textPrimary, textAlignVertical: 'top' },
  export: { marginHorizontal: 20, padding: 13, alignItems: 'center', borderRadius: 8, backgroundColor: colors.primary },
  exportLabel: { color: colors.textOnAccent, fontWeight: '700' },
});
