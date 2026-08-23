# UI Redesign — Task Tracker

Source plan: [docs/ui-plan.md](../docs/ui-plan.md). Mark a task `[x]` only after
it is implemented, verified (tests / tsc / lint), and committed.

- [x] Task 1 — Safe-area foundation (Issue 1)
      `ScreenShell` (themed background + top/bottom safe-area insets) wraps every
      screen root; shared `renderScreen`/`wrapInSafeArea` test harness renders
      screen tests inside a `SafeAreaProvider`.
- [ ] Task 2 — Level-play question screen rework (Issues 3, 5, 6)
- [ ] Task 3 — Settings and secondary-screen cleanup (Issues 2, 9)
- [ ] Task 4 — Home screen (main screen) (Issues 2, 7, 8, 9)
- [ ] Task 5 — Topics screen (Issue 4)
- [ ] Task 6 — Navigator restructure and boot flow (Issues 4, 8)
- [ ] Task 7 — Regression sweep and remaining test coverage
