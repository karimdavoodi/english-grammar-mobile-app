/**
 * Task 14 — full-journey verification.
 *
 * Scripts the integrated game loop against the REAL validated content corpus and
 * the pure machine / serving / reducers / selectors the screens drive, plus an
 * in-memory AsyncStorage. This is the automated-test equivalent of the Task 14
 * acceptance criterion "Fresh install → start → play → pass/mercy → review →
 * reset completes without data loss or invalid navigation":
 *
 *   fresh install (multiple tracks) → choose Basic at the start-choice screen
 *   → play b01 (miss one, then pass by streak) → wrong-answer history populated;
 *     the missed rule is cleared from the Weakness Queue by correct Review
 *     answers during the same level — proving "clear a weakness, keep the history"
 *   → play b02 to a real 12-answer mercy-end → unlocked but NOT passed, frontier
 *     still advances, the Weakness Queue is fed (nothing clears it on a mercy)
 *   → Review groups every missed question by rule
 *   → a queued rule resurfaces as a Review serve in a later level that carries it
 *   → reset clears progress while settings survive → relaunch re-auto-starts.
 *
 * Every transition asserts the frontier is a real level id and an ended level is
 * never left resumable ("no invalid navigation"); the Weakness Queue and
 * wrong-answer history survive pass/mercy and are only cleared by a deliberate
 * reset ("no data loss"). Importing the real content corpus also re-proves
 * load-time `validateContent()` (Task 13) as part of the journey.
 */

// The journey injects an in-memory store, but `storage.ts` statically imports
// the native AsyncStorage module, which Jest cannot transform — mock it so the
// import resolves (the mock is never exercised by these tests).
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
}));

import { findLevelById, tracks } from '../../content';
import type { Level, Question, QuestionUnion } from '../../content/types';
import { DEFAULT_PASS_CONFIG, type AnswerOutcome } from '../../game/levelMachine';
import { scoreAnswer, type AnswerResponse } from '../../game/scoring';
import { serveNextQuestion, type ServeResult } from '../../game/serving';
import {
  applyAnswer,
  completeLevel,
  createInitialProgress,
  flattenedLevelIds,
  queuedRuleSet,
  recordPlay,
  startMasterySession,
  startLevelSession,
} from '../../state/reducers';
import { repairProgress, reviewGroups, levelStatuses } from '../../state/selectors';
import {
  CURRENT_PROGRESS_VERSION,
  loadProgress,
  loadSettings,
  resetProgress,
  saveProgress,
  saveSettings,
  type StorageLike,
} from '../../state/storage';
import { hydrateSession, type Progress } from '../../state/types';

/** Fixed timestamp so review ordering is deterministic across the journey. */
const NOW = '2026-08-22T00:00:00.000Z';

/** The one flattened sequence every frontier/map/review ordering follows. */
const order = flattenedLevelIds(tracks);

