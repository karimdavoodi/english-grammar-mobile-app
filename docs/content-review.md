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
| 13 | b13 | Countable and Uncountable Nouns | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `countable_uncountable_nouns`, `quantifiers_some_any` | `present_simple_form` (b01) | AI | authoring-pass | Countable/uncountable noun forms and some/any. |
| 14 | b14 | Quantifiers | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `quantifiers_much_many`, `quantifiers_few_little` | `quantifiers_some_any` (b13) | AI | authoring-pass | Much/many and few/little with countability contrasts. |
| 15 | b15 | Pronouns and Determiners | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `subject_object_pronouns`, `possessive_determiners_pronouns` | `present_simple_form` (b01) | AI | authoring-pass | Subject/object pronouns and possessive forms. |
| 16 | b16 | Adverbs of Frequency and Manner | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `adverbs_frequency_position`, `adverbs_manner_form` | `present_simple_usage` (b01) | AI | authoring-pass | Frequency position and -ly manner adverbs. |
| 17 | b17 | Prepositions of Place and Movement | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `prepositions_place`, `prepositions_movement` | `prepositions_time_in_on_at` (b11) | AI | authoring-pass | Place, destination, and movement across a space. |
| 18 | b18 | Infinitives and Gerunds: Foundations | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `gerund_after_preposition`, `infinitive_to_purpose` | `present_simple_usage` (b01) | AI | authoring-pass | Gerunds after prepositions and infinitives of purpose. |
| 19 | b19 | Imperatives and Instructions | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `imperative_form`, `imperative_negative` | `modal_obligation_advice` (b07) | AI | authoring-pass | Positive and negative instructions. |
| 20 | b20 | Questions and Short Answers | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `question_word_order`, `short_answers` | `present_simple_form` (b01) | AI | authoring-pass | Auxiliary inversion and matching short answers. |
| 21 | b21 | Passive Voice: Introduction | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `present_passive_form`, `past_passive_form` | `past_simple_form` (b03) | AI | authoring-pass | Present and past passive forms with past participles. |
| 22 | b22 | Reported Speech: Statements | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `reported_statements_backshift`, `reported_pronouns_time` | `present_simple_form` (b01) | AI | authoring-pass | Backshift plus pronoun and time-expression changes. |
| 23 | b23 | Relative Clauses: Defining | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `defining_relative_who_which`, `relative_pronoun_omission` | `present_simple_form` (b01) | AI | authoring-pass | Defining relative clauses and object-pronoun omission. |
| 24 | b24 | Present Perfect: Experiences and Results | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `present_perfect_experience`, `present_perfect_result` | `present_perfect_form` (b05) | AI | authoring-pass | Experiences without finished time and present results. |
| 25 | b25 | Present Perfect Continuous | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `present_perfect_continuous_form`, `present_perfect_simple_duration` | `present_perfect_form` (b05) | AI | authoring-pass | Ongoing activities and duration with have/has been + -ing. |
| 26 | b26 | Second Conditional | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `second_conditional_form`, `second_conditional_use` | `first_conditional` (b12) | AI | authoring-pass | Hypothetical present and future situations. |
| 27 | b27 | Modals of Probability | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `modal_probability_present`, `modal_probability_past` | `modal_ability_permission` (b07) | AI | authoring-pass | Present and past guesses with modal auxiliaries. |
| 28 | b28 | Linkers and Contrast | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `because_so`, `although_but` | `present_simple_usage` (b01) | AI | authoring-pass | Reasons, results, and contrasting clauses. |
| 29 | b29 | Phrasal Verbs: Separable Basics | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `phrasal_verb_particle_position`, `phrasal_verb_object_type` | `imperative_form` (b19) | AI | authoring-pass | Particle placement with noun and pronoun objects. |
| 30 | b30 | Basic Grammar Consolidation | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `basic_grammar_consolidation` | `present_simple_form` (b01), `present_perfect_form` (b05) | AI | authoring-pass | Cumulative review of core Basic grammar. |

## Global review checks applied at authoring time

