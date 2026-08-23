# English Grammar Review — Content & State Schema

TypeScript shape behind the principle: **the app is a player, the content is a database.**

Two distinct worlds:

1. **Content** — static, bundled with the app, read-only. Tracks, levels, lessons, questions. Adding levels = shipping more content, never code.
2. **State** — runtime, persisted locally on the device (AsyncStorage). Progress, weakness queue, wrong answers, settings.

---

## 1. Content

```typescript
// ── Tracks (chapters) ──────────────────────────────────────────────
type TrackId = string; // content-defined stable ID; e.g. 'basic'

interface Track {
  id: TrackId;
  order: number;        // 1..n — defines chapter order on the map
  name: string;         // 'Basic'
  label: string;        // user-facing: 'Beginner'
  levels: Level[];      // ordered by level.number
  eligibleStartingPoint: boolean; // controls onboarding choices; Basic is true in the MVP
}

// ── Levels ────────────────────────────────────────────────────────
interface Level {
  id: string;           // e.g. 'b03'
  trackId: TrackId;
  number: number;       // 1-based, sequential within the track
  title: string;        // e.g. 'Past Perfect'
  topic: Topic;         // the single grammar topic this level teaches
  questions: Question[]; // the bank (≥ mercy cap; recommended target ~12)
}

// ── Topic / Lesson (the teaching card) ────────────────────────────
interface Topic {
  title: string;        // 'Past Perfect'
  summary: string;      // one-paragraph teaching blurb (shown on the lesson card)
  rules: TopicRule[];   // the sub-rules of this topic
}

interface TopicRule {
  rule: string;         // GLOBAL tag — links to Question.rule. The key of the whole design.
  title: string;        // human: 'Past Perfect vs Past Simple'
  explanation: string;  // the teaching: form + use
  example: string;      // example sentence(s)
}

// ── Questions ─────────────────────────────────────────────────────
type Question =
  | MultipleChoiceQuestion
  | FixSentenceQuestion
  | FillBlankQuestion
  | WordOrderQuestion;

interface QuestionBase {
  id: string;           // e.g. 'b03q01' — globally unique
  levelId: string;      // owning level
  rule: string;         // narrow rule tag (may belong to this topic OR an earlier topic)
}

interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple_choice'; // legacy source objects may omit this; the loader adds it
  prompt: string;       // 'By the time we got to the station, the train ___ .'
  choices: string[];          // exactly 4
  correctIndex: number;       // 0–3
  choiceExplanations: string[]; // exactly 4, positionally aligned with choices:
                                //   [correctIndex] = why that choice is RIGHT
                                //   the other 3   = why each choice is WRONG
}

interface FixSentenceQuestion extends MultipleChoiceQuestion {
  type: 'fix_sentence';
  faultySentence: string; // sentence shown above the four correction choices
}

interface FillBlankQuestion extends QuestionBase {
  type: 'fill_blank';
  prompt: string;         // contains the blank to complete
  correctAnswer: string;  // canonical answer
  acceptedAnswers: string[]; // non-empty normalized accepted forms
  explanation: string;
  commonMistakes?: { mistake: string; feedback: string }[];
}

interface WordOrderQuestion extends QuestionBase {
  type: 'word_order';
  sentenceWords: string[]; // canonical order; at least 3 non-empty words
  prompt?: string;
  explanation: string;
}
```

### How the `rule` tag powers the mechanics

- **Adaptive serving (within a level):** pick the next unasked question by priority — (1) a same-level remediation variant of the rule just missed, (2) any rule already in the Weakness Queue (served marked *"Review"*), (3) otherwise random from the bank.
- **Weakness Queue (across levels):** keyed by `rule`. Every wrong answer upserts its rule immediately (`missCount++`, `reviewStreak` reset to 0) — whether the level is later passed or mercy-ended. A question resurfaces marked *"Review"* when its `rule` is in the queue — even if that rule's *home* is an earlier level.
- **Lesson card content:** a wrong answer shows the current level's `topic.summary` plus the `TopicRule` whose `rule` matches the question. For a Review question, the UI labels the rule explanation as a review of an earlier topic so the two contexts are not confused.
- **Review screen:** wrong-answer records group by the question's `rule`.

### Content validation (run at load/dev-time, fail fast)

`validateContent()` must throw on any of these — a safety net for AI-generated content:

