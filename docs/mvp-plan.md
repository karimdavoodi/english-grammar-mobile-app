# Implementation Plan: English Grammar Game — MVP (Basic Track)

> Source documents:
> - `docs/ideas/english-grammar-game.md` — product vision & MVP scope
> - `docs/schema/english-grammar-game.md` — content & state schema
> - `docs/use-cases/english-grammar-game.md` — Gherkin behavioral spec

## Overview

Build the MVP of a mastery-based grammar game. A player answers multiple-choice
questions on a single grammar topic per level; passing a level proves mastery via
**3 correct in a row OR 8 total correct, whichever comes first**, with a
**12-question mercy cap** so nobody is stuck forever. Every wrong answer teaches
(the topic lesson card + the "why" of each choice) before re-testing the same rule.
Missed rules accumulate in a cross-level **Weakness Queue** and resurface in later
levels and on a **Review screen**.

The governing principle: **the app is a player, the content is a database.** Tracks,
levels, topics, rules, and questions are all data. Adding a level or an entire track
is a content edit, never a code change. v1 ships the Basic track only (a validated
subset of ~10–15 levels); Intermediate and Advanced arrive later as content releases.

**Already done (do not redo):** `src/game/levelMachine.ts` implements the pure
level-play state machine — `createSession`, `answerQuestion` (streak/volume/mercy
pass rules), and `pickNextQuestion` (remediation → review → random) — with a full
Jest suite in `src/game/__tests__/levelMachine.test.ts`. The plan below builds on it.

## Architecture Decisions

- **Pure, testable core.** Game logic (scoring, serving, validation, selectors,
  reducers) lives in plain TypeScript modules with no React/RN imports and is covered
  by Jest — matching the existing `levelMachine.ts` style. UI screens stay thin.
- **Content as data, read-only.** All content types and tracks live under
  `src/content/`; `validateContent()` runs at load/dev-time and throws on malformed
  AI-generated content (fail-fast). No question text is ever stored in state — only IDs.
- **State is local and id-referencing.** Progress, Weakness Queue, wrong-answer
  history, and settings persist via AsyncStorage under `egg:progress` / `egg:settings`.
  Unlock state is **derived**, never stored.
- **Navigation via React Navigation** (native-stack). It is the community standard,
  handles the Android hardware back button and screen transitions, and the app has
  ~6 screens. Alternative (hand-rolled screen state machine) is viable but re-implements
  back-stack behavior for no benefit.
- **State management via React Context + pure reducers** (no Redux/Zustand). The
  state shape is small and the derived views are pure functions; an extra dependency
  adds weight without value.
- **Theme via a small React context** (`ThemeProvider`) over a light/dark token
  palette, honoring the `device | light | dark` setting. No extra library.
- **Android-first.** Verify on `npm run android`; iOS follows once the loop is proven.

### Implementation contracts

- **Canonical rule definitions.** Each `TopicRule.rule` is defined exactly once in
  the level/topic where that rule is introduced. Later levels may include questions
  tagged with that rule, but do not duplicate the `TopicRule` definition; the
  validator resolves those questions against the global rule registry. A recurring
  rule therefore must exist in its home topic and have at least one question in the
  recurring level's bank. This preserves global rule identity without conflicting
  duplicate lesson text.
- **Machine versus persisted sessions.** `src/game/levelMachine.ts` keeps its
  machine-only `status` field. `src/state/types.ts` defines a separate
  `PersistedLevelSession` without `status`, and storage/adapters explicitly map
  between the two. The persisted `activeSession` is always in progress.
- **Review mode is a serving snapshot.** `serving.ts` receives the Weakness Queue
  before the question is selected and returns the resulting mode. Reducers, not the
  serving function, update `reviewStreak` after an answer. Same-level remediation
  never counts as a Review answer.

### Dependencies to add

| Package | Purpose |
|---|---|
| `@react-native-async-storage/async-storage` | Local persistence (required) |
| `@react-navigation/native` + `@react-navigation/native-stack` | Navigation (decision above) |
| `react-native-screens` | Native-stack peer dependency |

`react-native-safe-area-context` is already present. Everything else is in `package.json`.

---

## Target folder structure

The tree below is what **Task 1** creates. `src/game/` and its test already exist and
are preserved as-is.

