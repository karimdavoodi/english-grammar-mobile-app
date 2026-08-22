# Basic Track — Content Review Checklist

Content is AI-generated and must be hand-reviewed; `validateContent()` catches
structural problems (bank size, id integrity, rule resolution, explanation
alignment) but cannot establish grammatical correctness. Every authored level
records its reviewer and review status here before it is considered shippable.

**Reviewer convention:** `AI` = the authoring pass (Claude) — schema-checked and
grammatically self-reviewed at authoring time. `Human` = an English-language
reviewer. A level is *ship-ready* only once its status is `human-review-pass`.

## Status legend

- `authoring-pass` — written and validated; grammar self-checked at authoring time.
- `human-review-pending` — awaiting a native-speaker linguistic review (recommended before release).
- `human-review-pass` — reviewed and approved by a human reviewer.

---

| # | Level | Topic | Questions | Home rules | Recurring rules | Reviewer | Status | Notes |
|---|-------|-------|-----------|------------|-----------------|----------|--------|-------|
| 1 | b01 | Present Simple | 12 | `present_simple_form`, `present_simple_usage` | — | Claude (AI) | authoring-pass · human-review-pending | Form (-s/-es, do/does) + usage (habits, facts, schedules). |
| 2 | b02 | Present Continuous | 12 | `present_continuous_form`, `present_simple_vs_continuous` | `present_simple_form` (b01) ×2 | Claude (AI) | authoring-pass · human-review-pending | am/is/are + -ing; simple-vs-continuous pair questions. |
| 3 | b03 | Past Simple | 12 | `past_simple_form`, `past_simple_usage` | `present_simple_form` (b01) ×2 | Claude (AI) | authoring-pass · human-review-pending | Regular -ed + irregulars (went, ate, heard, lost); did/didn't. |
| 4 | b04 | Past Continuous | 12 | `past_continuous_form`, `past_simple_vs_continuous` | `past_simple_form` (b03) ×2 | Claude (AI) | authoring-pass · human-review-pending | was/were + -ing; interrupted-action patterns. |
| 5 | b05 | Present Perfect | 12 | `present_perfect_form`, `present_perfect_vs_past_simple` | `past_simple_form` (b03) ×2 | Claude (AI) | authoring-pass · human-review-pending | has/have + participle; unspecified-past vs specific-past contrast. |
| 6 | b06 | Future: will and going to | 12 | `future_will`, `will_vs_going_to` | `present_continuous_form` (b02) ×2 | Claude (AI) | authoring-pass · human-review-pending | Predictions/offers (will) vs plans/evidence (going to); present-continuous arrangements. |
| 7 | b07 | Modal verbs: can, could, must, should | 12 | `modal_ability_permission`, `modal_obligation_advice` | `present_simple_form` (b01) ×2 | Claude (AI) | authoring-pass · human-review-pending | Modal + base verb (no -s, no to); mustn't vs don't have to. |
| 8 | b08 | Articles: a, an, the | 12 | `articles_a_an`, `articles_the_zero` | `present_simple_form` (b01) ×2 | Claude (AI) | authoring-pass · human-review-pending | Sound-based a/an (hour, university); the vs zero article. Zero-article choice is the string `nothing`. |
| 9 | b09 | Comparatives and Superlatives | 12 | `comparatives`, `superlatives` | `articles_a_an` (b08), `articles_the_zero` (b08) | Claude (AI) | authoring-pass · human-review-pending | -er/more + than; the -est/the most; spelling (hotter). |
| 10 | b10 | Past Perfect | 12 | `past_perfect_form`, `past_perfect_vs_past_simple` | — | Claude (AI) | authoring-pass · human-review-pending | The Task 4 reference level, renumbered from b01 → b10 (level 10) when the track was completed. |
| 11 | b11 | Prepositions of time | 12 | `prepositions_time_in_on_at`, `prepositions_time_since_for_until` | `present_simple_form` (b01), `past_simple_form` (b03) | Claude (AI) | authoring-pass · human-review-pending | in/on/at; since/for/until. |
| 12 | b12 | Zero and First Conditionals | 12 | `zero_conditional`, `first_conditional` | `present_simple_form` (b01), `future_will` (b06) | Claude (AI) | authoring-pass · human-review-pending | Present simple in the if-clause, will in the result (never will in the if-clause). |

## Global review checks applied at authoring time

- **Schema conformance** — every level passes `validateContent()` on the full
  Basic track (12 levels, `level.number` 1..12 sequential; every `Question.rule`
  resolves to a unique `TopicRule`; each rule defined exactly once; 4 choices +
  4 positionally-aligned non-empty explanations; banks ≥ mercy cap 12).
- **Grammatical correctness** — each question has exactly one defensible answer;
  distractors are ungrammatical or meaningfully wrong, and each explanation names
  the specific error.
- **Recurring-rule identity** — recurring questions are tagged with an earlier
  level's canonical rule (never re-defined), so the Weakness Queue can resurface
  them with the correct teaching card.
- **Language variety** — `correctIndex` is spread across 0–3 within every level;
  prompts vary between form drills and usage/contrast questions.

## Known editorial decisions (flag for human review)

- **Zero article** (b08 q06, q09): the "no article" choice is represented by the
  string `nothing` so the UI can render a meaningful button. Revisit if the
  ChoiceButton design wants a different token.
- **At night / in the evening** (b11): standard British-English expressions were
  used. Confirm the target-audience variant (e.g. US `on the weekend`) if relevant.
- **Future arrangements** (b06 q11–q12): tagged with b02's `present_continuous_form`
  rule as the canonical teaching for the -ing form; the question explanations add
  the future-arrangement usage note.
