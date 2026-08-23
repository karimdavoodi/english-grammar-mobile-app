# Implementation Plan: UI Fixes — Round 2 (docs/ui-plan-1.md)

Date: 2026-08-23 · Status: Draft for review · Owner: Karim
Source plan: [docs/ui-plan.md](ui-plan.md) (Round 1 — already landed). This plan is
the follow-up fixing the remaining reported UI issues. Tracker:
[tasks/ui-todo-1.md](../tasks/ui-todo-1.md).

The app is React Native (0.87) + TypeScript, `@react-navigation/native-stack`
with `headerShown: false`, content is 3 tracks (Basic / Intermediate / Advanced,
30 levels each). All screens are presentational and consume the theme palette
(`ThemeProvider`, `ScreenShell`). The app boots to Home (Home → Topics →
LevelPlay).

---

## Current → Target mapping

| # | Reported issue | Root cause today | Target behavior |
|---|---|---|---|
| 1 | Mobile back inside a level asks "exit app?" instead of returning, or stops working | `HomeScreen` registers a **mount-time** `BackHandler` listener (shows the "Exit app?" dialog) that is never scoped to Home being focused. It stays active while Topics/LevelPlay/Result are pushed, so it can swallow hardware back on pushed screens (exit dialog instead of a pop) and, in some navigation states, leaves back handling wedged. | The exit-confirm is registered **only while Home is focused** (`useFocusEffect` in the route layer). Back on any pushed screen pops the stack normally; only back on Home asks to exit. |
| 2 | Stats screen is unprofessional; "ACCURACY BY RULE" shows raw rule tags with `_` | `StatsScreen` renders a plain text list and prints the raw rule tag (e.g. `present_simple_form`) as-is. `StatsSummary.accuracyByRule` is keyed by tag, not by the human `TopicRule.title`. | Redesigned stats layout (metric tiles + per-rule accuracy bars). "Accuracy by rule" rows show the canonical human `TopicRule.title` (no underscores), resolved via `findRule`, falling back to the tag. |
| 3 | On a wrong answer the lesson is NOT shown immediately; it appears after clicking "Next question" | `LevelPlayScreen` shows the lesson only in a pre-question `lesson` phase (adaptive re-teach, `serve.showLesson`), which the Next press routes into. The feedback phase never shows the lesson. | A wrong answer renders the `LessonCard` **inline on the same feedback screen**; "Next question" serves the next question directly (never an intermediate lesson). Entry re-teach on a resumed session is unchanged. |
| 4 | Review screen: per-question "Missed N item" and per-question "Report problem" are noisy | `ReviewScreen` renders a `Missed {count} time(s)` line and a `ReportButton` inside every missed-question entry. | Remove the per-entry miss count and per-entry Report buttons; keep **one** "Report a problem" action at the bottom of the screen. It creates a general-feedback draft and opens its editable Report view. |
| 5 | Levels ahead of the frontier are locked; user wants access to all levels | `unlockedLevelIds` (selectors.ts) unlocks only levels at/before the frontier, and `TopicsScreen` disables the rest (`disabled`, "🔒 Locked"). | All levels are unlocked in the data layer (`unlockedLevelIds`/`isLevelUnlocked`/`levelStatuses` always unlock) and `TopicsScreen` renders every level tappable with no lock UI. |

---

## Architecture decisions

