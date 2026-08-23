/**
 * AppNavigator — the root native-stack navigator.
 *
 * Home-first (docs/ui-plan.md Task 6): the app always boots to Home — the main
 * screen that lists the three tracks plus the study shortcuts (Settings, Resume,
 * Wrong answers, Review / Practice, Stats). There is no first-launch choice
 * screen and no flat level map anymore:
 *   - tapping a track pushes the Topics screen for that track;
 *   - tapping a topic pushes a fresh LevelPlay (a first-time player's first tap
 *     creates the starting point via `chooseStartingPoint`, so everything before
 *     it unlocks by derivation);
 *   - a level ending routes to Result, whose Continue advances to the next level
 *     or — in the completion state — to Graduation;
 *   - Graduation's "Go to level map" and Mixed Review's exit both pop back to
 *     Home; Settings' reset replaces the whole stack with Home (never the old
 *     StartPoint screen);
 *   - back navigation everywhere is the system gesture (no bottom Back buttons,
 *     no native header). The Android hardware-back exit-confirm lives on the
 *     Home route behind `useFocusEffect`, so it is active only while Home is
 *     focused (docs/ui-plan-1.md Task 1).
 *
 * Content and state come from the AppContext (`useApp`): the navigator stays
 * thin, resolving content ids to Level/Track objects and handing presentational
 * screens their props.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, Text } from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
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
import { HomeScreen } from '../screens/HomeScreen';
import { TopicsScreen } from '../screens/TopicsScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
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
  startMasterySession,
} from '../state/reducers';
import { GENERAL_REVIEW_FEEDBACK_ID } from '../state/reports';
import { resumableLevelId } from '../state/selectors';

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

/** The main screen — track list, progress summary, and study shortcuts (Task 4). */
function HomeRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const { tracks, progress } = useApp();

  // Android hardware back on the root screen asks before exiting (Issue 7 /
  // docs/ui-plan-1.md Task 1). Focus-scoped so the listener exists ONLY while
  // Home is focused: on a pushed screen the cleanup removes it and native-stack
  // pops normally; only back on Home shows the confirm dialog.
  useFocusEffect(
    useCallback(() => {
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
    }, []),
  );

  const handleResume = useCallback(() => {
    if (!progress) {
      return;
    }
    const target = resumableLevelId(progress);
    if (target.kind === 'mastery') {
      // A mastery/mixed session's persisted levelId is a sentinel string, not a
      // real level id — routing it to LevelPlay would land on the missing view.
      navigation.navigate('MixedReview');
    } else {
      navigation.navigate('LevelPlay', { levelId: target.levelId });
    }
  }, [progress, navigation]);

  return (
    <HomeScreen
      tracks={tracks}
      progress={progress}
      onOpenSettings={() => navigation.navigate('Settings')}
      onResume={handleResume}
      onOpenReview={() => navigation.navigate('Review')}
      onOpenMixedReview={() => navigation.navigate('MixedReview')}
      onOpenStats={() => navigation.navigate('Stats')}
      onSelectTrack={trackId => navigation.push('Topics', { trackId })}
    />
  );
}

/** One track's topic list — tapping an unlocked topic pushes a fresh LevelPlay. */
function TopicsRoute({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Topics'>) {
  const { tracks, progress, chooseStartingPoint } = useApp();
  const { trackId } = route.params;
  const track = useMemo(() => tracks.find(t => t.id === trackId), [tracks, trackId]);

  const handleSelectLevel = useCallback(
    async (levelId: string) => {
      const level = findLevelById(tracks, levelId);
      if (!level) {
        return;
      }
      if (!progress) {
        // First-time player: the first tapped topic becomes the starting point
        // (everything before it unlocks by derivation), then the level mounts.
        await chooseStartingPoint(trackId, level.number);
      }
      navigation.push('LevelPlay', { levelId });
    },
    [tracks, progress, chooseStartingPoint, trackId, navigation],
  );

  if (!track) {
    // Defensive: an unknown track id should not reach here.
    return <MissingView message="This track is not available." />;
  }

  return (
    <TopicsScreen
      tracks={tracks}
      trackId={trackId}
      progress={progress}
      onSelectLevel={handleSelectLevel}
    />
  );
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
    // (Unknown-current-level repair is a selector concern.)
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

function ReportRoute() {
  const { reports, updateReport, exportReports: sendReports } = useApp();
  return (
    <ReportScreen
      reports={reports}
      onUpdate={updateReport}
      onExport={sendReports}
    />
  );
}

/** Wrong-answer study history — the Review screen (Home links here). */
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
      onOpenReport={() => {
        // One general-feedback draft per press — a real ContentReport keyed to
        // the sentinel questionId, so Report opens an editable "General
        // feedback" entry instead of an empty outbox or a misleading question id.
        createReport(GENERAL_REVIEW_FEEDBACK_ID)
          .then(() => navigation.navigate('Report', {}))
          .catch(() => {});
      }}
    />
  );
}

/** Settings — appearance, growth preferences, and reset. */
function SettingsRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Settings'>) {
  const { settings, progress, applySettings, resetGame } = useApp();

  const handleReset = useCallback(async () => {
    await resetGame();
    // The boot route is always Home now: a reset replaces the whole stack with
    // Home. With multiple eligible tracks progress is null → the empty
    // "Pick a level to begin" state; with a single eligible track the reset
    // auto-starts fresh progress and Home shows it. Never the old StartPoint.
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
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
    />
  );
}

function StatsRoute({ navigation }: NativeStackScreenProps<RootStackParamList, 'Stats'>) {
  const { store } = useApp();
  const [stats, setStats] = React.useState(() => selectStats([]));
  useEffect(() => {
    loadEvents(store).then(events => setStats(selectStats(events))).catch(() => {});
  }, [store]);
  return <StatsScreen stats={stats} onOpenReview={() => navigation.navigate('Review')} />;
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
        navigation.popTo('Home');
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
      onOpenMap={() => navigation.popTo('Home')}
    />
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeRoute} />
        <Stack.Screen name="Topics" component={TopicsRoute} />
        <Stack.Screen name="LevelPlay" component={LevelPlayRoute} />
        <Stack.Screen name="Result" component={ResultRoute} />
        <Stack.Screen name="Graduation" component={GraduationRoute} />
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
