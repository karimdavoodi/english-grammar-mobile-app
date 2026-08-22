import {
  answerQuestion,
  createSession,
  FinishedLevelError,
  pickNextQuestion,
  type AnswerOutcome,
  type LevelSession,
  type Question,
} from '../levelMachine';

/** A wrong choice index for any fixture question (never the correct one). */
const wrongIndex = (q: Question) => (q.correctIndex + 1) % q.choices.length;

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    levelId: 'b03',
    rule: 'past_perfect_vs_past_simple',
    prompt: 'By the time we got to the station, the train ___ .',
    choices: ['left', 'had left', 'has left', 'leaves'],
    correctIndex: 1,
    choiceExplanations: ['left: wrong', 'had left: right', 'has left: wrong', 'leaves: wrong'],
    ...overrides,
  };
}

const q1 = makeQuestion({ id: 'b03q01' });
const q2 = makeQuestion({ id: 'b03q02', rule: 'past_perfect_form' });
const q3 = makeQuestion({ id: 'b03q03' });

/** Answer a sequence and return the final session + outcomes. */
function playThrough(
  moves: Array<{ q: Question; correct: boolean }>,
): { session: LevelSession; outcomes: AnswerOutcome[] } {
  let session = createSession('b03');
  const outcomes: AnswerOutcome[] = [];
  for (const { q, correct } of moves) {
    const r = answerQuestion(session, q, correct ? q.correctIndex : wrongIndex(q));
    session = r.session;
    outcomes.push(r.outcome);
  }
  return { session, outcomes };
}

describe('createSession', () => {
  it('starts in_progress with zeroed counters', () => {
    expect(createSession('b03')).toEqual({
      levelId: 'b03',
      askedIds: [],
      correctCount: 0,
      streak: 0,
      totalAnswered: 0,
      missCounts: {},
      status: 'in_progress',
    });
  });
});

describe('Level Play — pass rules (Gherkin: Level Play)', () => {
  it('passes by streak: 3 correct in a row', () => {
    const { session, outcomes } = playThrough([
      { q: q1, correct: true },
      { q: q2, correct: true },
      { q: q3, correct: true },
    ]);

    expect(session.status).toBe('passed');
    expect(outcomes.map(o => o.streak)).toEqual([1, 2, 3]);
    expect(outcomes[0]).toMatchObject({ passed: false, passReason: null });
    expect(outcomes[2]).toMatchObject({ passed: true, passReason: 'streak' });
  });

  it('passes by volume: 8 total correct with no 3-streak', () => {
    // C C W C C W C C W C C — 8 correct at answer 11, streak never exceeds 2
    const { session, outcomes } = playThrough([
      { q: q1, correct: true },
      { q: q2, correct: true },
      { q: q3, correct: false },
      { q: q1, correct: true },
      { q: q2, correct: true },
      { q: q3, correct: false },
      { q: q1, correct: true },
      { q: q2, correct: true },
      { q: q3, correct: false },
      { q: q1, correct: true },
      { q: q2, correct: true },
    ]);

    expect(session.status).toBe('passed');
    expect(session.correctCount).toBe(8);
    expect(outcomes[outcomes.length - 1]).toMatchObject({
      passed: true,
      passReason: 'volume',
    });
  });

  it('does not pass before either rule is met', () => {
    const { session } = playThrough([
      { q: q1, correct: true },
      { q: q2, correct: true },
      { q: q3, correct: false },
    ]);
    expect(session.status).toBe('in_progress');
    expect(session.correctCount).toBe(2);
    expect(session.streak).toBe(0);
  });
});

describe('Level Play — mercy cap (Gherkin: mercy cap ends a struggling level)', () => {
  it('mercy-ends on the 12th answer when never passing', () => {
    let session = createSession('b03');
    for (let i = 0; i < 11; i++) {
      const r = answerQuestion(session, q1, wrongIndex(q1));
      session = r.session;
      expect(session.status).toBe('in_progress');
    }
    const r = answerQuestion(session, q1, wrongIndex(q1));
    expect(r.outcome).toMatchObject({ passed: false, endedByMercy: true });
    expect(r.session.status).toBe('mercy_ended');
    expect(r.session.totalAnswered).toBe(12);
  });

  it('mercy-ends even if the cap is reached on a correct answer below volume', () => {
    const { session } = playThrough([
      // 11 corrects in a row — streak passes at 3, so instead build a 1-streak pattern
      { q: q1, correct: true },
      { q: q2, correct: false },
      { q: q3, correct: true },
      { q: q1, correct: false },
      { q: q2, correct: true },
      { q: q3, correct: false },
      { q: q1, correct: true },
      { q: q2, correct: false },
      { q: q3, correct: true },
      { q: q1, correct: false },
      { q: q2, correct: true },
      { q: q3, correct: false }, // 12th answer, correctCount = 6
    ]);
    expect(session.status).toBe('mercy_ended');
    expect(session.correctCount).toBe(6);
  });

  it('counts missed rules for the Weakness Queue after mercy end', () => {
    let session = createSession('b03');
    for (let i = 0; i < 12; i++) {
      session = answerQuestion(session, i % 2 === 0 ? q1 : q2, wrongIndex(i % 2 === 0 ? q1 : q2))
        .session;
    }
    expect(session.missCounts).toEqual({ [q1.rule]: 6, [q2.rule]: 6 });
  });
});

