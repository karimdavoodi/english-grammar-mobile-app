# Implementation Plan: Main-Screen Redesign and Question-Screen UI Fixes

Date: 2026-08-23 · Status: Draft for review · Owner: Karim

This plan fixes the reported UI issues: safe-area/status-bar overlap, removing
unwanted bottom Back buttons and exit-confirmation dialogs, splitting the flat
level map into a Home screen → per-track Topics screen, reworking the in-play
feedback so only the correct + chosen answers explain themselves, adding a
Resume button and Android "exit app?" back handling, and moving the study
shortcuts out of Settings onto the Home screen.

The app is React Native (0.87) + TypeScript, `@react-navigation/native-stack`
with `headerShown: false`, content is 3 tracks (Basic / Intermediate / Advanced,
30 levels each). All screens are presentational and consume the theme palette.

---

## Current → Target mapping

| # | Reported issue | Root cause today | Target behavior |
|---|---|---|---|
| 1 | Upper status line overlaps the mobile upper toolbar | No screen applies safe-area insets (`headerShown: false`, screens render from the top of the display). `src/components/ProgressHeader.tsx` and every screen header sit under the status bar / notch. | Every screen applies top (and bottom) safe-area insets via a shared shell. |
| 2 | A 'Back' button on the bottom of the screen is not needed | Bottom `Back` `Pressable` in LevelMap, Review, Settings, Stats, Report. | Remove all bottom Back buttons. Navigation back uses the system back button / iOS swipe gesture. |
| 3 | Clicking buttons shows a "sure to exit current screen?" dialog | `LevelPlayScreen.handleAbandon` shows `Alert.alert` before quitting a level / Mastery Review. | No confirmation dialog when leaving a level; leaving just navigates back (session stays resumable). |
| 4 | Main screen shows all three levels with all their topics in one screen | `LevelMapScreen` renders all 90 levels flat. | Home shows only the three tracks; tapping a track opens a new Topics screen listing that track's topics. |
| 5 | Question screens don't scroll; 'Quit level' button not needed | `LevelPlayScreen` body is a fixed `flex: 1` View; a bottom 'Quit level' button exists. | Question content scrolls; the Quit level button is removed. |
| 6 | On answering, only the correct answer and the chosen answer should be explained | `QuestionCard`/`ChoiceButton` reveal a per-choice explanation for ALL four choices and dim the rest; a wrong answer also re-shows the full `LessonCard`. | After an answer: highlight the correct choice and the chosen choice, show explanations for those two only, and drop the post-answer lesson card. Pre-question re-teach lesson cards stay. |
| 7 | Android back on the main screen should ask "exit the app?" | No `BackHandler` anywhere; back on the root screen just exits. | On the Home screen only, Android back shows a confirm dialog: Yes → `BackHandler.exitApp()`, No → stay. |
| 8 | App start should show the main screen with a Resume button | Boot routes returning players straight into `LevelPlay` (`progress ? 'LevelPlay' : 'StartPoint'`). | App always boots to Home. Home shows a Resume button that resumes the last session (or current level). |
| 9 | Main screen must carry Settings / progress / Resume / wrong answers / track list; Settings loses three study buttons | Study links live in Settings; LevelMap is a flat map. | Home: Settings, progress summary text, Resume, wrong answers (Review), Review/Practice (Mixed Review), Stats, then the three tracks. Settings keeps only Appearance, Growth (notifications), and Reset. |

---

## Architecture decisions

1. **Boot always to Home.** `initialRouteName` becomes `Home` unconditionally.
   The `StartPoint` first-launch screen is removed: its role ("start where you
   want") is replaced by browsing tracks → topics from Home. A first-time player
   (progress `null`) taps any topic; that topic becomes their starting point
   (everything before it unlocks by derivation). This reuses the existing
   `chooseStartingPoint(trackId, levelNumber)` + `createInitialProgress` path.
   `resolveBootProgress` in `AppProvider` is left unchanged.

2. **`LevelMap` becomes Home; a new `Topics` route is added.**
   - `Home` (renamed from `LevelMap`) lists the three tracks + the Home actions.
   - `Topics` (`{ trackId }`) lists one track's levels (each level teaches one
     topic) with their derived statuses, reusing `levelStatuses`.
   - Routes become: `Home, Topics, LevelPlay, Result, Graduation, Review,
     Settings, MixedReview, Report, Stats`. `StartPoint` is removed.

