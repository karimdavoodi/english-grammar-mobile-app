import type { Track } from '../../content/types';
import { interleavedBank, mixedBank } from '../mixed';
import type { Progress } from '../../state/types';

const q = (id: string, levelId: string, rule: string) => ({
  id, levelId, rule, prompt: id, choices: ['a', 'b', 'c', 'd'], correctIndex: 0,
  choiceExplanations: ['right', 'wrong', 'wrong', 'wrong'],
});

const tracks: Track[] = [{
  id: 'basic', order: 1, name: 'Basic', label: 'Beginner', eligibleStartingPoint: true,
  levels: [
    { id: 'b01', trackId: 'basic', number: 1, title: 'One', topic: { title: 'One', summary: '', rules: [{ rule: 'queued', title: 'Queued', explanation: '', example: '' }] }, questions: [q('q1', 'b01', 'queued'), q('q2', 'b01', 'other')] },
    { id: 'b02', trackId: 'basic', number: 2, title: 'Two', topic: { title: 'Two', summary: '', rules: [{ rule: 'other', title: 'Other', explanation: '', example: '' }] }, questions: [q('q3', 'b02', 'other'), q('q4', 'b02', 'other')] },
  ],
}];

const progress: Progress = {
  version: 2, startingPoint: { trackId: 'basic', levelNumber: 1 }, completedLevelIds: ['b01'],
  currentLevelId: 'b02', activeSession: null, weaknessQueue: { queued: { rule: 'queued', missCount: 1, reviewStreak: 0, lastMissedAt: '2026-08-20' } },
  wrongAnswers: { q3: { questionId: 'q3', count: 1, lastChosenIndex: 1, lastMissedAt: '2026-08-22' } },
};

describe('mixedBank', () => {
  it('prioritizes queued rules, then freshest misses, then passed-level sampling', () => {
    const bank = mixedBank(tracks, progress, { size: 3, random: () => 0 });
    expect(bank.map(question => question.id)).toEqual(['q1', 'q3', 'q2']);
  });

  it('caps the bank and de-duplicates questions selected by multiple priorities', () => {
    const bank = mixedBank(tracks, { ...progress, wrongAnswers: { q1: { questionId: 'q1', count: 1, lastChosenIndex: 1, lastMissedAt: '2026-08-22' } } }, { size: 2, random: () => 0 });
    expect(bank).toHaveLength(2);
    expect(new Set(bank.map(question => question.id)).size).toBe(2);
  });
});

describe('interleavedBank', () => {
  it('keeps own questions first and prioritizes queued then recurring earlier rules', () => {
    const level = { ...tracks[0].levels[1], interleave: true };
    const bank = interleavedBank(level, tracks, progress, { sampleSize: 3, random: () => 0 });
    expect(bank.map(question => question.id)).toEqual(['q3', 'q4', 'q1', 'q2']);
  });

  it('returns only the owning bank when interleaving is disabled', () => {
    const bank = interleavedBank(tracks[0].levels[1], tracks, progress, { sampleSize: 3, random: () => 0 });
    expect(bank.map(question => question.id)).toEqual(['q3', 'q4']);
  });
});
