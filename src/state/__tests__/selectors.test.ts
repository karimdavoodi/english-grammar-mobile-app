/**
 * Tests for the Task 11 derived state selectors: the "unlock is derived" view
 * (unlocked levels, frontier, map status), the persisted-ID repair, the Weakness
 * Queue view, and the Review grouping.
 *
 * Pure functions over content + progress fixtures — no storage or navigation.
 */

import type {
  FillBlankQuestion,
  FixSentenceQuestion,
  Level,
  Question,
  TopicRule,
  Track,
  WordOrderQuestion,
} from '../../content/types';
import type { Progress, WeaknessEntry, WrongAnswerEntry } from '../types';
import {
  completedByTrack,
  firstValidLevelId,
  isLevelUnlocked,
  levelNeedsReview,
  levelStatuses,
  orderedLevels,
  repairProgress,
  resumableLevelId,
  reviewGroups,
  unlockedLevelIds,
  weaknessEntries,
} from '../selectors';

const RULE_PRESENT = 'present_simple_form';
const RULE_PAST = 'past_simple_form';
const RULE_FUTURE = 'future_will';

const PRESENT_RULE: TopicRule = {
  rule: RULE_PRESENT,
  title: 'Present Simple',
  explanation: 'Present explanation.',
  example: 'She works.',
};
const PAST_RULE: TopicRule = {
  rule: RULE_PAST,
  title: 'Past Simple',
  explanation: 'Past explanation.',
  example: 'She worked.',
};
const FUTURE_RULE: TopicRule = {
  rule: RULE_FUTURE,
  title: 'Future will',
  explanation: 'Future explanation.',
  example: 'She will work.',
};

function makeQuestion(
  levelId: string,
  id: string,
  rule: string,
  overrides: Partial<Question> = {},
): Question {
  return {
    id,
    levelId,
    rule,
    prompt: `Prompt ${id}`,
    choices: ['alpha', 'beta', 'gamma', 'delta'],
    correctIndex: 0,
    choiceExplanations: [
      'correct: alpha',
      'wrong: beta',
      'wrong: gamma',
      'wrong: delta',
    ],
    ...overrides,
  };
}

function makeLevel(
  trackId: string,
  id: string,
  number: number,
  rules: TopicRule[],
  questions: Question[] = [],
): Level {
  return {
    id,
    trackId,
    number,
    title: `Level ${id}`,
    topic: { title: `Topic ${id}`, summary: 'summary', rules },
    questions,
  };
}

const b01q01 = makeQuestion('b01', 'b01q01', RULE_PRESENT);
const b01q02 = makeQuestion('b01', 'b01q02', RULE_PRESENT);
const b02q01 = makeQuestion('b02', 'b02q01', RULE_PAST);
const b03q01 = makeQuestion('b03', 'b03q01', RULE_FUTURE);

const b01 = makeLevel('basic', 'b01', 1, [PRESENT_RULE], [b01q01, b01q02]);
const b02 = makeLevel('basic', 'b02', 2, [PAST_RULE], [b02q01]);
const b03 = makeLevel('basic', 'b03', 3, [FUTURE_RULE], [b03q01]);
const i01 = makeLevel('intermediate', 'i01', 1, []);

const TRACKS: Track[] = [
  {
    id: 'basic',
    order: 1,
    name: 'Basic',
    label: 'Beginner',
    eligibleStartingPoint: true,
    levels: [b01, b02, b03],
  },
  {
    id: 'intermediate',
    order: 2,
    name: 'Intermediate',
    label: 'Some English',
    eligibleStartingPoint: false,
    levels: [i01],
  },
];

function makeProgress(overrides: Partial<Progress> = {}): Progress {
  return {
    version: 1,
    startingPoint: { trackId: 'basic', levelNumber: 1 },
    completedLevelIds: [],
    currentLevelId: 'b01',
    activeSession: null,
    weaknessQueue: {},
    wrongAnswers: {},
    ...overrides,
  };
}

function queuedEntry(rule: string, overrides: Partial<WeaknessEntry> = {}): WeaknessEntry {
  return { rule, missCount: 1, reviewStreak: 0, lastMissedAt: 'x', ...overrides };
}

describe('orderedLevels', () => {
  it('flattens tracks by order and levels by number into one sequence', () => {
    expect(orderedLevels(TRACKS).map(level => level.id)).toEqual([
      'b01',
      'b02',
      'b03',
      'i01',
    ]);
  });

  it('returns an empty sequence for no tracks', () => {
    expect(orderedLevels([])).toEqual([]);
  });
});

