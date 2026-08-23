# UI Fixes Round 2 — Task Tracker

Source plan: [docs/ui-plan-1.md](../docs/ui-plan-1.md). Mark a task `[x]` only
after it is implemented, verified (tests / tsc / lint), and committed.

- [x] Task 1 — Scope the Android exit-confirm to Home (back-navigation fix)
      Remove the mount-time `BackHandler` from `HomeScreen` (it stays
      presentational) and register the Android "Exit app?" handler in `HomeRoute`
      (`AppNavigator.tsx`) inside `useFocusEffect`, so it fires only while Home is
      focused. Hardware back on Topics/LevelPlay/Result/etc. pops normally; only
      back on Home asks to exit. Update `HomeScreen.test.tsx` (drop the exit-confirm
      block) and add focus-scoped coverage in `AppNavigator.test.tsx`. Manual
      Android-device pass required (hardware back can't be fully reproduced in jest).
- [x] Task 2 — Stats screen redesign + human rule names
      Redesign `StatsScreen` from plain text lines into themed summary tiles
      (Answers / Accuracy / Time played / Practice days) and an "Accuracy by rule"
      section whose rows show the human `TopicRule.title` (resolved via `findRule`,
      fallback to the tag), the `correct/total` fraction, an accuracy bar, and the
      percentage. Sort rows by resolved title (then tag). Keep the "Review mistakes"
      button. Update `StatsScreen.test.tsx`.
- [x] Task 3 — Teach-on-failure lesson in the feedback screen (not after "Next")
      In `LevelPlayScreen`, render the `LessonCard` inline in the `feedback` phase
      whenever the last answer was wrong, and make the "Next question" dismiss serve
      the next question directly (drop the `nextServe.showLesson ? 'lesson' :
      'question'` branch). Entry re-teach (resumed session at the ≥2-miss threshold)
      keeps the `lesson` phase and Continue button. `LessonCard` action button becomes
      optional (`actionLabel?: string | null`) so the inline card has no separate
      button. Update `LevelPlayScreen.test.tsx` (wrong answer shows lesson inline;
      Next shows no lesson; mercy/12-cap tests stop pressing `lesson-continue`
      mid-level) and `components.test.tsx`.
- [x] Task 4 — Review screen cleanup (no per-question miss count / report; one
      report at the end)
      Removed the per-entry "Missed N time(s)" line and per-question `ReportButton`
      from `ReviewScreen`; replaced `onReport(questionId)` with a single
      `onOpenReport()` rendered as one "Report a problem" action at the end of a
      non-empty list. `ReviewRoute` creates a `general-review-feedback` draft
      (sentinel questionId) before navigating to Report; `ReportScreen` labels it
      "General feedback" so the note can be edited and sent. Updated Review, Report
      (new test file), and navigator tests.
- [x] Task 5a — Data layer: all levels unlocked
      `unlockedLevelIds` now returns every level id, so `isLevelUnlocked` is true
      for every level in the corpus and `levelStatuses.unlocked` is always true.
      `currentLevelId`, completed, `isCurrent`, and `needsReview` stay — only the
      lock gate is dropped (Round 2 "all levels accessible" decision). Updated
      `selectors.test.ts` and `journey.test.ts` to assert all-unlocked and removed
      the "future levels stay locked" assertions. Note: TopicsScreen lock-UI tests
      fail as a result — Task 5b removes the locked presentation and updates them.
- [ ] Task 5b — Topics screen: remove the locked rows
      `TopicsScreen` renders every level tappable (`disabled` false,
      `accessibilityRole="button"`), no "🔒 Locked" badge, no locked styles;
      `stateLabel` never returns "Locked" (unpassed non-current levels read
      "Available"). Passed / Current / Review badges stay. Update `TopicsScreen.test.tsx`.
      Depends on Task 5a.

### Checkpoint
- [ ] Full suite green: `npm test`; typecheck: `npx tsc --noEmit`; lint: `npm run lint`.
- [ ] Manual Android pass: back navigation, lesson on wrong answer, all levels accessible.
- [ ] Manual visual pass: Stats screen, Review screen.
- [ ] Review with human before proceeding.
