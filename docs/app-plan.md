# Implementation Plan: English Grammar Game — Final Complete Version

> Source documents:
> - `docs/ideas/english-grammar-game.md` — product vision & roadmap (the 90-level plan)
> - `docs/schema/english-grammar-game.md` — content & state schema
> - `docs/use-cases/english-grammar-game.md` — Gherkin behavioral spec (MVP; this plan extends it)
> - `docs/mvp-plan.md` — the completed MVP plan (Tasks 1–14, all DONE)
> - `docs/content-review.md` — Basic-track content review checklist (all 12 levels `authoring-pass` / `human-review-pending`)
> - `docs/progress.md` — verified state of the shipped MVP

## Overview

The MVP is **done** (Tasks 1–14): a 12-level Basic track with the full mastery loop —
pass by **3-in-a-row OR 8-total**, **12-question mercy cap**, teach-on-failure lesson
cards, a cross-level Weakness Queue, a Review screen, a Level Map, Settings + theme,
AsyncStorage persistence with a version migration gate, and 236 passing tests with an
Android build verified. The governing principle throughout: **the app is a player,
the content is a database.**

This plan takes that proven core to the **final complete version** described in the
ideas doc: the full **90-level corpus** (Basic, Intermediate, and Advanced tracks),
the **recognition→production upgrade** (fill-in-the-blank, fix-the-sentence, and
word-order question types), **mixed review & interleaving**, the **growth layer**
(daily streaks, local statistics, local notifications), the **end-game** (graduation,
endless mastery review, tuning from real play), and **release readiness** (human
content review, app identity, crash reporting, both stores). The architecture is
preserved throughout: pure testable core, content as data, local id-referencing state,
thin UI screens, React Navigation, React Context.

### Scope decisions (confirmed)

These decisions shape everything below; do not reintroduce them without revisiting the
plan.

| Decision | Choice | Consequence |
|---|---|---|
| **Cloud sync / accounts** | **Local-first, sync deferred** | Progress stays in AsyncStorage. No auth, no backend. `docs/ideas` "Accounts / cloud sync" stays out of scope. |
| **Monetization** | **None for now** | No ads, no IAP. Store release is free. Revisit after retention data. |
| **Teaching language** | **English-only** | Lesson cards, rule explanations, and UI stay English. No i18n layer. |

### What is already built (do not redo)

`src/game/levelMachine.ts` (pure pass/mercy machine + `pickNextQuestion`), `src/game/serving.ts`
(adaptive serving + re-teach), `src/content/` (types, validator, loader, 12-level Basic track),
`src/state/` (types, storage with version gate, selectors, reducers), `src/theme/`, `src/navigation/`,
`src/screens/` (StartPoint, LevelMap, LevelPlay, Result, Review, Settings), `src/components/`
(QuestionCard, ChoiceButton, LessonCard, ProgressHeader), `src/app/` (AppProvider, AppContext).
Every task below builds on these; the existing test suite (236 tests) must stay green through
every refactor.

---

## Architecture Decisions

- **Pure core, thin UI (unchanged).** Game logic stays in plain TS modules covered by Jest.
  New question types extend the *pure scoring core*, not the screens.
- **Content as data, read-only (unchanged, but the corpus grows).** Tracks/levels/questions
  stay data. The loader derives the map order and onboarding choices from content metadata —
  nothing hardcodes "3 tracks" or "30 levels". Authoring the 90-level corpus is a *content*
  effort; the app code does not change for it (except the one content-assembly refactor below).
- **Question types via a backward-compatible tagged union.** `Question.type` defaults to
  `'multiple_choice'`, so existing content and saved state keep working. MC and
  fix-the-sentence score by index; fill-in-the-blank and word-order are scored by a pure
  `scoreAnswer` resolver. The existing machine API generalizes from `chosenIndex` to an
  `AnswerResponse` — a contained refactor with the full suite as the guard.
- **State stays local and id-referencing, version-gated (unchanged).** Each shape change bumps
  `CURRENT_PROGRESS_VERSION` and registers a migration in `src/state/storage.ts`. Settings
  gain a tolerant parse-and-merge read (the current `loadSettings` rejects unknown shapes, so
  new settings fields require a rewrite of that function).
- **Mixed review / interleaving are synthesized banks, not new machines.** A "mixed" session
  is `createSession` over a *cross-level bank* assembled by a pure selector. Interleaved
  levels add earlier-level questions into their play bank. No new state machine.
- **Growth layer is local and opt-in.** Daily streaks live in `Progress`; analytics is a local
  append-only event log (`egg:events`) surfaced on a Stats screen — no third-party analytics,
  consistent with local-first. Notifications use `@notifee/react-native` (local-only), default
  off. Audio uses `react-native-tts` (optional phase, default off).
- **No new state management or navigation libraries.** React Context + pure reducers +
  native-stack continue to serve ~10 screens.
- **Report-an-error is offline-first.** Reports persist under `egg:reports` and are exported
  via a `mailto:` compose (or copy-to-clipboard) — no backend, and it feeds the human
  content-review pipeline.
- **Android first, iOS before each store release.** The codebase is already cross-platform
  (the `ios/` template exists). iOS enablement (Phase 1) and iOS release are explicit tasks.

### New dependencies

| Package | Phase | Purpose |
|---|---|---|
| `@sentry/react-native` (optional) | 1 | Crash reporting for the store release; a local `ErrorUtils` log + mailto is the no-SDK fallback |
| `@notifee/react-native` | 4 | Local daily reminder notifications (native rebuild) |
| `react-native-tts` (optional) | 6 | Listen buttons for prompts/answers (native rebuild) |

Everything else is already in `package.json`.

### Implementation contracts (extend the MVP's)

- **Canonical rule definitions (unchanged).** Each `TopicRule.rule` is defined exactly once;
  recurring questions reference it. The Intermediate/Advanced tracks keep this — new topics
  add new canonical rules, cross-track recurrences tag the original.
- **Scoring registry.** `scoreAnswer(question, response) → { isCorrect }` lives beside the
  machine and is pure. Response shapes: `{ type:'index', index }`, `{ type:'text', text }`,
  `{ type:'sequence', indexes }`. MC and fix-the-sentence use `index`; fill-in-the-blank
  normalizes text; word-order compares the tapped index sequence.