describe('unlockedLevelIds', () => {
  it('unlocks only the frontier level when it is level 1', () => {
    expect(unlockedLevelIds(TRACKS, makeProgress({ currentLevelId: 'b01' }))).toEqual(
      new Set(['b01']),
    );
  });

  it('unlocks every level at or before the frontier', () => {
    expect(unlockedLevelIds(TRACKS, makeProgress({ currentLevelId: 'b02' }))).toEqual(
      new Set(['b01', 'b02']),
    );
  });

  it('keeps a passed level unlocked even when the frontier has moved past it', () => {
    const progress = makeProgress({
      currentLevelId: 'b02',
      completedLevelIds: ['b01'],
    });
    expect(unlockedLevelIds(TRACKS, progress)).toEqual(new Set(['b01', 'b02']));
  });

  it('unlocks a completed level beyond the frontier without advancing it', () => {
    const progress = makeProgress({
      currentLevelId: 'b01',
      completedLevelIds: ['b02'],
    });
    expect(unlockedLevelIds(TRACKS, progress)).toEqual(new Set(['b01', 'b02']));
  });

  it('unlocks all earlier levels when the frontier is a later track (higher start)', () => {
    expect(unlockedLevelIds(TRACKS, makeProgress({ currentLevelId: 'i01' }))).toEqual(
      new Set(['b01', 'b02', 'b03', 'i01']),
    );
  });

  it('locks levels after the frontier that are not completed', () => {
    expect(unlockedLevelIds(TRACKS, makeProgress({ currentLevelId: 'b02' }))).not.toContain(
      'b03',
    );
  });
});

describe('isLevelUnlocked', () => {
  it('is true at or before the frontier, false after it', () => {
    const progress = makeProgress({ currentLevelId: 'b02' });
    expect(isLevelUnlocked(TRACKS, progress, 'b01')).toBe(true);
    expect(isLevelUnlocked(TRACKS, progress, 'b02')).toBe(true);
    expect(isLevelUnlocked(TRACKS, progress, 'b03')).toBe(false);
    expect(isLevelUnlocked(TRACKS, progress, 'i01')).toBe(false);
  });
});

describe('levelNeedsReview', () => {
  it('is true when any bank question is tagged with a queued rule', () => {
    expect(levelNeedsReview(b02, new Set([RULE_PAST]))).toBe(true);
    expect(levelNeedsReview(b02, new Set([RULE_PRESENT]))).toBe(false);
    expect(levelNeedsReview(b01, new Set([RULE_PAST]))).toBe(false);
  });
});

describe('levelStatuses', () => {
  it('flags current, completed, and needs-review per level', () => {
    const progress = makeProgress({
      currentLevelId: 'b02',
      completedLevelIds: ['b01'],
      weaknessQueue: { [RULE_PAST]: queuedEntry(RULE_PAST) },
    });

    const statuses = levelStatuses(TRACKS, progress);
    const byId = Object.fromEntries(statuses.map(s => [s.levelId, s]));

    expect(byId.b01).toMatchObject({
      unlocked: true,
      completed: true,
      isCurrent: false,
      needsReview: false,
    });
    expect(byId.b02).toMatchObject({
      unlocked: true,
      completed: false,
      isCurrent: true,
      needsReview: true, // its bank question is tagged with the queued past rule
    });
    expect(byId.b03).toMatchObject({
      unlocked: false,
      completed: false,
      isCurrent: false,
      needsReview: false,
    });
  });

  it('keeps the flattened order for the map', () => {
    expect(levelStatuses(TRACKS, makeProgress()).map(s => s.levelId)).toEqual([
      'b01',
      'b02',
      'b03',
      'i01',
    ]);
  });
});

describe('firstValidLevelId', () => {
  it('returns the first level in the sequence', () => {
    expect(firstValidLevelId(TRACKS)).toBe('b01');
  });

  it('returns null when no levels exist', () => {
    expect(firstValidLevelId([])).toBeNull();
  });
});

