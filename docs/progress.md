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

## Task 5: Author remaining Basic levels (content only) — DONE

Completed the Basic track in `src/content/tracks/basic.ts` — 12 levels, sequential `level.number` 1..12, all pure content data (the app is a player, the content is a database):

- **Pedagogically ordered corpus** — Present Simple → Present Continuous → Past Simple → Past Continuous → Present Perfect → Future (will/going to) → Modals → Articles → Comparatives/Superlatives → **Past Perfect** (the Task 4 reference level renumbered b01→b10 / level 10) → Prepositions of time → Zero & First Conditionals.
- **12-question banks per level** (≥ mercy cap 12): each question has exactly 4 choices, a varied `correctIndex` across 0–3, and 4 non-empty, positionally-aligned `choiceExplanations` ([correctIndex] = why right, the rest = why each is wrong).
- **Rule identity contract honored** — each `TopicRule.rule` is defined exactly once in its home level; levels b02–b12 additionally carry 2 recurring-tagged questions each (e.g. `present_simple_form` resurfaces in b02/b03/b07/b08/b11/b12; `past_simple_form` in b04/b05/b11) so the Weakness Queue has cross-level material to resurface. Validator's global rule registry accepts the whole corpus with zero duplicate definitions.
- **Content-review checklist** — new `docs/content-review.md` records per-level reviewer and review status (AI authoring pass, human review recommended), plus global review checks and flagged editorial decisions (zero-article rendered as `nothing`; BrE time expressions; future-arrangement tagging).

Verification: `npx tsc --noEmit` clean · `npm run lint` clean · `npm test` 60/60 pass (existing suites intact) · throwaway load test confirmed `content/index.ts` imports and validates the full 12-level track (then deleted).

## Task 6: Adaptive serving orchestrator — DONE

Implemented `src/game/serving.ts`, the caller-side adaptive-serving layer that wraps the existing `levelMachine.pickNextQuestion` per `docs/use-cases` "Teach on Failure" / "Weakness Queue" and `docs/schema` §1:

- `serveNextQuestion(session, bank, queuedRules, { random })` → `{ question, mode, showLesson } | null`. Priority delegated to `pickNextQuestion`: an unasked same-rule variant of the rule just missed → an unasked queued-rule question (Review) → a random unasked question. Returns `null` for a finished session or an exhausted bank.
- `mode` ∈ `remediation | review | normal` is an **immutable pre-answer snapshot** (`classifyMode`): `remediation` only when the question is a same-rule re-test of `lastWrongRule` — which wins even if that rule is also queued (same-level remediation is never a Review answer); `review` only when the rule was in the Weakness Queue before serving; otherwise `normal`. Serving never touches `reviewStreak` — that stays purely with the Task 11 answer reducers.
- **Re-teach rule** (`shouldReTeach` + `RE_TEACH_MISS_THRESHOLD = 2`): `showLesson` is `true` when the served rule has been missed ≥ 2 times in the current level, so the UI re-shows the lesson card before the question; applies to both remediation and review serves.
- Injectable randomness threaded through to `pickNextQuestion` for deterministic tests.
- `src/game/__tests__/serving.test.ts` — 25 tests covering classification, the threshold boundaries, first/normal serving, remediation, Review (incl. not forcing a queued rule into a bank that lacks it), re-teach, finished/exhausted null cases, injectable randomness, and the stable pre-answer snapshot.

Verification: `npm test -- serving` 25/25 pass · `npm test` 85/85 pass (existing suites intact) · `npx tsc --noEmit` clean · `npm run lint` clean.

## Task 7A: Question and teaching components — DONE

Built the four presentational UI components per `docs/mvp-plan.md` Task 7A and `docs/use-cases` "Level Play" / "Teach on Failure", independent of navigation, storage, and reducers so they test with fixture data:

