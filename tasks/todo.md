# Task List — English Grammar Game, Final Complete Version

Checklist companion to `docs/app-plan.md`. Phase gates are listed between phases.

## Phase 1 — Release 1.0 hardening

- [x] Task 1: Human content review of the Basic track (b01–b12 → `human-review-pass`)
- [x] Task 2: App identity + store assets (name, icon, splash, copy, privacy policy)
- [ ] Task 3: Crash reporting + release build pipeline (Sentry or local log; signed AAB)
- [ ] Task 4: iOS enablement (pods, build, TestFlight)
- [ ] Task 5: Report-an-error button + Report screen (offline, mailto/clipboard export)

### Checkpoint: Release 1.0
- [x] Basic levels all `human-review-pass`
- [ ] Signed release build installs; crash reporting verified
- [ ] iOS build + TestFlight runs the full loop
- [ ] Report-an-error works from question feedback and Review

## Phase 2 — Production question types

- [ ] Task 6: Content schema — `Question.type` tagged union + validator extension
- [ ] Task 7: Machine scoring generalization (`scoreAnswer`, `AnswerResponse`)
- [ ] Task 8: State + migration for typed responses (version 1 → 2)
- [ ] Task 9: Type-specific components + `QuestionCard` dispatch
- [ ] Task 10: Author/convert typed questions into the 12 Basic levels

### Checkpoint: Four question types
- [ ] MC, fix-sentence, fill-blank, word-order play end-to-end on device
- [ ] Old saved games migrate 1 → 2 with history intact
- [ ] Existing 236-test suite still green

## Phase 3 — Mixed review & interleaving

- [ ] Task 11: Mixed-bank assembly + mixed session serving (version 2 → 3; resumable bank snapshot)
- [ ] Task 12: Interleaved levels (earlier-level questions mixed in)
- [ ] Task 13: Mixed Review route/screen + map entry + use-cases

### Checkpoint: Mixed and interleaved play
- [ ] Mixed session serves queued rules → wrong answers → sampling
- [ ] Interleaved levels respect pass/mercy rules
- [ ] New Gherkin scenarios documented and tested

## Phase 4 — Growth layer

- [ ] Task 14: Daily streak tracking + streak UI (version 3 → 4)
- [ ] Task 15: Local event log + Stats screen
- [ ] Task 17: Settings growth + tolerant settings read (do before Task 16)
- [ ] Task 16: Local notifications (`@notifee`) + notification settings

### Checkpoint: Growth layer
- [ ] Streak increments/resets correctly and survives relaunch
- [ ] Stats screen accurate (accuracy by rule, totals, streak history, time played)
- [ ] Daily reminder schedules/cancels; default off; permission handled

## Phase 5 — Full 90-level corpus

- [ ] Task 18: Content authoring infrastructure (cluster modules + loader assembly)
- [ ] Task 19: 90-level content roadmap (topic map, rule registry, recurring strategy)
- [ ] Task 20A: Complete Basic b13–b21
- [ ] Task 20B: Complete Basic b22–b30
- [ ] Task 21A: Author Intermediate levels 1–10
- [ ] Task 21B: Author Intermediate levels 11–20
- [ ] Task 21C: Author Intermediate levels 21–30
- [ ] Task 22A: Author Advanced levels 1–10
- [ ] Task 22B: Author Advanced levels 11–20
- [ ] Task 22C: Author Advanced levels 21–30
- [ ] Task 23: Human review of all new content + review-doc extension

### Checkpoint: 90-level corpus
- [ ] Full corpus validates (30/30/30)
- [ ] Three-track first-launch flow works
- [ ] Every new level `human-review-pass`
- [ ] App code unchanged by the corpus

## Phase 6 — End-game, polish, tuning, release

- [ ] Task 24: Graduation screen + completion flow
- [ ] Task 25: Endless Mastery Review
- [ ] Task 26: Tuning pass from real play (adjust `PassConfig`)
- [ ] Task 27A: Gherkin extensions + feature-focused regression suites
- [ ] Task 27B: Full journey and platform regression
- [ ] Task 28: Final release 2.0 (Android + iOS)

## Optional (droppable)

- [ ] Task 29: TTS listen buttons + audio setting

### Checkpoint: Complete
- [ ] Graduation + endless Mastery Review work
- [ ] Pass config tuned from Stats; use-cases re-verified
- [ ] Full regression green on Android and iOS; both stores released
