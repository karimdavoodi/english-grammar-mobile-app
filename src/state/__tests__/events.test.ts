jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import {
  appendEvent,
  EVENTS_KEY,
  loadEvents,
  MAX_EVENT_COUNT,
  selectStats,
  type GameEvent,
} from '../events';
import type { StorageLike } from '../storage';

function store(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: async key => data.get(key) ?? null,
    setItem: async (key, value) => { data.set(key, value); },
    removeItem: async key => { data.delete(key); },
  };
}

const answer = (id: string, rule: string, type: string, isCorrect: boolean): GameEvent => ({
  kind: 'answer', questionId: id, rule, questionType: type, isCorrect, levelId: 'b01',
  timestamp: '2026-08-23T10:00:00.000Z',
});

describe('local event log', () => {
  it('appends events and keeps only the newest bounded entries', async () => {
    const memory = store();
    for (let index = 0; index < MAX_EVENT_COUNT + 1; index += 1) {
      await appendEvent({ ...answer(String(index), 'rule', 'multiple_choice', true), timestamp: `2026-08-23T10:00:${String(index % 60).padStart(2, '0')}.000Z` }, memory);
    }
    const events = await loadEvents(memory);
    expect(events).toHaveLength(MAX_EVENT_COUNT);
    expect((events[0] as GameEvent & { questionId: string }).questionId).toBe('1');
    expect(await memory.getItem(EVENTS_KEY)).not.toBeNull();
  });
});

describe('stats selectors', () => {
  it('computes totals, accuracy by rule/type, practice dates, and time played', () => {
    const events: GameEvent[] = [
      { kind: 'session_start', sessionId: 's1', timestamp: '2026-08-22T10:00:00.000Z' },
      answer('q1', 'tense', 'multiple_choice', true),
      answer('q2', 'tense', 'fill_blank', false),
      { kind: 'session_end', sessionId: 's1', timestamp: '2026-08-22T10:02:30.000Z' },
      { kind: 'session_start', sessionId: 's2', timestamp: '2026-08-23T10:00:00.000Z' },
      answer('q3', 'agreement', 'word_order', true),
    ];
    const stats = selectStats(events);
    expect(stats.totalAnswers).toBe(3);
    expect(stats.correctAnswers).toBe(2);
    expect(stats.accuracy).toBeCloseTo(2 / 3);
    expect(stats.accuracyByRule.tense).toEqual({ total: 2, correct: 1, accuracy: 0.5 });
    expect(stats.accuracyByType.fill_blank).toEqual({ total: 1, correct: 0, accuracy: 0 });
    expect(stats.practiceDates).toEqual(['2026-08-22', '2026-08-23']);
    expect(stats.timePlayedSeconds).toBe(150);
  });
});
