# Store Listing — English Grammar Game

*Working title: **English Grammar Game**. Final name is an owner decision (see
`docs/app-plan.md`, Open Questions). Text below is drafted for the current
release — the 12-level Basic track with the full mastery loop. Update it when
Phases 2–6 ship (question types, mixed review, streaks, 90-level corpus).*

Source icon: `assets/icon-master.png` (1024×1024). Screenshots are taken from a
real device; see the checklist at the bottom.

---

## Google Play

**App name:** English Grammar Game

**Category:** Education

**Short description (≤ 80 chars):**
> Master English grammar one level at a time. Free, offline, no ads.

**Full description:**

> English Grammar Game turns grammar practice into a game you can actually win.
> Play through bite-sized levels, and the app adapts to you: miss a rule and a
> short lesson card teaches it on the spot; keep missing it and that rule lands
> in your personal Weakness Queue, ready to resurface until you master it.
>
> How a level works:
> - Answer questions about a topic (form, usage, and common mistakes).
> - Pass by getting 3 in a row — or 8 correct in total.
> - A 12-question mercy cap stops the pain: you re-learn, then retry.
> - Every wrong answer explains the specific error, then shows a mini-lesson.
>
> Features:
> - 12 grammar levels covering the essential tenses, modals, articles,
>   conditionals, comparatives, and prepositions — with more on the way.
> - A cross-level Weakness Queue that keeps your problem rules in front of you.
> - A Review screen for every wrong answer you've ever given.
> - A Level Map so you always know what's next.
> - Light and dark themes, adjustable in Settings.
> - 100% offline. No account. No ads. No in-app purchases. Free.

---

## App Store

**App name:** English Grammar Game

**Subtitle:** Grammar practice, level by level

**Promotional text:** Pass 3 in a row, or 8 correct — and the app teaches you
whatever you miss.

**Description:**

> English Grammar Game is a focused, friendly way to master the grammar that
> English learners actually trip over: tenses, modals, articles, conditionals,
> comparisons, and prepositions.
>
> Play a level and the app adapts to what you get wrong. Each miss shows the
> specific error and a short lesson card for the rule — then that rule is queued
> to resurface until you've truly learned it, not just guessed it. You pass a
> level by answering 3 correctly in a row (or 8 in total), and a mercy cap of 12
> questions makes sure practice stays fair.
>
> What's inside:
> - 12 levels of focused grammar practice, with a full roadmap to 90 levels.
> - A Weakness Queue that keeps problem rules in regular rotation.
> - A Review screen of your complete wrong-answer history.
> - Progress that is saved on your device and works entirely offline.
> - No account, no ads, no in-app purchases — a clean, calm experience.

**Keywords:** grammar, English, learn, tenses, practice

---

## Screenshots checklist (capture from a real device)

1. **Level Map** — the track with the next level highlighted and streak header.
2. **Question** — a multiple-choice question card with 4 answers.
3. **Feedback / lesson** — a wrong-answer reveal with the explanation and the
   teach-on-failure lesson card.
4. **Result** — the level-complete pass state.
5. **Review** — the wrong-answer history grouped by rule.
6. **Settings** — theme toggle and app info.

Screenshot order on the store should follow the player journey (map → play →
feedback → result → review). Capture at the largest supported resolution, in
both light and dark theme where the store allows, with status bars hidden.

---

## Release checklist (owner)

- [ ] Final app name chosen; update `app.json`, Android `strings.xml`,
      iOS `Info.plist`, this file, and `docs/privacy.md`.
- [ ] Replace placeholder screenshots with device captures.
- [ ] Fill in the support email / contact in `docs/privacy.md` and the store
      console.
- [ ] Verify the privacy policy text matches the shipped build (local-first,
      user-initiated reports, optional crash reporting).