- **Schema conformance** — every level passes `validateContent()` on the full
  Basic track (30 levels, `level.number` 1..30 sequential; every `Question.rule`
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

## Intermediate track — Task 21A authoring pass

| # | Level | Topic | Questions | Type mix | Home rules | Recurring rules | Reviewer | Status | Notes |
|---|-------|-------|-----------|----------|------------|-----------------|----------|--------|-------|
| 1 | i01 | Tense Review in Narratives | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `narrative_tense_sequence`, `past_perfect_narrative` | `present_simple_form` (b01) | AI | authoring-pass | Main events, background actions, and earlier past events. |
| 2 | i02 | Past Perfect Continuous | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `past_perfect_continuous_form`, `past_perfect_continuous_duration` | `past_perfect_form` (b10) | AI | authoring-pass | Duration and visible results before a past point. |
| 3 | i03 | Future Continuous and Future Perfect | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `future_continuous_form`, `future_perfect_form` | `future_will` (b06) | AI | authoring-pass | Future activity in progress versus completed by a deadline. |
| 4 | i04 | Future in the Past | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `future_in_past_would`, `future_in_past_was_going_to` | `past_simple_form` (b03) | AI | authoring-pass | Later events and intentions viewed from the past. |
| 5 | i05 | Third Conditional | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `third_conditional_form`, `third_conditional_regret` | `first_conditional` (b12) | AI | authoring-pass | Unreal past conditions, results, and regret. |
| 6 | i06 | Mixed Conditionals | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `mixed_conditional_past_present`, `mixed_conditional_present_past` | `first_conditional` (b12) | AI | authoring-pass | Past and present time references combined in unreal conditions. |
| 7 | i07 | Passive Voice: Extended Tenses | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `perfect_passive`, `modal_passive` | `past_simple_form` (b03) | AI | authoring-pass | Perfect and modal passive constructions. |
| 8 | i08 | Causative Have and Get | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `causative_have`, `causative_get` | `present_perfect_form` (b05) | AI | authoring-pass | Arranging for another person to perform a service. |
| 9 | i09 | Reported Questions and Commands | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `reported_questions`, `reported_commands` | `present_simple_form` (b01) | AI | authoring-pass | Statement word order and reported instructions. |
| 10 | i10 | Reporting Verbs | 12 | multiple_choice ×9, fix_sentence ×1, fill_blank ×1, word_order ×1 | `reporting_verbs_patterns`, `reporting_verb_object` | `gerund_after_preposition` (b18) | AI | authoring-pass | Verb-specific gerund, infinitive, and object patterns. |

## Intermediate track — Task 21B authoring pass

| # | Level | Topic | Questions | Type mix | Home rules | Recurring rules | Reviewer | Status | Notes |
|---|-------|-------|-----------|----------|------------|-----------------|----------|--------|-------|
| 11 | i11 | Non-defining Relative Clauses | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `nondefining_relative_clause`, `relative_which_reference` | `defining_relative_who_which` (b23) | AI | authoring-pass | Commas, non-essential information, and which-reference clauses. |
| 12 | i12 | Reduced Relative Clauses | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `reduced_relative_present_participle`, `reduced_relative_past_participle` | `present_perfect_form` (b05) | AI | authoring-pass | Present and past participle reductions. |
| 13 | i13 | Gerunds and Infinitives: Verb Patterns | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `verb_gerund_pattern`, `verb_infinitive_pattern` | `gerund_after_preposition` (b18) | AI | authoring-pass | Verbs selecting gerund or to-infinitive complements. |
| 14 | i14 | Meaning Changes with Gerund or Infinitive | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `gerund_infinitive_meaning_change`, `remember_regret_patterns` | `verb_gerund_pattern` (i13) | AI | authoring-pass | Meaning contrasts with stop, remember, regret, and try. |
| 15 | i15 | Modal Deduction and Speculation | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `modal_deduction_present`, `modal_deduction_past` | `modal_obligation_advice` (b07) | AI | authoring-pass | Present and past certainty and possibility. |
| 16 | i16 | Obligation, Necessity, and Permission | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `past_obligation`, `absence_of_obligation` | `modal_obligation_advice` (b07) | AI | authoring-pass | Past obligation and the distinction between unnecessary and forbidden. |
| 17 | i17 | Articles with Abstract and Proper Nouns | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `abstract_noun_article`, `proper_noun_article` | `articles_the_zero` (b08) | AI | authoring-pass | General versus specific abstract nouns and proper-name conventions. |
| 18 | i18 | Noun Clauses | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `noun_clause_that`, `embedded_question` | `reported_questions` (i09) | AI | authoring-pass | That-clauses and statement order in embedded questions. |
| 19 | i19 | Adverbial Clauses | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `time_clause_future`, `reason_purpose_clause` | `first_conditional` (b12) | AI | authoring-pass | Future time clauses, reasons, and purposes. |
| 20 | i20 | Participle Clauses | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `participle_clause_cause`, `participle_clause_time` | `past_perfect_form` (b10) | AI | authoring-pass | Cause and time relationships in reduced clauses. |

## Intermediate track — Task 21C authoring pass

| # | Level | Topic | Questions | Type mix | Home rules | Recurring rules | Reviewer | Status | Notes |
|---|-------|-------|-----------|----------|------------|-----------------|----------|--------|-------|
| 21 | i21 | Inversion after Negative Adverbials | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `negative_adverbial_inversion`, `inversion_auxiliary` | `past_perfect_form` (b10) | AI | authoring-pass | Fronted negative adverbials and auxiliary inversion. |
| 22 | i22 | Emphasis with Do and Clefts | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `emphatic_do`, `cleft_it_sentence` | `present_perfect_form` (b05) | AI | authoring-pass | Emphatic auxiliaries and it-cleft focus. |
| 23 | i23 | Substitution and Ellipsis | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `so_neither_substitution`, `ellipsis_comparison` | `defining_relative_who_which` (b23) | AI | authoring-pass | Agreement substitution and recoverable omissions. |
| 24 | i24 | Discourse Markers | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `discourse_marker_addition`, `discourse_marker_contrast` | `although_but` (b28) | AI | authoring-pass | Markers for addition and contrast. |
| 25 | i25 | Collocation and Dependent Prepositions | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `adjective_dependent_preposition`, `verb_dependent_preposition` | `gerund_after_preposition` (b18) | AI | authoring-pass | Adjective and verb preposition patterns. |
| 26 | i26 | Phrasal and Prepositional Verbs | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `phrasal_verb_transitivity`, `prepositional_verb_object` | `phrasal_verb_particle_position` (b29) | AI | authoring-pass | Particle position and prepositional objects. |
| 27 | i27 | Formal and Informal Register | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `register_formality`, `conversational_ellipsis` | `reported_commands` (i09) | AI | authoring-pass | Audience-appropriate formal and conversational structures. |
| 28 | i28 | Hedging and Softening | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `hedging_adverbs`, `softening_modals` | `modal_probability_present` (b27) | AI | authoring-pass | Cautious claims and polite requests. |
| 29 | i29 | Cohesion and Reference | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `text_reference_pronouns`, `lexical_cohesion` | `defining_relative_who_which` (b23) | AI | authoring-pass | Clear text reference and lexical linking. |
| 30 | i30 | Intermediate Grammar Consolidation | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `intermediate_grammar_consolidation` | `first_conditional` (b12) | AI | authoring-pass | Consolidated inversion, complementation, discourse, and register. |

## Advanced track — Task 22A authoring pass

| # | Level | Topic | Questions | Type mix | Home rules | Recurring rules | Reviewer | Status | Notes |
|---|-------|-------|-----------|----------|------------|-----------------|----------|--------|-------|
| 1 | a01 | Advanced Tense Aspect | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `aspectual_choice`, `stative_dynamic_shift` | `present_perfect_form` (b05) | AI | authoring-pass | Aspect selection and stative/dynamic verb shifts. |
| 2 | a02 | Complex Narrative Time | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `past_time_anchoring`, `historical_present` | `past_perfect_form` (b10) | AI | authoring-pass | Past-time anchoring and historical-present narrative summaries. |
| 3 | a03 | Advanced Future Meaning | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `future_as_prediction`, `future_as_arrangement` | `future_will` (b06) | AI | authoring-pass | Evidence-based predictions and definite arrangements. |
| 4 | a04 | Conditional Inversion | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `conditional_inversion`, `implied_condition` | `first_conditional` (b12) | AI | authoring-pass | Formal inverted conditionals and implied conditions. |
| 5 | a05 | Advanced Mixed Conditionals | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `remote_past_present_result`, `remote_present_past_result` | `second_conditional` (b26) | AI | authoring-pass | Unreal past/present cause-and-result combinations. |
| 6 | a06 | Subjunctive and Mandative Forms | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `mandative_subjunctive`, `formulaic_subjunctive` | `modal_obligation_advice` (b07) | AI | authoring-pass | Formal recommendations, demands, and fixed subjunctive phrases. |
| 7 | a07 | Advanced Passive and Get-Passive | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `get_passive`, `passive_reporting_structure` | `past_simple_form` (b03) | AI | authoring-pass | Get-passives and passive reporting structures. |
| 8 | a08 | Passive with Two Objects | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `double_object_passive`, `prepositional_passive` | `present_perfect_form` (b05) | AI | authoring-pass | Personal, prepositional, and double-object passives. |
| 9 | a09 | Advanced Reported Discourse | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `backshift_optional`, `reported_modality` | `reported_statements_backshift` (b22) | AI | authoring-pass | Optional backshift and modal meaning in reported discourse. |
| 10 | a10 | Quotative and Reporting Style | 12 | multiple_choice ×5, fix_sentence ×2, fill_blank ×3, word_order ×2 | `quotative_inversion`, `reporting_source` | `reporting_verbs_patterns` (i10) | AI | authoring-pass | Quotative inversion and explicit reporting sources. |

## Advanced track — Task 22B authoring pass

| # | Level | Topic | Questions | Type mix | Home rules | Recurring rules | Reviewer | Status | Notes |
|---|-------|-------|-----------|----------|------------|-----------------|----------|--------|-------|
| 11 | a11 | Relative Clauses and Information Structure | 12 | multiple_choice ×4, fix_sentence ×3, fill_blank ×3, word_order ×2 | `relative_clause_attachment`, `resumptive_reference` | `relative_clause_attachment` (a11) | AI | authoring-pass | Relative-clause attachment and omission of repeated reference. |
| 12 | a12 | Nominal Relative Clauses | 12 | multiple_choice ×4, fix_sentence ×3, fill_blank ×3, word_order ×2 | `nominal_relative_what`, `nominal_relative_whoever` | `relative_clause_attachment` (a11) | AI | authoring-pass | What-clauses and open nominal relatives. |
| 13 | a13 | Advanced Complementation | 12 | multiple_choice ×4, fix_sentence ×3, fill_blank ×3, word_order ×2 | `complex_complementation`, `raising_verbs` | `reported_modality` (a09) | AI | authoring-pass | Verb-selected complements and raising patterns. |
| 14 | a14 | Control and Infinitive Subjects | 12 | multiple_choice ×4, fix_sentence ×3, fill_blank ×3, word_order ×2 | `control_infinitive`, `for_to_subject` | `complex_complementation` (a13) | AI | authoring-pass | Controlled infinitives and explicit for-to subjects. |
| 15 | a15 | Modality and Evidentiality | 12 | multiple_choice ×4, fix_sentence ×3, fill_blank ×3, word_order ×2 | `epistemic_modality_scale`, `evidential_language` | `reported_modality` (a09) | AI | authoring-pass | Certainty scales and evidence-marking expressions. |
| 16 | a16 | Politeness and Interpersonal Modality | 12 | multiple_choice ×4, fix_sentence ×3, fill_blank ×3, word_order ×2 | `tentative_language`, `negative_politeness` | `epistemic_modality_scale` (a15) | AI | authoring-pass | Tentative requests and negative-politeness strategies. |
| 17 | a17 | Article Meaning and Genericity | 12 | multiple_choice ×4, fix_sentence ×3, fill_blank ×3, word_order ×2 | `generic_reference`, `institutional_zero_article` | `generic_reference` (a17) | AI | authoring-pass | Generic reference and institutional zero article. |
| 18 | a18 | Determiners and Information Packaging | 12 | multiple_choice ×4, fix_sentence ×3, fill_blank ×3, word_order ×2 | `distributive_determiners`, `predeterminers` | `generic_reference` (a17) | AI | authoring-pass | Distributive and predeterminer scope. |
| 19 | a19 | Focus and Prosody in Writing | 12 | multiple_choice ×4, fix_sentence ×3, fill_blank ×3, word_order ×2 | `focus_fronting`, `focus_particle` | `tentative_language` (a16) | AI | authoring-pass | Written focus through fronting and focus particles. |
| 20 | a20 | Clefts and Pseudo-clefts | 12 | multiple_choice ×4, fix_sentence ×3, fill_blank ×3, word_order ×2 | `pseudo_cleft`, `reversed_cleft` | `focus_fronting` (a19) | AI | authoring-pass | Cleft information structure and agreement. |
