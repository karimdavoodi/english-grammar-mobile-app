# UI Redesign — Task Tracker

Source plan: [docs/ui-plan.md](../docs/ui-plan.md). Mark a task `[x]` only after
it is implemented, verified (tests / tsc / lint), and committed.

- [x] Task 1 — Safe-area foundation (Issue 1)
      `ScreenShell` (themed background + top/bottom safe-area insets) wraps every
      screen root; shared `renderScreen`/`wrapInSafeArea` test harness renders
      screen tests inside a `SafeAreaProvider`.
- [x] Task 2 — Level-play question screen rework (Issues 3, 5, 6)
      Question/feedback body scrolls (ScrollView); 'Quit level' / 'Exit Mastery
      Review' button and abandon confirm dialog removed (`onExit` dropped from
      `LevelPlayScreenProps` and the navigator/MixedReview wiring); feedback
      reveals explanations only for the correct + chosen choices (others dimmed,
      no explanation); post-answer `LessonCard` no longer re-shown; pre-question
      re-teach lesson unchanged.
- [x] Task 3 — Settings and secondary-screen cleanup (Issues 2, 9)
      Settings now holds only Appearance, Growth, and Reset — the three study
      shortcuts ('Review mistakes', 'Review / Practice', 'Stats') removed (they
      move to Home in Task 4). Bottom Back button removed from Settings, Review,
      Stats, and Report; `onBack` dropped from their props and the navigator
      wiring (back is the system gesture). Tests assert the absence of the old
      entries/buttons.
- [x] Task 4 — Home screen (main screen) (Issues 2, 7, 8, 9)
      New `HomeScreen` (replaces the flat LevelMap as the hub): Settings entry
      (`home-settings`), per-track progress summary from the new pure
      `completedByTrack` selector ("Basic: 3/30 · …") or "Pick a level to begin"
      for first-time players (progress null), Resume button (only with progress),
      Wrong answers (`home-review`), Review / Practice (`home-mixed-review`),
      Stats (`home-stats`), and three track cards (`onSelectTrack(trackId)` →
      Topics). New pure `resumableLevelId` selector routes resume by session kind
      (mastery/mixed → Mixed Review; level session → LevelPlay at
      `activeSession.levelId`; no session → LevelPlay at `currentLevelId`).
      Android-only hardware-back handler on Home asks "Exit app?" (Yes →
      `BackHandler.exitApp()`, No stays). No bottom Back button. Selector + new
      `HomeScreen.test.tsx` coverage green; navigator wiring lands in Task 6.
- [x] Task 5 — Topics screen (Issue 4)
      New presentational `TopicsScreen` (`{ trackId }`): lists the selected
      track's levels (each level teaches one topic) in level-number order with
      derived statuses — passed / current / locked / needs-review — reusing the
      pure `levelStatuses` selector filtered to the track; a first-time player
      (progress null) sees every topic as available and tappable; tapping an
      unlocked topic calls `onSelectLevel(levelId)` while locked topics are
      disabled; unknown track id renders a defensive message; no bottom Back
      button (system gesture); safe-area via ScreenShell. New
      `TopicsScreen.test.tsx` coverage green; navigator wiring lands in Task 6.
- [x] Task 6 — Navigator restructure and boot flow (Issues 4, 8)
      Root stack is Home-first: `initialRouteName` is always `Home`; `StartPoint`
      removed (never shown), `LevelMap` removed, `Topics: { trackId }` added.
      `HomeRoute` wires Settings / Resume (via `resumableLevelId`: mastery →
      Mixed Review, level session → LevelPlay at `activeSession.levelId`, none →
      LevelPlay at `currentLevelId`) / Wrong answers / Review / Stats / track
      cards → `push('Topics', { trackId })`. `TopicsRoute` resolves the track and
      on `onSelectLevel` with no progress calls `chooseStartingPoint` then pushes
      a fresh `LevelPlay`; with progress it pushes directly (fresh mount per
      replay). Settings reset now `navigation.reset`s to Home (never the deleted
      StartPoint). Mixed Review exit and Graduation "Go to level map" return to
      Home via `popTo('Home')`. `LevelPlay` has no `onExit` wiring. Deleted
      `StartPointScreen.tsx` / `LevelMapScreen.tsx` and their tests;
      `AppNavigator.test.tsx` rewritten for the Home-first flow (new player picks
      a track + topic and passes through Result; returning player lands on Home
      and resumes; reset lands on Home). Full suite green.
- [x] Task 7 — Regression sweep and remaining test coverage
      Full regression verified: `npm test` 29 suites / 316 tests green (incl.
      journey + Home-first AppNavigator), `npx tsc --noEmit` clean, `npm run
      lint` clean. New coverage confirmed in place: HomeScreen (progress text,
      Resume visibility, per-action callbacks, Android "Exit app?" BackHandler
      confirm), TopicsScreen (status badges, locked-disabled, no-progress
      state), feedback only-correct-and-chosen behavior (dimmed choices get no
      explanation). Old expectations confirmed removed: no bottom Back buttons,
      no abandon dialog / Quit level / `onExit`, no flat LevelMap, no Settings
      study shortcuts, no StartPoint flow. `docs/use-cases/english-grammar-review.md`
      updated for the Home/Topics structure (First Launch rewritten as Home-first
      boot; Level Map → Home and Topics; Review / Mixed Review / reset /
      graduation point at Home). Stale StartPoint / abandon-dialog comments
      cleaned from `AppProvider`, `AppContext`, `reducers`, `SettingsScreen`.