describe('repairProgress', () => {
  it('returns the same reference when nothing needs repairing', () => {
    const progress = makeProgress({ currentLevelId: 'b02' });
    expect(repairProgress(TRACKS, progress)).toBe(progress);
  });

  it('advances an unknown current level to the first valid level', () => {
    const next = repairProgress(TRACKS, makeProgress({ currentLevelId: 'b99' }));
    expect(next.currentLevelId).toBe('b01');
    expect(next).not.toBe(makeProgress({ currentLevelId: 'b99' }));
  });

  it('drops completed level ids that no longer resolve', () => {
    const progress = makeProgress({
      currentLevelId: 'b02',
      completedLevelIds: ['b01', 'b99'],
    });
    const next = repairProgress(TRACKS, progress);
    expect(next.completedLevelIds).toEqual(['b01']);
  });

  it('clears an active session whose level no longer exists', () => {
    const progress = makeProgress({
      activeSession: {
        levelId: 'b99',
        askedIds: [],
        correctCount: 0,
        streak: 0,
        totalAnswered: 0,
        missCounts: {},
        lastWrongRule: null,
      },
    });
    const next = repairProgress(TRACKS, progress);
    expect(next.activeSession).toBeNull();
  });

  it('keeps a valid active session and repairs an unknown current level together', () => {
    const progress = makeProgress({
      currentLevelId: 'b99',
      activeSession: {
        levelId: 'b01',
        askedIds: ['b01q01'],
        correctCount: 1,
        streak: 1,
        totalAnswered: 1,
        missCounts: {},
        lastWrongRule: null,
      },
    });
    const next = repairProgress(TRACKS, progress);
    expect(next.currentLevelId).toBe('b01');
    expect(next.activeSession).not.toBeNull();
    expect(next.activeSession?.levelId).toBe('b01');
  });

  it('stays in the completion state when no levels exist', () => {
    const progress = makeProgress({ currentLevelId: '' });
    expect(repairProgress([], progress).currentLevelId).toBe('');
  });
});

describe('weaknessEntries', () => {
  it('exposes the queue entries as an array (due reviews)', () => {
    const progress = makeProgress({
      weaknessQueue: {
        [RULE_PRESENT]: queuedEntry(RULE_PRESENT, { missCount: 2, reviewStreak: 1 }),
      },
    });
    expect(weaknessEntries(progress)).toEqual([
      { rule: RULE_PRESENT, missCount: 2, reviewStreak: 1, lastMissedAt: 'x' },
    ]);
  });

  it('returns an empty array for an empty queue', () => {
    expect(weaknessEntries(makeProgress())).toEqual([]);
  });
});

describe('reviewGroups', () => {
  const wrongAnswers: Record<string, WrongAnswerEntry> = {
    'b01q01': {
      questionId: 'b01q01',
      count: 2,
      lastChosenIndex: 2,
      lastMissedAt: '2026-08-01T10:00:00.000Z',
    },
    'b01q02': {
      questionId: 'b01q02',
      count: 1,
      lastChosenIndex: 1,
      lastMissedAt: '2026-08-02T10:00:00.000Z',
    },
    'b02q01': {
      questionId: 'b02q01',
      count: 3,
      lastChosenIndex: 2,
      lastMissedAt: '2026-08-03T10:00:00.000Z',
    },
    // Unknown historical question id — must be omitted.
    ghost_q1: {
      questionId: 'ghost_q1',
      count: 5,
      lastChosenIndex: 0,
      lastMissedAt: '2026-08-04T10:00:00.000Z',
    },
  };

  it('omits unknown question ids and groups the rest by rule', () => {
    const groups = reviewGroups(TRACKS, wrongAnswers);
    expect(groups.map(g => g.rule)).toEqual([RULE_PAST, RULE_PRESENT]);
  });

  it('orders groups by the most recent miss, freshest first', () => {
    const groups = reviewGroups(TRACKS, wrongAnswers);
    expect(groups[0].rule).toBe(RULE_PAST); // latest miss 08-03
    expect(groups[1].rule).toBe(RULE_PRESENT); // latest miss 08-02
  });

  it('orders questions within a group most-recently-missed first', () => {
    const groups = reviewGroups(TRACKS, wrongAnswers);
    const present = groups.find(g => g.rule === RULE_PRESENT)!;
    expect(present.missedQuestions.map(m => m.question.id)).toEqual(['b01q02', 'b01q01']);
  });

  it('resolves the chosen/correct answers and both explanations', () => {
    const groups = reviewGroups(TRACKS, wrongAnswers);
    const present = groups.find(g => g.rule === RULE_PRESENT)!;
    const q02 = present.missedQuestions.find(m => m.question.id === 'b01q02')!;

    expect(q02.count).toBe(1);
    expect(q02.correctAnswer).toBe('alpha');
    expect(q02.chosenAnswer).toBe('beta');
    expect(q02.correctExplanation).toBe('correct: alpha');
    expect(q02.wrongExplanation).toBe('wrong: beta');
  });

  it('carries the canonical rule teaching into the group header', () => {
    const groups = reviewGroups(TRACKS, wrongAnswers);
    const past = groups.find(g => g.rule === RULE_PAST)!;
    expect(past.ruleTitle).toBe('Past Simple');
    expect(past.ruleExplanation).toBe('Past explanation.');
    expect(past.ruleExample).toBe('She worked.');
  });

  it('flags still-queued rules', () => {
    const groups = reviewGroups(TRACKS, wrongAnswers, new Set([RULE_PRESENT]));
    const present = groups.find(g => g.rule === RULE_PRESENT)!;
    const past = groups.find(g => g.rule === RULE_PAST)!;
    expect(present.stillQueued).toBe(true);
    expect(past.stillQueued).toBe(false);
  });

  it('returns an empty list when there are no mistakes', () => {
    expect(reviewGroups(TRACKS, {})).toEqual([]);
  });

  it('treats a wrong choice equal to the correct index as correct-answer text', () => {
    const wrongAnswersWithCorrectChosen: Record<string, WrongAnswerEntry> = {
      'b02q01': {
        questionId: 'b02q01',
        count: 1,
        lastChosenIndex: 0, // correctIndex 0 — the player actually chose right
        lastMissedAt: '2026-08-05T10:00:00.000Z',
      },
    };
    const groups = reviewGroups(TRACKS, wrongAnswersWithCorrectChosen);
    expect(groups[0].missedQuestions[0].chosenAnswer).toBe('alpha');
    expect(groups[0].missedQuestions[0].correctAnswer).toBe('alpha');
  });
});