```
src/
  game/                          # pure game logic (already present)
    levelMachine.ts              # level session state machine (exists)
    serving.ts                   # adaptive next-question orchestration (new)
    __tests__/
      levelMachine.test.ts       # (exists)
      serving.test.ts            # (new)
  content/                       # the "database": static, bundled, read-only
    types.ts                     # Track, Level, Topic, TopicRule, Question
    validate.ts                  # validateContent()
    tracks/
      basic.ts                   # Basic track — ~10–15 levels in v1
    index.ts                     # assemble all tracks + run validateContent()
    __tests__/
      validate.test.ts
  state/                         # runtime, persisted local state
    types.ts                     # AppState, Settings, Progress, LevelSession, WeaknessEntry, WrongAnswerEntry
    storage.ts                   # AsyncStorage load/save + version migration
    selectors.ts                 # derived views: unlocked levels, frontier, due reviews
    reducers.ts                  # pure transitions (progress, weakness queue)
    __tests__/
  theme/
    tokens.ts                    # spacing, typography, radii
    themes.ts                    # light + dark palettes
    ThemeProvider.tsx            # device/light/dark context
  navigation/
    types.ts                     # route param types
    AppNavigator.tsx             # root stack
  screens/
    StartPointScreen.tsx         # first-launch starting-point choice
    LevelMapScreen.tsx           # track/level map
    LevelPlayScreen.tsx          # question loop
    ResultScreen.tsx             # pass / mercy-end
    ReviewScreen.tsx             # wrong-answer study history
    SettingsScreen.tsx           # reset + theme
  components/
    LessonCard.tsx               # teach-on-failure card
    QuestionCard.tsx             # prompt + 4 choices
    ChoiceButton.tsx             # single answer choice
    ProgressHeader.tsx           # streak / correct-count / cap header
  app/
    AppProvider.tsx              # loads content + state, wires providers
```

---

## Task List

### Phase 0 — Foundation

- [ ] Task 1: Establish the project folder structure
- [ ] Task 2: Content schema types + validator
- [ ] Task 3: State types + AsyncStorage persistence

### Checkpoint: Foundation
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes (existing `levelMachine` suite remains intact)
- [ ] `npm run lint` clean

### Phase 1 — Content & serving

- [ ] Task 4: Content loader + one fully-authored reference level
- [ ] Task 5: Author remaining Basic levels (content only)
- [ ] Task 6: Adaptive serving orchestrator

### Checkpoint: Content & serving
- [ ] `validateContent()` passes on the full Basic track
- [ ] Serving respects remediation → review → random with tests

### Phase 2 — Core loop (vertical slice)

- [ ] Task 7A: Question and teaching components
- [ ] Task 7B: Level play screen + persistence + adaptive loop
- [ ] Task 8: Pass / mercy-end flow + result screen + frontier advance

### Checkpoint: Core loop
- [ ] Question → answer → teach/feedback → next loop works end-to-end on device
- [ ] Pass by streak, pass by volume, and mercy-end all behave per Gherkin

### Phase 3 — Navigation and onboarding

- [ ] Task 9: Root navigator + starting-point screen

### Phase 4 — Derived progress, map, and review

- [ ] Task 11: Progress selectors + Weakness Queue + Review screen
- [ ] Task 10: Level map screen (after Task 11 selectors)

### Checkpoint: Navigation, map, and review
- [ ] First launch shows the correct start path; returning players skip it
- [ ] Map reflects derived lock/pass/current state

### Phase 5 — Settings and theme

- [ ] Task 12: Settings (reset, theme) + theme system

### Checkpoint: Review, settings, theme
- [ ] Review groups wrong answers by rule and keeps history after clearing weakness
- [ ] Reset clears progress and returns to the starting-point choice
- [ ] Theme follows/pins device/light/dark correctly

### Phase 6 — Integration & verification

- [ ] Task 13: End-to-end provider wiring and load-time validation
- [ ] Task 14: Full Gherkin verification and Android smoke/regression pass

### Checkpoint: Complete
- [ ] All Gherkin scenarios in `use-cases` satisfied
- [ ] `npm run android` builds and the full loop runs without errors
- [ ] Ready for content + retention review

---

## Tasks in detail

### Task 1: Establish the project folder structure

**Description:** Create the `src/` layout documented above — directories, empty
module stubs, and per-module `README` placeholders. The existing `src/game/`
module is already in the correct location and is preserved without modification.
This is the foundation every later task imports from, so it must land first and
keep the app compiling.