3. **Feedback shows only correct + chosen explanations (issue 6).** When
   revealed, the correct choice shows its "why it's right" and the chosen wrong
   choice shows its "why it's wrong". The other choices render with a light dim
   and no explanation, so the correct and chosen answers stand out while "no
   more" explanations are shown. On a correct answer, one explanation shows.
   The post-answer `LessonCard` (re-shown on a wrong answer) is removed — the
   two per-choice explanations carry the teaching. **Deliberate behavior
   change**: the "Teach on Failure" Gherkin scenario that re-shows the topic
   lesson card after a wrong answer is updated to match. The *pre-question*
   re-teach lesson (2-miss adaptive re-teach, `serve.showLesson`) is kept.

4. **Safe-area handled once, shared everywhere.** A small `ScreenShell`
   component applies themed background + top/bottom `useSafeAreaInsets`.
   Every screen is wrapped in it. This also fixes the status-bar overlap on all
   screens, not just the question screen.

5. **`headerShown: false` stays.** Removal of bottom Back buttons relies on the
   Android system back button and the iOS edge-swipe gesture (native-stack
   provides both by default — `gestureEnabled` is on for iOS, hardware back for
   Android). No native header is added: the in-screen headers (notably the
   `LevelPlay` `ProgressHeader` status strip) don't map to a plain title bar,
   and the issues ask for less chrome, not a new one. iOS edge-swipe is
   verified on device in the Task 7 manual pass.

6. **No schema/state migration.** `Progress`, settings, and content shapes are
   unchanged. The new Home progress summary and per-track statuses are pure
   derivations (new small selectors).

---

## Task list

### Task 1 — Safe-area foundation (Issue 1)

**Description:** Add a shared `ScreenShell` component (themed background +
top/bottom safe-area insets via `useSafeAreaInsets`) and wrap every screen root
with it so no content renders under the status bar / notch or behind the home
indicator. Add a test harness so screen tests render inside a
`SafeAreaProvider` (`useSafeAreaInsets` throws without one).

**Acceptance criteria:**
- [ ] Every screen (Home, Topics, LevelPlay, Result, Graduation, Review, Settings, MixedReview, Report, Stats) renders its header below the status bar / notch.
- [ ] Bottom-anchored content (Next question, reset, send reports) clears the home indicator.
- [ ] All existing screen tests render inside a `SafeAreaProvider` without throwing.

**Verification:**
- [ ] `npm test` — screen/component suites green with the new harness.
- [ ] `npx tsc --noEmit` and `npm run lint` clean.
- [ ] Manual: launch on device — ProgressHeader and all headers clear the status bar; nothing is cut off at the bottom.

**Dependencies:** None (independent of all other tasks).

**Files likely touched:**
- `src/components/ScreenShell.tsx` (new)
- `src/screens/*.tsx` (all 10 screens — swap root View for ScreenShell)
- `src/**/__tests__/*.test.tsx` (wrap renders in `SafeAreaProvider`; a shared `test-utils` helper)
- `src/app/__tests__/journey.test.ts` (renders screens via the provider — same harness)

**Estimated scope:** Medium (1 new file, ~10 mechanical edits + test harness).

---

### Task 2 — Level-play question screen rework (Issues 3, 5, 6)

**Description:** In `LevelPlayScreen` (and the choice cards it drives):
1. Wrap the question/feedback body in a `ScrollView` so long questions and
   feedback scroll on small screens.
2. Remove the 'Quit level' / 'Exit Mastery Review' button and the abandon
   confirmation dialog (`handleAbandon`, `abandonSession` usage, `onExit`).
   Leaving a level mid-way is the system back gesture; the active session is
   already persisted and resumable. Note: Mastery Review is non-terminating, so
   this removes its only explicit exit affordance — the system back gesture
   remains, and iOS discoverability is covered by Open Question 1.