describe('reviewGroups — typed responses', () => {
  const fill: FillBlankQuestion = {
    type: 'fill_blank',
    id: 'typed-fill',
    levelId: 'typed',
    rule: 'typed_fill_rule',
    prompt: 'She ___ here.',
    correctAnswer: 'works',
    acceptedAnswers: ['works'],
    explanation: 'Use the present simple for a routine.',
    commonMistakes: [{ mistake: 'work', feedback: 'Add -s for she.' }],
  };
  const order: WordOrderQuestion = {
    type: 'word_order',
    id: 'typed-order',
    levelId: 'typed',
    rule: 'typed_order_rule',
    sentenceWords: ['They', 'have', 'arrived'],
    explanation: 'Put the subject before the verb.',
  };
  const fix: FixSentenceQuestion = {
    type: 'fix_sentence',
    id: 'typed-fix',
    levelId: 'typed',
    rule: 'typed_fix_rule',
    prompt: 'Choose the correction.',
    faultySentence: 'She work here.',
    choices: ['She works here.', 'She working here.', 'She worked here.', 'She work here.'],
    correctIndex: 0,
    choiceExplanations: ['Correct.', 'Wrong.', 'Wrong tense.', 'Missing -s.'],
  };
  const typedTrack = {
    id: 'typed-track',
    order: 1,
    name: 'Typed',
    label: 'Typed',
    eligibleStartingPoint: true,
    levels: [
      {
        id: 'typed',
        trackId: 'typed-track',
        number: 1,
        title: 'Typed questions',
        topic: {
          title: 'Typed questions',
          summary: 'Typed summary',
          rules: [
            { rule: fill.rule, title: fill.rule, explanation: 'Fill rule', example: 'She works.' },
            { rule: order.rule, title: order.rule, explanation: 'Order rule', example: 'They have arrived.' },
            { rule: fix.rule, title: fix.rule, explanation: 'Fix rule', example: 'She works here.' },
          ],
        },
        questions: [fill, order, fix] as unknown as Question[],
      },
    ],
  } as unknown as Track;

  it('resolves fill-blank, word-order, and fix-sentence responses', () => {
    const groups = reviewGroups([typedTrack], {
      [fill.id]: {
        questionId: fill.id,
        count: 1,
        lastChosenIndex: -1,
        lastResponse: { type: 'text', text: 'work' },
        lastMissedAt: '2026-08-22T10:00:00.000Z',
      },
      [order.id]: {
        questionId: order.id,
        count: 1,
        lastChosenIndex: -1,
        lastResponse: { type: 'sequence', indexes: [0, 2, 1] },
        lastMissedAt: '2026-08-22T11:00:00.000Z',
      },
      [fix.id]: {
        questionId: fix.id,
        count: 1,
        lastChosenIndex: 1,
        lastResponse: { type: 'index', index: 1 },
        lastMissedAt: '2026-08-22T12:00:00.000Z',
      },
    });

    const missed = Object.fromEntries(
      groups.flatMap(group => group.missedQuestions.map(question => [question.question.id, question])),
    );
    expect(missed[fill.id]).toMatchObject({
      chosenAnswer: 'work',
      correctAnswer: 'works',
      wrongExplanation: 'Add -s for she.',
      correctExplanation: fill.explanation,
    });
    expect(missed[order.id]).toMatchObject({
      chosenAnswer: 'They arrived have',
      correctAnswer: 'They have arrived',
      correctExplanation: order.explanation,
    });
    expect(missed[fix.id]).toMatchObject({
      chosenAnswer: 'She working here.',
      correctAnswer: 'She works here.',
      wrongExplanation: 'Wrong.',
    });
  });
});

