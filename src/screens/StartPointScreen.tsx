/**
 * StartPointScreen — the first-launch "Where do you want to start?" choice.
 *
 * Per docs/use-cases "First Launch": when more than one bundled track is an
 * eligible starting point, the player picks one and starts at its level 1. With
 * only one eligible track the AppProvider auto-starts and this screen is never
 * shown. Presentational: no navigation, storage, or reducer imports, so it tests
 * with fixture data like the Task 7A/8 presentational screens.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Track } from '../content/types';

export interface StartPointScreenProps {
  /** Eligible starting tracks — only these are offered as choices. */
  tracks: Track[];
  /** Called when the player picks a track (its level 1 is the starting point). */
  onChoose: (trackId: string, levelNumber: number) => void;
}

export function StartPointScreen({ tracks, onChoose }: StartPointScreenProps) {
  return (
    <View style={styles.screen} testID="start-point-screen">
      <View style={styles.card} accessibilityRole="summary">
        <Text style={styles.heading} accessibilityRole="header" testID="start-point-heading">
          Where do you want to start?
        </Text>
        <Text style={styles.subheading} testID="start-point-subheading">
          Pick the level that best matches your experience. You can always go
          back and practice earlier levels.
        </Text>
      </View>

      {tracks.map(track => (
        <Pressable
          key={track.id}
          testID={`start-choice-${track.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Start at ${track.label} level 1`}
          onPress={() => onChoose(track.id, 1)}
          style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
        >
          <Text style={styles.choiceName} testID={`start-choice-name-${track.id}`}>
            {track.name}
          </Text>
          <Text style={styles.choiceLabel} testID={`start-choice-label-${track.id}`}>
            {track.label} — start at level 1
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 24,
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1e40af',
  },
  choice: {
    alignSelf: 'stretch',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  choicePressed: {
    backgroundColor: '#1d4ed8',
  },
  choiceName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  choiceLabel: {
    color: '#dbeafe',
    fontSize: 14,
    marginTop: 2,
  },
});