describe('Teach on Failure (Gherkin: Teach on Failure)', () => {
  it('resets the streak and records the rule on a wrong answer', () => {
    let session = createSession('b03');
    session = answerQuestion(session, q1, q1.correctIndex).session; // streak 1
    session = answerQuestion(session, q2, q2.correctIndex).session; // streak 2

    const r = answerQuestion(session, q3, wrongIndex(q3)); // wrong

    expect(r.outcome).toMatchObject({ isCorrect: false, streak: 0 });
    expect(r.session.missCounts).toEqual({ [q3.rule]: 1 });
  });

  it('counts each miss per rule, and never counts correct answers', () => {
    let session = createSession('b03');
    session = answerQuestion(session, q1, wrongIndex(q1)).session; // miss rule A
    session = answerQuestion(session, q1, wrongIndex(q1)).session; // miss rule A again
    session = answerQuestion(session, q2, wrongIndex(q2)).session; // miss rule B
    session = answerQuestion(session, q1, q1.correctIndex).session; // correct (no new miss)

    expect(session.missCounts).toEqual({ [q1.rule]: 2, [q2.rule]: 1 });
  });
});

describe('pickNextQuestion (Gherkin: next question targets the missed rule)', () => {
  const bank = [q1, q2, q3]; // q1 & q3 share a rule; q2's rule is unique
  const randomZero = () => 0;

  it('returns a question from the bank', () => {
    const picked = pickNextQuestion(bank, new Set(), null, { random: randomZero });
    expect(bank).toContain(picked);
  });

  it('never returns an already-asked question', () => {
    const asked = new Set([q1.id]);
    const picked = pickNextQuestion(bank, asked, null, { random: randomZero });
    expect(picked).not.toBeNull();
    expect(asked.has(picked!.id)).toBe(false);
  });

  it('targets the same rule after a wrong answer', () => {
    // q2 was answered wrong; q2's rule is unique, so only q2 matches — already asked,
    // which forces the fallback. Instead ask q1 wrong and expect a q3 (same rule).
    const asked = new Set([q1.id]);
    const picked = pickNextQuestion(bank, asked, q1.rule, { random: randomZero });
    expect(picked!.rule).toBe(q1.rule);
    expect(picked!.id).toBe(q3.id);
  });

  it('falls back to random when no unasked same-rule question remains', () => {
    const asked = new Set([q2.id]); // only q2 carries its rule
    const picked = pickNextQuestion(bank, asked, q2.rule, { random: randomZero });
    expect(picked!.id).not.toBe(q2.id);
    expect(picked!.id).toBe(q1.id); // randomZero → first unasked
  });

  it('prioritizes a queued rule for review after the immediate re-test', () => {
    // q1 & q3 share a rule; q2's rule is unique. Queue q2's rule.
    const asked = new Set([q3.id]);
    const queuedRules = new Set([q2.rule]);
    const picked = pickNextQuestion(bank, asked, null, { random: randomZero, queuedRules });
    expect(picked!.rule).toBe(q2.rule);
  });

  it('falls back to random when no unasked queued-rule question remains', () => {
    const asked = new Set([q2.id]); // q2 is the only queued-rule question, and it's asked
    const queuedRules = new Set([q2.rule]);
    const picked = pickNextQuestion(bank, asked, null, { random: randomZero, queuedRules });
    expect(picked!.id).toBe(q1.id); // randomZero → first unasked
  });

  it('returns null when the bank is exhausted', () => {
    const asked = new Set(bank.map(q => q.id));
    expect(pickNextQuestion(bank, asked, null)).toBeNull();
  });
});

describe('Guards', () => {
  it('refuses to score an answer on a finished level', () => {
    let session = createSession('b03');
    session = answerQuestion(session, q1, q1.correctIndex).session;
    session = answerQuestion(session, q2, q2.correctIndex).session;
    session = answerQuestion(session, q3, q3.correctIndex).session; // passed

    expect(() => answerQuestion(session, q1, q1.correctIndex)).toThrow(FinishedLevelError);
  });

  it('rejects an out-of-range choice index', () => {
    const session = createSession('b03');
    expect(() => answerQuestion(session, q1, 4)).toThrow(RangeError);
    expect(() => answerQuestion(session, q1, -1)).toThrow(RangeError);
  });
});