1. **Exit-confirm is navigation behavior, not screen behavior.** The Android
   "Exit app?" handler moves out of the presentational `HomeScreen` into the
   `HomeRoute` wrapper in `AppNavigator.tsx`, registered with `useFocusEffect`
   (React Navigation's focus-scoped effect) so the listener exists **only while
   Home is focused**. This is the canonical fix for "a BackHandler fires while
   another screen is focused": on a pushed screen the listener is removed and
   native-stack pops normally; on Home it shows the dialog. `HomeScreen` becomes
   purely presentational again. (`beforeRemove` / `usePreventRemove` is NOT used
   because it does not fire on the root screen of a stack — there is nothing to
   remove — so a focus-scoped `BackHandler` is the right tool.)

2. **Stats rule names resolve through the canonical rule registry.** The raw
   underscore tags (`present_simple_form`) are internal keys; the human labels
   live in `TopicRule.title`, already resolvable via `findRule()` in
   `content/index.ts` (the same lookup `LevelPlayScreen` uses). `StatsScreen`
   imports `findRule` and shows `findRule(tag)?.title ?? tag`, keeping the screen
   presentational (no new props) and the fallback safe for unknown/test tags.
   Rows sort alphabetically by their resolved display title (then by tag) so the
   order is stable, testable, and does not depend on event insertion order.

3. **Teach-on-failure lives on the wrong-answer feedback screen.** The
   `LessonCard` becomes an inline element of the `feedback` phase whenever the
   last answer was wrong; the "Next question" dismiss always serves the next
   question (`phase: 'question'`), ignoring `serve.showLesson`. The pre-question
   `lesson` phase is kept **only** for the screen-entry re-teach (a resumed
   session whose rule already hit the re-teach threshold) so the existing
   resume behavior and `serving.ts` re-teach API are unchanged. `LessonCard` gets
   an optional action button (`actionLabel?: string | null`); when `null` the
   inline card renders without a Continue button (Next dismisses it).

4. **Locking is a data-layer decision, not a screen flag.** `unlockedLevelIds`
   becomes "all levels" (the unlock-by-frontier derivation is dropped). The
   `currentLevelId` frontier, `completedLevelIds`, `isCurrent`, and
   `needsReview` signals all stay — they drive Resume, the Passed/Current/Review
   badges, and progress summaries. Only the lock *gate* is removed. This matches
   the product intent ("user should be able to access all levels") and avoids
   leaving dead lock logic behind after the UI is cleaned up.

5. **The single Review report is general feedback, not an arbitrary missed
   question.** Navigating to the existing Report route by itself only opens an
   empty outbox; it does not create anything the player can edit or send. The
   bottom action therefore creates one normal `ContentReport` using the stable
   sentinel id `general-review-feedback`, then navigates to Report. `ReportScreen`
   displays that id as "General feedback" rather than as a question id. This
   reuses the existing persisted report shape (including its note editor and
   export flow), needs no migration, and avoids silently attaching a report to
   an unrelated missed question.

6. **No Progress/settings/content migration.** Progress, settings, bundled
   content shapes, and persisted events are unchanged. The report record shape
   is also unchanged; the general-feedback sentinel is a valid existing string
   value. All five changes are presentational or pure-derivation edits plus test
   updates.

---

## Task list

Tasks 2 and 3 can proceed independently. Task 5b follows Task 5a so the UI
consumes the new selector contract. Tasks 1 and 4 both modify
`AppNavigator.tsx`; do them sequentially (Task 1 first) or coordinate a single
owner for that file. Suggested order: 1 → 2/3 in parallel → 4 → 5a → 5b.

### Phase 1: Ordered workstreams

#### Task 1 — Scope the Android exit-confirm to Home (back-navigation fix)

**Description:** Remove the mount-time `BackHandler` from `HomeScreen` and
register the Android "Exit app?" handler in `HomeRoute` (`AppNavigator.tsx`)
inside `useFocusEffect`, so it is active only while Home is focused. Hardware
back on Topics/LevelPlay/Result/etc. then pops normally; only back on Home shows
the confirm dialog. Fixes both reported symptoms: "asks to exit instead of
returning to main screen" and "stops working".

**Acceptance criteria:**
- [ ] `HomeScreen` no longer imports/registers `BackHandler` (pure presentational screen).
- [ ] `HomeRoute` registers the Android-only `BackHandler` inside `useFocusEffect`, showing "Exit app?" (Yes → `BackHandler.exitApp()`, No → stay) only while Home is focused.
- [ ] Back on a pushed screen pops the stack with no exit dialog; back on Home shows the dialog.

**Verification:**
- Tests pass: `npx jest src/navigation src/screens/__tests__/HomeScreen.test.tsx`.
- Build/typecheck: `npx tsc --noEmit`; lint: `npm run lint`.
- Manual (Android device — the harness cannot reproduce native-stack hardware back): Home → Topics → LevelPlay → back → Topics → back → Home (no exit dialog until Home); Home → back → exit dialog; both "No" and "Yes" behave.

**Dependencies:** None.

**Files likely touched:**
- `src/navigation/AppNavigator.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/__tests__/HomeScreen.test.tsx`
- `src/navigation/__tests__/AppNavigator.test.tsx`

**Estimated scope:** Medium (2 screens + 2 test files).

#### Task 2 — Stats screen redesign + human rule names

**Description:** Redesign `StatsScreen` from a plain text list into a designed
layout: a 2×2 grid of summary metric tiles (Answers, Accuracy, Time played,
Practice days) and an "Accuracy by rule" section whose rows show the human rule
title (via `findRule`, no underscores), the `correct/total` fraction, an accuracy
bar, and the percentage. Keep the "Review mistakes" button.

**Acceptance criteria:**
- [ ] Summary metrics render as themed tiles/cards (theme tokens), not plain text lines.
- [ ] "Accuracy by rule" rows show the human `TopicRule.title` (no `_`), `correct/total`, an accuracy bar, and the percentage.
- [ ] Unknown rule tags (fixtures/tests) fall back to the raw tag — no crash.
- [ ] Rule rows sort by resolved title (then raw tag), independent of event insertion order.
- [ ] "Review mistakes" still calls `onOpenReview` (`stats-review`).

**Verification:**
- Tests pass: `npx jest src/screens/__tests__/StatsScreen.test.tsx`.
- Build/typecheck: `npx tsc --noEmit`; lint: `npm run lint`.
- Manual: open Stats on a device/simulator with real history; confirm layout and human rule names.

**Dependencies:** None.

**Files likely touched:**
- `src/screens/StatsScreen.tsx`
- `src/screens/__tests__/StatsScreen.test.tsx`

**Estimated scope:** Small–Medium.

#### Task 3 — Teach-on-failure lesson in the feedback screen (not after "Next")

**Description:** In `LevelPlayScreen`, render the `LessonCard` inline in the
`feedback` phase whenever the last answer was wrong, and make the "Next
question" dismiss always go straight to the next question (drop the
`nextServe.showLesson ? 'lesson' : 'question'` branch). The screen-entry re-teach
(resumed session at the re-teach threshold) keeps showing the lesson before the
first question. `LessonCard` gets an optional action button so the inline card
renders without its own Continue.