3. Rework post-answer feedback: in `QuestionCard`/`ChoiceButton`, reveal
   explanations only for the correct choice and the user's chosen choice (the
   two collapse to one on a correct answer). Other choices get a light dim and
   no explanation. Remove the post-answer `LessonCard` re-show
   (`feedback.showLesson` branch); a wrong answer always gets a "Next question"
   affordance. Keep the Report button available on wrong answers.
4. Pre-question re-teach lesson (`phase === 'lesson'`) is unchanged.

**Acceptance criteria:**
- [ ] Question and feedback content scrolls when it exceeds the viewport.
- [ ] No 'Quit level' / 'Exit Mastery Review' button and no abandon dialog anywhere.
- [ ] After an answer: exactly the correct choice (with its explanation) and the chosen wrong choice (with its explanation) are annotated; the other two choices are lightly dimmed with no explanation; no lesson card appears after an answer.
- [ ] The pre-question re-teach lesson still appears before a re-served missed rule (2-miss rule unchanged).
- [ ] `onExit` is removed from `LevelPlayScreenProps` and the navigator's `LevelPlay`/`MixedReview` wiring.

**Verification:**
- [ ] `npm test` — LevelPlayScreen, components suites updated and green.
- [ ] `npx tsc --noEmit`, `npm run lint` clean.
- [ ] Manual: answer wrong on a long question — feedback shows only correct + chosen explanations and scrolls; no lesson card, no quit button.

**Dependencies:** Task 1 (screen is wrapped in ScreenShell).

**Files likely touched:**
- `src/screens/LevelPlayScreen.tsx`
- `src/components/QuestionCard.tsx`
- `src/components/ChoiceButton.tsx`
- `src/components/FixSentenceCard.tsx` (same choice-reveal behavior)
- `src/screens/MixedReviewScreen.tsx` (drop `onExit` pass-through)
- `src/navigation/AppNavigator.tsx` (drop `handleExit` / `onExit` wiring)
- `docs/use-cases/english-grammar-review.md` (update the wrong-answer scenario)
- Tests: `src/screens/__tests__/LevelPlayScreen.test.tsx`, `src/components/__tests__/components.test.tsx`, `src/navigation/__tests__/AppNavigator.test.tsx`, `src/game/__tests__/serving.test.ts` (re-teach assertions stay)

**Estimated scope:** Medium.

---

### Task 3 — Settings and secondary-screen cleanup (Issues 2, 9)

**Description:** Remove the three study buttons ('Review mistakes',
'Review/Practice', 'Stats') from the Settings screen — they move to Home
(Task 4). Remove the bottom Back button from Settings, Review, Stats, and
Report screens and their `onBack` props/wiring. Settings keeps Appearance
(theme), Growth (notifications + reminder time), and Reset. (Reset's
post-reset routing — which today targets `StartPoint` — is re-pointed to Home
in Task 6.)

**Acceptance criteria:**
- [ ] Settings shows only Appearance, Growth, and Reset; no 'Review mistakes' / 'Review / Practice' / 'Stats' entries.
- [ ] No bottom 'Back' button renders on Settings, Review, Stats, or Report.
- [ ] Back navigation from these screens works via the system back gesture.
- [ ] `SettingsScreenProps` drops `onOpenReview`, `onOpenMixedReview`, `onOpenStats`, `onBack`; `ReviewScreenProps`/`StatsScreenProps`/`ReportScreenProps` drop `onBack`; navigator wiring updated accordingly.

**Verification:**
- [ ] `npm test` — Settings/Review/Stats screen suites updated and green.
- [ ] `npx tsc --noEmit`, `npm run lint` clean.
- [ ] Manual: open Settings, Review, Stats, Report from Home — no bottom Back button; back gesture returns to Home.

**Dependencies:** Task 1. (Home entries for the moved buttons land in Task 4.)