- [ ] `multiple_choice` and `fix_sentence` questions have `choices.length === 4` and `correctIndex` in `0..3`
- [ ] `fill_blank` questions have non-empty `acceptedAnswers` and `correctAnswer`
- [ ] `word_order` questions have at least 3 non-empty `sentenceWords`
- [ ] No duplicate `question.id`, `level.id`, or `TopicRule.rule` definitions
- [ ] No duplicate `track.id` values or `track.order` values
- [ ] Every `Level.trackId` matches its containing track
- [ ] Every `Question.levelId` matches its containing level
- [ ] Every `Question.rule` resolves to a `TopicRule` somewhere in the corpus
- [ ] `level.number` is sequential (1, 2, 3, …) within each track
- [ ] At least one track is marked `eligibleStartingPoint`, and each eligible track has level 1
- [ ] Each level's bank size ≥ the configured mercy cap (12 in v1; never recycle mid-level before the cap)
- [ ] Rules that recur across levels exist in **both** their home topic and the recurring level's bank
- [ ] `choiceExplanations.length === 4`, positionally aligned with `choices`
- [ ] All 4 choice explanations are non-empty — a question with no "why" ships broken teaching
- [ ] `choiceExplanations[correctIndex]` states why that choice is right (reviewer check — can't be fully automated)

Legacy content may omit `type`; the loader normalizes it to `multiple_choice` before
the app consumes the corpus. Loaded questions always carry the explicit discriminator.

### Example — abbreviated level fragment

This fragment intentionally shows two questions for readability. A shippable level must contain at least 12 questions in v1.

```json
{
  "id": "b03",
  "trackId": "basic",
  "number": 3,
  "title": "Past Perfect",
  "topic": {
    "title": "Past Perfect",
    "summary": "The past perfect describes an action completed before another past action.",
    "rules": [
      {
        "rule": "past_perfect_form",
        "title": "Form: had + past participle",
        "explanation": "Formed with 'had' + the past participle (worked, gone, seen).",
        "example": "They had finished dinner before we arrived."
      },
      {
        "rule": "past_perfect_vs_past_simple",
        "title": "Past Perfect vs Past Simple",
        "explanation": "Use past simple for the later action and past perfect for the earlier one.",
        "example": "The train had left (earlier) by the time we arrived (later)."
      }
    ]
  },
  "questions": [
    {
      "id": "b03q01",
      "levelId": "b03",
      "rule": "past_perfect_vs_past_simple",
      "prompt": "By the time we got to the station, the train ___.",
      "choices": ["left", "had left", "has left", "leaves"],
      "correctIndex": 1,
      "choiceExplanations": [
        "'Left' is past simple — fine for the later action, but the departure happened before we arrived, so the earlier action needs past perfect.",
        "'Had left' is correct: past perfect marks the earlier of two past actions.",
        "'Has left' is present perfect — wrong here; the departure is a completed past event before another past event.",
        "'Leaves' is present simple — wrong tense for any past context."
      ]
    },
    {
      "id": "b03q02",
      "levelId": "b03",
      "rule": "past_perfect_vs_past_simple",
      "prompt": "She ___ her keys before I asked.",
      "choices": ["already found", "has already found", "had already found", "finds"],
      "correctIndex": 2,
      "choiceExplanations": [
        "'Already found' is past simple — the finding still needs to be marked as earlier than the asking.",
        "'Has already found' is present perfect — wrong; the asking is a past event, not a present one.",
        "'Had already found' is correct: past perfect for the action completed before the asking.",
        "'Finds' is present simple — wrong tense here."
      ]
    }
  ]
}
```

---

## 2. State (persisted locally)

```typescript
// ── Settings ──────────────────────────────────────────────────────
interface Settings {
  theme: 'device' | 'light' | 'dark';
  notifications: {
    enabled: boolean;
    hour: number;                // local time, 0–23
    minute: number;              // local time, 0–59
  };
}

// ── Progress ──────────────────────────────────────────────────────
interface Progress {
  version: number;              // schema version — gate for migrations
  startingPoint: {              // from the content-defined start choice
    trackId: TrackId;
    levelNumber: number;        // 1-based, within the chosen track (e.g. 1 for Beginner, 1 for Advanced)
  };
  completedLevelIds: string[];  // passed levels — drives the map indicators
  currentLevelId: string;       // frontier/next level; advances past passed AND mercy-ended levels
  activeSession: LevelSession | null; // resumable in-progress level, if any
  weaknessQueue: Record<string, WeaknessEntry>;  // keyed by rule tag
  wrongAnswers: Record<string, WrongAnswerEntry>; // keyed by question id
  dailyStreak: number;                            // consecutive practice calendar days
  bestStreak: number;                             // highest dailyStreak reached
  lastPlayedDate: string | null;                  // local YYYY-MM-DD
}

interface WeaknessEntry {
  rule: string;
  missCount: number;      // total wrong answers on this rule (monotonic — never decremented)
  reviewStreak: number;   // consecutive correct review answers; ≥ 2 → cleared; resets to 0 on a new miss
  lastMissedAt: string;   // ISO timestamp of the most recent miss
}

interface WrongAnswerEntry {
  questionId: string;
  count: number;          // times this question was missed
  lastChosenIndex: number;
  lastResponse?: AnswerResponse; // typed response; absent on pre-v2 saved answers
  lastMissedAt: string;   // ISO timestamp
}

type AnswerResponse =
  | { type: 'index'; index: number }
  | { type: 'text'; text: string }
  | { type: 'sequence'; indexes: number[] };

// Persisted snapshot of an in-progress session. The machine-only `status`
// (in_progress | passed | mercy_ended) is not stored — `activeSession` is
// cleared the moment a level ends, so a saved session is always in progress.
interface LevelSession {
  levelId: string;
  askedIds: string[];                 // questions already served, in order — never re-served
  correctCount: number;               // total correct (volume pass progress, 8 in v1)
  streak: number;                     // consecutive correct (streak pass progress, 3 in v1)
  totalAnswered: number;              // answers submitted, correct or not (mercy cap, 12 in v1)
  missCounts: Record<string, number>; // rule → times missed this session (drives re-teach)
  lastWrongRule: string | null;       // rule of the last wrong answer (null if none or last was correct) — resumes remediation
}

// Mixed Review reuses the same machine counters. Its bank is snapshotted so a
// relaunch serves the same question ids and does not rebuild from changed
// progress; `currentLevelId` is never changed by a mixed session.
interface MixedSession extends LevelSession {
  kind: 'mixed';
  bankQuestionIds: string[]; // de-duplicated, selected-at-start question ids
}

// Mastery Review uses the same persisted bank snapshot but cycles askedIds
// back to an empty list when the bank is exhausted. It has no pass or mercy
// outcome and ends only when the player explicitly exits.
interface MasterySession extends LevelSession {
  kind: 'mastery';
  bankQuestionIds: string[]; // the whole corpus, prioritized then shuffled
}

// ── Root ──────────────────────────────────────────────────────────
interface AppState {
  settings: Settings;
  progress: Progress | null;   // null until the starting-point choice is made
}
```

### Persistence notes

- Single AsyncStorage key per concern: `egg:settings`, `egg:progress`, and `egg:events` — small, atomic, cheap.
- `progress.version` lets future versions migrate saved games when the shape changes. Version 3 adds optional mixed-session metadata; version 4 adds daily streak fields without changing learning data. Older saves migrate through the registered chain.
- Progress version 2 adds the optional `WrongAnswerEntry.lastResponse` field. Version 1
  records retain `lastChosenIndex` and migrate without losing history; when `lastResponse`
  is absent, Review treats the record as a legacy index response.
- Content lookups always go **by id** into the bundled content — state never duplicates question text, only references ids. Adding levels in a release is safe because old saved IDs still resolve. Unknown historical question IDs may be omitted from Review, but an unknown current level must be repaired to the first valid level at or after the saved frontier; if none exists, show completion.
- Reset = clear `egg:progress` (and re-enter the starting-point choice). Settings survive a reset.
- `egg:events` is an append-only, bounded local statistics log. Answer, level-end, and
  session lifecycle events remain after a progress reset; Stats derives totals, accuracy,
  practice-date/streak history, and time played from this separate key.
- **Unlock is derived, never stored:** flatten tracks by ascending `track.order`, then levels by ascending `level.number`. A level is unlocked when it occurs at or before the saved frontier, or its ID is in `completedLevelIds`. Passed levels show a pass mark; mercy-ended and skipped-earlier levels are unlocked but not passed. Mercy-end is not a separate persisted state. Levels whose rules appear in `weaknessQueue` may show a "needs review" indicator.
- `activeSession` is cleared when a level passes or mercy-ends and is restored after app restart. It is reset when the player deliberately abandons a session.
- Mixed Review uses the same counters with a volume target and ends when that target or its snapshotted bank is exhausted. Its answers update the Weakness Queue and wrong-answer history, while ending it clears only `activeSession` and leaves `currentLevelId` unchanged.
- A level passes when `streak >= 3` or `correctCount >= 8`; otherwise a session mercy-ends when `totalAnswered >= 12`. Review and remediation questions count normally toward all level counters.

---

## 3. Proposed file layout

```
src/
  content/
    tracks/*.ts              # or JSON — content-defined tracks
    index.ts                 # assembles all tracks + runs validateContent()
  state/
    storage.ts               # AsyncStorage load/save, versioning
    selectors.ts             # derived views (unlocked levels, due reviews, ...)
  ...
```

New levels and tracks ship as edits/additions to these content files only — no screen, progression logic, or schema changes. The loader derives the map sequence and onboarding choices from the content metadata.
