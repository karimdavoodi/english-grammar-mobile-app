import { DEFAULT_STORE, type StorageLike } from './storage';

export const EVENTS_KEY = 'egg:events';
export const MAX_EVENT_COUNT = 5_000;

export type AnswerEvent = {
  kind: 'answer';
  questionId: string;
  rule: string;
  questionType: string;
  isCorrect: boolean;
  levelId: string;
  timestamp: string;
};

export type LevelEndEvent = {
  kind: 'level_end';
  levelId: string;
  outcome: 'passed' | 'mercy_ended';
  reason: string;
  timestamp: string;
};

export type SessionEvent = {
  kind: 'session_start' | 'session_end';
  sessionId: string;
  timestamp: string;
};

export type GameEvent = AnswerEvent | LevelEndEvent | SessionEvent;

export async function loadEvents(store: StorageLike = DEFAULT_STORE): Promise<GameEvent[]> {
  const raw = await store.getItem(EVENTS_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as GameEvent[] : [];
  } catch {
    return [];
  }
}

/** Append one event, retaining only the newest bounded slice. */
export async function appendEvent(
  event: GameEvent,
  store: StorageLike = DEFAULT_STORE,
): Promise<void> {
  const events = await loadEvents(store);
  const bounded = [...events, event].slice(-MAX_EVENT_COUNT);
  await store.setItem(EVENTS_KEY, JSON.stringify(bounded));
}

export async function appendEvents(
  events: readonly GameEvent[],
  store: StorageLike = DEFAULT_STORE,
): Promise<void> {
  if (events.length === 0) return;
  const current = await loadEvents(store);
  await store.setItem(EVENTS_KEY, JSON.stringify([...current, ...events].slice(-MAX_EVENT_COUNT)));
}

export interface StatsSummary {
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  accuracyByRule: Record<string, { total: number; correct: number; accuracy: number }>;
  accuracyByType: Record<string, { total: number; correct: number; accuracy: number }>;
  practiceDates: string[];
  streakHistory: string[];
  timePlayedSeconds: number;
}

function addAccuracy(
  target: Record<string, { total: number; correct: number; accuracy: number }>,
  key: string,
  isCorrect: boolean,
) {
  const prior = target[key] ?? { total: 0, correct: 0, accuracy: 0 };
  const total = prior.total + 1;
  const correct = prior.correct + (isCorrect ? 1 : 0);
  target[key] = { total, correct, accuracy: correct / total };
}

function localDate(timestamp: string): string {
  return timestamp.slice(0, 10);
}

/** Derive all Stats UI data without coupling selectors to React or storage. */
export function selectStats(events: readonly GameEvent[]): StatsSummary {
  const answers = events.filter((event): event is AnswerEvent => event.kind === 'answer');
  const accuracyByRule: StatsSummary['accuracyByRule'] = {};
  const accuracyByType: StatsSummary['accuracyByType'] = {};
  answers.forEach(answer => {
    addAccuracy(accuracyByRule, answer.rule, answer.isCorrect);
    addAccuracy(accuracyByType, answer.questionType, answer.isCorrect);
  });
  const practiceDates = [...new Set(events
    .filter(event => event.kind === 'session_start')
    .map(event => localDate(event.timestamp)))].sort();
  const starts = new Map<string, number>();
  let timePlayedSeconds = 0;
  events.forEach(event => {
    const time = Date.parse(event.timestamp);
    if (event.kind === 'session_start' && Number.isFinite(time)) starts.set(event.sessionId, time);
    if (event.kind === 'session_end' && Number.isFinite(time)) {
      const start = starts.get(event.sessionId);
      if (start !== undefined && time >= start) timePlayedSeconds += (time - start) / 1000;
      starts.delete(event.sessionId);
    }
  });
  return {
    totalAnswers: answers.length,
    correctAnswers: answers.filter(answer => answer.isCorrect).length,
    accuracy: answers.length ? answers.filter(answer => answer.isCorrect).length / answers.length : 0,
    accuracyByRule,
    accuracyByType,
    practiceDates,
    streakHistory: practiceDates,
    timePlayedSeconds,
  };
}
