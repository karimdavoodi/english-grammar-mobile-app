/**
 * AppNavigator — the root native-stack navigator.
 *
 * Task 9 wires React Navigation and the first-launch start-point flow:
 *   - no saved progress → the StartPoint choice (or, with a single eligible
 *     track, the AppProvider auto-starts and this navigator boots at LevelPlay);
 *   - saved progress (returning player) → LevelPlay at the current level;
 *   - a level ending routes to Result, whose Continue advances to the next level
 *     or — in the completion state — pops to the LevelMap (Task 10).
 *
 * Task 10 adds the LevelMap as the progress overview and free-play hub: quitting
 * a level and the completion-state "Go to map" both `popTo` it, and tapping an
 * unlocked level `push`es a fresh LevelPlay so replayed levels always mount
 * cleanly (the play screen resolves its session once on mount).
 *
 * Content and state come from the AppContext (`useApp`): the navigator stays
 * thin, resolving content ids to Level/Track objects and handing presentational
 * screens their props. Review lands in Task 11; Settings lands in Task 12.
 */

import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useApp } from '../app/AppContext';
import { findLevelById } from '../content';
import type { RootStackParamList } from './types';
import { LevelMapScreen } from '../screens/LevelMapScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { StartPointScreen } from '../screens/StartPointScreen';
import { LevelPlayScreen, type LevelEndResult } from '../screens/LevelPlayScreen';
import {
  completeLevel,
  flattenedLevelIds,
  nextLevelId,
  startingLevelId,
} from '../state/reducers';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** First-launch start choice — offers each eligible track at its level 1. */
function StartPointRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'StartPoint'>) {
  const { tracks, chooseStartingPoint } = useApp();
  const eligible = useMemo(() => tracks.filter(t => t.eligibleStartingPoint), [tracks]);

  const handleChoose = useCallback(
    async (trackId: string, levelNumber: number) => {
      await chooseStartingPoint(trackId, levelNumber);
      const levelId = startingLevelId(tracks, { trackId, levelNumber });
      if (levelId) {
        navigation.replace('LevelPlay', { levelId });
      }
    },
    [tracks, chooseStartingPoint, navigation],
  );

  return <StartPointScreen tracks={eligible} onChoose={handleChoose} />;
}

/** The question loop for one level — resumes a saved session, ends at Result. */
function LevelPlayRoute({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'LevelPlay'>) {
  const { tracks, progress, applyProgress } = useApp();
  const { levelId } = route.params;
  const level = useMemo(() => findLevelById(tracks, levelId), [tracks, levelId]);

  const handleLevelEnd = useCallback(
    (result: LevelEndResult) => {
      const order = flattenedLevelIds(tracks);
      const next = completeLevel(result.progress, {
        levelId,
        passed: result.outcome.passed,
        levelOrder: order,
      });
      // Persistence is best-effort here — the result screen navigates immediately.
      applyProgress(next).catch(() => {});
      navigation.replace('Result', {
        levelId,
        outcome: result.outcome,
        nextLevelId: nextLevelId(order, levelId),
      });
    },
    [tracks, levelId, applyProgress, navigation],
  );

  const handleExit = useCallback(() => {
    // Quitting a level returns to the map — popTo the existing LevelMap, or
    // (when quitting from the boot LevelPlay) replace this screen with it.
    navigation.popTo('LevelMap');
  }, [navigation]);

  if (!level || !progress) {
    // Defensive: an unknown level or missing progress should not reach here.
    // (Unknown-current-level repair is a Task 11 selector concern.)
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This level is not available.</Text>
      </View>
    );
  }

  return (
    <LevelPlayScreen
      level={level}
      initialProgress={progress}
      onLevelEnd={handleLevelEnd}
      onExit={handleExit}
    />
  );
}

/** The level map — progress overview + free-play hub (Task 10). */
function LevelMapRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'LevelMap'>) {
  const { tracks, progress } = useApp();
  if (!progress) {
    // No progress yet means nothing to map — the boot flow routes to the
    // starting point instead, so this is defensive only.
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Nothing to explore yet.</Text>
      </View>
    );
  }
  return (
    <LevelMapScreen
      tracks={tracks}
      progress={progress}
      onSelectLevel={levelId => navigation.push('LevelPlay', { levelId })}
      onBack={() => navigation.goBack()}
    />
  );
}

/** Wrong-answer study history — the Task 11 Review screen (Settings links here in Task 12). */
function ReviewRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Review'>) {
  const { tracks, progress } = useApp();
  if (!progress) {
    // No progress yet means no mistakes — nothing to review.
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Nothing to review yet.</Text>
      </View>
    );
  }
  return (
    <ReviewScreen
      tracks={tracks}
      wrongAnswers={progress.wrongAnswers}
      weaknessQueue={progress.weaknessQueue}
      onBack={() => navigation.goBack()}
    />
  );
}

/** Pass / mercy-end result — Continue advances to the next level or completion. */
function ResultRoute({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Result'>) {
  const { tracks } = useApp();
  const { levelId, outcome, nextLevelId: nextId } = route.params;
  const level = useMemo(() => findLevelById(tracks, levelId), [tracks, levelId]);
  const nextLevel = useMemo(
    () => (nextId ? findLevelById(tracks, nextId) ?? null : null),
    [tracks, nextId],
  );

  const handleContinue = useCallback(() => {
    if (nextLevel) {
      navigation.replace('LevelPlay', { levelId: nextLevel.id });
    } else {
      // Completion state: no next level — the LevelMap is the destination.
      // popTo the existing map, or (when the track was finished straight from
      // the boot LevelPlay) replace this Result with it.
      navigation.popTo('LevelMap');
    }
  }, [nextLevel, navigation]);

  if (!level) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This level is not available.</Text>
      </View>
    );
  }

  return (
    <ResultScreen
      level={level}
      outcome={outcome}
      nextLevel={nextLevel}
      onContinue={handleContinue}
    />
  );
}

export function AppNavigator() {
  const { progress } = useApp();
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={progress ? 'LevelPlay' : 'StartPoint'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="StartPoint" component={StartPointRoute} />
        <Stack.Screen
          name="LevelPlay"
          component={LevelPlayRoute}
          initialParams={{ levelId: progress?.currentLevelId ?? '' }}
        />
        <Stack.Screen name="Result" component={ResultRoute} />
        <Stack.Screen name="LevelMap" component={LevelMapRoute} />
        <Stack.Screen name="Review" component={ReviewRoute} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  missingText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
