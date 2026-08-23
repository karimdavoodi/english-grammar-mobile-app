/**
 * LevelPlayScreen — the question → answer → feedback → next loop.
 *
 * Drives the pure machine (`levelMachine`) and adaptive serving (`serving`)
 * with the Task 7A components, dispatching Weakness Queue / wrong-answer /
 * review-streak updates through the pure reducers and persisting after every
 * answer. The serving mode is snapshotted BEFORE the answer (serving.ts) and
 * honored by `applyAnswer`, so a same-level remediation answer is never
 * recorded as a Review answer.
 *
 * The screen owns the progress slice it is given: it resumes a saved session
 * for this level, or starts a fresh one, and persists each transition through
 * an injectable AsyncStorage-compatible store (a memory store in tests).
 *
 * Lifecycle:
 *   serve → [re-teach lesson] → question → answer → feedback
 *   feedback reveals the correct + chosen answers with their explanations and
 *   offers "Next question"; a wrong answer never re-shows the lesson card (the
 *   two per-choice explanations carry the teaching). Dismissing the final
 *   answer's feedback calls `onLevelEnd`; the caller (Task 8 result flow) is
 *   responsible for routing to the result screen.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { findRule, tracks } from '../content';
import { normalizeQuestion } from '../content/types';
import type { Level } from '../content/types';
import { LessonCard } from '../components/LessonCard';
import { ProgressHeader } from '../components/ProgressHeader';
import { QuestionCard } from '../components/QuestionCard';
import { ScreenShell } from '../components/ScreenShell';
import type { AnswerResponse } from '../game/levelMachine';
import {
  DEFAULT_PASS_CONFIG,
  type AnswerOutcome,
  type LevelSession,
  type PassConfig,
  type QuestionLike,
} from '../game/levelMachine';
import { serveNextQuestion, type ServeResult } from '../game/serving';
import { interleavedBank } from '../game/mixed';
import {
  applyAnswer,
  queuedRuleSet,
  recordPlay,
  startLevelSession,
} from '../state/reducers';
import { DEFAULT_STORE, saveProgress, type StorageLike } from '../state/storage';
import { appendEvent } from '../state/events';
import { hydrateSession, type Progress } from '../state/types';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';

/** What the caller (Task 8 result flow) needs to route when a level ends. */
export interface LevelEndResult {
  session: LevelSession;
  outcome: AnswerOutcome;
  /**
   * The final progress slice after the ending answer — its active session is
   * already cleared, and its Weakness Queue / wrong-answer history are current.
   * The caller advances the frontier with it (`completeLevel`).
   */
  progress: Progress;
}

export interface LevelPlayScreenProps {
  /** The level being played. */
  level: Level;
  /** The progress slice to play within — the screen owns and persists updates to it. */
  initialProgress: Progress;
  /** AsyncStorage-compatible store; inject a memory store in tests. */
  store?: StorageLike;
  /** Injectable randomness for adaptive serving (deterministic tests). */
  random?: () => number;
  /** Pass/mercy tuning (defaults to the game defaults). */
  passConfig?: PassConfig;
  /** Called once the level ends (pass or mercy) and the final feedback is dismissed. */
  onLevelEnd?: (result: LevelEndResult) => void;
  onReport?: (questionId: string) => void;
  onProgressChange?: (progress: Progress) => void;
}

type Phase = 'lesson' | 'question' | 'feedback' | 'ended';

interface Feedback {
  response: AnswerResponse;
  outcome: AnswerOutcome;
}

interface PlayState {
  progress: Progress;
  /** The hydrated machine session — post-answer once feedback is showing. */
  session: LevelSession;
  /** The current serve (question + immutable mode + re-teach flag). */
  serve: ServeResult | null;
  phase: Phase;
  feedback: Feedback | null;
}