**Files likely touched:**
- `src/screens/SettingsScreen.tsx`
- `src/screens/ReviewScreen.tsx`
- `src/screens/StatsScreen.tsx`
- `src/screens/ReportScreen.tsx`
- `src/navigation/AppNavigator.tsx`
- Tests: `src/screens/__tests__/SettingsScreen.test.tsx`, `ReviewScreen.test.tsx`, `StatsScreen.test.tsx`

**Estimated scope:** Medium.

---

### Task 4 — Home screen (main screen) (Issues 2, 7, 8, 9)

**Description:** Build the new `HomeScreen` (replaces `LevelMapScreen` as the
main screen):
- **Settings** button (top-right, unchanged testID `level-map-settings` → keep or `home-settings`).
- **Progress summary** text: per-track topics passed ("Basic: 3/30 · Intermediate: 0/30 · Advanced: 0/30") plus the daily/best streak. From a new pure selector `completedByTrack(tracks, progress)`; when `progress` is `null`, show an encouraging "Pick a level to begin" instead.
- **Resume** button — shown only when `progress` exists; resumes the last session
  via a new helper `resumableLevelId(progress)` that routes by session kind: a
  `mastery` session resumes Mixed Review, a normal level session resumes
  `LevelPlay` at `activeSession.levelId`, and no session resumes `LevelPlay` at
  `currentLevelId`. (A mastery session's persisted `levelId` is the sentinel
  string `'mastery'`, not a real level id — routing it to `LevelPlay` would land
  on the "level not available" view, so it must target Mixed Review.)