**Acceptance criteria:**
- [ ] A wrong answer renders the `LessonCard` inline on the same feedback screen (before the Next button).
- [ ] A correct answer does not render the lesson.
- [ ] "Next question" after a wrong answer serves the next question directly — no lesson card in between, even at the ≥2-miss re-teach threshold.
- [ ] The inline card has no separate action button (Next dismisses it).
- [ ] The `lesson` phase on screen entry (resumed session) and its Continue button still work.

**Verification:**
- Tests pass: `npx jest src/screens/__tests__/LevelPlayScreen.test.tsx src/components/__tests__/components.test.tsx`.
  - Wrong answer shows `lesson-card` inline; `next-question` then shows the next prompt with no `lesson-card`.
  - The mercy-end and 12-question-cap tests no longer press `lesson-continue` mid-level.
  - The resume-at-re-teach test still expects the lesson before the first question.
  - components: LessonCard hides its button when no action label is given.
- Build/typecheck: `npx tsc --noEmit`; lint: `npm run lint`.

**Dependencies:** None.

**Files likely touched:**
- `src/screens/LevelPlayScreen.tsx`
- `src/components/LessonCard.tsx`
- `src/screens/__tests__/LevelPlayScreen.test.tsx`
- `src/components/__tests__/components.test.tsx`

**Estimated scope:** Medium.

#### Task 4 — Review screen cleanup (no per-question miss count / report; one report at the end)

**Description:** In `ReviewScreen`, remove the per-entry "Missed N time(s)" line
and the per-question `ReportButton`. Replace the `onReport(questionId)` prop with
a single `onOpenReport()` prop rendered as one "Report a problem" action at the
bottom of a non-empty list. `ReviewRoute` creates a `general-review-feedback`
report draft, then navigates to Report; `ReportScreen` labels that draft
"General feedback" so the editable note and Send reports flow are useful.

**Acceptance criteria:**
- [ ] No per-question "Missed N" line remains.
- [ ] No per-question Report button remains.
- [ ] Exactly one "Report a problem" button at the end of the list calls `onOpenReport`.
- [ ] Pressing it creates/opens an editable general-feedback draft; Report does not show an empty outbox or a misleading question id.

**Verification:**
- Tests pass: `npx jest src/screens/__tests__/ReviewScreen.test.tsx src/screens/__tests__/ReportScreen.test.tsx src/navigation/__tests__/AppNavigator.test.tsx`.
- Build/typecheck: `npx tsc --noEmit`; lint: `npm run lint`.