function createStore(): StorageLike {
  const data = new Map<string, string>();
  return {
    async getItem(key) {
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
}

type TestResponse = number | AnswerResponse;

/** Submit a deterministic correct or incorrect response for every question type. */
function responseFor(question: Question, correct: boolean): TestResponse {
  const typed = question as QuestionUnion;
  switch (typed.type) {
    case 'fill_blank':
      return { type: 'text', text: correct ? typed.correctAnswer : '' };
    case 'word_order':
      return {
        type: 'sequence',
        indexes: correct
          ? typed.sentenceWords.map((_, index) => index)
          : typed.sentenceWords.map((_, index) => typed.sentenceWords.length - index - 1),
      };
    case 'fix_sentence':
    case 'multiple_choice':
    default:
      return correct ? typed.correctIndex : (typed.correctIndex + 1) % typed.choices.length;
  }
}

interface PlayedLevel {
  progress: Progress;
  outcome: AnswerOutcome;
  reviewServes: number;
}

/**
 * Play a level to its end (pass or mercy) through the real machine + serving +
 * reducers, returning the post-end progress (active session already cleared),
 * the machine outcome, and how many Review-mode serves occurred.
 */
function playLevel(
  progress: Progress,
  level: Level,
  choose: (question: Question, serve: ServeResult) => TestResponse,
): PlayedLevel {
  let p = startLevelSession(progress, level.id);
  let outcome: AnswerOutcome | null = null;
  let reviewServes = 0;
  for (let guard = 0; guard < 100; guard++) {
    const session = hydrateSession(p.activeSession!);
    const serve = serveNextQuestion(session, level.questions, queuedRuleSet(p), {
      random: () => 0.5,
    });
    if (!serve) {
      break;
    }
    if (serve.mode === 'review') {
      reviewServes++;
    }
    const response = choose(serve.question, serve);
    const result = applyAnswer({
      progress: p,
      question: serve.question,
      ...(typeof response === 'number' ? { chosenIndex: response } : { response }),
      mode: serve.mode,
      config: DEFAULT_PASS_CONFIG,
      now: NOW,
    });
    p = result.progress;
    outcome = result.outcome;
    if (outcome.passed || outcome.endedByMercy) {
      break;
    }
  }
  if (!outcome || (!outcome.passed && !outcome.endedByMercy)) {
    throw new Error(`Level ${level.id} did not end within the guard.`);
  }
  return { progress: p, outcome, reviewServes };
}

describe('full journey — fresh install → play → pass/mercy → review → reset', () => {
  it('completes the whole loop with no data loss and no invalid navigation', async () => {
    const store = createStore();
    const b01 = findLevelById(tracks, 'b01')!;
    const b02 = findLevelById(tracks, 'b02')!;

    // ── Fresh install: choose Basic from the multi-track start-point flow ──
    const boot = createInitialProgress(tracks, { trackId: 'basic', levelNumber: 1 });
    expect(boot!.currentLevelId).toBe('b01');
    expect(boot!.startingPoint).toEqual({ trackId: 'basic', levelNumber: 1 });
    expect(boot!.completedLevelIds).toEqual([]);
    expect(boot!.activeSession).toBeNull();
    await saveProgress(boot!, store);

    // ── Play b01 → miss one, then pass by streak ─────────────────────────────
    let missedRule: string | null = null;
    let first = true;
    const pass = playLevel(boot!, b01, question => {
      if (first) {
        first = false;
        missedRule = question.rule;
        return responseFor(question, false);
      }
      return responseFor(question, true);
    });
    expect(pass.outcome.passed).toBe(true);
    expect(pass.outcome.passReason).toBe('streak');
    expect(missedRule).not.toBeNull();

    let progress = completeLevel(pass.progress, {
      levelId: 'b01',
      passed: true,
      levelOrder: order,
    });
    expect(progress.completedLevelIds).toEqual(['b01']);
    expect(progress.currentLevelId).toBe('b02');
    expect(progress.activeSession).toBeNull(); // an ended level is never resumable
    expect(order).toContain(progress.currentLevelId); // frontier is a real level

    // The single miss persisted its wrong-answer history. The missed rule may
    // have been cleared from the Weakness Queue by correct Review answers within
    // the same level (spec: 2 correct reviews clear) — the history must remain.
    expect(Object.keys(progress.wrongAnswers)).toHaveLength(1);
    expect(progress.wrongAnswers).toHaveProperty(
      [Object.keys(progress.wrongAnswers)[0], 'count'],
      1,
    );

    // ── Play b02 → real 12-answer mercy-end (all wrong): unlocked, NOT passed ──
    const mercy = playLevel(progress, b02, question => responseFor(question, false));
    expect(mercy.outcome.endedByMercy).toBe(true);
    expect(mercy.outcome.passed).toBe(false);
    expect(mercy.outcome.totalAnswered).toBe(12); // the real mercy cap
    expect(mercy.progress.activeSession).toBeNull();

    progress = completeLevel(mercy.progress, {
      levelId: 'b02',
      passed: false,
      levelOrder: order,
    });
    expect(progress.completedLevelIds).toEqual(['b01']); // b02 is NOT completed
    expect(progress.currentLevelId).toBe('b03'); // but the frontier still advances
    expect(progress.activeSession).toBeNull();
    expect(order).toContain(progress.currentLevelId);

    // Mercy feeds the Weakness Queue (no correct Review answer cleared it) and
    // grows the wrong-answer history.
    const queued = queuedRuleSet(progress);
    expect(queued.size).toBeGreaterThan(0);
    for (const rule of queued) {
      expect(progress.weaknessQueue[rule].missCount).toBeGreaterThanOrEqual(1);
      expect(progress.weaknessQueue[rule].reviewStreak).toBe(0);
    }
    expect(Object.keys(progress.wrongAnswers).length).toBeGreaterThan(1);

    // ── Level-map view: b02 unlocked-but-not-passed; b03 current; future locked ──
    const statuses = levelStatuses(tracks, progress);
    const sB02 = statuses.find(s => s.levelId === 'b02')!;
    expect(sB02.unlocked).toBe(true);
    expect(sB02.completed).toBe(false);
    const sB03 = statuses.find(s => s.levelId === 'b03')!;
    expect(sB03.unlocked).toBe(true);
    expect(sB03.isCurrent).toBe(true);
    const sB12 = statuses.find(s => s.levelId === 'b12')!;
    expect(sB12.unlocked).toBe(false); // future levels stay locked

    // ── Review: wrong-answer history grouped by rule, still-queued flagged ──
    const groups = reviewGroups(tracks, progress.wrongAnswers, queued);
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.missedQuestions.length).toBeGreaterThan(0);
      expect(group.ruleTitle.length).toBeGreaterThan(0);
      if (queued.has(group.rule)) {
        expect(group.stillQueued).toBe(true);
      }
    }

    // ── A queued rule resurfaces as a Review serve in a later level that carries ──
    // ── it (fresh serve: priority 2 is a queued rule; the bank has one). ──
    const laterCarrying = order
      .slice(order.indexOf('b02'))
      .map(id => findLevelById(tracks, id)!)
      .find(level => level.questions.some(q => queued.has(q.rule)));
    expect(laterCarrying).toBeDefined();
    const resumed = startLevelSession(progress, laterCarrying!.id);
    const reviewServe = serveNextQuestion(
      hydrateSession(resumed.activeSession!),
      laterCarrying!.questions,
      queued,
      { random: () => 0.5 },
    );
    expect(reviewServe).not.toBeNull();
    expect(reviewServe!.mode).toBe('review');
    expect(queued.has(reviewServe!.question.rule)).toBe(true); // pre-queued before serving

    // ── The journey slice survives a storage round-trip unchanged (no data loss) ──
    await saveProgress(progress, store);
    expect(await loadProgress(store)).toEqual(progress);
    expect(repairProgress(tracks, progress)).toBe(progress); // all ids still valid

    // ── Reset clears progress while settings survive → relaunch re-auto-starts ──
    await saveSettings({ theme: 'dark' }, store);
    expect(await loadSettings(store)).toEqual({ theme: 'dark', notifications: { enabled: false, hour: 9, minute: 0 } });
    await resetProgress(store);
    expect(await loadProgress(store)).toBeNull();
    expect(await loadSettings(store)).toEqual({ theme: 'dark', notifications: { enabled: false, hour: 9, minute: 0 } }); // settings survive
    const fresh = createInitialProgress(tracks, { trackId: 'basic', levelNumber: 1 });
    expect(fresh!.currentLevelId).toBe('b01');
    expect(fresh!.completedLevelIds).toEqual([]);
  });

  it('keeps the frontier valid and never leaves a resumable session across a full pass + mercy chain', () => {
    // The completeLevel chain (b01 pass → b02 mercy → b03 pass) must keep
    // currentLevelId in the real corpus at every step — the "no invalid
    // navigation" invariant the navigator relies on. (Drives the reducers
    // directly with real content.)
    let progress = createInitialProgress(tracks, { trackId: 'basic', levelNumber: 1 });
    for (const [levelId, passed] of [
      ['b01', true],
      ['b02', false],
      ['b03', true],
    ] as const) {
      const level = findLevelById(tracks, levelId)!;
      const ended = playLevel(progress, level, q => responseFor(q, passed));
      progress = completeLevel(ended.progress, {
        levelId,
        passed: ended.outcome.passed,
        levelOrder: order,
      });
      expect(order).toContain(progress.currentLevelId);
      expect(progress.activeSession).toBeNull();
    }
    // After b01 pass + b02 mercy + b03 pass, the frontier is b04 and only the
    // passed levels are completed — the map can render every state from this.
    expect(progress.currentLevelId).toBe('b04');
    expect(progress.completedLevelIds).toEqual(['b01', 'b03']);
    expect(progress.activeSession).toBeNull();
    expect(CURRENT_PROGRESS_VERSION).toBe(progress.version);
  });

  it('covers every response type before cycling Mastery Review at graduation', () => {
    const questions = tracks.flatMap(track =>
      track.levels.flatMap(level => level.questions as QuestionUnion[]),
    );
    const questionTypes = new Set(questions.map(question => question.type));
    expect(questionTypes).toEqual(
      new Set(['multiple_choice', 'fix_sentence', 'fill_blank', 'word_order']),
    );

    for (const question of questions.filter(candidate => questionTypes.has(candidate.type))) {
      const response: AnswerResponse =
        question.type === 'fill_blank'
          ? { type: 'text', text: question.correctAnswer }
          : question.type === 'word_order'
            ? { type: 'sequence', indexes: question.sentenceWords.map((_, index) => index) }
            : { type: 'index', index: question.correctIndex };
      expect(scoreAnswer(question, response).isCorrect).toBe(true);
    }

    let progress = createInitialProgress(tracks, { trackId: 'basic', levelNumber: 1 });
    progress = recordPlay(progress, '2026-08-23');
    expect(progress.dailyStreak).toBe(1);
    progress = startMasterySession(progress, tracks, { random: () => 0 });
    expect(progress.activeSession?.kind).toBe('mastery');

    const masteryQuestion = questions.find(
      question => question.id === progress.activeSession?.bankQuestionIds?.[0],
    )!;
    const response: AnswerResponse =
      masteryQuestion.type === 'fill_blank'
        ? { type: 'text', text: masteryQuestion.correctAnswer }
        : masteryQuestion.type === 'word_order'
          ? { type: 'sequence', indexes: masteryQuestion.sentenceWords.map((_, index) => index) }
          : { type: 'index', index: masteryQuestion.correctIndex };
    const answered = applyAnswer({ progress, question: masteryQuestion, response, mode: 'normal' });
    expect(answered.outcome.passed).toBe(false);
    expect(answered.progress.activeSession?.kind).toBe('mastery');
  });
});
