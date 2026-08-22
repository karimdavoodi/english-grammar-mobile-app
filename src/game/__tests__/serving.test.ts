import {
  createSession,
  type LevelSession,
  type Question,
} from '../levelMachine';
import {
  classifyMode,
  RE_TEACH_MISS_THRESHOLD,
  serveNextQuestion,
  shouldReTeach,
  type ServeResult,
} from '../serving';

const RULE_A = 'past_perfect_vs_past_simple';
const RULE_B = 'past_perfect_form';
const RULE_C = 'past_simple_form';

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    levelId: 'b03',
    rule: RULE_A,
    prompt: 'By the time we got to the station, the train ___ .',
    choices: ['left', 'had left', 'has left', 'leaves'],
    correctIndex: 1,
    choiceExplanations: ['left: wrong', 'had left: right', 'has left: wrong', 'leaves: wrong'],
    ...overrides,
  };
}

// RULE_A and RULE_B each have a variant; RULE_C is a unique question.
const qA1 = makeQuestion({ id: 'b03q01' });
const qA2 = makeQuestion({ id: 'b03q02' });
const qB1 = makeQuestion({ id: 'b03q03', rule: RULE_B });
const qB2 = makeQuestion({ id: 'b03q04', rule: RULE_B });
const qC1 = makeQuestion({ id: 'b03q05', rule: RULE_C });
const bank = [qA1, qA2, qB1, qB2, qC1];

/** Build a session for the fixture level at an arbitrary machine state. */
function sessionAt(overrides: Partial<LevelSession>): LevelSession {
  return { ...createSession('b03'), ...overrides };
}

const randomZero = () => 0;
const randomAlmostOne = () => 0.99;

describe('classifyMode', () => {
  it('marks a same-rule re-test of the last wrong rule as remediation', () => {
    expect(classifyMode(qA1, RULE_A, new Set())).toBe('remediation');
  });

  it('marks remediation even when the rule is also queued (remediation is never Review)', () => {
    expect(classifyMode(qA1, RULE_A, new Set([RULE_A]))).toBe('remediation');
  });

  it('marks a queued rule as review when it is not the last wrong rule', () => {
    expect(classifyMode(qB1, RULE_A, new Set([RULE_B]))).toBe('review');
  });

  it('marks a queued rule as review when no remediation is active', () => {
    expect(classifyMode(qB1, null, new Set([RULE_B]))).toBe('review');
  });

  it('marks everything else as normal', () => {
    expect(classifyMode(qC1, RULE_A, new Set([RULE_B]))).toBe('normal');
    expect(classifyMode(qC1, null, new Set())).toBe('normal');
  });
});

describe('shouldReTeach', () => {
  it('is false for a rule never missed this level', () => {
    expect(shouldReTeach(sessionAt({ missCounts: {} }), RULE_A)).toBe(false);
  });

  it('is false below the threshold (first miss — teach-on-failure already covered it)', () => {
    const session = sessionAt({ missCounts: { [RULE_A]: RE_TEACH_MISS_THRESHOLD - 1 } });
    expect(shouldReTeach(session, RULE_A)).toBe(false);
  });

  it('is true at the threshold — a rule missed twice re-shows the card', () => {
    const session = sessionAt({ missCounts: { [RULE_A]: RE_TEACH_MISS_THRESHOLD } });
    expect(shouldReTeach(session, RULE_A)).toBe(true);
  });

  it('is true above the threshold', () => {
    const session = sessionAt({ missCounts: { [RULE_A]: RE_TEACH_MISS_THRESHOLD + 1 } });
    expect(shouldReTeach(session, RULE_A)).toBe(true);
  });

  it('is false for other rules regardless of this rule’s miss count', () => {
    const session = sessionAt({ missCounts: { [RULE_A]: RE_TEACH_MISS_THRESHOLD + 2 } });
    expect(shouldReTeach(session, RULE_B)).toBe(false);
  });
});

describe('serveNextQuestion — normal serving', () => {
  it('serves the first question of a fresh level as normal, no lesson', () => {
    const result = serveNextQuestion(sessionAt({}), bank, new Set());
    expect(result).not.toBeNull();
    expect(bank).toContain(result!.question);
    expect(result!.mode).toBe('normal');
    expect(result!.showLesson).toBe(false);
  });

  it('respects injectable randomness', () => {
    const session = sessionAt({});
    const first = serveNextQuestion(session, bank, new Set(), { random: randomZero });
    const last = serveNextQuestion(session, bank, new Set(), { random: randomAlmostOne });
    expect(first!.question.id).toBe('b03q01');
    expect(last!.question.id).toBe('b03q05'); // floor(0.99 * 5) = index 4
  });

  it('never re-serves an already-asked question', () => {
    const session = sessionAt({ askedIds: [qA1.id, qB1.id, qC1.id] });
    const result = serveNextQuestion(session, bank, new Set(), { random: randomZero });
    expect(result!.question.id).toBe('b03q02'); // first unasked
  });

  it('returns null when the bank is exhausted', () => {
    const session = sessionAt({ askedIds: bank.map(q => q.id) });
    expect(serveNextQuestion(session, bank, new Set())).toBeNull();
  });

  it('returns null for a finished level', () => {
    const session = sessionAt({ status: 'passed', askedIds: [] });
    expect(serveNextQuestion(session, bank, new Set())).toBeNull();
  });
});