- **State references ids only (unchanged).** New typed answers record the response
  (`lastResponse`) alongside the existing `lastChosenIndex`; Review resolves both back into
  content for display.
- **Schema doc is updated with every schema change.** `docs/schema/english-grammar-game.md`
  and `docs/use-cases/english-grammar-game.md` are extended in the same task that changes
  the code, so the docs never drift from the implementation.

---

## Target content roadmap (the 90 levels)

The ideas doc frames 90 levels as a *content roadmap*. This plan targets **30 levels per
track** — a content decision that the roadmap task (Phase 5) confirms or adjusts:

| Track | order | eligible start | Levels | Status |
|---|---|---|---|---|
| Basic | 1 | true | 1–30 | 12 shipped (b01–b12); 18 to author |
| Intermediate | 2 | true | 1–30 | all to author |
| Advanced | 3 | true | 1–30 | all to author |

With three eligible starting tracks, the existing multi-track `StartPointScreen` flow
activates on first launch — already built and tested. Each level keeps a **≥12-question bank**
(≥ mercy cap), a mix of question types once Phase 2 lands, and cross-level recurring-rule
questions so the Weakness Queue has material to resurface across all 90 levels.

---

## Task List

### Phase 1 — Release 1.0 hardening (ship what is proven)

- [ ] Task 1: Human content review of the Basic track
- [ ] Task 2: App identity + store assets
- [ ] Task 3: Crash reporting + release build pipeline
- [ ] Task 4: iOS enablement (build + TestFlight)
- [ ] Task 5: Report-an-error button + Report screen

### Checkpoint: Release 1.0
- [ ] All 12 Basic levels have `human-review-pass` status in `docs/content-review.md`
- [ ] Release build (AAB) builds and installs; crash reports land
- [ ] App runs on iOS (TestFlight build)
- [ ] Report-an-error works from question feedback and the Review screen

### Phase 2 — Production question types (recognition → production)

- [ ] Task 6: Content schema: question-type tagged union + validator extension
- [ ] Task 7: Machine scoring generalization (`scoreAnswer`, `AnswerResponse`)
- [ ] Task 8: State + migration for typed responses (version 1 → 2)
- [ ] Task 9: Type-specific question components + `QuestionCard` dispatch
- [ ] Task 10: Author/convert typed questions into the 12 Basic levels

### Checkpoint: Four question types
- [ ] MC, fix-sentence, fill-in-the-blank, and word-order all play end-to-end on device
- [ ] Every old saved game migrates (version 1 → 2) with wrong-answer history intact
- [ ] Existing 236-test suite still green after the machine refactor

### Phase 3 — Mixed review & interleaving

