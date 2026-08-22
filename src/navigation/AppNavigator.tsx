/**
 * AppNavigator — the root native-stack navigator.
 *
 * Task 9 wires React Navigation and the first-launch start-point flow:
 *   - no saved progress → the StartPoint choice (or, with a single eligible
 *     track, the AppProvider auto-starts and this navigator boots at LevelPlay);
 *   - saved progress (returning player) → LevelPlay at the current level;
 *   - a level ending routes to Result, whose Continue advances to the next level
 *     or — in the completion state, until the LevelMap lands in Task 10 —
 *     replays the current level.
 *
 * Content and state come from the AppContext (`useApp`): the navigator stays
 * thin, resolving content ids to Level/Track objects and handing presentational
 * screens their props. LevelMap / Review / Settings routes land in Tasks 10–12.
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
import { ResultScreen } from '../screens/ResultScreen';
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
    navigation.goBack();
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
      // Completion state: no next level. The LevelMap (Task 10) becomes the
      // destination; until then, return to the just-finished level to replay.
      navigation.replace('LevelPlay', { levelId });
    }
  }, [nextLevel, levelId, navigation]);

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
