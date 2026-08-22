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
 * Presentational: no navigation, storage, or reducer imports — it takes content
 * + progress as props and resolves the statuses through the pure `levelStatuses`
 * selector, so it tests with fixture data like the other Task 7A/8/11
 * presentational screens. The navigator supplies onSelectLevel (push a fresh
 * LevelPlay) and onBack.
 */

import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Track } from '../content/types';
import { levelStatuses, type LevelStatus } from '../state/selectors';
import type { Progress } from '../state/types';

export interface LevelMapScreenProps {
  /** The bundled tracks — flattened by order → number for the map. */
  tracks: Track[];
  /** The progress slice — the map's statuses are derived from it (never null on the real route). */
  progress: Progress;
  /** Called when an unlocked level is tapped (replay — never re-locks). */
  onSelectLevel: (levelId: string) => void;
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
  onBack,
}: LevelMapScreenProps) {
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
    <View style={styles.screen} testID="level-map-screen">
      <View style={styles.header}>
        <Text style={styles.heading} accessibilityRole="header" testID="level-map-heading">
          Level Map
        </Text>
        <Text style={styles.subheading} testID="level-map-subheading">
          Your progress across the tracks. Tap any unlocked level to practice.
        </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1e40af',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  trackSection: {
    marginBottom: 24,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  trackName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  trackLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 8,
  },
  levelRowCurrent: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    borderWidth: 2,
  },
  levelRowLocked: {
    backgroundColor: '#f9fafb',
  },
  levelRowPressed: {
    backgroundColor: '#f3f4f6',
  },
  numberBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberBadgeCurrent: {
    backgroundColor: '#2563eb',
  },
  number: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4b5563',
  },
  numberCurrent: {
    color: '#ffffff',
  },
  levelInfo: {
    flex: 1,
    marginRight: 8,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  levelTitleLocked: {
    color: '#9ca3af',
  },
  levelTopic: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 1,
  },
  levelTopicLocked: {
    color: '#9ca3af',
  },
  badges: {
    alignItems: 'flex-end',
  },
  reviewBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  reviewBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  passedBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  passedBadgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  currentBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  currentBadgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  lockedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  back: {
    margin: 16,
    alignSelf: 'stretch',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backPressed: {
    backgroundColor: '#1d4ed8',
  },
  backLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
