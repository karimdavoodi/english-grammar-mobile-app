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
| 4 | Growth layer: streaks, stats, settings, notifications | 14–17 (order 14→15→17→16) |
| 5 | Full 90-level corpus (content authoring + review) | 18–23 (clustered) |
| 6 | End-game, tuning, regression, release 2.0 | 24–28 (27A/B) |
| — | Optional: TTS audio polish (droppable) | 29 |

Checkpoint gates sit between phases. The verified MVP baseline is 236 passing tests, clean
TypeScript/lint, and an Android debug smoke pass. The remaining work starts at Task 1 below;
the detailed acceptance criteria, migration contracts, and risk notes live in
`docs/app-plan.md`.

## Planning corrections applied

- Mixed sessions persist a `kind` and immutable `bankQuestionIds` snapshot, so resume does not
  corrupt the level frontier.
- Progress migrations are reserved in order: 1→2 typed responses, 2→3 mixed sessions,
  3→4 streaks.
- Growth implementation order is Task 14 → Task 15 → Task 17 → Task 16; this removes the
  previous settings/notifications dependency cycle.
- Corpus and regression work is split into cluster-sized subtasks (20A/B, 21A–C, 22A–C,
  27A/B), each with its own validation checkpoint.
- Signing keys, telemetry secrets, platform credentials, and store uploads remain outside git
  and require the project owner’s environment/access.