- [ ] Task 11: Mixed-bank assembly + mixed session serving
- [ ] Task 12: Interleaved levels (mix earlier-level questions into a level's bank)
- [ ] Task 13: Mixed Review route/screen + map entry + use-cases

### Checkpoint: Mixed and interleaved play
- [ ] A Mixed Review session serves a cross-level bank (queued rules first, then wrong answers, then sampling)
- [ ] Interleaved levels mix earlier-level questions and still meet pass/mercy rules
- [ ] New Gherkin scenarios documented and tested

### Phase 4 — Growth layer: streaks, stats, notifications

- [ ] Task 14: Daily streak tracking + streak UI (version 2 → 3)
- [ ] Task 15: Local event log + Stats screen
- [ ] Task 16: Local notifications (`@notifee`) + notification settings
- [ ] Task 17: Settings growth + tolerant settings read

### Checkpoint: Growth layer
- [ ] Streak increments on a new day, resets on a missed day, survives relaunch
- [ ] Stats screen shows accuracy by rule, totals, streak history, time played
- [ ] Daily reminder schedules/cancels correctly (permission handled, default off)

### Phase 5 — The full 90-level corpus (content authoring)

- [ ] Task 18: Content authoring infrastructure (track-level cluster modules + loader assembly)
- [ ] Task 19: 90-level content roadmap (topic map, rule registry, recurring-rule strategy)
- [ ] Task 20: Complete Basic to 30 levels (b13–b30, authored in clusters)
- [ ] Task 21: Author Intermediate track (30 levels, in clusters)
- [ ] Task 22: Author Advanced track (30 levels, in clusters)
- [ ] Task 23: Human review of all new content + review-doc extension

### Checkpoint: 90-level corpus
- [ ] `validateContent()` passes on the full corpus (30/30/30)
- [ ] Three-track first-launch flow works (start-point choice shown; no unavailable tracks offered)
- [ ] Every new level has a completed content-review entry; corpus is `human-review-pass`
- [ ] App code unchanged by the corpus (content-only additions)

### Phase 6 — End-game, polish, tuning, release

- [ ] Task 24: Graduation screen + completion flow
- [ ] Task 25: Endless Mastery Review
- [ ] Task 26: Tuning pass from real play (adjust `PassConfig` from Stats)
- [ ] Task 27: Gherkin extension + full regression suite
- [ ] Task 28: Final release 2.0 (Android + iOS)

### Optional (droppable) — Audio polish
- [ ] Task 29: TTS listen buttons (`react-native-tts`) + audio setting

### Checkpoint: Complete
- [ ] Graduation shows when all 90 levels pass; Mastery Review loops forever
- [ ] Pass config tuned from real Stats data and use-cases re-verified
- [ ] Full regression green on Android and iOS; both stores have a release
- [ ] All Gherkin scenarios in the extended `use-cases` satisfied

---

## Tasks in detail

### Task 1: Human content review of the Basic track

**Description:** Every Basic level (b01–b12) is currently `authoring-pass` /
`human-review-pending` in `docs/content-review.md`. Grammar correctness cannot be automated —
`validateContent()` only proves structure. A native-speaker reviewer works through each of
the 12 levels, marks each level `human-review-pass`, and fixes (or files for fixing) any
grammatical, distractor, or explanation issues against the checklist. This is the release
gate for 1.0 and the model every later content task follows.

**Acceptance criteria:**
- [ ] All 12 Basic levels reach `human-review-pass` in `docs/content-review.md` with a named reviewer.
- [ ] Every flagged issue is resolved in `src/content/tracks/basic.ts` (and re-validated).
- [ ] The three flagged editorial decisions (zero-article `nothing`, BrE time expressions, future-arrangement tagging) are confirmed or revised by the reviewer.

**Verification:**
- [ ] `npm test -- validate` (whole track) passes after any edits
- [ ] `npx tsc --noEmit`, `npm run lint` clean

**Dependencies:** None (content already authored)

**Files likely touched:**
- `docs/content-review.md`
- `src/content/tracks/basic.ts` (only if issues are found)

**Estimated scope:** Small (human-gated; code changes limited to fixes)

---

### Task 2: App identity + store assets

**Description:** Resolve the working title and produce the release identity: app name,
icon (adaptive + legacy), splash/launch screen, store copy (Play + App Store listing text),
and a short privacy policy. The privacy policy must honestly state what leaves the device —
with local-first decisions, that is only user-initiated mailto reports and (if enabled)
Sentry crash payloads. Update `app.json` / Android resources / iOS `Info.plist` accordingly.

**Acceptance criteria:**
- [ ] App name + icon + splash ship in the Android and iOS projects.
- [ ] Store copy drafted for both stores (short + full descriptions, screenshots checklist).
- [ ] A privacy policy file exists (`docs/privacy.md`) and its claims match the app's data behavior.

**Verification:**
- [ ] `npm run android` builds and shows the new identity
- [ ] Manual: fresh install shows the correct name/icon

**Dependencies:** None

**Files likely touched:**
- `app.json`, `android/app/src/main/res/**`, `ios/EnglishGrammarGame/**`, `docs/privacy.md`

**Estimated scope:** Medium

---

### Task 3: Crash reporting + release build pipeline

**Description:** A shipped app needs crash visibility. Recommended: `@sentry/react-native`
(hardware-accelerated source maps, native + JS crash reporting). The local-first fallback:
a `global.ErrorUtils` hook that appends to `egg:errors` and a "Send error report" path that
composes a mailto. Establish the release pipeline: Android **AAB** with a release keystore,
and a `npm run release:android` script; confirm the release build boots. Sentry is a third-party
telemetry dependency — it is release infra, not product backend; the plan treats it as the
default and the local log as the fallback if the human prefers zero third parties.

**Acceptance criteria:**
- [ ] A release keystore + signing config exist; `./gradlew bundleRelease` produces a signed AAB.
- [ ] JS and native crashes are captured (Sentry) or logged locally (fallback) and reachable by the developer.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test` stay green; a Sentry DSN (if used) is injected, never committed.

**Verification:**
- [ ] `./gradlew bundleRelease` → signed AAB installs on an emulator
- [ ] Manual: force a JS error in a dev build and confirm it surfaces

**Dependencies:** Task 2 (app identity for the release artifact)

**Files likely touched:**
- `android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml`, `index.js`, `App.tsx`, `src/app/AppProvider.tsx`
- `package.json` (+ `@sentry/react-native`), `app.json`

**Estimated scope:** Medium

---

### Task 4: iOS enablement (build + TestFlight)

**Description:** The MVP was Android-verified; the final version ships both stores. Install
pods, build the iOS target, resolve any platform gaps (safe-area, fonts, status bar already
theme-aware), and produce a TestFlight build (provisioning, bundle id, signing). This is
mostly native/build work; the JS is already cross-platform by construction.

**Acceptance criteria:**
- [ ] `npx pod-install` succeeds; the iOS app builds and runs the full loop on a simulator.
- [ ] A TestFlight build uploads (or a documented signing path is ready).
- [ ] Any iOS-only rendering/behavior gaps (e.g. safe-area insets, keyboard on typed questions later) are fixed.

**Verification:**
- [ ] Manual: fresh install → start → play a level → pass → map on the iOS simulator
- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit` green

**Dependencies:** Task 2 (bundle id / name)

**Files likely touched:**
- `ios/**` (Podfile, project settings, signing), `src/**` (only for platform gaps)

**Estimated scope:** Medium–Large (native tooling friction)

---

### Task 5: Report-an-error button + Report screen

**Description:** AI-generated content needs a trust channel (ideas-doc assumption). Add a
"Report" affordance on the question-feedback view and on the Review screen. Reports persist
locally under `egg:reports` (question id, optional note, timestamp, version) and are exported
by composing a `mailto:` email (prefilled subject/body) or copying to clipboard. A small
Report screen lists pending reports, lets the user add a note, and clears them once sent.
This feeds the human content-review pipeline of every later content task.

**Acceptance criteria:**
- [ ] A report can be created from wrong-answer feedback and from the Review screen; it persists across relaunch.
- [ ] The Report screen lists reports and exports them (mailto compose and/or clipboard copy).
- [ ] Reports survive a progress reset (they are content feedback, not progress) and are not shown to the learner in the Review grouping.

**Verification:**
- [ ] `npm test -- Report*` (new suite)
- [ ] Manual: report from a question, relaunch, confirm the report persists and exports

**Dependencies:** Task 2 (app name for the mail subject is nice-to-have)

**Files likely touched:**
- `src/state/reports.ts` (new: types + storage under `egg:reports`)
- `src/screens/ReportScreen.tsx` (new), `src/components/ReportButton.tsx` (new)
- `src/navigation/types.ts`, `src/navigation/AppNavigator.tsx`
- `src/components/QuestionCard.tsx`, `src/screens/ReviewScreen.tsx` (report affordance)

**Estimated scope:** Medium

---

### Task 6: Content schema — question-type tagged union + validator extension

**Description:** Extend `src/content/types.ts` so `Question` is a discriminated union on a
`type` field defaulting to `'multiple_choice'` — existing content validates unchanged. Add
two genuinely new interaction types and one presentational type:

- `fill_blank`: `prompt` with a blank, `correctAnswer` (canonical), `acceptedAnswers: string[]`
  (normalized accepted forms), `explanation`, optional `commonMistakes: { mistake; feedback }[]`.
- `word_order`: `sentenceWords: string[]` (canonical order), optional `prompt`, `explanation`.
  The UI shuffles for display; the correct answer is the canonical order.
- `fix_sentence`: `faultySentence` shown above, plus the existing MC shape (`choices[4]`,
  `correctIndex`, `choiceExplanations[4]`) — scored by index, rendered differently.

Extend `validateContent()` with per-type integrity (bank ≥ mercy cap still counts all types;
`choiceExplanations` required only for choice-based types; `acceptedAnswers` non-empty for
fill_blank; `sentenceWords.length ≥ 3` for word_order; every question still carries a unique
id, a resolvable `rule`, and `levelId`). Update `docs/schema/english-grammar-game.md` §1 in
the same change. `docs/content-review.md` records the type mix per level.

**Acceptance criteria:**
- [ ] `Question` is a tagged union; existing MC content passes validation with no edits.
- [ ] Each new type has a validator path that throws on malformed data and accepts valid data.
- [ ] The schema doc's content section reflects the union and its invariants.

**Verification:**
- [ ] `npm test -- validate` (existing + new type cases)
- [ ] `npx tsc --noEmit`, `npm run lint`

**Dependencies:** None (Task 1 edits are content-only, orthogonal)

**Files likely touched:**
- `src/content/types.ts`, `src/content/validate.ts`, `src/content/__tests__/validate.test.ts`
- `docs/schema/english-grammar-game.md`

**Estimated scope:** Medium

---

### Task 7: Machine scoring generalization (`scoreAnswer`, `AnswerResponse`)

**Description:** Generalize the pure scoring core without changing behavior for MC. Introduce
`AnswerResponse = { type:'index'; index } | { type:'text'; text } | { type:'sequence'; indexes }`
and a pure `scoreAnswer(question, response)` that resolves `isCorrect` per type (normalized
text match for fill_blank, sequence match for word_order, index match for MC/fix_sentence).
Refactor `answerQuestion(session, question, response, config)` to accept a response and source
`isCorrect` from `scoreAnswer`; `AnswerOutcome` keeps `correctIndex` for choice-based types and
gains a display `correctAnswer` for typed ones. `pickNextQuestion` / `serving.ts` are untouched
(they only read `rule`/`id`). Keep `game/levelMachine.ts`'s `Question` aligned to the content
union (source the type from `content/types` via `import type` — the machine now genuinely needs
the discriminator). Update `docs/use-cases` "Level Play" for typed responses.

**Acceptance criteria:**
- [ ] Existing MC tests pass unchanged (responses become `{ type:'index', index }` with identical outcomes).
- [ ] `scoreAnswer` unit tests cover normalization (case, whitespace, punctuation), accepted-answer matching, and word-order sequence matching.
- [ ] A typed wrong answer still feeds the Weakness Queue and wrong-answer history through the existing reducers.

**Verification:**
- [ ] `npm test -- levelMachine serving` (full existing suite intact)
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 6 (union exists)

**Files likely touched:**
- `src/game/levelMachine.ts` (+ new `src/game/scoring.ts` or inline `scoreAnswer`)
- `src/game/__tests__/levelMachine.test.ts` (add scoring cases), `src/game/__tests__/scoring.test.ts` (new)
- `docs/use-cases/english-grammar-game.md`

**Estimated scope:** Medium (contained refactor, suite-guarded)

---

### Task 8: State + migration for typed responses (version 1 → 2)

**Description:** Extend the persisted shape for typed answers: `WrongAnswerEntry` gains an
optional `lastResponse: AnswerResponse` alongside `lastChosenIndex`; `applyAnswer` records
the response; `reviewGroups`/`ReviewScreen` resolve a response to display text (index → choice
text; text → the submitted text; sequence → the joined sentence) with the correct answer shown
per type. Bump `CURRENT_PROGRESS_VERSION` to 2 and register a migration (1 → 2) that keeps
existing entries' `lastChosenIndex` and leaves `lastResponse` absent (choice-based) — a real
typed wrong answer only arrives after this release. Update `docs/schema/english-grammar-game.md` §2.

**Acceptance criteria:**
- [ ] `WrongAnswerEntry.lastResponse` is optional and backward-compatible.
- [ ] Version 1 → 2 migration runs on real saved games without data loss; unknown versions still fail fast.
- [ ] Review renders correct/wrong answers for all four question types.

**Verification:**
- [ ] `npm test -- storage reducers selectors` (migration + grouping cases)
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 7 (response shapes), Task 6

**Files likely touched:**
- `src/state/types.ts`, `src/state/storage.ts`, `src/state/reducers.ts`, `src/state/selectors.ts`
- `src/state/__tests__/*`, `docs/schema/english-grammar-game.md`

**Estimated scope:** Medium

---

### Task 9: Type-specific question components + `QuestionCard` dispatch

**Description:** Add renderers for the new types and dispatch from `QuestionCard`: a
`FillBlankCard` (text input, normalize-on-submit, keyboard handling), a `WordOrderCard`
(tap words in order into a builder strip; a shuffle seeded by the serving `random`), and a
`FixSentenceCard` (faulty sentence header over the existing MC choice list). The feedback
layer adapts per type: choice-based questions reveal correct/wrong choices + aligned "why";
typed questions show the correct answer, the rule teaching, and matched common-mistake
feedback. The lesson card (`LessonCard`) stays rule-driven and type-agnostic. All components
stay presentational and fixture-testable, matching the existing component pattern.

**Acceptance criteria:**
- [ ] All four types render from fixture data and submit a correctly-typed response.
- [ ] Typed feedback shows the correct answer + rule explanation + common-mistake feedback when matched.
- [ ] New interactions are accessible (labels, focus, disabled-while-revealed) and covered by component tests.

**Verification:**
- [ ] `npm test -- components LevelPlayScreen`
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 6, Task 7 (response types)

**Files likely touched:**
- `src/components/QuestionCard.tsx` (dispatch), `FillBlankCard.tsx`, `WordOrderCard.tsx`, `FixSentenceCard.tsx` (new)
- `src/components/__tests__/components.test.tsx`

**Estimated scope:** Medium

---

### Task 10: Author/convert typed questions into the 12 Basic levels

**Description:** Convert or add production-type questions to the existing 12 Basic levels so
each bank stays **≥12 questions** with a sensible recognition→production mix (e.g. 7–8 MC,
1–2 fix-sentence, 1–2 fill-blank, 1 word-order per level). New questions follow the recurring
rule-tag strategy so the Weakness Queue gains production-type material to resurface. Update
`docs/content-review.md` per level with the type mix and review status; every converted question
must pass the new validator.

**Acceptance criteria:**
- [ ] Every Basic level has ≥ 12 questions spanning at least three question types.
- [ ] Every new typed question passes `validateContent()`; banks still ≥ mercy cap.
- [ ] A human re-review covers the new typed questions (append to the existing checklist).

**Verification:**
- [ ] `npm test -- validate`
- [ ] Manual: play a level containing each type on device

**Dependencies:** Task 9, Task 6

**Files likely touched:**
- `src/content/tracks/basic.ts`, `docs/content-review.md`

**Estimated scope:** Medium (content volume)

---

### Task 11: Mixed-bank assembly + mixed session serving

**Description:** Build the pure assembler `mixedBank(tracks, progress, { size, random })` —
a cross-level bank that serves queued-rule questions first (any level whose bank contains a
queued rule), then recently-missed questions (from `wrongAnswers`, freshest first), then a
sampled spread across passed levels. A Mixed Review session is `createSession('mixed')` over
that bank with a volume pass target and an explicit end (bank exhausted or target reached) —
no new state machine. `serveNextQuestion` works unchanged over any bank; the re-teach rule
still applies.

**Acceptance criteria:**
- [ ] `mixedBank` prioritizes queued rules, then wrong answers, then sampling; size-capped; deterministic with injected `random`.
- [ ] A mixed session runs through the existing machine/reducers without touching persisted `currentLevelId`.
- [ ] Mixed answers still feed the Weakness Queue and wrong-answer history normally.

**Verification:**
- [ ] `npm test -- serving selectors` (mixed-bank cases)
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 7 (typed scoring), Task 8 (history shapes)

**Files likely touched:**
- `src/game/mixed.ts` (new, pure), `src/game/__tests__/mixed.test.ts` (new)
- `src/state/selectors.ts` (reuse)

**Estimated scope:** Medium

---

### Task 12: Interleaved levels

**Description:** Add a content flag `Level.interleave?: boolean` (default off). When set, the
level's play bank is the level's own questions plus a sampled set of earlier-level questions
(prioritizing queued rules and recurring rules already in the bank), while still guaranteeing
≥ mercy-cap own questions first. Interleaving increases retrieval practice without changing
pass/mercy rules or serving classification.

**Acceptance criteria:**
- [ ] An interleaved level serves its own questions first, then earlier-level material; bank never falls below the mercy cap.
- [ ] Interleaved serves classify correctly (remediation / review / normal) and count toward the level normally.
- [ ] Content flag is optional and validated (default off).

**Verification:**
- [ ] `npm test -- serving levelMachine`
- [ ] Manual: play a level marked interleaved on device

**Dependencies:** Task 11 (bank assembly helpers)

**Files likely touched:**
- `src/content/types.ts` (flag), `src/content/validate.ts` (flag validation)
- `src/screens/LevelPlayScreen.tsx` (bank resolution), `src/game/__tests__/serving.test.ts`

**Estimated scope:** Small–Medium

---

### Task 13: Mixed Review route/screen + map entry + use-cases

**Description:** Add a `MixedReview` route (`MixedReviewScreen`, presentational) that runs a
mixed session, plus a "Review / Practice" entry on the Level Map and a link from Settings.
Extend `docs/use-cases` with a "Mixed Review" feature (queued rules resurface, cross-level
history feeds it, wrong answers keep feeding the queue). Route wiring follows the existing
`LevelPlayRoute` pattern with a synthesized bank instead of a content-level lookup.

**Acceptance criteria:**
- [ ] Mixed Review is reachable from the map and Settings and completes/abandons cleanly.
- [ ] New Gherkin scenarios document mixed-bank priorities and session end.
- [ ] Replay and resume behave sanely (mixed sessions are resumable in `activeSession` with the assembled bank).

**Verification:**
- [ ] `npm test -- MixedReviewScreen AppNavigator`
- [ ] Manual: run a mixed session on device

**Dependencies:** Task 11, Task 8

**Files likely touched:**
- `src/screens/MixedReviewScreen.tsx` (new), `src/navigation/types.ts`, `src/navigation/AppNavigator.tsx`
- `src/screens/LevelMapScreen.tsx` (entry), `src/screens/SettingsScreen.tsx` (entry)
- `docs/use-cases/english-grammar-game.md`

**Estimated scope:** Medium

---

### Task 14: Daily streak tracking + streak UI (version 2 → 3)

**Description:** Add the growth-layer streak: `Progress` gains `dailyStreak`, `bestStreak`,
and `lastPlayedDate` (local `YYYY-MM-DD`). A pure `recordPlay(progress, date)` increments the
streak when `date` is the next day, keeps it on the same day, resets to 1 when a gap is missed,
and tracks `bestStreak`. Wired into level start/answer. A streak summary (current + best +
"practice today") appears on the map header. Bump `CURRENT_PROGRESS_VERSION` to 3 and register
the 2 → 3 migration (add the three fields, defaulting to 0/null).

**Acceptance criteria:**
- [ ] `recordPlay` handles same-day, next-day, and gap correctly (pure, timezone-injectable, tested).
- [ ] Playing any level updates the streak; the map shows current + best streak.
- [ ] Version 2 → 3 migration preserves all existing progress.

**Verification:**
- [ ] `npm test -- reducers selectors` (streak cases + migration)
- [ ] Manual: relaunch across a simulated day boundary

**Dependencies:** Task 8 (migration mechanics)

**Files likely touched:**
- `src/state/types.ts`, `src/state/reducers.ts` (`recordPlay`), `src/state/storage.ts` (migration)
- `src/screens/LevelMapScreen.tsx`, `src/components/ProgressHeader.tsx` or a new streak strip

**Estimated scope:** Small–Medium

---

### Task 15: Local event log + Stats screen

**Description:** Add an append-only event log under `egg:events` (`src/state/events.ts`):
answer events (question id, rule, type, isCorrect, levelId, timestamp), level-end events
(outcome, reason), and session events. Pure selectors compute totals, accuracy by rule,
per-type accuracy, streak history, and time played. A `StatsScreen` (presentational) renders
the summary and links to the Review screen. No third-party analytics — this data also drives
the Phase 6 tuning decision. Events survive progress resets (telemetry, not progress) or are
cleared on reset — decide and document in the storage contract.

**Acceptance criteria:**
- [ ] Answer/level-end events append correctly and are bounded (cap the log length to avoid unbounded growth).
- [ ] Stats selectors produce accurate totals/accuracy-per-rule/streak history from a fixture log.
- [ ] The Stats screen renders from fixtures and is reachable from Settings.

**Verification:**
- [ ] `npm test -- events stats` (new suites)
- [ ] Manual: play, open Stats, confirm accuracy matches

**Dependencies:** Task 14 (streak history source)

**Files likely touched:**
- `src/state/events.ts` (new), `src/state/selectors.ts` (stats views)
- `src/screens/StatsScreen.tsx` (new), `src/navigation/types.ts`, `src/navigation/AppNavigator.tsx`, `src/screens/SettingsScreen.tsx`

**Estimated scope:** Medium

---

### Task 16: Local notifications (`@notifee`) + notification settings

**Description:** Add the daily-reminder growth feature with `@notifee/react-native` (local
notifications only — consistent with local-first). `Settings` gains
`notifications: { enabled: boolean; hour: number; minute: number }` (default disabled) and a
time picker in Settings. Scheduling/canceling happens on launch and on change; Android
notification permission is requested when the user opts in. Native rebuild required.

**Acceptance criteria:**
- [ ] Enabling a reminder schedules a daily local notification at the chosen time; disabling cancels it; changes reschedule.
- [ ] Permission prompt appears only on opt-in; denial is handled gracefully (still saves the setting).
- [ ] Notification code is injectable/mocked for tests (native module mocked in Jest).

**Verification:**
- [ ] `npm test -- settings notifications`
- [ ] Manual: on-device notification fires at the scheduled time

**Dependencies:** Task 17's settings read (or land together)

**Files likely touched:**
- `src/state/types.ts` (settings shape), `src/app/notifications.ts` (new, thin wrapper)
- `src/screens/SettingsScreen.tsx`, `src/app/AppProvider.tsx`
- `package.json` (+ `@notifee/react-native`)

**Estimated scope:** Medium

---

### Task 17: Settings growth + tolerant settings read

**Description:** Rework `loadSettings` to a parse-and-merge read that preserves `theme` and
defaults the new fields (`notifications`, and the optional `audio`) rather than rejecting the
whole shape (the current implementation returns `DEFAULT_SETTINGS` for any unknown shape —
it would wipe new settings). Extend `SettingsScreen` with the streak display, notification
toggle + time picker, the Stats link, and (when the optional TTS task is taken) the audio
toggle. `Settings` stays the only slice that survives a progress reset.

**Acceptance criteria:**
- [ ] `loadSettings` merges saved fields with defaults and never drops `theme` or new fields.
- [ ] All new settings persist, survive a reset, and restore on relaunch.
- [ ] Settings UI reflects every new control with accessible labels/states.

**Verification:**
- [ ] `npm test -- storage SettingsScreen AppProvider`
- [ ] Manual: change settings, reset progress, confirm settings survive

**Dependencies:** Task 14, Task 16, Task 15 (UI entries)

**Files likely touched:**
- `src/state/storage.ts`, `src/state/types.ts`
- `src/screens/SettingsScreen.tsx`, `src/app/AppProvider.tsx`
- `src/state/__tests__/storage.test.ts`

**Estimated scope:** Medium

---

### Task 18: Content authoring infrastructure (cluster modules + loader assembly)

**Description:** Split the one-file-per-track content into small, parallelizable cluster
modules before the corpus lift. Move `src/content/tracks/basic.ts` (and the new tracks) into
`src/content/tracks/<track>/<cluster>.ts` partial modules (e.g. `basic/basic-01.ts`) that
export level fragments; `src/content/index.ts` assembles them into full `Track[]` objects and
runs `validateContent()` at import (unchanged contract). All existing tests and callers keep
working — screens only ever see the validated `Track[]`.

**Acceptance criteria:**
- [ ] The loader contract (`Track[]`, validated at import) is unchanged; the existing 12 levels load identically.
- [ ] Each cluster module is small enough to author and review in one pass (~10 levels max).
- [ ] Content files stay data-only (no logic); `npm test`, `tsc`, `lint` stay green.

**Verification:**
- [ ] `npm test` (full suite, especially `validate` and `loader`)
- [ ] `npx tsc --noEmit`, `npm run lint`

**Dependencies:** None (pure refactor)

**Files likely touched:**
- `src/content/tracks/**` (restructured), `src/content/index.ts`

**Estimated scope:** Small–Medium

---

### Task 19: 90-level content roadmap (topic map, rule registry, recurring strategy)

**Description:** Write the content roadmap that the corpus tasks follow: the per-track topic
list (Intermediate and Advanced topic maps; completing Basic b13–b30), the canonical rule
registry for every new topic, and the cross-track recurring-rule strategy (which rules resurface
where, so the Weakness Queue has material across all 90 levels). This is a planning/decision
task — the product of a content lead — and is the checklist the authoring tasks and human
reviewers use. Where the 30/30/30 split is not ideal pedagogically, adjust here and record it.

**Acceptance criteria:**
- [ ] A topic map exists for all 90 levels (30/30/30 or an adjusted, recorded split) in `docs/content-roadmap.md`.
- [ ] Every new `TopicRule.rule` has exactly one canonical home and a defined recurrence set.
- [ ] Per-level type-mix guidance (MC/fix/fill/order) is documented.

**Verification:**
- [ ] The roadmap's rule registry parses against `validateContent` naming (dry-run with the first authored cluster).

**Dependencies:** Task 18

**Files likely touched:**
- `docs/content-roadmap.md` (new)

**Estimated scope:** Medium (decision/planning)

---

### Task 20: Complete Basic to 30 levels (b13–b30)

**Description:** Author Basic b13–b30 (18 levels) as pure content in clusters of ~9 levels per
sub-task, following `docs/content-roadmap.md`. Each level: 12+ questions across ≥3 question
types, recurring-rule questions into earlier material, `level.number` 13–30 sequential. Update
`docs/content-review.md` for each new level. This is a content task — no code changes.

**Acceptance criteria:**
- [ ] b13–b30 authored and validating; Basic is a full 30-level track.
- [ ] Each level has ≥ 12 questions spanning ≥ 3 types with aligned explanations.
- [ ] Every new level has an `authoring-pass` checklist entry (human review lands in Task 23).

**Verification:**
- [ ] `npm test -- validate` (whole Basic track)

**Dependencies:** Task 19, Task 18

**Files likely touched:**
- `src/content/tracks/basic/**` (new cluster modules), `docs/content-review.md`

**Estimated scope:** Large (content) — split into two ~9-level sub-tasks

---

### Task 21: Author Intermediate track (30 levels)

**Description:** Author the Intermediate track (30 levels, `order: 2`,
`eligibleStartingPoint: true`) as pure content in clusters, per the roadmap. Intermediate
topics (e.g. past perfect in more depth, conditionals II/III, passive voice, reported speech,
relative clauses, gerunds/infinitives, etc. — per the roadmap) build on Basic rules and carry
recurring-rule questions so the queue resurfacing spans tracks. Activates the existing
multi-track StartPoint flow.

**Acceptance criteria:**
- [ ] Intermediate track validates as 30 sequential levels with `eligibleStartingPoint: true`.
- [ ] Each level has ≥ 12 questions across ≥ 3 types; new rules are canonically defined; recurrences tag Basic rules.
- [ ] Every new level has an `authoring-pass` checklist entry.

**Verification:**
- [ ] `npm test -- validate` (full corpus with Basic + Intermediate)

**Dependencies:** Task 19, Task 18

**Files likely touched:**
- `src/content/tracks/intermediate/**` (new), `docs/content-review.md`

**Estimated scope:** Large (content) — split into three ~10-level sub-tasks

---

### Task 22: Author Advanced track (30 levels)

**Description:** Author the Advanced track (30 levels, `order: 3`, `eligibleStartingPoint: true`)
as pure content in clusters, per the roadmap (e.g. advanced clause combinations, conditionals
with mixed tenses, subjunctive, advanced articles, cleft sentences, discourse markers — per the
roadmap). Same contracts as Task 21: 12+ questions, ≥3 types, canonical rules, cross-track
recurrences, `authoring-pass` entries.

**Acceptance criteria:**
- [ ] Advanced track validates as 30 sequential levels; all three tracks validate together.
- [ ] First-launch with three eligible tracks shows the StartPoint choice with all three; choosing higher leaves earlier content unlocked (already tested behavior, now with real tracks).
- [ ] Every new level has an `authoring-pass` checklist entry.

**Verification:**
- [ ] `npm test -- validate` (full 90-level corpus)
- [ ] Manual: fresh install → start-point choice → higher start → earlier levels unlocked

**Dependencies:** Task 21 (same machinery), Task 19

**Files likely touched:**
- `src/content/tracks/advanced/**` (new), `docs/content-review.md`

**Estimated scope:** Large (content) — split into three ~10-level sub-tasks

---

### Task 23: Human review of all new content + review-doc extension

**Description:** Native-speaker review of every newly authored level (Basic b13–b30,
Intermediate, Advanced) against `docs/content-review.md` and the roadmap — grammar, distractors,
explanations, and typed-question feedback. Each level moves `authoring-pass` →
`human-review-pass`; flagged issues are fixed in content and re-validated. This is the corpus
release gate and the largest human effort in the plan.

**Acceptance criteria:**
- [ ] Every one of the ~78 new levels (plus the 12 Basic ones from Task 1) is `human-review-pass`.
- [ ] All flagged issues resolved and re-validated; the roadmap's flagged editorial decisions are confirmed.
- [ ] The review checklist documents reviewer, date, and any content decisions per track.

**Verification:**
- [ ] `npm test -- validate` on the full corpus after all fixes
- [ ] Spot-check: a sample of reviewed levels re-read for consistency

**Dependencies:** Tasks 20, 21, 22

**Files likely touched:**
- `docs/content-review.md`, `src/content/tracks/**` (fixes only)

**Estimated scope:** Large (human-gated; content fixes)

---

### Task 24: Graduation screen + completion flow

**Description:** Replace the current "no next level → pop to map" completion state with a
proper Graduation route: when the last level of the flattened 90-level sequence passes, the
Result screen's Continue routes to a Graduation screen ("You've mastered all 90 levels") with
a stats summary and a "Keep practicing" action (Mastery Review from Task 25). `completeLevel`
behavior is unchanged (frontier stays put at the end); only the navigator's completion branch
changes.

**Acceptance criteria:**
- [ ] Completing the final level routes to Graduation, not the map.
- [ ] Graduation shows a summary (levels, streak, accuracy) and a path to Mastery Review.
- [ ] A player can still reach the map from Graduation to replay.

**Verification:**
- [ ] `npm test -- AppNavigator ResultScreen` (completion branch)
- [ ] Manual: complete the final authored level (test with a fixture corpus)

**Dependencies:** Task 22 (real 90 levels), Task 15 (stats summary)

**Files likely touched:**
- `src/screens/GraduationScreen.tsx` (new), `src/navigation/types.ts`, `src/navigation/AppNavigator.tsx`
- `src/screens/ResultScreen.tsx` (route target)

**Estimated scope:** Small–Medium

---

### Task 25: Endless Mastery Review

**Description:** A never-ending mixed-review mode over the whole mastered corpus: serve queued
rules, recently-wrong answers, then a random spread across all 90 levels, cycling without
passing/mercy end — an "as long as you like" session with an explicit exit. Reuses the
`mixedBank` assembly (Task 11) without a pass rule; answers still feed the Weakness Queue and
history so mastery review genuinely corrects weaknesses. Reachable from Graduation and the map.

**Acceptance criteria:**
- [ ] Mastery Review serves across all levels, prioritizes the queue, and never runs out of questions (cycles with de-dupe on repeat).
- [ ] Answers feed the Weakness Queue/history; correct Review answers can clear a weakness mid-session.
- [ ] Exit is explicit; no pass/mercy semantics apply.

**Verification:**
- [ ] `npm test -- mixed mastery` (new cases)
- [ ] Manual: run Mastery Review from Graduation

**Dependencies:** Task 24, Task 11

**Files likely touched:**
- `src/game/mixed.ts` (mastery variant), `src/screens/MixedReviewScreen.tsx` or a new MasteryReviewScreen

**Estimated scope:** Medium

---

### Task 26: Tuning pass from real play (adjust `PassConfig`)

**Description:** Use the Stats data (Task 15) and the decided tunables to review the pass rule
(`passStreak` 3, `passVolume` 8, `mercyCap` 12) — the ideas doc's key assumption. Where real
play shows levels are too easy/hard, adjust `DEFAULT_PASS_CONFIG`, update
`docs/use-cases`' tuning parameters, and re-run the affected suites. This is decision + data
work (partially human); the constants stay tunable and content-level overrides remain a future
option (unchanged default today).

**Acceptance criteria:**
- [ ] A tuning decision is documented from Stats data (values unchanged, or changed with rationale) in `docs/` (tuning note).
- [ ] Any `PassConfig` change is reflected in the use-cases doc and covered by tests.
- [ ] `validateContent()` bank-size checks still reference the configured mercy cap, not a hardcoded one.

**Verification:**
- [ ] `npm test` (full suite with any config change)
- [ ] Manual spot-play at the tuned values

**Dependencies:** Task 15 (data), Task 23 (content finality)

**Files likely touched:**
- `src/game/levelMachine.ts` (defaults), `docs/use-cases/english-grammar-game.md`, `docs/content-roadmap.md` (tuning note)

**Estimated scope:** Small

---

### Task 27: Gherkin extension + full regression suite

**Description:** Extend `docs/use-cases/english-grammar-game.md` with features added since the
MVP — typed question types, Mixed Review, interleaving, daily streaks, notifications,
Graduation, Mastery Review, report-an-error — and add automated equivalents for every new
scenario, following the proven pattern (pure unit/selector/screen/navigator tests + a full
journey test). Run the complete verification matrix: `npm test`, `npm run lint`,
`npx tsc --noEmit`, and an Android + iOS build.

**Acceptance criteria:**
- [ ] Every new feature has Gherkin scenarios with a test equivalent.
- [ ] The existing 8 MVP features still pass (no regression from the machine/state refactors).
- [ ] A full-journey test scripts fresh install → start → play all types → mixed → streak → graduation → mastery → reset.

**Verification:**
- [ ] `npm test` (full suite green), `npm run lint`, `npx tsc --noEmit`
- [ ] `npm run android` smoke; iOS simulator smoke (Task 4 tooling)

**Dependencies:** Tasks 2–26

**Files likely touched:**
- `docs/use-cases/english-grammar-game.md`, `src/**/__tests__/**`, `src/app/__tests__/journey.test.ts`

**Estimated scope:** Large (test volume) — split by feature area

---

### Task 28: Final release 2.0 (Android + iOS)

**Description:** Production builds for both stores: final content lock, release build with
crash reporting wired, store listings updated with new screenshots/features, and staged
rollout. Any release-blocking issues from the regression are fixed. The final version ships
the 90-level corpus, all question types, mixed review, growth layer, and end-game.

**Acceptance criteria:**
- [ ] Signed AAB + iOS archive build from a clean checkout.
- [ ] Store listings describe the final feature set; privacy policy reflects the shipped build.
- [ ] A post-release smoke checklist (install, start, play, stats, notifications, graduation) passes on both platforms.

**Verification:**
- [ ] `./gradlew bundleRelease`; Xcode archive → TestFlight/App Store
- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit` green at the release commit

**Dependencies:** Task 27, Task 3 (pipeline), Task 4 (iOS)

**Files likely touched:**
- `android/**`, `ios/**`, `app.json`, `docs/` (release notes), store assets

**Estimated scope:** Medium (release process)

---

### Task 29 (optional): TTS listen buttons + audio setting

**Description:** Add `react-native-tts` so prompts, choices, and lesson examples can be read
aloud via a "listen" button, gated by a Settings `audio` toggle (default off). The ideas doc
treats speech as separate from grammar; this is a polish pass and is droppable without
affecting the core plan. Native rebuild required.

**Acceptance criteria:**
- [ ] Listen buttons render on prompts, choices, and lesson examples; TTS speaks the selected text.
- [ ] Audio toggle defaults off and persists with settings.
- [ ] TTS is mocked/injectable for tests.

**Verification:**
- [ ] `npm test -- components settings`
- [ ] Manual: on-device TTS speaks a prompt and a lesson example

**Dependencies:** Task 17 (settings shape), Task 9 (components)

**Files likely touched:**
- `src/components/` (listen buttons), `src/state/types.ts` (audio setting), `src/app/` (init)
- `package.json` (+ `react-native-tts`)

**Estimated scope:** Small–Medium

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Content authoring scale (~78 new levels ≈ 940+ questions) | High | Cluster-based content modules (Task 18) enable parallel authoring; the roadmap (Task 19) fixes topics/rules first; automated `validateContent()` catches structural errors; human review is a hard gate (Task 23) |
| Human content review is a bottleneck | High | In-app report-an-error (Task 5) feeds the review queue; review is per-cluster and parallelizable; the release gate is explicit |
| The machine/scoring refactor (Task 7) regresses the proven loop | Med | Backward-compatible tagged union; MC stays the default; the full 236-test suite must stay green through the refactor |
| Native deps (notifee, TTS, Sentry) add build friction | Med | Land early in their phases; native rebuild verification right after each install; mocks in Jest |
| iOS signing/TestFlight friction | Med | Start iOS enablement in Phase 1 (Task 4), not at the end; iterate before the corpus lift |
| 90-level corpus hurts load time / bundling | Med | Content split into cluster modules; only the current level's bank is loaded into serving; validate at import stays cheap |
| Streak/notification behavior drifts into Duolingo-style manipulation | Low | Local-only, opt-in defaults (notifications off), streaks are a display, not a lock/penalty |
| Pass-rule tuning needs real data | Med | Local Stats log (Task 15) + event exports make tuning evidence-based; constants stay tunable |
| Scope creep from the ideas doc's deferred features (sync/monetization/localization) | Med | Explicitly out of scope by confirmed decisions; revisit only through a plan revision |

## Open Questions

- **Track split:** Is 30/30/30 the right 90-level split, or should a track have more levels
  (e.g. Basic 36, Intermediate 30, Advanced 24)? Resolved in Task 19 from pedagogy; the app
  is content-driven either way.
- **App name / icon / store copy:** Needs the human owner (Task 2); the working title
  "English Grammar Game" is a placeholder.
- **Notification default:** Off by default (recommended) vs. a default reminder time.
- **fix_sentence interaction:** Chosen as "pick the corrected rewrite" (MC-shaped). A
  tap-the-error variant is a possible later extension, not in this plan.
- **Audio (TTS):** Task 29 is optional and droppable; take it only if pronunciation support
  is desired.
- **Crash reporting choice:** Sentry (third-party telemetry) vs. the local log + mailto
  fallback. Both are specified; the human picks in Task 3.
- **Release 1.0 timing:** Recommended — ship the hardened 12-level app to both stores before
  the corpus lift, so a shippable product and retention data exist early.
- **Privacy policy wording:** Local-first means minimal data leaves the device; the policy
  must match the final choice about Sentry and reports (Task 2).