- `src/components/ChoiceButton.tsx` — one answer choice: A/B/C/D letter + choice text, `accessibilityRole="button"` with a state-aware label, and `accessibilityState.disabled` once `revealed`. The `onPress` is guarded, so a revealed (locked) button never answers. Shows the positionally-aligned per-choice "why" once revealed. Visual states: idle / selected / correct / wrong / dimmed.
- `src/components/QuestionCard.tsx` — prompt (header role) + exactly 4 `ChoiceButton`s. Controlled via `selectedIndex` + `revealed`. On reveal the correct choice is highlighted, a wrong chosen answer is marked wrong, the rest are dimmed, all four explanations are shown, and every choice is disabled until feedback is dismissed.
- `src/components/LessonCard.tsx` — the teach-on-failure card: topic title + summary plus the matching `TopicRule` (title / explanation / example). The `review` flag labels the rule as an earlier-topic review per the schema (§1), so a Review serve is not confused with the current topic. Dismissed via a continue button (label default "Continue", overridable); lists all topic rules when no specific rule matches.
- `src/components/ProgressHeader.tsx` — the session status strip: streak / correct count / answered count over the mercy cap, with a summary role and a combined accessible label.
- `src/components/__tests__/components.test.tsx` — 16 tests covering four choices, correct/wrong feedback, disable-after-submission, lesson-card content, and accessible labels/roles.

Verification: `npm test -- components` 16/16 pass · `npm test` 101/101 pass (existing suites intact) · `npx tsc --noEmit` clean · `npm run lint` clean.

## Task 7B: Level play screen, persistence, and adaptive loop — DONE

Built `LevelPlayScreen` around the pure machine and the Task 7A components, wiring the full question → answer → feedback → next loop with reducer-driven Weakness Queue / wrong-answer updates and persistence after every answer:

- `src/state/reducers.ts` — the pure transitions the loop runs on:
  - `startLevelSession(progress, levelId)` — resumes a saved session for the same level, or starts a fresh one (overwriting a different-level session).
  - `applyAnswer({ progress, question, chosenIndex, mode, config, now })` — wraps `levelMachine.answerQuestion`; advances the session, upserts the Weakness Queue on any miss (`missCount++`, `reviewStreak → 0`), records the wrong-answer history, and advances `reviewStreak` **only** for a correct answer whose `mode` snapshot is `review` (remediation/normal never touch it). Reaching `REVIEW_CLEAR_STREAK` (2) clears the rule from the queue. Clears `activeSession` the moment the level ends so a finished level is never persisted as resumable.
  - `abandonSession(progress)` — clears only `activeSession`; completed levels, weakness data, and wrong-answer history survive.
  - `queuedRuleSet(progress)` — the serving `queuedRules` set.
- `src/content/index.ts` — added `findRule(ruleTag)` (global rule registry from validated content) so the lesson card can resolve a served/reviewed question's rule even when its home is an earlier level.
- `src/screens/LevelPlayScreen.tsx` — the screen: resolves the session synchronously on mount (resume or start), serves adaptively via `serving.serveNextQuestion` (remediation → review → random), honors the pre-answer `mode` snapshot (same-level remediation is never recorded as Review), shows the re-teach lesson before a question when `showLesson`, teaches-on-failure after a wrong answer, persists each transition through a serialized last-write-wins save (injectable store), and reports the level end via `onLevelEnd({ session, outcome })` after the final feedback is dismissed. `passConfig` and `random` are injectable for deterministic tests.
- `src/state/__tests__/reducers.test.ts` — 15 tests: start/resume/overwrite, correct/wrong answer transitions, weakness upsert + reviewStreak reset, review-clear-at-2, remediation-never-review, mercy/pass clearing the session, abandon keeping history, and queued-rule serving input.
- `src/screens/__tests__/LevelPlayScreen.test.tsx` — 9 tests: fresh serving + header, correct-feedback advance, wrong-answer lesson + immediate weakness persistence, remediation serving after a miss, resume (counters + no repeat of asked ids), confirmed abandon clearing only the active session, pass-by-streak and mercy-end `onLevelEnd` handoffs, and Review answers advancing `reviewStreak` while counting toward the level.

Note: the on-device question → answer → feedback loop (`npm run android`) is not runnable yet — the screen needs the Task 9 navigator / Task 13 provider to be reachable. The loop is verified by the screen/reducer tests above; the manual Android pass lands at the Task 9 early native verification and Task 14 regression.

Verification: `npm test -- reducers` 15/15 pass · `npm test -- LevelPlayScreen` 9/9 pass · `npm test` 125/125 pass (existing suites intact) · `npx tsc --noEmit` clean · `npm run lint` clean.

## Task 8: Pass / mercy-end flow + result screen + frontier advance — DONE