**Acceptance criteria:**
- [ ] `src/game/`, `src/content/`, `src/content/tracks/`, `src/state/`, `src/theme/`,
      `src/navigation/`, `src/screens/`, `src/components/`, `src/app/` all exist.
- [ ] Each module has a one-line `README.md` or header comment describing its contract.
- [ ] Existing `src/game/levelMachine.ts` and its test remain untouched.
- [ ] `App.tsx` still boots (`NewAppScreen`) — no functional change yet.

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes (existing suite intact)
- [ ] `npm run lint` clean

**Dependencies:** None

**Files likely touched:**
- `src/**/*` (new directories + stubs)

**Estimated scope:** Medium (many new files, but all trivial stubs)

---

### Task 2: Content schema types + validator

**Description:** Define the content TypeScript interfaces exactly as in
`docs/schema/english-grammar-game.md` (`Track`, `Level`, `Topic`, `TopicRule`,
`Question`) and implement `validateContent()` covering every fail-fast rule in the
schema doc (4 choices + aligned explanations, unique ids, `trackId`/`levelId`
consistency, `rule` resolves to a `TopicRule`, sequential `level.number`, ≥1
`eligibleStartingPoint`, bank ≥ mercy cap, etc.). Treat `TopicRule.rule` as a
global registry: definitions are unique, while recurring levels reference the
existing definition through tagged questions.

**Acceptance criteria:**
- [ ] Types mirror the schema doc field-for-field.
- [ ] `validateContent(tracks, { mercyCap })` throws on each documented violation.
- [ ] Recurring rules are accepted when their canonical definition exists once and
      the recurring level contains tagged questions for that rule; duplicate rule
      definitions are rejected.
- [ ] Valid content passes; a valid `correctIndex` / explanation alignment is accepted.
- [ ] Covered by Jest (`src/content/__tests__/validate.test.ts`).

**Verification:**
- [ ] `npm test -- validate`
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 1

**Files likely touched:**
- `src/content/types.ts`
- `src/content/validate.ts`
- `src/content/__tests__/validate.test.ts`

**Estimated scope:** Medium

---

### Task 3: State types + AsyncStorage persistence

**Description:** Define the runtime state types (`AppState`, `Settings`, `Progress`,
`PersistedLevelSession`, `WeaknessEntry`, `WrongAnswerEntry`) and implement
`storage.ts` —
load/save under `egg:settings` / `egg:progress`, a `progress.version` migration gate,
and `resetProgress()` that clears `egg:progress` while settings survive. Add
`@react-native-async-storage/async-storage`.

**Acceptance criteria:**
- [ ] Persisted types mirror the schema doc's "State" section and exclude the
      machine-only `status` field.
- [ ] Explicit adapters map between the persisted session and the existing
      `levelMachine.LevelSession` without dropping counters or asked IDs.
- [ ] Save/load round-trips state; unknown-version state triggers the migration path.
- [ ] Reset clears progress and preserves settings.
- [ ] Storage functions are injectable (async-store injected) for testability; covered by Jest.

**Verification:**
- [ ] `npm test -- storage`
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 1

**Files likely touched:**
- `src/state/types.ts`
- `src/state/storage.ts`
- `src/state/__tests__/storage.test.ts`
- `package.json` (add async-storage)

**Estimated scope:** Medium

---

### Task 4: Content loader + one fully-authored reference level

**Description:** Build `content/index.ts` (assemble all tracks, run `validateContent()`
at load) and author **one complete Basic level** (e.g. "Past Perfect") with a
~12-question bank across its topic rules, using the schema doc's example fragment as
the model. This proves the content pipeline end-to-end before mass authoring.

**Acceptance criteria:**
- [ ] `content/index.ts` exports a validated `Track[]` (or throws).
- [ ] The reference level passes `validateContent()`.
- [ ] The level has ≥ 12 questions, 4 choices each, all explanations non-empty.

**Verification:**
- [ ] `npm test -- validate`
- [ ] Manual: a throwaway `console.log` / test loads `content/index.ts` without error

**Dependencies:** Task 2

**Files likely touched:**
- `src/content/tracks/basic.ts`
- `src/content/index.ts`

**Estimated scope:** Medium

---

### Task 5: Author remaining Basic levels (content only)

**Description:** Author the remaining Basic-track levels (~10–15 total) as pure
content data — questions, choices, and explanations, hand-reviewed against the schema
rules. Record the reviewer and review status per level in a content-review checklist;
validation alone does not establish grammatical correctness. No code changes; this
can be done incrementally and in parallel with later UI tasks once the loader contract
(Task 4) is fixed.

