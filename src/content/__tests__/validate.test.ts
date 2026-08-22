import {
  ContentValidationError,
  validateContent,
} from '../validate';
import type { Level, Question, Track } from '../types';

const MERCY_CAP = 12;

/**
 * Build a valid, shippable question. A fixed 4-choice shape with correctIndex 0
 * and a non-empty aligned explanation at every position.
 */
function makeQuestion(id: string, rule: string, levelId: string): Question {
  return {
    id,
    levelId,
    rule,
    prompt: `Question ${id}`,
    choices: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
    correctIndex: 0,
    choiceExplanations: [
      `'Alpha' is correct (${rule}).`,
      `'Bravo' is wrong (${rule}).`,
      `'Charlie' is wrong (${rule}).`,
      `'Delta' is wrong (${rule}).`,
    ],
  };
}

/**
 * Build a valid level with a mercy-cap-sized bank that alternates across the
 * given rules, and a topic that defines exactly those rules. Ids are derived
 * from the owning track so multi-track corpora never collide.
 */
function makeLevel(
  trackId: string,
  number: number,
  rules: string[],
  overrides: Partial<Level> = {},
): Level {
  const id = overrides.id ?? `${trackId}l${number}`;
  const questions: Question[] = [];
  for (let i = 0; i < MERCY_CAP; i++) {
    const rule = rules[i % rules.length];
    questions.push(makeQuestion(`${id}q${String(i + 1).padStart(2, '0')}`, rule, id));
  }
  return {
    id,
    trackId,
    number,
    title: `Level ${number}`,
    topic: {
      title: `Topic ${number}`,
      summary: `Summary of topic ${number}.`,
      rules: rules.map(rule => ({
        rule,
        title: rule,
        explanation: `Form + use of ${rule}.`,
        example: `Example of ${rule}.`,
      })),
    },
    questions,
    ...overrides,
  };
}

/** A single-level, single-track corpus that passes every check. */
function makeTrack(overrides: Partial<Track> = {}): Track {
  const id = overrides.id ?? 'basic';
  return {
    id,
    order: 1,
    name: 'Basic',
    label: 'Beginner',
    eligibleStartingPoint: true,
    levels: [makeLevel(id, 1, ['rule_a', 'rule_b'])],
    ...overrides,
  };
}

describe('validateContent — valid corpus', () => {
  it('accepts a well-formed track without throwing', () => {
    expect(() => validateContent([makeTrack()], { mercyCap: MERCY_CAP })).not.toThrow();
  });

  it('accepts a valid correctIndex / explanation alignment (choices, explanations, correctIndex all consistent)', () => {
    const track = makeTrack();
    // correctIndex 0 aligns with a non-empty "why it's right" explanation at [0].
    expect(track.levels[0].questions[0].choiceExplanations[0]).not.toBe('');
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).not.toThrow();
  });

  it('accepts multiple tracks with distinct ids and orders', () => {
    const basic = makeTrack();
    const advanced = makeTrack({ id: 'advanced', order: 2, eligibleStartingPoint: false });
    // The advanced track needs its own canonical rules — the rule registry is
    // global, so re-using rule_a/rule_b would be a duplicate-definition error.
    advanced.levels[0] = makeLevel('advanced', 1, ['rule_x', 'rule_y']);
    expect(() => validateContent([basic, advanced], { mercyCap: MERCY_CAP })).not.toThrow();
  });

  it('accepts a recurring rule: a later level tags a canonical rule defined in an earlier level', () => {
    const track = makeTrack();
    // Level 2's bank contains a question tagged rule_a, whose canonical
    // definition lives in level 1 — and level 2 does NOT re-define rule_a.
    const level2 = makeLevel('basic', 2, ['rule_c']);
    level2.questions[0] = { ...level2.questions[0], rule: 'rule_a' };
    track.levels.push(level2);
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).not.toThrow();
  });
});