- **Wrong answers** button → `Review` (testID `home-review`); hidden when
  `progress` is `null` (the Review route already returns a defensive "Nothing to
  review yet").
- **Review / Practice** button → `MixedReview` (testID `home-mixed-review`).
- **Stats** button → `Stats` (testID `home-stats`).
- **Three track cards** (Basic / Intermediate / Advanced) → `onSelectTrack(trackId)` opens `Topics`.
- No bottom Back button.
- **Android back exit confirm:** a `BackHandler` effect on the Home screen only — back press shows `Alert.alert('Exit app?', … [No, Yes])`; Yes → `BackHandler.exitApp()`, No/cancel → stay. Guarded with `Platform.OS === 'android'`.

**Acceptance criteria:**
- [ ] Home renders Settings, progress summary, Resume (only with progress), Wrong answers, Review/Practice, Stats, and the three track cards.
- [ ] Tapping a track calls `onSelectTrack(trackId)` (Topics route).
- [ ] Resume routes by session kind: normal level session → `LevelPlay` at `activeSession.levelId`; `mastery` session → Mixed Review; no session → `LevelPlay` at `currentLevelId`.
- [ ] On Android, back on Home shows the exit-confirm dialog; Yes exits, No stays. On other screens back behaves normally. iOS Home is the root (no-op).
- [ ] No bottom Back button on Home.

**Verification:**
- [ ] `npm test` — new `HomeScreen.test.tsx` (rendering, progress text, resume visibility, per-action callbacks) + a BackHandler confirm test.
- [ ] `npx tsc --noEmit`, `npm run lint` clean.
- [ ] Manual: cold start with saved progress → Home shows Resume; tap Resume → resumes the in-progress level. Back on Home → exit dialog.

**Dependencies:** Task 1. Supplies the moved buttons from Task 3; route wiring in Task 6.

**Files likely touched:**
- `src/screens/HomeScreen.tsx` (new; `LevelMapScreen.tsx` deleted after Task 6)
- `src/state/selectors.ts` (`completedByTrack`, `resumableLevelId` — pure; `resumableLevelId` returns a discriminated target `{ kind: 'level' | 'mastery'; levelId?: string }` so the route knows whether to open `LevelPlay` or Mixed Review)
- `src/state/__tests__/selectors.test.ts`
- `src/screens/__tests__/HomeScreen.test.tsx` (new)

**Estimated scope:** Medium.

---

### Task 5 — Topics screen (Issue 4)

**Description:** Build `TopicsScreen` (`{ trackId }`): lists the selected
track's levels (each level teaches one topic) with derived statuses — current,
passed, locked, "needs review" — reusing `levelStatuses` filtered to the track.
Tapping an unlocked topic pushes a fresh `LevelPlay`. When `progress` is
`null` (first-time player), every topic is shown as available; the first tap
creates the starting point (Task 6 wires `chooseStartingPoint`). No bottom Back
button; safe-area via ScreenShell.

**Acceptance criteria:**
- [ ] Topics shows only the selected track's topics, in level-number order, with correct status badges (passed/current/locked/needs-review) when progress exists.
- [ ] With no progress, all topics are tappable.
- [ ] Tapping an unlocked topic calls `onSelectLevel(levelId)`; tapping a locked topic does nothing.
- [ ] No bottom Back button.

**Verification:**
- [ ] `npm test` — new `TopicsScreen.test.tsx`.
- [ ] `npx tsc --noEmit`, `npm run lint` clean.
- [ ] Manual: Home → Basic → 30 topics listed; locked ones (after current) not tappable; back gesture returns to Home.

**Dependencies:** Task 1.

**Files likely touched:**
- `src/screens/TopicsScreen.tsx` (new)
- `src/screens/__tests__/TopicsScreen.test.tsx` (new)

**Estimated scope:** Small–Medium.

---

### Task 6 — Navigator restructure and boot flow (Issues 4, 8)

**Description:** Rewire `AppNavigator`:
- `initialRouteName` is always `Home`.
- Add `Topics: { trackId }` to `RootStackParamList`; remove `StartPoint`.
- `HomeRoute`: wires Settings, Resume, Wrong answers, Mixed Review, Stats, track selection (→ `push('Topics', { trackId })`), and the BackHandler exit-confirm.
- `TopicsRoute`: resolves the track; on `onSelectLevel` with no progress, calls `chooseStartingPoint(trackId, level.number)` then `push('LevelPlay', { levelId })`; with progress, `push('LevelPlay', { levelId })` (a fresh mount per replay, as the map does today).
- `LevelPlayRoute`: drop `onExit`/`handleExit` (Task 2).
- `SettingsRoute` reset: `resetGame()` returns `null` after clearing progress
  (two eligible starting tracks), so the post-reset `navigation.reset` must land
  on `Home` rather than the deleted `StartPoint`.
- `Result`/`Graduation` "Go to map" and `MixedReview` exit return to `Home` (`popTo('Home')` / `replace('Home')`).
- Delete `StartPointScreen.tsx` and its route; `StartPointScreen.test.tsx` removed. `eligibleStartingPoint` stays in content (harmless, still used by `resolveBootProgress`).

**Acceptance criteria:**
- [ ] App boots to Home whether or not progress exists; StartPoint is never shown.
- [ ] Home → track → Topics → topic → LevelPlay flow works for both new (no progress) and returning players.
- [ ] Result Continue advances through levels; final-level Result → Graduation; Graduation → Home and → Mixed Review both work.
- [ ] Mixed Review exit returns to Home.
- [ ] `LevelPlay` has no `onExit` wiring.
- [ ] After a reset the stack lands on Home (empty "Pick a level to begin" state), never StartPoint.

**Verification:**
- [ ] `npm test` — `AppNavigator.test.tsx` rewritten for the Home-first flow (new player picks a track and topic, pass-through-Result, returning player lands on Home and resumes via button).
- [ ] `npx tsc --noEmit`, `npm run lint` clean.
- [ ] Manual: fresh install → Home (no Resume); tap Advanced → topics → topic → plays. Relaunch → Home with Resume.

**Dependencies:** Tasks 4, 5 (routes reference the new screens).

**Files likely touched:**
- `src/navigation/AppNavigator.tsx`
- `src/navigation/types.ts`
- `src/screens/StartPointScreen.tsx` (delete) + its test
- `src/screens/LevelMapScreen.tsx` (delete, superseded by Home) + its test
- `src/navigation/__tests__/AppNavigator.test.tsx`

**Estimated scope:** Medium.

---

### Task 7 — Regression sweep and remaining test coverage

**Description:** After Tasks 1–6 the suite must be fully green. Update the
remaining affected tests and add the new-feature coverage, then run the full
regression + lint + typecheck, and the manual device pass.

**Acceptance criteria:**
- [ ] `npm test` fully green (all suites incl. journey).
- [ ] `npx tsc --noEmit` clean; `npm run lint` clean.
- [ ] New coverage present: HomeScreen (progress text, Resume visibility, action callbacks), TopicsScreen (statuses, locked behavior, no-progress state), BackHandler exit-confirm, feedback only-correct-and-chosen behavior.
- [ ] Old expectations removed: bottom Back buttons, abandon dialog/quit button, LevelMap flat map, Settings study buttons, StartPoint flow.
- [ ] `docs/use-cases/english-grammar-review.md` updated for the feedback change (post-answer lesson card no longer re-shown) and the Home/Topics structure.

**Verification:**
- [ ] Full `npm test` run.
- [ ] Manual device pass (Android + iOS): status bar clear on every screen; no bottom Back buttons; no exit dialogs during play; feedback shows only correct + chosen explanations; Home → Topics → LevelPlay → Result → Graduation end-to-end; back-on-Home exit confirm; Resume from cold start.

**Dependencies:** Tasks 1–6.

**Files likely touched:** test files across the suite; `docs/use-cases/english-grammar-review.md`; `docs/progress.md` (progress note).

**Estimated scope:** Medium.

---

## Checkpoints

- **After Tasks 1–3:** App builds and runs; status-bar overlap gone; no bottom
  Back buttons; no exit dialogs; question feedback simplified; Settings
  cleaned up. Screen/component suites green with the new harness.
- **After Task 6:** New end-to-end structure works — Home → Topics → LevelPlay →
  Result → Graduation; Resume; Android exit confirm. Navigator suite green.
- **After Task 7:** Full suite green, lint + tsc clean, manual device pass
  recorded. Review with human before any release.

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Test harness churn (screens now need `SafeAreaProvider`) breaks many tests at once | Med | Land Task 1 with a shared render helper; keep it mechanical. |
| Removing the post-answer lesson card contradicts the "Teach on Failure" Gherkin scenario | Med | Treat as a deliberate spec change (issue 6); update the Gherkin + tests in the same task. |
| Large navigator restructure is the riskiest change | Med | Build Home/Topics components first (Tasks 4–5), rewire last (Task 6); each task leaves the app runnable. |
| BackHandler on Home could swallow back on other screens if scoped wrong | Med | Attach the handler only inside the Home route component with `useFocusEffect`/mount effect; return `true` only when the dialog is shown; verify other screens still navigate back. |
| iOS loses a visible Back affordance when bottom Back buttons are removed | Med | Accepted: native-stack edge-swipe is the back gesture (verified in the Task 7 device pass); no native header is added. |
| First-time start semantics (topic = starting point) differs from the old StartPoint flow | Low | Reuses existing `chooseStartingPoint`; unlock derivation already handles earlier levels. Covered by AppNavigator tests. |
| No schema/state migration needed | — | Confirmed: `Progress`/settings/content unchanged. |

---

## Resolved decisions

These were open during drafting; they are now resolved (already reflected in the
tasks above):

1. **Visible back control on iOS → gesture-only, no native header.** The
   in-screen headers (especially the `LevelPlay` `ProgressHeader` status strip)
   don't map cleanly to a native title bar, and the issues ask to remove chrome,
   not add it. iOS edge-swipe (`gestureEnabled` on by default) and the Android
   hardware back button are the back mechanism; both are verified on device in
   the Task 7 manual pass.

2. **Progress summary → per-track topics passed** ("Basic: 12/30 · Intermediate:
   0/30 · Advanced: 0/30") plus the daily/best streak, derived from
   `completedLevelIds`. Levels are the unit the app already tracks, so
   "questions completed" was read as "levels completed". No change to Task 4.

3. **Non-chosen choices after reveal → light dim, no explanation.** The two
   non-participating choices keep the existing `dimmed` opacity so the correct
   (green) and chosen (red) answers stand out, but get no explanation text —
   honoring "no more". This is the smaller code change (keep the `dimmed`
   status, only gate the explanation).