**Acceptance criteria:**
- [ ] Basic track contains the MVP level count with sequential `level.number`.
- [ ] Every level passes `validateContent()`.
- [ ] Every question's `rule` resolves to a `TopicRule` in the corpus.
- [ ] `eligibleStartingPoint` is `true` on Basic (and only Basic in v1).
- [ ] Every authored level has a completed content-review checklist entry.

**Verification:**
- [ ] `npm test -- validate` (whole track)

**Dependencies:** Task 4 (contract), Task 2

**Files likely touched:**
- `src/content/tracks/basic.ts`

**Estimated scope:** Large (content volume) — split by level as needed

---

### Task 6: Adaptive serving orchestrator

**Description:** Implement `src/game/serving.ts` — the caller-side logic that wraps
`pickNextQuestion` and decides, given a `LevelSession` + content bank + Weakness Queue,
what to serve next **and whether to show the lesson card first** (the re-teach rule:
a rule missed **twice** in the current level re-shows the card before its question).
Distinguish same-level remediation from Review (queued-rule) serving per the schema.

**Acceptance criteria:**
- [ ] Returns `{ question, mode }` where mode ∈ `remediation | review | normal`.
- [ ] A question is `review` only when its rule was queued before serving; the
      returned mode is an immutable pre-answer snapshot.
- [ ] Serving never mutates `reviewStreak`; answer reducers increment it only for a
      `review` result and clear the rule at two consecutive correct review answers.
- [ ] Re-teach triggers when a rule's in-level miss count reaches 2.
- [ ] Injectable randomness; covered by Jest.

**Verification:**
- [ ] `npm test -- serving`

**Dependencies:** Task 3 (types), Task 4 (content shape)

**Files likely touched:**
- `src/game/serving.ts`
- `src/game/__tests__/serving.test.ts`

**Estimated scope:** Small–Medium

---

### Task 7A: Question and teaching components

**Description:** Build the presentational `QuestionCard`, `ChoiceButton`,
`LessonCard`, and `ProgressHeader` components. Keep them independent of navigation,
storage, and reducers so they can be tested with fixture data.

**Acceptance criteria:**
- [ ] Question renders prompt + exactly 4 choices.
- [ ] Correct answer → confirm rationale; wrong answer → lesson card + per-choice "why".
- [ ] Lesson card shows topic summary + the matching `TopicRule`.
- [ ] Header shows streak / correct count / answered count.
- [ ] Components expose accessible labels/roles and disable answer choices after
      submission until feedback is dismissed.

**Verification:**
- [ ] Component tests cover four choices, correct/wrong feedback, and lesson-card
      content.
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 4, Task 6

**Files likely touched:**
- `src/components/QuestionCard.tsx`, `ChoiceButton.tsx`, `LessonCard.tsx`, `ProgressHeader.tsx`

**Estimated scope:** Medium

---

### Task 7B: Level play screen, persistence, and adaptive loop

**Description:** Build `LevelPlayScreen` around the pure machine and components.
Wire answer submission, feedback dismissal, adaptive serving, Weakness Queue and
wrong-answer reducer updates, and persistence after every answer. Preserve the
serving mode snapshot so same-level remediation is never recorded as Review.

**Acceptance criteria:**
- [ ] Correct and wrong answers follow the Gherkin feedback sequence and dispatch
      the appropriate progress, weakness, and wrong-answer updates immediately.
- [ ] Leaving the screen and relaunching resumes the saved session counters,
      `missCounts`, `lastWrongRule`, and `askedIds`; already-served questions are
      not repeated.
- [ ] Deliberate abandonment clears only `activeSession` after confirmation and
      does not erase completed levels, weakness data, or wrong-answer history.
- [ ] Review questions count toward level scoring, while only pre-queued Review
      answers affect `reviewStreak`.

**Verification:**
- [ ] Screen/reducer tests cover resume, abandon, wrong-answer persistence, and
      remediation-versus-review mode.
- [ ] `npx tsc --noEmit`
- [ ] Manual: question → answer → feedback → next question on Android.

**Dependencies:** Task 7A, Task 6, Task 4, Task 3

**Files likely touched:**
- `src/screens/LevelPlayScreen.tsx`
- `src/state/reducers.ts`
- `src/state/storage.ts`

**Estimated scope:** Medium

---

### Task 8: Pass / mercy-end flow + result screen + frontier advance

