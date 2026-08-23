/**
 * LevelMapScreen — the progress overview and free-play hub.
 *
 * Per docs/use-cases "Level Map" and docs/schema §2 ("Unlock is derived, never
 * stored"): the map renders the flattened track → level sequence with the
 * derived statuses — the current level highlighted, passed levels with a pass
 * mark, future levels locked, and mercy-ended / skipped-earlier levels unlocked
 * but without a pass mark. A level whose bank contains a queued rule gets a
 * "needs review" indicator.
 *
 * Tapping an unlocked level replays it; replaying never re-locks — unlock stays
 * derived, so the selectors keep passed levels and anything at-or-before the
 * frontier playable regardless of how often they are re-entered.
 *
 * Task 12 adds a Settings entry (the map is the home hub) and consumes the theme
 * palette — no hardcoded colors. Presentational: no navigation, storage, or
 * reducer imports — it takes content + progress as props and resolves the
 * statuses through the pure `levelStatuses` selector, so it tests with fixture
 * data like the other presentational screens. The navigator supplies
 * onSelectLevel (push a fresh LevelPlay), onOpenSettings, and onBack.
 */

import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Track } from '../content/types';
import { levelStatuses, type LevelStatus } from '../state/selectors';
import type { Progress } from '../state/types';
import { ScreenShell } from '../components/ScreenShell';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { tokens } from '../theme/tokens';

export interface LevelMapScreenProps {
  /** The bundled tracks — flattened by order → number for the map. */
  tracks: Track[];
  /** The progress slice — the map's statuses are derived from it (never null on the real route). */
  progress: Progress;
  /** Called when an unlocked level is tapped (replay — never re-locks). */
  onSelectLevel: (levelId: string) => void;
  /** Called when the Settings entry is tapped (Task 12). */
  onOpenSettings?: () => void;
  onOpenMixedReview?: () => void;
  /** Called when the player taps Back. */
  onBack?: () => void;
}

/** One track section on the map: the track header plus its level statuses. */
interface MapSection {
  track: Track;
  statuses: LevelStatus[];
}

/** Human label for a level's map state, used in the accessible label. */
function stateLabel(status: LevelStatus): string {
  if (status.completed) {
    return 'Passed';
  }
  if (status.isCurrent) {
    return 'Current level';
  }
  if (status.unlocked) {
    return 'Unlocked';
  }
  return 'Locked';
}

