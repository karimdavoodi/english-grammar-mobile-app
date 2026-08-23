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
 * Task 12 adds Settings (theme + reset): the map gains a Settings entry, and the
 * Settings route offers the appearance choice, a Review link, and a confirmed
 * reset that replaces the whole stack with the re-initialized boot route
 * (auto-started current level for Basic-only v1, or the StartPoint choice).
 * All defensive "missing" views consume the theme palette like every screen.
 *
 * Content and state come from the AppContext (`useApp`): the navigator stays
 * thin, resolving content ids to Level/Track objects and handing presentational
 * screens their props.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useApp } from '../app/AppContext';
import { findLevelById } from '../content';
import { ScreenShell } from '../components/ScreenShell';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import type { RootStackParamList } from './types';
import { LevelMapScreen } from '../screens/LevelMapScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StartPointScreen } from '../screens/StartPointScreen';
import { LevelPlayScreen, type LevelEndResult } from '../screens/LevelPlayScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { MixedReviewScreen } from '../screens/MixedReviewScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { GraduationScreen } from '../screens/GraduationScreen';
import { loadEvents, selectStats } from '../state/events';
import {
  completeLevel,
  flattenedLevelIds,
  nextLevelId,
  startingLevelId,
  startMasterySession,
} from '../state/reducers';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Defensive placeholder for a route with no progress / unknown content. */
function MissingView({ message }: { message: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <ScreenShell style={styles.missingContent}>
      <Text style={styles.missingText}>{message}</Text>
    </ScreenShell>
  );
}

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
  const { tracks, progress, applyProgress, createReport } = useApp();
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

  if (!level || !progress) {
    // Defensive: an unknown level or missing progress should not reach here.
    // (Unknown-current-level repair is a Task 11 selector concern.)
    return <MissingView message="This level is not available." />;
  }

  return (
    <LevelPlayScreen
      level={level}
      initialProgress={progress}
      onLevelEnd={handleLevelEnd}
      onReport={questionId => {
        createReport(questionId).then(() => navigation.navigate('Report', { questionId })).catch(() => {});
      }}
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
    return <MissingView message="Nothing to explore yet." />;
  }
  return (
    <LevelMapScreen
      tracks={tracks}
      progress={progress}
      onSelectLevel={levelId => navigation.push('LevelPlay', { levelId })}
      onOpenSettings={() => navigation.navigate('Settings')}
      onOpenMixedReview={() => navigation.navigate('MixedReview')}
      onBack={() => navigation.goBack()}
    />
  );
}

function ReportRoute({ navigation }: NativeStackScreenProps<RootStackParamList, 'Report'>) {
  const { reports, updateReport, exportReports: sendReports } = useApp();
  return (
    <ReportScreen
      reports={reports}
      onUpdate={updateReport}
      onExport={sendReports}
      onBack={() => navigation.goBack()}
    />
  );
}

/** Wrong-answer study history — the Task 11 Review screen (Settings links here). */
function ReviewRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Review'>) {
  const { tracks, progress, createReport } = useApp();
  if (!progress) {
    // No progress yet means no mistakes — nothing to review.
    return <MissingView message="Nothing to review yet." />;
  }
  return (
    <ReviewScreen
      tracks={tracks}
      wrongAnswers={progress.wrongAnswers}
      weaknessQueue={progress.weaknessQueue}
      onBack={() => navigation.goBack()}
      onReport={(questionId: string) => {
        createReport(questionId).then(() => navigation.navigate('Report', { questionId })).catch(() => {});
      }}
    />
  );
}

