/**
 * TopicsScreen — one track's topic list (Issue 4, Task 5).
 *
 * Home shows only the three tracks; tapping a track opens this screen, which
 * lists that track's levels in level-number order (each level teaches one
 * topic) with the derived statuses — passed, current, needs-review — reusing
 * the pure `levelStatuses` selector filtered to the selected track. Every
 * level is playable (all levels unlocked, Round 2 decision); the lock gate
 * and its presentation were removed in Task 5. A first-time player (progress
 * null) sees every topic as available; the navigator wires the first tap to
 * create the starting point (Task 6).
 *
 * No bottom Back button: back is the system gesture (issue 2). Safe-area via
 * ScreenShell (issue 1). Presentational: no navigation, storage, or reducer
 * imports — it takes content + progress + a callback as props, so it tests
 * with fixture data like the other presentational screens.
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

export interface TopicsScreenProps {
  /** The bundled tracks — statuses derive over the full flattened level order. */
  tracks: Track[];
  /** The selected track's id; unknown ids render a defensive message. */
  trackId: string;
  /** The progress slice, or null for a first-time player (all topics available). */
  progress: Progress | null;
  /** Called when a level/topic is tapped (push a fresh LevelPlay). */
  onSelectLevel: (levelId: string) => void;
}

/**
 * The selected track's level statuses, in level-number order. With progress,
 * reuse `levelStatuses` filtered to the track; for a first-time player every
 * topic is available (nothing passed, current, or queued for review).
 */
function statusesForTrack(
  tracks: readonly Track[],
  trackId: string,
  progress: Progress | null,
): LevelStatus[] {
  if (!progress) {
    const track = tracks.find(t => t.id === trackId);
    return (track?.levels ?? []).map(level => ({
      levelId: level.id,
      level,
      unlocked: true,
      completed: false,
      isCurrent: false,
      needsReview: false,
    }));
  }
  return levelStatuses(tracks, progress).filter(status => status.level.trackId === trackId);
}

/** Human label for a topic's state, used in the accessible row label. */
function stateLabel(status: LevelStatus): string {
  if (status.completed) {
    return 'Passed';
  }
  if (status.isCurrent) {
    return 'Current level';
  }
  // Every level is unlocked, so the unpassed non-current state is "Available".
  return 'Available';
}

export function TopicsScreen({
  tracks,
  trackId,
  progress,
  onSelectLevel,
}: TopicsScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const track = useMemo(() => tracks.find(t => t.id === trackId), [tracks, trackId]);
  const statuses = useMemo(
    () => statusesForTrack(tracks, trackId, progress),
    [tracks, trackId, progress],
  );

  if (!track) {
    // Defensive: an unknown track id should not reach here (the navigator
    // resolves the track and would show its own missing view).
    return (
      <ScreenShell testID="topics-screen">
        <View style={styles.missingContent}>
          <Text style={styles.missingText}>This topic list is not available.</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell testID="topics-screen">
      <View style={styles.header}>
        <Text style={styles.heading} accessibilityRole="header" testID="topics-heading">
          {track.name}
        </Text>
        <Text style={styles.trackLabel} testID="topics-track-label">
          {track.label}
        </Text>
        <Text style={styles.subheading} testID="topics-subheading">
          Topics
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {statuses.map(status => {
          const { level, completed, isCurrent, needsReview } = status;
          const label = `Level ${level.number}, ${level.title}, ${stateLabel(status)}${
            needsReview ? ', needs review' : ''
          }`;
          return (
            <Pressable
              key={level.id}
              testID={`topics-level-${level.id}`}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => onSelectLevel(level.id)}
              style={({ pressed }) => [
                styles.levelRow,
                isCurrent && styles.levelRowCurrent,
                pressed && styles.levelRowPressed,
              ]}
            >
              <View style={[styles.numberBadge, isCurrent && styles.numberBadgeCurrent]}>
                <Text style={[styles.number, isCurrent && styles.numberCurrent]}>
                  {level.number}
                </Text>
              </View>

              <View style={styles.levelInfo}>
                <Text
                  style={styles.levelTitle}
                  testID={`topics-title-${level.id}`}
                >
                  {level.title}
                </Text>
                <Text
                  style={styles.levelTopic}
                  testID={`topics-topic-${level.id}`}
                >
                  {level.topic.title}
                </Text>
              </View>

              <View style={styles.badges}>
                {needsReview ? (
                  <View style={styles.reviewBadge}>
                    <Text
                      style={styles.reviewBadgeLabel}
                      testID={`topics-review-${level.id}`}
                    >
                      Review
                    </Text>
                  </View>
                ) : null}
                {completed ? (
                  <View style={styles.passedBadge}>
                    <Text
                      style={styles.passedBadgeLabel}
                      testID={`topics-passed-${level.id}`}
                    >
                      ✓ Passed
                    </Text>
                  </View>
                ) : null}
                {isCurrent ? (
                  <View style={styles.currentBadge}>
                    <Text
                      style={styles.currentBadgeLabel}
                      testID={`topics-current-${level.id}`}
                    >
                      Current
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
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
    heading: {
      fontSize: tokens.typography.heading,
      fontWeight: '700',
      color: colors.primaryOnContainer,
    },
    trackLabel: {
      marginTop: 2,
      fontSize: tokens.typography.small,
      color: colors.primaryOnContainerMuted,
    },
    subheading: {
      marginTop: tokens.spacing.sm,
      fontSize: tokens.typography.caption,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: colors.primaryOnContainerMuted,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: tokens.spacing.lg,
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
    levelTopic: {
      fontSize: tokens.typography.small,
      color: colors.textMuted,
      marginTop: 1,
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
    missingContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: tokens.spacing.lg,
    },
    missingText: {
      color: colors.textMuted,
      fontSize: 16,
    },
  });