export function LevelMapScreen({
  tracks,
  progress,
  onSelectLevel,
  onOpenSettings,
  onOpenMixedReview,
  onBack,
}: LevelMapScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const statuses = useMemo(() => levelStatuses(tracks, progress), [tracks, progress]);

  // Group the flattened statuses back under their tracks (track order, then
  // level number — the order `levelStatuses` already emits).
  const sections = useMemo<MapSection[]>(() => {
    const orderedTracks = [...tracks].sort((a, b) => a.order - b.order);
    const sectionList = orderedTracks.map(track => ({ track, statuses: [] as LevelStatus[] }));
    const byTrackId = new Map(sectionList.map(section => [section.track.id, section]));
    for (const status of statuses) {
      const section = byTrackId.get(status.level.trackId);
      if (section) {
        section.statuses.push(status);
      }
    }
    return sectionList;
  }, [tracks, statuses]);

  return (
    <ScreenShell testID="level-map-screen">
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.heading} accessibilityRole="header" testID="level-map-heading">
            Level Map
          </Text>
          {onOpenSettings ? (
            <Pressable
              testID="level-map-settings"
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={onOpenSettings}
              style={({ pressed }) => [styles.settings, pressed && styles.settingsPressed]}
            >
              <Text style={styles.settingsLabel}>Settings</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.subheading} testID="level-map-subheading">
          Your progress across the tracks. Tap any unlocked level to practice.
        </Text>
        <Text style={styles.streakSummary} testID="level-map-streak-summary">
          Daily streak: {progress.dailyStreak ?? 0} · Best: {progress.bestStreak ?? 0} · Practice today
        </Text>
        {onOpenMixedReview ? (
          <Pressable
            testID="level-map-mixed-review"
            accessibilityRole="button"
            accessibilityLabel="Review and practice"
            onPress={onOpenMixedReview}
            style={({ pressed }) => [styles.mixedReview, pressed && styles.mixedReviewPressed]}
          >
            <Text style={styles.mixedReviewLabel}>Review / Practice</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {sections.map(section => (
          <View key={section.track.id} style={styles.trackSection}>
            <View style={styles.trackHeader}>
              <Text
                style={styles.trackName}
                accessibilityRole="header"
                testID={`level-map-track-${section.track.id}`}
              >
                {section.track.name}
              </Text>
              <Text style={styles.trackLabel} testID={`level-map-track-label-${section.track.id}`}>
                {section.track.label}
              </Text>
            </View>

            {section.statuses.map(status => {
              const { level, unlocked, completed, isCurrent, needsReview } = status;
              const locked = !unlocked;
              const label = `Level ${level.number}, ${level.title}, ${stateLabel(status)}${
                needsReview ? ', needs review' : ''
              }`;
              return (
                <Pressable
                  key={level.id}
                  testID={`level-map-level-${level.id}`}
                  accessibilityRole={locked ? undefined : 'button'}
                  accessibilityLabel={label}
                  accessibilityState={{ disabled: locked }}
                  disabled={locked}
                  onPress={() => onSelectLevel(level.id)}
                  style={({ pressed }) => [
                    styles.levelRow,
                    isCurrent && styles.levelRowCurrent,
                    locked && styles.levelRowLocked,
                    pressed && !locked && styles.levelRowPressed,
                  ]}
                >
                  <View style={[styles.numberBadge, isCurrent && styles.numberBadgeCurrent]}>
                    <Text style={[styles.number, isCurrent && styles.numberCurrent]}>
                      {level.number}
                    </Text>
                  </View>

                  <View style={styles.levelInfo}>
                    <Text
                      style={[styles.levelTitle, locked && styles.levelTitleLocked]}
                      testID={`level-map-title-${level.id}`}
                    >
                      {level.title}
                    </Text>
                    <Text
                      style={[styles.levelTopic, locked && styles.levelTopicLocked]}
                      testID={`level-map-topic-${level.id}`}
                    >
                      {level.topic.title}
                    </Text>
                  </View>

                  <View style={styles.badges}>
                    {needsReview ? (
                      <View style={styles.reviewBadge}>
                        <Text
                          style={styles.reviewBadgeLabel}
                          testID={`level-map-review-${level.id}`}
                        >
                          Review
                        </Text>
                      </View>
                    ) : null}
                    {completed ? (
                      <View style={styles.passedBadge}>
                        <Text
                          style={styles.passedBadgeLabel}
                          testID={`level-map-passed-${level.id}`}
                        >
                          ✓ Passed
                        </Text>
                      </View>
                    ) : null}
                    {isCurrent ? (
                      <View style={styles.currentBadge}>
                        <Text
                          style={styles.currentBadgeLabel}
                          testID={`level-map-current-${level.id}`}
                        >
                          Current
                        </Text>
                      </View>
                    ) : null}
                    {locked ? (
                      <Text style={styles.lockedLabel} testID={`level-map-locked-${level.id}`}>
                        🔒 Locked
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {onBack ? (
        <Pressable
          testID="level-map-back"
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      ) : null}
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
    subheading: {
      fontSize: tokens.typography.body,
      lineHeight: 20,
      color: colors.primaryOnContainerMuted,
    },
    streakSummary: {
      marginTop: tokens.spacing.sm,
      fontSize: tokens.typography.body,
      fontWeight: '600',
      color: colors.primaryOnContainer,
    },
    mixedReview: {
      alignSelf: 'flex-start',
      marginTop: tokens.spacing.md,
      backgroundColor: colors.primary,
      borderRadius: tokens.radii.md,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
    },
    mixedReviewPressed: {
      backgroundColor: colors.primaryPressed,
    },
    mixedReviewLabel: {
      color: colors.textOnAccent,
      fontWeight: '700',
      fontSize: tokens.typography.body,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: tokens.spacing.lg,
    },
    trackSection: {
      marginBottom: tokens.spacing.xl,
    },
    trackHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: tokens.spacing.sm,
      paddingHorizontal: 2,
    },
    trackName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginRight: tokens.spacing.sm,
    },
    trackLabel: {
      fontSize: tokens.typography.small,
      color: colors.textMuted,
    },
    levelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: tokens.radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: tokens.spacing.md,
      marginBottom: tokens.spacing.sm,
    },
    levelRowCurrent: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer,
      borderWidth: 2,
    },
    levelRowLocked: {
      backgroundColor: colors.surfaceMuted,
    },
    levelRowPressed: {
      backgroundColor: colors.surfacePressed,
    },
    numberBadge: {
      width: 34,
      height: 34,
      borderRadius: tokens.radii.pill,
      backgroundColor: colors.badgeSurface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing.md,
    },
    numberBadgeCurrent: {
      backgroundColor: colors.primary,
    },
    number: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.badgeText,
    },
    numberCurrent: {
      color: colors.textOnAccent,
    },
    levelInfo: {
      flex: 1,
      marginRight: tokens.spacing.sm,
    },
    levelTitle: {
      fontSize: tokens.typography.bodyLarge,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    levelTitleLocked: {
      color: colors.textDisabled,
    },
    levelTopic: {
      fontSize: tokens.typography.small,
      color: colors.textMuted,
      marginTop: 1,
    },
    levelTopicLocked: {
      color: colors.textDisabled,
    },
    badges: {
      alignItems: 'flex-end',
    },
    reviewBadge: {
      backgroundColor: colors.warningBadge,
      borderRadius: tokens.radii.sm,
      paddingVertical: 3,
      paddingHorizontal: tokens.spacing.sm,
      marginBottom: 4,
    },
    reviewBadgeLabel: {
      fontSize: tokens.typography.caption,
      fontWeight: '600',
      color: colors.warningBadgeText,
    },
    passedBadge: {
      backgroundColor: colors.successBadge,
      borderRadius: tokens.radii.sm,
      paddingVertical: 3,
      paddingHorizontal: tokens.spacing.sm,
      marginBottom: 4,
    },
    passedBadgeLabel: {
      fontSize: tokens.typography.caption,
      fontWeight: '700',
      color: colors.success,
    },
    currentBadge: {
      backgroundColor: colors.primary,
      borderRadius: tokens.radii.sm,
      paddingVertical: 3,
      paddingHorizontal: tokens.spacing.sm,
    },
    currentBadgeLabel: {
      fontSize: tokens.typography.caption,
      fontWeight: '700',
      color: colors.textOnAccent,
    },
    lockedLabel: {
      fontSize: tokens.typography.caption,
      fontWeight: '600',
      color: colors.textDisabled,
    },
    back: {
      margin: tokens.spacing.lg,
      alignSelf: 'stretch',
      backgroundColor: colors.primary,
      borderRadius: tokens.radii.md,
      paddingVertical: tokens.spacing.md,
      alignItems: 'center',
    },
    backPressed: {
      backgroundColor: colors.primaryPressed,
    },
    backLabel: {
      color: colors.textOnAccent,
      fontWeight: '600',
      fontSize: 15,
    },
  });
