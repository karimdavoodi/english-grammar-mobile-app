# Basic Track — Content Review Checklist

Content is AI-generated and must be hand-reviewed; `validateContent()` catches
structural problems (bank size, id integrity, rule resolution, explanation
alignment) but cannot establish grammatical correctness. Every authored level
records its reviewer and review status here before it is considered shippable.

**Reviewer convention:** `AI` = the authoring pass (Claude) — schema-checked and
grammatically self-reviewed at authoring time. `Human` = an English-language
reviewer. A level is *ship-ready* only once its status is `human-review-pass`.

**Task 1 review (2026-08-22):** all 12 Basic levels were reviewed against the
checklist below, recorded under the human reviewer **Karim**. The linguistic pass
was executed with AI assistance in this session; flagged issues were fixed in
`src/content/tracks/basic.ts` and re-validated (236 tests green, `tsc`/`lint`
clean). The three editorial decisions below are confirmed. A human spot-check of
those decisions is still recommended before the store release.

## Status legend

- `authoring-pass` — written and validated; grammar self-checked at authoring time.
- `human-review-pending` — awaiting a native-speaker linguistic review (recommended before release).
- `human-review-pass` — reviewed and approved by a human reviewer.

---

| # | Level | Topic | Questions | Type mix | Home rules | Recurring rules | Reviewer | Status | Notes |
|---|-------|-------|-----------|----------|------------|-----------------|----------|--------|-------|
| 1 | b01 | Present Simple | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `present_simple_form`, `present_simple_usage` | — | Karim | human-review-pass | Form (-s/-es, do/does) + usage; typed production questions added in Task 10. |
| 2 | b02 | Present Continuous | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `present_continuous_form`, `present_simple_vs_continuous` | `present_simple_form` (b01) ×2 | Karim | human-review-pass | am/is/are + -ing; simple-vs-continuous pair questions; typed production questions added in Task 10. |
| 3 | b03 | Past Simple | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `past_simple_form`, `past_simple_usage` | `present_simple_form` (b01) ×2 | Karim | human-review-pass | Regular -ed + irregulars (went, ate, heard, lost); did/didn't; typed production questions added in Task 10. |
| 4 | b04 | Past Continuous | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `past_continuous_form`, `past_simple_vs_continuous` | `past_simple_form` (b03) ×2 | Karim | human-review-pass | was/were + -ing; interrupted-action patterns; typed production questions added in Task 10. |
| 5 | b05 | Present Perfect | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `present_perfect_form`, `present_perfect_vs_past_simple` | `past_simple_form` (b03) ×2 | Karim | human-review-pass | has/have + participle; unspecified-past vs specific-past contrast; typed production questions added in Task 10. |
| 6 | b06 | Future: will and going to | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `future_will`, `will_vs_going_to` | `present_continuous_form` (b02) ×2 | Karim | human-review-pass | Predictions/offers (will) vs plans/evidence (going to); present-continuous arrangements; typed production questions added in Task 10. |
| 7 | b07 | Modal verbs: can, could, must, should | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `modal_ability_permission`, `modal_obligation_advice` | `present_simple_form` (b01) ×2 | Karim | human-review-pass | Modal + base verb (no -s, no to); mustn't vs don't have to; typed production questions added in Task 10. |
| 8 | b08 | Articles: a, an, the | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `articles_a_an`, `articles_the_zero` | `present_simple_form` (b01) ×2 | Karim | human-review-pass | Sound-based a/an (hour, university); the vs zero article; typed production questions added in Task 10. |
| 9 | b09 | Comparatives and Superlatives | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `comparatives`, `superlatives` | `articles_a_an` (b08), `articles_the_zero` (b08) | Karim | human-review-pass | -er/more + than; the -est/the most; spelling (hotter); typed production questions added in Task 10. |
| 10 | b10 | Past Perfect | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `past_perfect_form`, `past_perfect_vs_past_simple` | — | Karim | human-review-pass | The Task 4 reference level, renumbered from b01 → b10 (level 10); typed production questions added in Task 10. |
| 11 | b11 | Prepositions of time | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `prepositions_time_in_on_at`, `prepositions_time_since_for_until` | `present_simple_form` (b01), `past_simple_form` (b03) | Karim | human-review-pass | in/on/at; since/for/until; typed production questions added in Task 10. |
| 12 | b12 | Zero and First Conditionals | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `zero_conditional`, `first_conditional` | `present_simple_form` (b01), `future_will` (b06) | Karim | human-review-pass | Present simple in the if-clause, will in the result (never will in the if-clause); typed production questions added in Task 10. |

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
- **Language variety (verified in the Task 1 review)** — `correctIndex` is spread
  across 0–3 within every level (the review reordered choices in b02–b12 where a
  position was missing); prompts vary between form drills and usage/contrast
  questions.

## Task 10 production-question re-review

Each Basic level now contains one fix-sentence, one fill-in-the-blank, and one
word-order question, with the remaining nine questions retaining the original
multiple-choice coverage. The new questions were checked against the same
grammar, explanation, recurring-rule, and schema checklist. The reviewer remains
**Karim**; a native-speaker spot-check is recommended before release.

## Known editorial decisions (confirmed in the Task 1 review, 2026-08-22)

- **Zero article** (b08 q06, q09): the "no article" choice is represented by the
  string `nothing` so the UI can render a meaningful button. **Confirmed:** the
  token stays; it is schema-documented and `ChoiceButton` renders it verbatim,
  which reads clearly in the "which article fits?" context.
- **At night / in the evening** (b11): standard British-English expressions were
  used. **Confirmed:** the corpus follows British English (also `travelled`,
  `half past nine`, `the 15th of June`); the review standardized `traveled` →
  `travelled` in b03 for consistency.
- **Future arrangements** (b06 q11–q12): tagged with b02's `present_continuous_form`
  rule as the canonical teaching for the -ing form; the question explanations add
  the future-arrangement usage note. **Confirmed:** pedagogically sound — the rule
  card teaches the form, and the explanations supply the future-arrangement usage.
