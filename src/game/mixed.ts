/** Pure construction of the deterministic bank used by Mixed Review. */

import type { QuestionUnion, Track } from '../content/types';
import type { Progress } from '../state/types';

export interface MixedBankOptions {
  size: number;
  random?: () => number;
}

function questionsInOrder(tracks: readonly Track[]): QuestionUnion[] {
  return [...tracks]
    .sort((a, b) => a.order - b.order)
    .flatMap(track =>
      [...track.levels]
        .sort((a, b) => a.number - b.number)
        .flatMap(level => level.questions as QuestionUnion[]),
    );
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/**
 * Assemble a size-capped bank in the product's priority order:
 * queued rules, recently missed questions, then a spread from passed levels.
 * Question ids are de-duplicated and all ordering randomness is injectable.
 */
export function mixedBank(
  tracks: readonly Track[],
  progress: Progress,
  options: MixedBankOptions,
): QuestionUnion[] {
  const limit = Math.max(0, Math.floor(options.size));
  if (limit === 0) return [];
  const random = options.random ?? Math.random;
  const all = questionsInOrder(tracks);
  const byId = new Map(all.map(question => [question.id, question]));
  const selected = new Set<string>();
  const result: QuestionUnion[] = [];
  const add = (question: QuestionUnion | undefined) => {
    if (question && !selected.has(question.id) && result.length < limit) {
      selected.add(question.id);
      result.push(question);
    }
  };

  const queued = all.filter(question => Object.hasOwn(progress.weaknessQueue, question.rule));
  for (const question of shuffled(queued, random)) add(question);

  const missed = Object.values(progress.wrongAnswers)
    .sort((a, b) => b.lastMissedAt.localeCompare(a.lastMissedAt))
    .map(entry => byId.get(entry.questionId));
  for (const question of missed) add(question);

  const passedIds = new Set(progress.completedLevelIds);
  const passedLevels = tracks
    .flatMap(track => track.levels)
    .filter(level => passedIds.has(level.id));
  const pools = passedLevels.map(level => shuffled(level.questions as QuestionUnion[], random));
  let poolIndex = 0;
  while (result.length < limit && pools.some(pool => pool.length > 0)) {
    const pool = pools[poolIndex % pools.length];
    poolIndex += 1;
    add(pool.shift());
  }
  return result;
}