/** Resume the saved session for `level`, or start a fresh one, then serve. */
function resolveInitial(
  initialProgress: Progress,
  level: Level,
  random?: () => number,
): { state: PlayState; createdSession: boolean } {
  let progress = initialProgress;
  let createdSession = false;
  if (!(progress.activeSession && progress.activeSession.levelId === level.id)) {
    progress = startLevelSession(progress, level.id, localDate(new Date()));
    createdSession = true;
  } else {
    progress = recordPlay(progress, localDate(new Date()));
  }
  const session = hydrateSession(progress.activeSession!);
  const bank: QuestionLike[] = level.interleave
    ? interleavedBank(level, tracks, progress, { random })
    : level.questions;
  const serve = serveNextQuestion(session, bank, queuedRuleSet(progress), { random });
  const phase: Phase = serve ? (serve.showLesson ? 'lesson' : 'question') : 'ended';
  return { state: { progress, session, serve, phase, feedback: null }, createdSession };
}

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function LevelPlayScreen({
  level,
  initialProgress,
  store = DEFAULT_STORE,
  random,
  passConfig = DEFAULT_PASS_CONFIG,
  onLevelEnd,
  onReport,
  onProgressChange,
}: LevelPlayScreenProps) {
  const styles = useThemedStyles(makeStyles);

  // Resolved once per mount: props are stable for the lifetime of a mounted
  // level (the navigator keys the screen by level), so this is safe.
  const init = useMemo(
    () => resolveInitial(initialProgress, level, random),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [play, setPlay] = useState<PlayState>(init.state);
  const [saveFailed, setSaveFailed] = useState(false);
  const sessionIdRef = useRef(`${level.id}:${new Date().toISOString()}`);

  // Persistence is serialized so a rapid follow-up answer never lets an earlier
  // stale write land after a newer one: only one save is in flight at a time,
  // and it always drains the latest pending progress first.
  const pendingSaveRef = useRef<Progress | null>(null);
  const savingRef = useRef(false);
  const persist = useCallback(
    (progress: Progress) => {
      pendingSaveRef.current = progress;
      if (savingRef.current) {
        return;
      }
      savingRef.current = true;
      const drain = async () => {
        while (pendingSaveRef.current) {
          const toSave = pendingSaveRef.current;
          pendingSaveRef.current = null;
          try {
            await saveProgress(toSave, store);
          } catch {
            setSaveFailed(true);
          }
        }
        savingRef.current = false;
      };
      drain();
    },
    [store],
  );

  // A freshly created session must survive a relaunch before the first answer.
  useEffect(() => {
    if (init.createdSession) {
      persist(init.state.progress);
      appendEvent({ kind: 'session_start', sessionId: sessionIdRef.current, timestamp: new Date().toISOString() }, store).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = useCallback(
    (response: AnswerResponse) => {
      if (play.phase !== 'question' || !play.serve) {
        return;
      }
      const { progress, session, outcome } = applyAnswer({
        progress: play.progress,
        question: play.serve.question,
        response,
        mode: play.serve.mode,
        config: passConfig,
      });
      persist(progress);
      onProgressChange?.(progress);
      appendEvent({
        kind: 'answer',
        questionId: play.serve.question.id,
        rule: play.serve.question.rule,
        questionType: normalizeQuestion(play.serve.question).type,
        isCorrect: outcome.isCorrect,
        levelId: level.id,
        timestamp: new Date().toISOString(),
      }, store).catch(() => {});
      setPlay({
        ...play,
        progress,
        session,
        phase: 'feedback',
        feedback: { response, outcome },
      });
    },
    [onProgressChange, play, passConfig, persist, level.id, store],
  );

  const handleContinueFromLesson = useCallback(() => {
    if (play.phase !== 'lesson' || !play.serve) {
      return;
    }
    setPlay({ ...play, phase: 'question' });
  }, [play]);

  const handleDismissFeedback = useCallback(() => {
    if (play.phase !== 'feedback' || !play.feedback) {
      return;
    }
    const { outcome } = play.feedback;
    const ended = outcome.passed || outcome.endedByMercy;
    if (ended) {
      setPlay({ ...play, phase: 'ended', feedback: null });
      appendEvent({
        kind: 'level_end',
        levelId: level.id,
        outcome: outcome.passed ? 'passed' : 'mercy_ended',
        reason: outcome.passReason ?? (outcome.endedByMercy ? 'mercy' : 'completed'),
        timestamp: new Date().toISOString(),
      }, store).then(() => appendEvent({
        kind: 'session_end', sessionId: sessionIdRef.current, timestamp: new Date().toISOString(),
      }, store)).catch(() => {});
      onLevelEnd?.({ session: play.session, outcome, progress: play.progress });
      return;
    }
    const bank: QuestionLike[] = level.interleave
      ? interleavedBank(level, tracks, play.progress, { random })
      : level.questions;
    const nextServe = serveNextQuestion(
      play.session,
      bank,
      queuedRuleSet(play.progress),
      { random },
    );
    if (!nextServe) {
      // Validated content keeps each bank ≥ the mercy cap, so an in-progress
      // level never runs dry; a dry bank here is defensive only.
      setPlay({ ...play, phase: 'ended', feedback: null });
      return;
    }
    setPlay({
      ...play,
      serve: nextServe,
      phase: nextServe.showLesson ? 'lesson' : 'question',
      feedback: null,
    });
  }, [onLevelEnd, play, level, random, store]);

  const { session, serve, phase, feedback } = play;
  const rule = serve ? (findRule(serve.question.rule) ?? null) : null;
  const review = serve ? serve.mode === 'review' : false;

  return (
    <ScreenShell testID="level-play-screen">
      <ProgressHeader
        streak={session.streak}
        correctCount={session.correctCount}
        answeredCount={session.totalAnswered}
        mercyCap={passConfig.mercyCap}
      />
      {saveFailed ? (
        <Text style={styles.saveWarning} testID="save-warning">
          Changes may not be saved.
        </Text>
      ) : null}

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {phase === 'lesson' && serve ? (
          <LessonCard
            topic={level.topic}
            rule={rule}
            review={review}
            onContinue={handleContinueFromLesson}
          />
        ) : null}

        {(phase === 'question' || phase === 'feedback') && serve ? (
          <QuestionCard
            question={serve.question}
            selectedIndex={feedback?.response.type === 'index' ? feedback.response.index : null}
            selectedResponse={feedback?.response ?? null}
            revealed={phase === 'feedback'}
            onAnswer={handleAnswer}
            random={random}
            onReport={
              phase === 'feedback' && feedback && !feedback.outcome.isCorrect
                ? () => onReport?.(serve.question.id)
                : undefined
            }
          />
        ) : null}

        {phase === 'feedback' ? (
          <Pressable
            testID="next-question"
            accessibilityRole="button"
            onPress={handleDismissFeedback}
            style={({ pressed }) => [styles.next, pressed && styles.nextPressed]}
          >
            <Text style={styles.nextLabel}>Next question</Text>
          </Pressable>
        ) : null}

        {phase === 'ended' ? (
          <Text style={styles.ended} testID="level-ended">
            Level complete
          </Text>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    saveWarning: {
      color: colors.warningText,
      fontSize: 13,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      padding: 16,
    },
    next: {
      marginTop: 8,
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 18,
    },
    nextPressed: {
      backgroundColor: colors.primaryPressed,
    },
    nextLabel: {
      color: colors.textOnAccent,
      fontWeight: '600',
      fontSize: 15,
    },
    ended: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 32,
    },
  });
