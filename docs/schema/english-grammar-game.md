# English Grammar Game — Content & State Schema

TypeScript shape behind the principle: **the app is a player, the content is a database.**

Two distinct worlds:

1. **Content** — static, bundled with the app, read-only. Tracks, levels, lessons, questions. Adding levels = shipping more content, never code.
2. **State** — runtime, persisted locally on the device (AsyncStorage). Progress, weakness queue, wrong answers, settings.

---

## 1. Content

```typescript
// ── Tracks (chapters) ──────────────────────────────────────────────
type TrackId = 'basic' | 'intermediate' | 'advanced';

interface Track {
  id: TrackId;
  order: number;        // 1..n — defines chapter order on the map
  name: string;         // 'Basic'
  label: string;        // user-facing: 'Beginner'
  levels: Level[];      // ordered by level.number
}

// ── Levels ────────────────────────────────────────────────────────
interface Level {
  id: string;           // e.g. 'b03'
  trackId: TrackId;
  number: number;       // 1-based, sequential within the track
  title: string;        // e.g. 'Past Perfect'
  topic: Topic;         // the single grammar topic this level teaches
  questions: Question[]; // the bank (~12) — must be ≥ mercy cap (12)
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
interface Question {
  id: string;           // e.g. 'b03q01' — globally unique
  levelId: string;      // owning level
  rule: string;         // narrow rule tag (may belong to this topic OR an earlier topic)
  prompt: string;       // 'By the time we got to the station, the train ___ .'
  choices: string[];          // exactly 4
  correctIndex: number;       // 0–3
  choiceExplanations: string[]; // exactly 4, positionally aligned with choices:
                                //   [correctIndex] = why that choice is RIGHT
                                //   the other 3   = why each choice is WRONG
}
```

### How the `rule` tag powers the mechanics

- **Adaptive serving (within a level):** pick the next unasked question by priority — (1) a variant of the rule just missed, (2) any rule in the Weakness Queue (served marked *"Review"*), (3) otherwise random from the bank.
- **Weakness Queue (across levels):** keyed by `rule`. Every wrong answer upserts its rule immediately (`missCount++`, `reviewStreak` reset to 0) — whether the level is later passed or mercy-ended. A question resurfaces marked *"Review"* when its `rule` is in the queue — even if that rule's *home* is an earlier level.
- **Lesson card content:** a wrong answer shows the level's `topic.summary` plus the `TopicRule` whose `rule` matches the question — a global lookup, so a review question pulls the explanation from its *home* topic, not the current level's.
- **Review screen:** wrong-answer records group by the question's `rule`.

### Content validation (run at load/dev-time, fail fast)

`validateContent()` must throw on any of these — a safety net for AI-generated content:

- [ ] `choices.length === 4` and `correctIndex` in `0..3`
- [ ] No duplicate `question.id`, `level.id`, `rule` tags
- [ ] Every `Question.rule` resolves to a `TopicRule` somewhere in the corpus
- [ ] `level.number` is sequential (1, 2, 3, …) within each track
- [ ] Each level's bank size ≥ 12 (never recycle mid-level before the mercy cap)
- [ ] Rules that recur across levels exist in **both** their home topic and the recurring level's bank
- [ ] `choiceExplanations.length === 4`, positionally aligned with `choices`
- [ ] All 4 choice explanations are non-empty — a question with no "why" ships broken teaching
- [ ] `choiceExplanations[correctIndex]` states why that choice is right (reviewer check — can't be fully automated)

### Example — one level

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
}

// ── Progress ──────────────────────────────────────────────────────
interface Progress {
  version: number;              // schema version — gate for migrations
  startingPoint: {              // from the start-higher choice
    trackId: TrackId;
    levelNumber: number;        // 1-based, within the chosen track (e.g. 1 for Beginner, 1 for Advanced)
  };
  completedLevelIds: string[];  // passed levels — drives the map indicators
  currentLevelId: string;       // where the player is next (advances past passed AND mercy-ended levels)
  weaknessQueue: Record<string, WeaknessEntry>;  // keyed by rule tag
  wrongAnswers: Record<string, WrongAnswerEntry>; // keyed by question id
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
  lastMissedAt: string;   // ISO timestamp
}

// ── Root ──────────────────────────────────────────────────────────
interface AppState {
  settings: Settings;
  progress: Progress | null;   // null until the starting-point choice is made
}
```

### Persistence notes

- Single AsyncStorage key per concern: `egg:settings`, `egg:progress` — small, atomic, cheap.
- `progress.version` lets future versions migrate saved games when the shape changes.
- Content lookups always go **by id** into the bundled content — state never duplicates question text, only references ids. This is what makes adding levels in a release safe (old saved ids still resolve; unknown ids are ignored gracefully).
- Reset = clear `egg:progress` (and re-enter the starting-point choice). Settings survive a reset.
- **Unlock is derived, never stored:** a level is unlocked when its map position is ≤ `currentLevelId` (or it's in `completedLevelIds`). Passed, mercy-ended, and skipped-earlier levels all land in the same "unlocked but not passed" bucket — replayable, no pass mark. Mercy-end is not a separate persisted state. Levels whose rules appear in `weaknessQueue` may show a "needs review" indicator.

---

## 3. Proposed file layout

```
src/
  content/
    tracks/basic.ts          # or basic.json — one file per track
    tracks/intermediate.ts
    tracks/advanced.ts
    index.ts                 # assembles all tracks + runs validateContent()
  state/
    storage.ts               # AsyncStorage load/save, versioning
    selectors.ts             # derived views (unlocked levels, due reviews, ...)
  ...
```

New levels ship as edits to these content files only — no screen, no logic, no schema changes.
