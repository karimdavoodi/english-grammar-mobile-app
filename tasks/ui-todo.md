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
- [ ] Task 5 — Topics screen (Issue 4)
- [ ] Task 6 — Navigator restructure and boot flow (Issues 4, 8)
- [ ] Task 7 — Regression sweep and remaining test coverage