/** Settings — appearance, growth preferences, study links, and reset. */
function SettingsRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Settings'>) {
  const { settings, progress, applySettings, resetGame } = useApp();

  const handleReset = useCallback(async () => {
    const next = await resetGame();
    // A reset replaces the whole stack with the re-initialized boot route:
    // Basic-only v1 auto-starts at the fresh current level; multiple eligible
    // tracks leave progress null and show the StartPoint choice.
    navigation.reset({
      index: 0,
      routes: next
        ? [{ name: 'LevelPlay', params: { levelId: next.currentLevelId } }]
        : [{ name: 'StartPoint' }],
    });
  }, [resetGame, navigation]);

  return (
    <SettingsScreen
      themePreference={settings.theme}
      onChangeTheme={theme => applySettings({ theme })}
      notifications={settings.notifications}
      onChangeNotifications={notifications => applySettings({ ...settings, notifications })}
      dailyStreak={progress?.dailyStreak ?? 0}
      bestStreak={progress?.bestStreak ?? 0}
      onReset={handleReset}
      onOpenReview={() => navigation.navigate('Review')}
      onOpenStats={() => navigation.navigate('Stats')}
      onOpenMixedReview={() => navigation.navigate('MixedReview')}
      onBack={() => navigation.goBack()}
    />
  );
}

function StatsRoute({ navigation }: NativeStackScreenProps<RootStackParamList, 'Stats'>) {
  const { store } = useApp();
  const [stats, setStats] = React.useState(() => selectStats([]));
  useEffect(() => {
    loadEvents(store).then(events => setStats(selectStats(events))).catch(() => {});
  }, [store]);
  return <StatsScreen stats={stats} onOpenReview={() => navigation.navigate('Review')} onBack={() => navigation.goBack()} />;
}

function MixedReviewRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'MixedReview'>) {
  const { tracks, progress, applyProgress } = useApp();
  const mixedProgress = progress?.activeSession?.kind === 'mastery' ? progress : null;

  useEffect(() => {
    if (progress && !mixedProgress) {
      const next = startMasterySession(progress, tracks);
      applyProgress(next).catch(() => {});
    }
  }, [applyProgress, mixedProgress, progress, tracks]);

  if (!progress) return <MissingView message="Nothing to review yet." />;
  if (!mixedProgress) return <MissingView message="Preparing Mixed Review…" />;

  return (
    <MixedReviewScreen
      tracks={tracks}
      progress={mixedProgress}
      onProgressChange={next => applyProgress(next).catch(() => {})}
      onEnd={result => {
        applyProgress(result.progress).catch(() => {});
        navigation.replace('LevelMap');
      }}
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
      navigation.replace('Graduation');
    }
  }, [nextLevel, navigation]);

  if (!level) {
    return <MissingView message="This level is not available." />;
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

function GraduationRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Graduation'>) {
  const { tracks, progress, store } = useApp();
  const [accuracy, setAccuracy] = React.useState(0);
  const totalLevels = flattenedLevelIds(tracks).length;
  const completedLevels = progress
    ? progress.completedLevelIds.filter(id => flattenedLevelIds(tracks).includes(id)).length
    : 0;

  useEffect(() => {
    loadEvents(store).then(events => setAccuracy(selectStats(events).accuracy)).catch(() => {});
  }, [store]);

  return (
    <GraduationScreen
      completedLevels={completedLevels}
      totalLevels={totalLevels}
      dailyStreak={progress?.dailyStreak ?? 0}
      accuracy={accuracy}
      onKeepPracticing={() => navigation.replace('MixedReview')}
      onOpenMap={() => navigation.replace('LevelMap')}
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
        <Stack.Screen name="Graduation" component={GraduationRoute} />
        <Stack.Screen name="LevelMap" component={LevelMapRoute} />
        <Stack.Screen name="Review" component={ReviewRoute} />
        <Stack.Screen name="Settings" component={SettingsRoute} />
        <Stack.Screen name="MixedReview" component={MixedReviewRoute} />
        <Stack.Screen name="Report" component={ReportRoute} />
        <Stack.Screen name="Stats" component={StatsRoute} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    missingContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    missingText: {
      color: colors.textMuted,
      fontSize: 16,
    },
  });
