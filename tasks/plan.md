# Implementation Plan: English Grammar Game — Final Complete Version

**The full plan lives in `docs/app-plan.md`** — this file is the `/build`-convention pointer
plus a phase index. Read `docs/app-plan.md` for the overview, architecture decisions, scope
decisions (local-first, no monetization, English-only teaching), the 90-level content roadmap,
and per-task detail.

## Phase index

| Phase | Focus | Tasks |
|---|---|---|
| 1 | Release 1.0 hardening (ship the proven 12-level app) | 1–5 |
| 2 | Production question types (recognition → production) | 6–10 |
| 3 | Mixed review & interleaving | 11–13 |
| 4 | Growth layer: streaks, stats, notifications | 14–17 |
| 5 | Full 90-level corpus (content authoring + review) | 18–23 |
| 6 | End-game, tuning, regression, release 2.0 | 24–28 |
| — | Optional: TTS audio polish (droppable) | 29 |

Checkpoint gates sit between phases; the existing 236-test suite must stay green through every
refactor.
