/**
 * HomeScreen — the main screen (replaces the flat LevelMap as the hub, Issue 9).
 *
 * Per docs/ui-plan.md Task 4 (Issues 2, 7, 8, 9):
 *   - Settings entry (top-right);
 *   - progress summary ("Basic: 3/30 · …") from the pure `completedByTrack`
 *     selector, or an encouraging "Pick a level to begin" for a first-time
 *     player (progress null);
 *   - Resume button — only with progress; routing is the caller's job via
 *     `resumableLevelId` (mastery/mixed → Mixed Review, level → LevelPlay);
 *   - Wrong answers (Review), Review / Practice (MixedReview), and Stats
 *     buttons — the study shortcuts that moved off Settings (Task 3);
 *   - three track cards → `onSelectTrack(trackId)` (the Topics route, Task 5);
 *   - no bottom Back button — back is the system gesture;
 *   - Android hardware back on this screen asks "exit the app?" (Issue 7).
 *
 * Presentational: no navigation, storage, or reducer imports — it takes content
 * + progress + callbacks as props, so it tests with fixture data like the other
 * presentational screens. The exit-confirm dialog is the only native side
 * effect, and it is Android-only.
 */

import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Track } from '../content/types';
import { completedByTrack } from '../state/selectors';
import type { Progress } from '../state/types';
import { ScreenShell } from '../components/ScreenShell';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { tokens } from '../theme/tokens';

export interface HomeScreenProps {
  /** The bundled tracks — rendered as one track card per track (by track.order). */
  tracks: Track[];
  /** The progress slice, or null for a first-time player (nothing to resume/review). */
  progress: Progress | null;
  /** Called when the Settings entry is tapped. */
  onOpenSettings?: () => void;
  /** Called when Resume is tapped (rendered only with progress). */
  onResume?: () => void;
  /** Called when the Wrong answers button is tapped (rendered only with progress). */
  onOpenReview?: () => void;
  /** Called when the Review / Practice button is tapped. */
  onOpenMixedReview?: () => void;
  /** Called when the Stats button is tapped. */
  onOpenStats?: () => void;
  /** Called when a track card is tapped — opens that track's Topics screen. */
  onSelectTrack: (trackId: string) => void;
}

