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
