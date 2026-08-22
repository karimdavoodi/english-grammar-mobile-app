# Progress

## Task 1: Establish the project folder structure — DONE

Created the `src/` module layout from the plan:
- Directories: `src/game/`, `src/content/` (+ `tracks/`, `__tests__/`), `src/state/` (+ `__tests__/`), `src/theme/`, `src/navigation/`, `src/screens/`, `src/components/`, `src/app/`.
- Each module has a one-line `README.md` describing its contract.
- Empty module stubs with one-line header comments for the files later tasks implement (`serving.ts`, `content/*`, `state/*`, `theme/*`, `navigation/*`, `screens/*`, `components/*`, `app/AppProvider.tsx`).
- Existing `src/game/levelMachine.ts` and its test left untouched.
- No functional change: `App.tsx` still boots the `NewAppScreen`.

Verification: `npx tsc --noEmit` clean · `npm test` 20/20 pass · `npm run lint` clean.

## Task 2: Content schema types + validator — DONE

Defined the content schema and its fail-fast validator per `docs/schema/english-grammar-game.md` §1:

- `src/content/types.ts` — `Track`, `Level`, `Topic`, `TopicRule`, `Question` mirroring the schema field-for-field, with doc comments for the id/rule contracts (globally unique ids; `TopicRule.rule` as the global tag).
- `src/content/validate.ts` — `validateContent(tracks, { mercyCap })` (default mercy cap 12) accumulating every violation into one `ContentValidationError`:
  - exactly 4 choices, `correctIndex` integer in 0..3;
  - no duplicate `question.id`, `level.id`, `track.id`, `track.order`, or `TopicRule.rule`;
  - `Level.trackId` / `Question.levelId` match their containers;
  - every `Question.rule` resolves to exactly one `TopicRule` in the global registry (built in pass 1, questions resolved in pass 2 — this enforces "recurring rules exist in both home topic and recurring bank" and rejects duplicate rule definitions);
  - `level.number` sequential 1..n per track; ≥1 eligible starting-point track, each with a level 1;
  - bank size ≥ mercy cap; 4 non-empty, positionally-aligned `choiceExplanations`.
- `src/content/__tests__/validate.test.ts` — 24 tests covering the valid corpus, the recurring-rule acceptance case, duplicate-definition rejection, and every individual violation.

Verification: `npm test -- validate` 24/24 pass · `npm test` 44/44 pass (existing `levelMachine` suite intact) · `npx tsc --noEmit` clean · `npm run lint` clean.

## Task 3: State types + AsyncStorage persistence — DONE

Implemented the runtime state layer and its persistence per `docs/schema/english-grammar-game.md` §2 (State):

- `src/state/types.ts` — `Settings`, `StartingPoint`, `PersistedLevelSession` (excludes the machine-only `status`), `WeaknessEntry`, `WrongAnswerEntry`, `Progress`, and `AppState`, plus `DEFAULT_SETTINGS`. Explicit adapters `persistSession()` / `hydrateSession()` map to/from the existing `levelMachine.LevelSession` without dropping counters or asked ids (a saved session always rehydrates as `in_progress`).
- `src/state/storage.ts` — load/save under `egg:settings` / `egg:progress`; a `progress.version` migration gate (`CURRENT_PROGRESS_VERSION = 1`, `migrateProgress()` walks a registered migration chain, 0 → 1 stamps the initial shape, throws on malformed or newer-than-supported data); `resetProgress()` clears only `egg:progress` so settings survive. Every function takes an injectable `StorageLike` store (defaulting to the real AsyncStorage) for testability.
- `package.json` — added `@react-native-async-storage/async-storage` (^3.1.1).
- `src/state/__tests__/storage.test.ts` — 16 tests covering the adapters, settings defaults/round-trip/malformed data, progress round-trip, version migration on load, newer-version rejection, missing-migration rejection, and reset preserving settings.

Verification: `npm test -- storage` 16/16 pass · `npm test` 60/60 pass (existing suites intact) · `npx tsc --noEmit` clean · `npm run lint` clean.

## Task 4: Content loader + one fully-authored reference level — DONE

Built the content loader and authored the Past Perfect reference level, proving the content pipeline end-to-end:

- `src/content/tracks/basic.ts` — the `basicTrack` (order 1, `eligibleStartingPoint: true`) holding one fully-authored reference level `b01` "Past Perfect" (level 1): a 12-question bank split across its two `TopicRule`s (`past_perfect_form`, `past_perfect_vs_past_simple`), modeled on the schema doc's example fragment. Every question has exactly 4 choices, a varied `correctIndex` (0–3), and 4 non-empty, positionally-aligned `choiceExplanations` ([correctIndex] = why it's right, the rest = why each is wrong).
- `src/content/index.ts` — the loader assembles all bundled tracks and runs `validateContent()` at import (fail-fast): a malformed track throws before it can reach the app. Exports the validated `tracks: Track[]` and re-exports `validateContent` / `ContentValidationError` / `DEFAULT_MERCY_CAP` and the content types.

Note: the single authored level is `number: 1` (id `b01`) so the validator's sequential-numbering and eligible-starting-point rules pass with a one-level track; Task 5 renumbers as remaining levels land.

Verification: `npx tsc --noEmit` clean · `npm run lint` clean · `npm test` 60/60 pass (existing suites intact) · throwaway load test confirmed `content/index.ts` imports without error and the reference level has ≥12 questions, 4 choices each, non-empty explanations (then deleted).