export function HomeScreen({
  tracks,
  progress,
  onOpenSettings,
  onResume,
  onOpenReview,
  onOpenMixedReview,
  onOpenStats,
  onSelectTrack,
}: HomeScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const summaries = useMemo(
    () => (progress ? completedByTrack(tracks, progress) : []),
    [tracks, progress],
  );
  const orderedTracks = useMemo(
    () => [...tracks].sort((a, b) => a.order - b.order),
    [tracks],
  );

  // Android hardware back on the root screen asks before exiting (Issue 7).
  // The native-stack navigator's back handler for any screen pushed on top is
  // registered later and therefore runs first, so this handler only fires when
  // Home is the top screen.
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Exit app?',
        'Do you want to leave the game?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ],
      );
      return true;
    });
    return () => subscription.remove();
  }, []);

  const progressSummary = progress
    ? summaries.map(s => `${s.trackName}: ${s.completedLevels}/${s.totalLevels}`).join(' · ')
    : 'Pick a level to begin';

  return (
    <ScreenShell testID="home-screen">
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.heading} accessibilityRole="header" testID="home-heading">
            Home
          </Text>
          {onOpenSettings ? (
            <Pressable
              testID="home-settings"
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={onOpenSettings}
              style={({ pressed }) => [styles.settings, pressed && styles.settingsPressed]}
            >
              <Text style={styles.settingsLabel}>Settings</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.progressSummary} testID="home-progress-summary">
          {progressSummary}
        </Text>
        {progress ? (
          <Text style={styles.streakSummary} testID="home-streak-summary">
            Daily streak: {progress.dailyStreak ?? 0} · Best: {progress.bestStreak ?? 0}
          </Text>
        ) : null}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {progress && onResume ? (
          <Pressable
            testID="home-resume"
            accessibilityRole="button"
            accessibilityLabel="Resume"
            onPress={onResume}
            style={({ pressed }) => [styles.resume, pressed && styles.resumePressed]}
          >
            <Text style={styles.resumeLabel}>Resume</Text>
          </Pressable>
        ) : null}

        {progress && onOpenReview ? (
          <Pressable
            testID="home-review"
            accessibilityRole="button"
            accessibilityLabel="Review mistakes"
            onPress={onOpenReview}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionLabel}>Review mistakes</Text>
          </Pressable>
        ) : null}

        {onOpenMixedReview ? (
          <Pressable
            testID="home-mixed-review"
            accessibilityRole="button"
            accessibilityLabel="Review and practice"
            onPress={onOpenMixedReview}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionLabel}>Review / Practice</Text>
          </Pressable>
        ) : null}

        {onOpenStats ? (
          <Pressable
            testID="home-stats"
            accessibilityRole="button"
            accessibilityLabel="Stats"
            onPress={onOpenStats}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionLabel}>Stats</Text>
          </Pressable>
        ) : null}

        <Text style={styles.sectionLabel} accessibilityRole="header" testID="home-tracks-label">
          Tracks
        </Text>
        {orderedTracks.map(track => (
          <Pressable
            key={track.id}
            testID={`home-track-${track.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${track.name}, ${track.label}`}
            onPress={() => onSelectTrack(track.id)}
            style={({ pressed }) => [styles.trackCard, pressed && styles.trackCardPressed]}
          >
            <View style={styles.trackInfo}>
              <Text style={styles.trackName} testID={`home-track-name-${track.id}`}>
                {track.name}
              </Text>
              <Text style={styles.trackLabel} testID={`home-track-label-${track.id}`}>
                {track.label}
              </Text>
            </View>
            <Text style={styles.trackChevron} accessibilityElementsHidden>
              ›
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      padding: tokens.spacing.lg,
      backgroundColor: colors.primaryContainer,
      borderBottomWidth: 1,
      borderBottomColor: colors.primaryBorder,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    heading: {
      fontSize: tokens.typography.heading,
      fontWeight: '700',
      color: colors.primaryOnContainer,
    },
    settings: {
      backgroundColor: colors.primary,
      borderRadius: tokens.radii.md,
      paddingVertical: tokens.spacing.xs + 2,
      paddingHorizontal: tokens.spacing.md,
    },
    settingsPressed: {
      backgroundColor: colors.primaryPressed,
    },
    settingsLabel: {
      color: colors.textOnAccent,
      fontWeight: '600',
      fontSize: tokens.typography.body,
    },
    progressSummary: {
      marginTop: tokens.spacing.sm,
      fontSize: tokens.typography.body,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.primaryOnContainer,
    },
    streakSummary: {
      marginTop: tokens.spacing.xs,
      fontSize: tokens.typography.body,
      color: colors.primaryOnContainerMuted,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: tokens.spacing.lg,
    },
    resume: {
      alignSelf: 'stretch',
      backgroundColor: colors.primary,
      borderRadius: tokens.radii.md,
      paddingVertical: tokens.spacing.md,
      alignItems: 'center',
      marginBottom: tokens.spacing.md,
    },
    resumePressed: {
      backgroundColor: colors.primaryPressed,
    },
    resumeLabel: {
      color: colors.textOnAccent,
      fontWeight: '700',
      fontSize: tokens.typography.bodyLarge,
    },
    action: {
      backgroundColor: colors.surface,
      borderRadius: tokens.radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.lg,
      marginBottom: tokens.spacing.sm,
    },
    actionPressed: {
      backgroundColor: colors.surfacePressed,
    },
    actionLabel: {
      fontSize: tokens.typography.bodyLarge,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    sectionLabel: {
      fontSize: tokens.typography.caption,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: colors.textMuted,
      marginBottom: tokens.spacing.sm,
      marginTop: tokens.spacing.md,
    },
    trackCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: tokens.radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.lg,
      marginBottom: tokens.spacing.sm,
    },
    trackCardPressed: {
      backgroundColor: colors.surfacePressed,
    },
    trackInfo: {
      flex: 1,
      marginRight: tokens.spacing.sm,
    },
    trackName: {
      fontSize: tokens.typography.bodyLarge,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    trackLabel: {
      fontSize: tokens.typography.small,
      color: colors.textMuted,
      marginTop: 1,
    },
    trackChevron: {
      fontSize: tokens.typography.title,
      color: colors.textMuted,
    },
  });