describe('completedByTrack', () => {
  it('counts passed levels per track in track order', () => {
    const progress = makeProgress({
      currentLevelId: 'b03',
      completedLevelIds: ['b01', 'b02'],
    });
    expect(completedByTrack(TRACKS, progress)).toEqual([
      { trackId: 'basic', trackName: 'Basic', totalLevels: 3, completedLevels: 2 },
      { trackId: 'intermediate', trackName: 'Intermediate', totalLevels: 1, completedLevels: 0 },
    ]);
  });

  it('counts only passed levels — not unlocked or current levels', () => {
    const progress = makeProgress({ currentLevelId: 'b02', completedLevelIds: [] });
    expect(completedByTrack(TRACKS, progress)).toEqual([
      { trackId: 'basic', trackName: 'Basic', totalLevels: 3, completedLevels: 0 },
      { trackId: 'intermediate', trackName: 'Intermediate', totalLevels: 1, completedLevels: 0 },
    ]);
  });

  it('returns an empty list when there are no tracks', () => {
    expect(completedByTrack([], makeProgress())).toEqual([]);
  });
});

describe('resumableLevelId', () => {
  it('resumes a normal level session at its saved level', () => {
    const progress = makeProgress({
      currentLevelId: 'b01',
      activeSession: {
        levelId: 'b02',
        askedIds: ['b02q01'],
        correctCount: 1,
        streak: 1,
        totalAnswered: 1,
        missCounts: {},
        lastWrongRule: null,
      },
    });
    expect(resumableLevelId(progress)).toEqual({ kind: 'level', levelId: 'b02' });
  });

  it('routes a mastery session to Mixed Review (sentinel levelId is not a real level)', () => {
    const progress = makeProgress({
      activeSession: {
        levelId: 'mastery',
        kind: 'mastery',
        askedIds: [],
        correctCount: 0,
        streak: 0,
        totalAnswered: 0,
        missCounts: {},
        lastWrongRule: null,
      },
    });
    expect(resumableLevelId(progress)).toEqual({ kind: 'mastery' });
  });

  it('routes a mixed session to Mixed Review (sentinel levelId is not a real level)', () => {
    const progress = makeProgress({
      activeSession: {
        levelId: 'mixed',
        kind: 'mixed',
        askedIds: [],
        correctCount: 0,
        streak: 0,
        totalAnswered: 0,
        missCounts: {},
        lastWrongRule: null,
      },
    });
    expect(resumableLevelId(progress)).toEqual({ kind: 'mastery' });
  });

  it('resumes at the current frontier level when no session is active', () => {
    expect(resumableLevelId(makeProgress({ currentLevelId: 'b05' }))).toEqual({
      kind: 'level',
      levelId: 'b05',
    });
  });

  it('falls back to the current level when a level session has no level id', () => {
    const progress = makeProgress({
      currentLevelId: 'b01',
      activeSession: {
        levelId: '',
        askedIds: [],
        correctCount: 0,
        streak: 0,
        totalAnswered: 0,
        missCounts: {},
        lastWrongRule: null,
      },
    });
    expect(resumableLevelId(progress)).toEqual({ kind: 'level', levelId: 'b01' });
  });
});
