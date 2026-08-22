/**
 * StartPointScreen — the first-launch "Where do you want to start?" choice.
 *
 * Per docs/use-cases "First Launch": when more than one bundled track is an
 * eligible starting point, the player picks one and starts at its level 1. With
 * only one eligible track the AppProvider auto-starts and this screen is never
 * shown. Presentational: no navigation, storage, or reducer imports, so it tests
 * with fixture data like the other presentational screens.
 *
 * Task 12: all colors come from the theme palette.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Track } from '../content/types';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';

export interface StartPointScreenProps {
  /** Eligible starting tracks — only these are offered as choices. */
  tracks: Track[];
  /** Called when the player picks a track (its level 1 is the starting point). */
  onChoose: (trackId: string, levelNumber: number) => void;
}

export function StartPointScreen({ tracks, onChoose }: StartPointScreenProps) {
  const styles = useThemedStyles(makeStyles);
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      padding: 24,
      marginBottom: 24,
    },
    heading: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.primaryOnContainer,
      marginBottom: 8,
    },
    subheading: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.primaryOnContainerMuted,
    },
    choice: {
      alignSelf: 'stretch',
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 12,
      alignItems: 'flex-start',
    },
    choicePressed: {
      backgroundColor: colors.primaryPressed,
    },
    choiceName: {
      color: colors.textOnAccent,
      fontWeight: '700',
      fontSize: 18,
    },
    choiceLabel: {
      color: colors.textOnAccentMuted,
      fontSize: 14,
      marginTop: 2,
    },
  });