describe('validateContent — question shape', () => {
  it('rejects a question without exactly 4 choices', () => {
    const track = makeTrack();
    track.levels[0].questions[0].choices = ['Alpha', 'Bravo', 'Charlie'];
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects a correctIndex outside 0..3', () => {
    const track = makeTrack();
    track.levels[0].questions[0].correctIndex = 4;
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects a non-integer correctIndex', () => {
    const track = makeTrack();
    track.levels[0].questions[0].correctIndex = 1.5;
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects choiceExplanations not aligned to the 4 choices', () => {
    const track = makeTrack();
    track.levels[0].questions[0].choiceExplanations = ['only one'];
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects any empty choice explanation', () => {
    const track = makeTrack();
    track.levels[0].questions[0].choiceExplanations[2] = '   ';
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });
});

describe('validateContent — id and reference integrity', () => {
  it('rejects duplicate question ids', () => {
    const track = makeTrack();
    track.levels[0].questions[1] = { ...track.levels[0].questions[1], id: track.levels[0].questions[0].id };
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects duplicate level ids', () => {
    const track = makeTrack();
    track.levels.push(makeLevel('basic', 2, ['rule_c'], { id: track.levels[0].id }));
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects duplicate track ids', () => {
    expect(() =>
      validateContent([makeTrack(), makeTrack({ order: 2 })], { mercyCap: MERCY_CAP }),
    ).toThrow(ContentValidationError);
  });

  it('rejects duplicate track.order values', () => {
    expect(() =>
      validateContent([makeTrack(), makeTrack({ id: 'advanced', eligibleStartingPoint: false })], {
        mercyCap: MERCY_CAP,
      }),
    ).toThrow(ContentValidationError);
  });

  it('rejects a Level.trackId that does not match its containing track', () => {
    const track = makeTrack();
    track.levels[0].trackId = 'not-basic';
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects a Question.levelId that does not match its containing level', () => {
    const track = makeTrack();
    track.levels[0].questions[0].levelId = 'some-other-level';
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects a Question.rule that resolves to no TopicRule anywhere', () => {
    const track = makeTrack();
    track.levels[0].questions[0].rule = 'no_such_rule';
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });
});

describe('validateContent — TopicRule registry', () => {
  it('rejects duplicate TopicRule.rule definitions anywhere in the corpus', () => {
    const track = makeTrack();
    // Level 2 re-defines rule_a, duplicating level 1's canonical definition.
    track.levels.push(makeLevel('basic', 2, ['rule_a', 'rule_c']));
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });
});

describe('validateContent — track structure', () => {
  it('rejects a gap or repeat in level.number sequence', () => {
    const track = makeTrack();
    track.levels.push(makeLevel('basic', 3, ['rule_c'])); // 1, 3 — skips 2
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects level.number not starting at 1', () => {
    const track = makeTrack();
    track.levels[0].number = 2;
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects content with no eligible starting point', () => {
    const track = makeTrack({ eligibleStartingPoint: false });
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects an eligible starting-point track that has no level 1', () => {
    const track = makeTrack();
    track.levels = []; // empty track: no level 1 available as a starting point
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects a level whose bank is smaller than the mercy cap', () => {
    const track = makeTrack();
    track.levels[0].questions = track.levels[0].questions.slice(0, MERCY_CAP - 1);
    expect(() => validateContent([track], { mercyCap: MERCY_CAP })).toThrow(ContentValidationError);
  });

  it('rejects a bank smaller than a raised mercy cap', () => {
    const track = makeTrack();
    expect(() => validateContent([track], { mercyCap: 15 })).toThrow(ContentValidationError);
  });
});

describe('ContentValidationError', () => {
  it('reports every violation in one throw, not just the first', () => {
    const track = makeTrack();
    track.levels[0].questions[0].rule = 'missing_rule';
    track.levels[0].questions[1].choices = ['a', 'b'];
    try {
      validateContent([track], { mercyCap: MERCY_CAP });
      throw new Error('expected validateContent to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      const validationError = error as ContentValidationError;
      expect(validationError.problems.length).toBeGreaterThan(1);
      expect(validationError.problems.some(p => p.includes('missing_rule'))).toBe(true);
      expect(validationError.problems.some(p => p.includes('exactly 4'))).toBe(true);
    }
  });
});