**Description:** Implement the end-of-level transition: detect `passed` (reason) or
`mercy_ended` from the machine outcome, show `ResultScreen` ("Streak!" / "Mastery
reached" / mercy message), clear `activeSession`, and advance `currentLevelId` to the
next level in the flattened sequence (or completion state). A passed level marks
`completedLevelIds`; a mercy-ended level unlocks but is not passed.

**Acceptance criteria:**
- [ ] Pass screen states the pass reason; mercy screen explains the cap.
- [ ] Passing adds the level to `completedLevelIds`; mercy-ending does not.
- [ ] Both advance the frontier; both clear `activeSession`.
- [ ] "Continue" routes to the next level or the completion/map state.

**Verification:**
- [ ] `npm test` (reducer tests)
- [ ] Manual: complete a level by streak, by volume, and by mercy-end

**Dependencies:** Task 7B, Task 3 (reducers)

**Files likely touched:**
- `src/screens/ResultScreen.tsx`
- `src/state/reducers.ts`
- `src/navigation/types.ts`

**Estimated scope:** Medium

---

### Task 9: Root navigator + starting-point screen

**Description:** Set up React Navigation and `AppNavigator`. Implement
`StartPointScreen` per the "First Launch" feature: if more than one bundled track is
`eligibleStartingPoint`, ask "Where do you want to start?"; if only Basic, auto-start
at Basic level 1. Persist `progress.startingPoint`; returning players skip the screen.

**Acceptance criteria:**
- [ ] First launch with multiple eligible tracks shows the choice; with one, it does not.
- [ ] Chosen point persists and is not re-asked on relaunch.
- [ ] With only Basic bundled, progress is initialized automatically at Basic level 1
      and no start-choice screen is shown.
- [ ] Higher start leaves earlier levels unlocked (derived, not stored).

**Verification:**
- [ ] `npx tsc --noEmit`
- [ ] Manual: fresh install → start choice (or auto-start); relaunch → straight to current level

**Dependencies:** Task 8, Task 3 (persist `startingPoint`)

**Early native verification:** After installing AsyncStorage and React Navigation,
run `npm run android` here as a smoke test before building the remaining screens.

**Files likely touched:**
- `src/navigation/AppNavigator.tsx`, `src/navigation/types.ts`
- `src/screens/StartPointScreen.tsx`
- `src/app/AppProvider.tsx`

**Estimated scope:** Medium

---

### Task 10: Level map screen

**Description:** Build `LevelMapScreen` using `state/selectors.ts` derived views:
flatten tracks by `track.order` → levels by `level.number`; show current level
highlighted, passed levels with a pass mark, future levels locked, and mercy-ended
levels unlocked-but-not-passed. Tapping an unlocked level replays it without re-locking.

**Acceptance criteria:**
- [ ] Map renders the Basic track with correct lock/pass/current indicators.
- [ ] A "needs review" indicator shows when a level's rules appear in the Weakness Queue.
- [ ] Replaying a passed/mercy-ended level does not re-lock it.

**Verification:**
- [ ] `npm test -- selectors`
- [ ] Manual: verify indicators across a fresh, mid, and completed run

**Dependencies:** Task 9, Task 11 (selectors and reducers must land first)

**Files likely touched:**
- `src/screens/LevelMapScreen.tsx`
- `src/state/selectors.ts`

**Estimated scope:** Medium

---

### Task 11: Progress selectors + Weakness Queue + Review screen

**Description:** Implement `state/selectors.ts` (unlocked levels, frontier, due
reviews) and `state/reducers.ts` (Weakness Queue upsert/clear: miss → `missCount++`,
`reviewStreak=0`; two correct review answers → clear). Build `ReviewScreen` listing
every missed question grouped by rule with last wrong choice, correct answer, miss
count, and both "why" explanations. Clearing a weakness keeps wrong-answer history.

**Acceptance criteria:**
- [ ] Wrong answers upsert the Weakness Queue immediately (pass or mercy-end).
- [ ] Two correct review answers clear a rule; any miss resets its `reviewStreak`.
- [ ] Review lists all missed questions grouped by rule with counts and explanations.
- [ ] Empty state shows a friendly message when no mistakes exist.
- [ ] The Review route is reachable from Settings and clearing a weakness does not
      delete its wrong-answer history.
- [ ] Selectors repair or surface unknown saved level/question IDs according to the
      persistence rules: unknown historical questions are omitted, while an unknown
      current level advances to the first valid level or completion state.

**Verification:**
- [ ] `npm test -- selectors reducers`
- [ ] Manual: make mistakes, open Review, confirm grouping + clearing behavior

**Dependencies:** Task 3, Task 8

**Files likely touched:**
- `src/state/selectors.ts`, `src/state/reducers.ts`
- `src/screens/ReviewScreen.tsx`

**Estimated scope:** Medium

---

### Task 12: Settings (reset, theme) + theme system

**Description:** Build `theme/` (tokens + light/dark palettes + `ThemeProvider` driven
by the `device|light|dark` setting) and `SettingsScreen` with theme choice and
"Reset game" (with confirmation). Reset clears `egg:progress` and returns to the
starting-point choice; settings survive.

**Acceptance criteria:**
- [ ] Theme follows device and can be pinned light/dark.
- [ ] All screens consume theme tokens (no hardcoded colors).
- [ ] Reset requires confirmation, erases progress, keeps settings, returns to start choice.
- [ ] Settings exposes navigation to the Review screen.

**Verification:**
- [ ] `npx tsc --noEmit`
- [ ] Manual: cycle device/light/dark; reset with and without confirm

**Dependencies:** Task 9, Task 3

**Files likely touched:**
- `src/theme/tokens.ts`, `src/theme/themes.ts`, `src/theme/ThemeProvider.tsx`
- `src/screens/SettingsScreen.tsx`

**Estimated scope:** Medium

---

### Task 13: End-to-end provider wiring and load-time validation

**Description:** Wire `AppProvider` to load content (with `validateContent()` at
load), load state, perform persisted-ID repair, and provide both to the navigator.
Remove the `NewAppScreen` scaffold. Keep this task focused on app composition and
startup behavior; final behavioral verification is Task 14.

**Acceptance criteria:**
- [ ] `validateContent()` runs at app load and surfaces a broken build early.
- [ ] `App.tsx` renders the real app (no scaffold screen).
- [ ] Loading with no progress initializes settings and the correct Basic-only
      starting state without flashing an invalid route.

**Verification:**
- [ ] `npm test -- provider storage selectors`
- [ ] `npm run lint`, `npx tsc --noEmit` all green

**Dependencies:** Tasks 9, 10, 11, and 12

**Files likely touched:**
- `src/app/AppProvider.tsx`
- `App.tsx`

**Estimated scope:** Medium

---

### Task 14: Full Gherkin verification and Android smoke/regression pass

**Description:** Verify the integrated app against every Gherkin scenario, including
fresh launch, higher starting points with fixture tracks, resume/abandon, pass by
streak and volume, mercy-end, cross-level review, wrong-answer history, reset, and
all theme modes. Run the Android build and record any known device limitations.

**Acceptance criteria:**
- [ ] All scenarios in `docs/use-cases/english-grammar-game.md` pass on Android or
      have an automated test equivalent.
- [ ] Fresh install → start → play → pass/mercy → review → reset completes without
      data loss or invalid navigation.
- [ ] Android build and runtime complete without errors.

**Verification:**
- [ ] `npm run android`
- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit` all green
- [ ] Manual scripted playthrough and regression checklist recorded in the task PR.

**Dependencies:** Task 13

**Estimated scope:** Medium

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI-generated content is incorrect/uneven | High | `validateContent()` fail-fast + per-level content-review checklist + in-app "report an error" (post-MVP) |
| The "3-in-a-row OR 8-total" rule feels off | Med | Tunable constants in `PassConfig`; adjust from real play |
| Navigation adds native config friction on Android | Med | Native-stack is the standard; install dependencies and verify `npm run android` early in Task 9 |
| Content authoring (Task 5) is a large data lift | Med | Split by level; contract fixed in Task 4 so it can parallelize with UI |
| Mercy cap lets a player pass 12/12 without a bank running dry | Low | `validateContent()` enforces bank ≥ mercy cap |

## Open Questions

- **Navigation dependency:** React Navigation native-stack is the accepted MVP
  decision; revisit only if the early Android smoke test fails or native setup is
  materially incompatible with the project.
- **App name / icon / store copy** — out of scope for this plan but needed before release.
- **Post-basic completion state** — endless review vs. a graduation screen (ideas doc
  leaves this open; Task 8 defaults to a completion/map state).
- **Lesson-card language** — should teaching translate to the learner's language?
  v1 assumes English-only teaching.
