/** Mixed Review route adapter over the existing question loop. */

import React, { useMemo } from 'react';
import type { Level, Question, Track } from '../content/types';
import { mixedBank } from '../game/mixed';
import type { Progress } from '../state/types';
import { LevelPlayScreen, type LevelEndResult } from './LevelPlayScreen';

export interface MixedReviewScreenProps {
  tracks: Track[];
  progress: Progress;
  onProgressChange: (progress: Progress) => void;
  onEnd: (result: LevelEndResult) => void;
  onExit: () => void;
}

export function MixedReviewScreen({
  tracks,
  progress,
  onProgressChange,
  onEnd,
  onExit,
}: MixedReviewScreenProps) {
  const level = useMemo<Level | null>(() => {
    const allQuestions = tracks.flatMap(track => track.levels).flatMap(item => item.questions);
    const session = progress.activeSession;
    const questions = session?.kind === 'mixed'
      ? (session.bankQuestionIds ?? [])
          .map(id => allQuestions.find(question => question.id === id))
          .filter((question): question is (typeof allQuestions)[number] => Boolean(question))
      : mixedBank(tracks, progress, { size: 12 });
    const firstLevel = tracks[0]?.levels[0];
    if (!firstLevel || questions.length === 0) return null;
    return {
      ...firstLevel,
      // startMixedSession persists this same id so LevelPlay resumes rather
      // than replacing the mixed session with a level session.
      id: 'mixed',
      title: 'Mixed Review',
      topic: { ...firstLevel.topic, title: 'Mixed Review', summary: 'Practice across your weaknesses and passed levels.' },
      questions: questions as Question[],
      interleave: false,
    };
  }, [progress, tracks]);

  if (!level) return null;
  return (
    <LevelPlayScreen
      level={level}
      initialProgress={progress}
      onLevelEnd={onEnd}
      onExit={onExit}
      onProgressChange={onProgressChange}
    />
  );
}