**Dependencies:** None.

**Files likely touched:**
- `src/screens/ReviewScreen.tsx`
- `src/navigation/AppNavigator.tsx` (ReviewRoute draft creation + prop swap)
- `src/screens/ReportScreen.tsx` (general-feedback label)
- `src/screens/__tests__/ReviewScreen.test.tsx`
- `src/screens/__tests__/ReportScreen.test.tsx`
- `src/navigation/__tests__/AppNavigator.test.tsx`

**Estimated scope:** Medium.

#### Task 5a — Data layer: all levels unlocked

**Description:** Drop the unlock-by-frontier derivation: `unlockedLevelIds`
returns every level id, so `isLevelUnlocked` is always true and
`levelStatuses.unlocked` is always true. `currentLevelId`, `completedLevelIds`,
`isCurrent`, and `needsReview` are unchanged. Update selector and journey tests
that assert frontier locking.

**Acceptance criteria:**
- [ ] `unlockedLevelIds(tracks, progress)` returns all level ids for any progress.
- [ ] `isLevelUnlocked` returns true for every level.
- [ ] `levelStatuses` marks every level `unlocked: true`.
- [ ] No test asserts "future levels stay locked".

**Verification:**
- Tests pass: `npx jest src/state/__tests__/selectors.test.ts src/app/__tests__/journey.test.ts`.
- Build/typecheck: `npx tsc --noEmit`; lint: `npm run lint`.

**Dependencies:** None.

**Files likely touched:**
- `src/state/selectors.ts`
- `src/state/__tests__/selectors.test.ts`
- `src/app/__tests__/journey.test.ts`

**Estimated scope:** Small.

#### Task 5b — Topics screen: remove the locked rows

**Description:** Remove the locked rendering from `TopicsScreen`: every level
row is tappable (`disabled` false, `accessibilityRole="button"`), no "🔒 Locked"
badge, no locked styles, and the state label never reads "Locked" (unpassed
non-current levels read "Available"). Passed / Current / Review badges stay.

**Acceptance criteria:**
- [ ] Every level row is tappable with no lock badge.
- [ ] `stateLabel` never returns "Locked"; accessibility labels use "Available" for unpassed non-current levels.
- [ ] Locked-specific styles are removed.

**Verification:**
- Tests pass: `npx jest src/screens/__tests__/TopicsScreen.test.tsx`.
- Build/typecheck: `npx tsc --noEmit`; lint: `npm run lint`.

**Dependencies:** Task 5a (the screen consumes `levelStatuses.unlocked === true`
for every level, then removes now-dead lock presentation).

**Files likely touched:**
- `src/screens/TopicsScreen.tsx`
- `src/screens/__tests__/TopicsScreen.test.tsx`

**Estimated scope:** Small–Medium.

### Checkpoint: All five issues
- [ ] Full suite green: `npm test`.
- [ ] Typecheck clean: `npx tsc --noEmit`; lint clean: `npm run lint`.
- [ ] Manual Android pass: back navigation (Task 1), lesson on wrong answer (Task 3), all levels accessible (Task 5).
- [ ] Manual visual pass: Stats screen (Task 2), Review screen (Task 4).
- [ ] Review with human before proceeding / committing.

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hardware-back behavior is device/OS specific; jest cannot reproduce native-stack back fully | Med | Scope the handler with `useFocusEffect` (deterministic: listener only while Home focused) and gate the task on a manual Android-device pass. |
| Lesson on every wrong answer may feel visually heavy | Low | It is the requested behavior; the card is the existing compact `LessonCard`, rendered inline and dismissed by Next. |
| Removing the frontier unlock changes selector semantics | Med | Keep `currentLevelId`/Resume/badges intact; the change is display-only and covered by updated selector + journey tests. |
| General-feedback report uses a sentinel rather than a content question id | Low | Keep the sentinel private to route/screen code, label it "General feedback" in the UI, and cover the editable/export path in tests. |

---

## Open questions

1. **Stats rule ordering** — Default: alphabetical by title (stable, testable).
   Alternative: weakest-first (ascending accuracy) to highlight trouble spots.
2. **Inline lesson cadence** — Default per the request: every wrong answer shows
   the lesson. Alternative: only at the re-teach threshold (≥2 misses). The
   default matches the issue wording.