describe('serveNextQuestion — remediation', () => {
  it('serves an unasked same-rule variant as remediation after a wrong answer', () => {
    // Missed qA1; its rule still has an unasked variant (qA2).
    const session = sessionAt({ lastWrongRule: RULE_A, askedIds: [qA1.id] });
    const result = serveNextQuestion(session, bank, new Set(), { random: randomZero });
    expect(result!.question.id).toBe(qA2.id);
    expect(result!.mode).toBe('remediation');
    expect(result!.showLesson).toBe(false); // first miss — teach-on-failure only
  });

  it('is not Review even when the re-tested rule is also queued', () => {
    const session = sessionAt({ lastWrongRule: RULE_A, askedIds: [qA1.id] });
    const result = serveNextQuestion(session, bank, new Set([RULE_A]), { random: randomZero });
    expect(result!.question.id).toBe(qA2.id);
    expect(result!.mode).toBe('remediation');
  });

  it('falls back to a queued-rule Review when no same-rule variant remains', () => {
    // qC1 is the only RULE_C question and it was asked; RULE_B is queued.
    const session = sessionAt({ lastWrongRule: RULE_C, askedIds: [qC1.id] });
    const result = serveNextQuestion(session, bank, new Set([RULE_B]), { random: randomZero });
    expect(result!.question.id).toBe(qB1.id);
    expect(result!.mode).toBe('review');
  });

  it('falls back to normal when neither remediation nor review is available', () => {
    // qC1 is the only RULE_C question and it was asked; nothing queued.
    const session = sessionAt({ lastWrongRule: RULE_C, askedIds: [qC1.id] });
    const result = serveNextQuestion(session, bank, new Set(), { random: randomZero });
    expect(result!.mode).toBe('normal');
  });
});

describe('serveNextQuestion — Review', () => {
  it('serves an unasked queued-rule question as review', () => {
    const session = sessionAt({});
    const result = serveNextQuestion(session, bank, new Set([RULE_B]), { random: randomZero });
    expect(result!.question.id).toBe(qB1.id);
    expect(result!.mode).toBe('review');
    expect(result!.showLesson).toBe(false);
  });

  it('does not force a queued rule into a level whose bank lacks it', () => {
    // RULE_C is queued but the only RULE_C question is already asked → never forced.
    const session = sessionAt({ askedIds: [qC1.id] });
    const result = serveNextQuestion(session, bank, new Set([RULE_C]), { random: randomZero });
    expect(result!.question.id).not.toBe(qC1.id);
    expect(result!.mode).toBe('normal');
  });

  it('re-teaches before a review question whose rule was missed twice this level', () => {
    const session = sessionAt({ missCounts: { [RULE_B]: RE_TEACH_MISS_THRESHOLD } });
    const result = serveNextQuestion(session, bank, new Set([RULE_B]), { random: randomZero });
    expect(result!.question.id).toBe(qB1.id);
    expect(result!.mode).toBe('review');
    expect(result!.showLesson).toBe(true);
  });
});

describe('serveNextQuestion — re-teach', () => {
  it('re-teaches before the next question on a rule missed twice', () => {
    const session = sessionAt({
      lastWrongRule: RULE_A,
      askedIds: [qA1.id],
      missCounts: { [RULE_A]: RE_TEACH_MISS_THRESHOLD },
    });
    const result = serveNextQuestion(session, bank, new Set(), { random: randomZero });
    expect(result!.question.id).toBe(qA2.id);
    expect(result!.mode).toBe('remediation');
    expect(result!.showLesson).toBe(true);
  });

  it('keeps re-teaching while the rule keeps being missed', () => {
    const session = sessionAt({
      lastWrongRule: RULE_A,
      askedIds: [qA1.id],
      missCounts: { [RULE_A]: RE_TEACH_MISS_THRESHOLD + 2 },
    });
    const result = serveNextQuestion(session, bank, new Set(), { random: randomZero });
    expect(result!.showLesson).toBe(true);
  });
});

describe('serveNextQuestion — immutable pre-answer snapshot', () => {
  it('returns a stable mode from the inputs alone, independent of later state', () => {
    const session = sessionAt({ lastWrongRule: RULE_C, askedIds: [qC1.id] });
    const queued = new Set([RULE_B]);

    const r1 = serveNextQuestion(session, bank, queued, { random: randomZero });
    const r2 = serveNextQuestion(session, bank, queued, { random: randomZero });

    expect(r1).toEqual(r2);
    expect(r1!.mode).toBe('review');

    // The snapshot is not recomputed from the queue after the fact: mutating the
    // input set does not change what was already served.
    const snapshot: ServeResult = r1!;
    queued.clear();
    expect(snapshot.mode).toBe('review');
  });
});