Implemented the end-of-level transition per `docs/mvp-plan.md` Task 8, `docs/use-cases` "Level Play" (pass screen / mercy), and `docs/schema` §2 (frontier advance + unlock-is-derived):

- `src/state/reducers.ts` — the end-of-level transition, content-free and pure:
  - `flattenedLevelIds(tracks)` — the single ordering the frontier advances along: tracks by ascending `track.order`, then levels by ascending `level.number` (the schema's "unlock is derived" flattening).
  - `nextLevelId(levelOrder, levelId)` — the level after a given one, or `null` for the last level (completion state) / unknown ids.
  - `completeLevel(progress, { levelId, passed, levelOrder })` — a **pass** adds the level to `completedLevelIds` (deduped); a **mercy-end** never does (unlocked-but-not-passed). Both clear `activeSession`. The frontier advances to the next level in the flattened sequence **only when the ended level is the current frontier or later** — replaying an earlier, already-unlocked level never pulls the frontier backward. Completing the last level keeps the frontier in place so the caller can show the completion state.
- `src/screens/ResultScreen.tsx` — the pass / mercy-end result screen, presentational (fixture-testable, no navigation/storage/reducer imports, matching the Task 7A component pattern): "Streak!" (pass by streak), "Mastery reached" (pass by volume), and a mercy message that names the answer cap and states the level stays unlocked. Includes a compact score summary and a "Continue" affordance — `Continue to <next level title>` when a next level exists, `Go to map` in the completion state — wired through `onContinue`.
- `src/navigation/types.ts` — added `ResultScreenParams` and a `RootStackParamList` (`LevelPlay` + `Result`) so screens/callers compile against a stable route contract before the Task 9 navigator lands.

Note: on-device end-to-end routing (`npm run android`) still needs the Task 9 navigator / Task 13 provider; the pass/mercy/continue behavior is verified by the reducer and screen tests below, with the manual Android pass landing at the Task 9 early native verification and Task 14 regression.

Verification: `npm test -- reducers` 26/26 pass (15 existing + 11 new for flattened/next/complete) · `npm test -- ResultScreen` 6/6 pass · `npm test` 142/142 pass (existing suites intact) · `npx tsc --noEmit` clean · `npm run lint` clean.

## Task 9: Root navigator + starting-point screen — DONE

Set up React Navigation and the first-launch boot flow per `docs/mvp-plan.md` Task 9 and `docs/use-cases` "First Launch":

- **Dependencies** — added `@react-navigation/native` (^7.3.17), `@react-navigation/native-stack` (^7.18.9), `react-native-screens` (^4.27.0); `react-native-safe-area-context` was already present.
- `src/app/AppContext.ts` — the app-wide context (`tracks`, `settings`, `progress`, `ready`, `chooseStartingPoint`, `applyProgress`) + `useApp()`, split from AppProvider so the navigator imports it without a provider↔navigator cycle.
- `src/app/AppProvider.tsx` — the composition root that loads settings + saved progress on boot and decides the route:
  - no saved progress + **one** eligible starting track (Basic-only in v1) → auto-initializes an empty Progress at that track's level 1 and persists it (no choice screen);
  - no saved progress + **multiple** eligible tracks → leaves progress null so the StartPoint choice shows;
  - saved progress → resumes straight at `currentLevelId` (returning players are never re-asked).
  - `chooseStartingPoint(trackId, levelNumber)` persists a fresh progress slice; `applyProgress(next)` replaces + persists.
- `src/screens/StartPointScreen.tsx` — the presentational "Where do you want to start?" screen: a heading + one button per eligible track (each starts at its level 1), accessible labels/roles, no navigation/storage/reducer imports (fixture-testable, matching the Task 7A/8 pattern).
- `src/navigation/types.ts` — `RootStackParamList` grows `StartPoint`; `ResultScreenParams` now carries the full `AnswerOutcome` (the ResultScreen derives its message + score summary from it).
- `src/navigation/AppNavigator.tsx` — native-stack navigator: boots at StartPoint (no progress) or LevelPlay (current level); StartPointRoute persists the choice and replaces to LevelPlay; LevelPlayRoute resolves the level, renders the LevelPlayScreen (resume/fresh), and on level end applies `completeLevel` + replaces to Result; ResultRoute renders the ResultScreen and Continue advances to the next level (or, in the completion state until the Task 10 map lands, replays the current level).
- `src/state/reducers.ts` — new pure boot helpers: `startingLevelId` (resolve a starting point to its level id), `createInitialProgress` (empty Progress at the chosen starting level — frontier = starting level, unlock stays derived), `resolveBootProgress` (auto-start vs. start choice vs. returning-player resume).
- `src/content/index.ts` — `findLevelById()` helper for the navigator's id→Level resolution.
- `src/screens/LevelPlayScreen.tsx` — `LevelEndResult` now also reports the final `progress` slice so the navigator can advance the frontier from the exact post-answer state (the existing `outcome` assertions are unaffected).
- `App.tsx` — renders the real composition root (`SafeAreaProvider → AppProvider → AppNavigator`), replacing the `NewAppScreen` scaffold.

Tests (13 new): `StartPointScreen` (heading, one choice per eligible track, onChoose reports track+1), `state/startup` (`startingLevelId`, `createInitialProgress`, `resolveBootProgress`: resume / auto-start / multi-track choice), and `app/AppProvider` (auto-start persists, multi-track leaves progress null → start choice, returning player resumes). `__tests__/App.test.tsx` updated to boot the real tree with storage + navigation modules mocked.

Verification: `npm test` 155/155 pass (13 new; existing suites intact) · `npx tsc --noEmit` clean · `npm run lint` clean.

Note: the `npm run android` smoke test (installing native-stack pulls `react-native-screens`, a native module, so a rebuild is required) needs an emulator/device and is deferred to the Task 9 "early native verification" / Task 14 regression.

## Task 11: Progress selectors + Weakness Queue + Review screen — DONE

Implemented the derived-state selectors and the Review screen per `docs/mvp-plan.md` Task 11, `docs/use-cases` "Review Screen" / "Weakness Queue", and `docs/schema` §2 ("unlock is derived, never stored"; content lookups always by id):

- `src/state/selectors.ts` — the pure derived views (no React/RN imports):
  - `orderedLevels(tracks)` — the flattened sequence (tracks by `order`, levels by `number`) the frontier, map, and review all follow.
  - `unlockedLevelIds` / `isLevelUnlocked` — the schema's derived-unlock rule: a level is unlocked when it occurs at-or-before the saved frontier or its id is in `completedLevelIds` (a passed level stays unlocked when the frontier moves on — replay never re-locks; a higher start leaves all earlier levels unlocked).
  - `levelStatuses(tracks, progress)` — the map view: `unlocked` / `completed` (pass mark) / `isCurrent` (frontier) / `needsReview`, plus `levelNeedsReview` (any question in the level's bank is tagged with a queued rule).
  - `repairProgress(tracks, progress)` — the persisted-ID repair: unknown `completedLevelIds` are dropped, an unknown `currentLevelId` advances to the first valid level (or stays in the completion state when no levels remain), and an active session whose level no longer exists is cleared; returns the same reference when nothing needs repairing (wired at load in Task 13).
  - `weaknessEntries(progress)` — the Weakness Queue ("due reviews") as an array.
  - `reviewGroups(tracks, wrongAnswers, queuedRules?)` — the review grouping: every missed question resolved back into content by id (unknown historical question ids omitted), grouped by rule tag with the canonical `TopicRule` teaching, cumulative miss count, last wrong choice + correct answer, and both positionally-aligned "why" explanations; groups order by the most recent miss.
- `src/screens/ReviewScreen.tsx` — the wrong-answer study history, grouped by rule. Presentational (fixture-testable, no navigation/storage/reducer imports): each group shows the rule title + teaching + example, an "In your Weakness Queue" badge when the rule is still queued, and per question the prompt, "Your answer", "Correct answer", miss count, why the choice was wrong, and why the correct one is right. Clearing a weakness never deletes this history — the badge is the only thing that disappears. Empty state ("No mistakes yet") when there are no wrong answers; an `onBack` affordance for the navigator.
- `src/navigation/types.ts` + `src/navigation/AppNavigator.tsx` — registered the `Review` route (reads `tracks` + `progress` from the AppContext; defensive "Nothing to review yet." when progress is null). The Settings entry point lands in Task 12; the route is registered and ready to be navigated to.
- Weakness Queue upsert/clear (miss → `missCount++`, `reviewStreak → 0`; two correct Review answers → clear) already landed in Task 7B `applyAnswer` and remains covered by `reducers.test.ts` — no reducer change was needed for Task 11.

Tests (40 new): `src/state/__tests__/selectors.test.ts` (30 — flattening, unlock/frontier/completed, map status incl. needs-review, first valid level, repair on unknown current level / dropped completed ids / cleared unknown active session, weakness entries, and review grouping incl. unknown-id omission, ordering, still-queued flag, and explanation resolution) and `src/screens/__tests__/ReviewScreen.test.tsx` (10 — empty state, grouping, per-entry details, miss-count pluralization, rule teaching, still-queued badge, history-kept-after-clear, back affordance, accessibility roles).

Note: opening Review on-device from Settings lands in Task 12 (which adds the Settings screen + Review link); grouping and clearing behavior are verified by the tests above, with the manual Android pass at the Task 14 regression.

Verification: `npm test -- selectors reducers` 57/57 pass (selectors 30/30 · reducers 27/27) · `npm test` 195/195 pass (40 new; existing suites intact) · `npx tsc --noEmit` clean · `npm run lint` clean.

## Task 10: Level map screen — DONE

Built the `LevelMapScreen` as the progress overview and free-play hub per `docs/mvp-plan.md` Task 10, `docs/use-cases` "Level Map", and `docs/schema` §2 ("Unlock is derived, never stored"):

- `src/screens/LevelMapScreen.tsx` — the presentational map (no navigation/storage/reducer imports, fixture-testable like the Task 7A/8/11 screens). Renders the flattened track → level sequence (tracks by `order`, levels by `number`) through the Task 11 `levelStatuses` selector, grouped into track sections. Per level it shows the number badge, title + topic, and the derived indicators:
  - **current** level highlighted (blue border/background + "Current" badge);
  - **passed** levels with a "✓ Passed" badge;
  - **locked** future levels dimmed with "🔒 Locked" and `disabled` (non-tappable);
  - **mercy-ended / skipped-earlier** levels unlocked but without a pass mark (no persisted distinction, per schema);
  - a **"Review" badge** when any question in the level's bank is tagged with a rule currently in the Weakness Queue.
  Tapping an unlocked level fires `onSelectLevel(levelId)`; replaying never re-locks — unlock stays derived (the selectors keep passed levels and anything at-or-before the frontier playable). Accessible: header roles on heading/track titles, `accessibilityRole="button"` + descriptive labels on unlocked rows, `accessibilityState.disabled` on locked ones, and a back affordance.
- `src/state/selectors.ts` — no change needed: Task 11 already shipped `levelStatuses` exactly for this view (flattening, unlock/frontier/completed flags, and per-level `needsReview`).
- `src/navigation/types.ts` — `RootStackParamList` gains `LevelMap: undefined`.
- `src/navigation/AppNavigator.tsx` — the wiring:
  - `LevelMapRoute` renders the screen from the AppContext (defensive "Nothing to explore yet." when progress is null) and `onSelectLevel` **pushes** a fresh `LevelPlay` (so a replayed level always mounts cleanly — the play screen resolves its session once on mount and reusing an existing screen would carry stale level params).
  - `LevelPlayRoute`'s abandon/`onExit` now `popTo('LevelMap')` (the map is the home), replacing the previous `goBack()` that was a no-op when the player had booted straight into LevelPlay.
  - `ResultRoute`'s completion-state "Continue" (no next level) now `popTo('LevelMap')` — the Task 8-deferred "Go to map" — instead of replaying the just-finished level. `popTo` pops to an existing map or replaces the current screen with it, so both the boot-straight-to-completion and map-entered completion stacks resolve to a single map.
  - Registered the `LevelMap` screen in the stack.

Tests (12 new): `src/screens/__tests__/LevelMapScreen.test.tsx` — track sections + all level titles, current/passed/locked/unlocked indicators, needs-review badge, unlocked tap → `onSelectLevel` (incl. replaying a passed level), locked levels disabled (non-tappable, no re-lock path), back affordance, and accessibility labels/roles/states.

Note: on-device verification (`npm run android`) still needs an emulator/device and lands in the Task 14 regression; the map's lock/pass/current indicators and replay behavior are verified by the selector tests (Task 11) and these screen tests.

Verification: `npm test -- LevelMapScreen` 12/12 pass · `npm test` 207/207 pass (12 new; existing suites intact) · `npx tsc --noEmit` clean · `npm run lint` clean.

## Task 12: Settings (reset, theme) + theme system — DONE

Built the theme system and the Settings screen per `docs/mvp-plan.md` Task 12, `docs/use-cases` "Settings — Theme" / "Settings — Reset Progress", and `docs/schema` §2 (settings survive a reset):

- `src/theme/tokens.ts` — design tokens (spacing, typography, radii), the scheme-independent structure half of the theme system.
- `src/theme/themes.ts` — a single semantic `ThemeColors` palette (surfaces, text, borders, primary/success/danger/warning families, badge chips) with `lightColors` (the exact colors the app shipped with) and `darkColors` (a slate scheme with brighter accents tuned for dark surfaces).
- `src/theme/ThemeProvider.tsx` — the `device | light | dark` context: resolves the preference against the device scheme (`useColorScheme`), exposes `useTheme()` (with a light-theme fallback when no provider is present, so presentational fixtures keep rendering) and `useThemedStyles(factory)` (palette-driven styles, memoized per scheme).
- **No hardcoded colors anywhere in the UI** — every screen, component, the navigator's defensive views, and the provider loading view consume the palette (verified by a grep sweep). The `StatusBar` now follows the resolved theme via a `ThemedStatusBar` inside the provider.
- `src/app/AppContext.ts` + `src/app/AppProvider.tsx` — `applySettings(next)` replaces + persists settings (survive a reset); `resetGame()` clears `egg:progress`, re-runs the first-launch boot decision (Basic-only v1 auto-starts a fresh progress at level 1 and persists it; multiple eligible tracks leave progress null → StartPoint choice), and resolves to the new progress so the caller can route to it.
- `src/screens/SettingsScreen.tsx` — presentational (no navigation/storage/reducer imports): the appearance choice (Device / Light / Dark, current one marked with a ✓ and `accessibilityState.selected`), a "Review mistakes" link (docs/use-cases "Review Screen" is opened from Settings), a confirmed "Reset game" action (native Alert dialog appears before anything is erased — the Cancel path has no callback; only Confirm calls `onReset`), and a back affordance. Built on the theme tokens.
- `src/navigation/types.ts` + `src/navigation/AppNavigator.tsx` — registered the `Settings` route; `LevelMapRoute` gains a Settings entry (the map is the home hub); `SettingsRoute` wires `onChangeTheme → applySettings`, `onOpenReview → navigate('Review')`, and `onReset` to `resetGame` + `navigation.reset` — replacing the whole stack with the re-initialized boot route (auto-started current level for Basic-only v1, or the StartPoint choice for multi-track), so the player cannot go back into pre-reset screens.
- `App.tsx` — the root is now just `SafeAreaProvider → AppProvider → AppNavigator`; the StatusBar moved into the provider so it follows the pinned theme.

Tests (18 new): `src/theme/__tests__/ThemeProvider.test.tsx` (6 — pinned light/dark ignore the device, device follows the mocked `useColorScheme`, no-provider fallback, `useThemedStyles` palette styles), `src/screens/__tests__/SettingsScreen.test.tsx` (7 — theme options + selected mark, `onChangeTheme` payloads, Review link, confirmed reset via the Alert mock, back affordance, accessibility), `src/app/__tests__/AppProvider.test.tsx` (+3 — `applySettings` updates + persists the theme; `resetGame` clears progress and re-auto-starts with settings surviving; multi-track reset leaves progress null → start choice), and `src/screens/__tests__/LevelMapScreen.test.tsx` (+2 — Settings entry tap → `onOpenSettings`, omitted without the prop).

Note: on-device theme cycling and reset (`npm run android`) still needs an emulator/device and lands in the Task 14 regression; the device/light/dark resolution, the confirmed reset flow, and settings-survive-reset are verified by the tests above.

Verification: `npm test -- ThemeProvider SettingsScreen` 13/13 pass · `npm test` 225/225 pass (18 new; existing suites intact) · `npx tsc --noEmit` clean · `npm run lint` clean.
