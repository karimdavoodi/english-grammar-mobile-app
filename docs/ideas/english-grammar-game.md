# English Grammar Game (working title)

## Problem Statement
How might we help self-directed English learners *master* grammar — not just get scored on it — through a 90-level mobile game that teaches on every mistake?

## Recommended Direction
A mastery-based grammar game with tracks as *chapters* (initially Basic, Intermediate, and Advanced), each level a single grammar topic. You pass a level by providing sufficient evidence of the topic — **3 correct in a row, OR 8 total correct, whichever comes first.** Fast players fly through; weak players stay and get taught. Every wrong answer triggers a topic lesson card + the question's "why," then a re-test on the same rule. Missed rules accumulate in a cross-level Weakness Queue that resurfaces in later levels and on a Review screen. When multiple tracks are available, first launch asks **"Where do you want to start?"** so skilled users can begin higher without the Basic march; earlier content remains accessible. If only Basic is bundled, the app starts at Basic level 1 and does not show unavailable starting choices. Settings: reset, theme (device/dark/light), and wrong-answer review. Content is AI-generated, hand-reviewed.

**Architecture principle — the app is a player, the content is a database:** the number of tracks and levels is a *content property*, never hardcoded. v1 ships a subset of Basic; later versions add levels and even whole tracks by shipping reviewed content data. Track IDs, map order, and available starting points must therefore be read from content rather than encoded in screen logic.

## Key Assumptions to Validate
- [ ] Learners want teaching, not just scoring — test with a 3-level prototype and 5 real users watching the explanation moment
- [ ] AI-generated grammar content can be made trustworthy — review pipeline + in-app "report an error" button
- [ ] The "3-in-a-row OR 8-total" pass rule feels good at both ends — tune from real play
- [ ] Players understand streak-based passing without instruction
- [ ] Advanced users will trust "start higher" and not feel they're missing content — the visible map and accessible earlier levels reassure them

## MVP Scope (Basic track only)
- Core loop: question → correct (streak++) / wrong (lesson card → re-test)
- Pass rule: 3-in-a-row OR 8 total correct; 12-question mercy cap
- Weakness Queue + Review screen (the differentiator — in from day one)
- Basic-only onboarding: level map, level play, settings, and wrong-answer review; the start-point choice appears when the bundled content offers more than one eligible starting track
- Basic track shipped incrementally: core loop + first ~10–15 levels to validate; the rest of Basic arrives in releases as *content*, not code
- Content schema + loader are data-driven (tracks, levels, topics, rules all defined in data)
- Theme (device/dark/light), reset, progress + queue in AsyncStorage
- Android first (iOS after); no backend

## Not Doing (and Why)
- Intermediate & Advanced tracks (and most of Basic) — the 90-level plan is a content roadmap, not an app requirement; ship a validated subset, prove retention, then add levels in releases
- Accounts / cloud sync — single-device local progress proves the model; sync is infra, not value
- Monetization (ads / IAP) — decide after retention data; don't let it contaminate the learning test
- Daily streaks & notifications — Duolingo-style growth layer, later
- Audio / pronunciation — grammar is visual; speech is a separate feature
- Production-style questions (fill-in-blank, fix-the-sentence) — the recognition→production upgrade; add after MC core is proven
- Mixed Review / interleaved levels — a strong later upgrade, not v1
- On-device adaptive LLM generation — reviewed static content only in v1
- Leaderboards / social — no social graph in v1

## Open Questions
- Monetization model — decide after first retention numbers
- Should lesson cards translate into the learner's language (e.g. Arabic)? The content is English; the *teaching* could be in their language
- App name, icon, store copy
- What happens after all currently bundled levels? (endless review / graduation screen)
