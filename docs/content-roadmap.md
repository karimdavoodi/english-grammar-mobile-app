# English Grammar Review — 90-Level Content Roadmap

This document is the authoring contract for the full corpus. The app remains a
content player: level order, topics, rules, and question types belong in the
track data, while this document records the pedagogical decisions that keep
those data files coherent.

## Corpus shape

The corpus keeps the planned 30/30/30 split. Each track is an eligible starting
point, with levels ordered from 1 to 30:

| Track | IDs | Learner role | Starting point |
| --- | --- | --- | --- |
| Basic | `b01`–`b30` | Core forms and high-frequency everyday grammar | Yes |
| Intermediate | `i01`–`i30` | Tense contrast, clauses, voice, and dependent forms | Yes |
| Advanced | `a01`–`a30` | Nuance, discourse, complex clause combinations, and register | Yes |

The existing Basic levels b01–b12 are the canonical foundation. New levels must
keep the existing `bNN`, `iNN`, and `aNN` IDs, use the same number as their
track-local `level.number`, and introduce no duplicate rule tag.

## Topic map

The topic is the level's teaching focus. A level may ask about earlier rules for
recurrence, but its topic rules are only the rules introduced at that level.

### Basic — b01–b30

| Level | Topic | New canonical rules |
| --- | --- | --- |
| b01 | Present Simple | `present_simple_form`, `present_simple_usage` |
| b02 | Present Continuous | `present_continuous_form`, `present_simple_vs_continuous` |
| b03 | Past Perfect | `past_perfect_form`, `past_perfect_vs_past_simple` |
| b04 | Past Simple | `past_simple_form`, `past_simple_usage` |
| b05 | Past Continuous | `past_continuous_form`, `past_simple_vs_continuous` |
| b06 | Present Perfect | `present_perfect_form`, `present_perfect_vs_past_simple` |
| b07 | Modals | `modal_ability_permission`, `modal_obligation_advice` |
| b08 | Articles | `articles_a_an`, `articles_the_zero` |
| b09 | Comparatives and Superlatives | `comparatives`, `superlatives` |
| b10 | Future Forms | `future_will`, `will_vs_going_to` |
| b11 | Conditionals | `zero_conditional`, `first_conditional` |
| b12 | Time Prepositions | `prepositions_time_in_on_at`, `prepositions_time_since_for_until` |
| b13 | Countable and Uncountable Nouns | `countable_uncountable_nouns`, `quantifiers_some_any` |
| b14 | Quantifiers | `quantifiers_much_many`, `quantifiers_few_little` |
| b15 | Pronouns and Determiners | `subject_object_pronouns`, `possessive_determiners_pronouns` |
| b16 | Adverbs of Frequency and Manner | `adverbs_frequency_position`, `adverbs_manner_form` |
| b17 | Prepositions of Place and Movement | `prepositions_place`, `prepositions_movement` |
| b18 | Infinitives and Gerunds: Foundations | `gerund_after_preposition`, `infinitive_to_purpose` |
| b19 | Imperatives and Instructions | `imperative_form`, `imperative_negative` |
| b20 | Questions and Short Answers | `question_word_order`, `short_answers` |
| b21 | Passive Voice: Introduction | `present_passive_form`, `past_passive_form` |
| b22 | Reported Speech: Statements | `reported_statements_backshift`, `reported_pronouns_time` |
| b23 | Relative Clauses: Defining | `defining_relative_who_which`, `relative_pronoun_omission` |
| b24 | Present Perfect: Experiences and Results | `present_perfect_experience`, `present_perfect_result` |
| b25 | Present Perfect Continuous | `present_perfect_continuous_form`, `present_perfect_simple_duration` |
| b26 | Second Conditional | `second_conditional_form`, `second_conditional_use` |
| b27 | Modals of Probability | `modal_probability_present`, `modal_probability_past` |
| b28 | Linkers and Contrast | `because_so`, `although_but` |
| b29 | Phrasal Verbs: Separable Basics | `phrasal_verb_particle_position`, `phrasal_verb_object_type` |
| b30 | Basic Grammar Consolidation | `basic_grammar_consolidation` |

Rule tags must contain only lowercase letters, digits, and underscores.

### Intermediate — i01–i30

| Level | Topic | New canonical rules |
| --- | --- | --- |
| i01 | Tense Review in Narratives | `narrative_tense_sequence`, `past_perfect_narrative` |
| i02 | Past Perfect Continuous | `past_perfect_continuous_form`, `past_perfect_continuous_duration` |
| i03 | Future Continuous and Future Perfect | `future_continuous_form`, `future_perfect_form` |
| i04 | Future in the Past | `future_in_past_would`, `future_in_past_was_going_to` |
| i05 | Third Conditional | `third_conditional_form`, `third_conditional_regret` |
| i06 | Mixed Conditionals | `mixed_conditional_past_present`, `mixed_conditional_present_past` |
| i07 | Passive Voice: Extended Tenses | `perfect_passive`, `modal_passive` |
| i08 | Causative Have and Get | `causative_have`, `causative_get` |
| i09 | Reported Questions and Commands | `reported_questions`, `reported_commands` |
| i10 | Reporting Verbs | `reporting_verbs_patterns`, `reporting_verb_object` |
| i11 | Non-defining Relative Clauses | `nondefining_relative_clause`, `relative_which_reference` |
| i12 | Reduced Relative Clauses | `reduced_relative_present_participle`, `reduced_relative_past_participle` |
| i13 | Gerunds and Infinitives: Verb Patterns | `verb_gerund_pattern`, `verb_infinitive_pattern` |
| i14 | Meaning Changes with Gerund or Infinitive | `gerund_infinitive_meaning_change`, `remember_regret_patterns` |
| i15 | Modal Deduction and Speculation | `modal_deduction_present`, `modal_deduction_past` |
| i16 | Obligation, Necessity, and Permission | `past_obligation`, `absence_of_obligation` |
| i17 | Articles with Abstract and Proper Nouns | `abstract_noun_article`, `proper_noun_article` |
| i18 | Noun Clauses | `noun_clause_that`, `embedded_question` |
| i19 | Adverbial Clauses | `time_clause_future`, `reason_purpose_clause` |
| i20 | Participle Clauses | `participle_clause_cause`, `participle_clause_time` |
| i21 | Inversion after Negative Adverbials | `negative_adverbial_inversion`, `inversion_auxiliary` |
| i22 | Emphasis with Do and Clefts | `emphatic_do`, `cleft_it_sentence` |
| i23 | Substitution and Ellipsis | `so_neither_substitution`, `ellipsis_comparison` |
| i24 | Discourse Markers | `discourse_marker_addition`, `discourse_marker_contrast` |
| i25 | Collocation and Dependent Prepositions | `adjective_dependent_preposition`, `verb_dependent_preposition` |
| i26 | Phrasal and Prepositional Verbs | `phrasal_verb_transitivity`, `prepositional_verb_object` |
| i27 | Formal and Informal Register | `register_formality`, `conversational_ellipsis` |
| i28 | Hedging and Softening | `hedging_adverbs`, `softening_modals` |
| i29 | Cohesion and Reference | `text_reference_pronouns`, `lexical_cohesion` |
| i30 | Intermediate Grammar Consolidation | `intermediate_grammar_consolidation` |

### Advanced — a01–a30

| Level | Topic | New canonical rules |
| --- | --- | --- |
| a01 | Advanced Tense Aspect | `aspectual_choice`, `stative_dynamic_shift` |
| a02 | Complex Narrative Time | `past_time_anchoring`, `historical_present` |
| a03 | Advanced Future Meaning | `future_as_prediction`, `future_as_arrangement` |
| a04 | Conditional Inversion | `conditional_inversion`, `implied_condition` |
| a05 | Advanced Mixed Conditionals | `remote_past_present_result`, `remote_present_past_result` |
| a06 | Subjunctive and Mandative Forms | `mandative_subjunctive`, `formulaic_subjunctive` |
| a07 | Advanced Passive and Get-Passive | `get_passive`, `passive_reporting_structure` |
| a08 | Passive with Two Objects | `double_object_passive`, `prepositional_passive` |
| a09 | Advanced Reported Discourse | `backshift_optional`, `reported_modality` |
| a10 | Quotative and Reporting Style | `quotative_inversion`, `reporting_source` |
| a11 | Relative Clauses and Information Structure | `relative_clause_attachment`, `resumptive_reference` |
| a12 | Nominal Relative Clauses | `nominal_relative_what`, `nominal_relative_whoever` |
| a13 | Advanced Complementation | `complex_complementation`, `raising_verbs` |
| a14 | Control and Infinitive Subjects | `control_infinitive`, `for_to_subject` |
| a15 | Modality and Evidentiality | `epistemic_modality_scale`, `evidential_language` |
| a16 | Politeness and Interpersonal Modality | `tentative_language`, `negative_politeness` |
| a17 | Article Meaning and Genericity | `generic_reference`, `institutional_zero_article` |
| a18 | Determiners and Information Packaging | `distributive_determiners`, `predeterminers` |
| a19 | Focus and Prosody in Writing | `focus_fronting`, `focus_particle` |
| a20 | Clefts and Pseudo-clefts | `pseudo_cleft`, `reversed_cleft` |
| a21 | Advanced Inversion | `subject_auxiliary_inversion`, `locative_inversion` |
| a22 | Extraposition and It-clauses | `extraposition_it`, `anticipatory_it` |
| a23 | Coordination and Parallelism | `parallel_structure`, `coordination_scope` |
| a24 | Ellipsis and Gapping | `gapping`, `comparative_ellipsis` |
| a25 | Concession and Scalar Meaning | `concessive_clause`, `scalar_even_if` |
| a26 | Academic and Formal Cohesion | `academic_linking`, `resultative_cohesion` |
| a27 | Stance, Certainty, and Qualification | `stance_noun_phrase`, `certainty_qualification` |
| a28 | Lexical Grammar and Valency | `valency_alternation`, `light_verb_collocation` |
| a29 | Register, Variation, and Editing | `standard_edited_english`, `register_variant_choice` |
| a30 | Advanced Grammar Consolidation | `advanced_grammar_consolidation` |

## Canonical rule and recurrence registry

The existing Basic rule tags listed above are the canonical homes for b01–b12.
For every new tag, the first level in the topic map is its only `TopicRule`
definition. Later questions reference the tag without adding another rule
definition. A recurrence set is the set of later levels that must contain at
least one question using that tag; it is guidance for authoring and review, not
a second definition.

| Rule family | Canonical home | Recurrence set |
| --- | --- | --- |
| Basic tense foundations | b01–b06 | b07–b12; b13–b30; i01–i06; a01–a05 |
| Basic function words and sentence building | b07–b12 | b13–b30; i07–i10; a07–a10 |
| Basic noun, determiner, and comparison rules | b08–b09, b13–b18 | b19–b30; i11–i18; a11–a18 |
| Basic clause and discourse rules | b19–b30 | i18–i30; a18–a30 |
| Intermediate tense/aspect | i01–i06 | i07–i30; a01–a10 |
| Intermediate voice and reporting | i07–i10 | i11–i30; a07–a15 |
| Intermediate clause/complementation | i11–i20 | i21–i30; a11–a25 |
| Intermediate discourse/register | i21–i30 | a19–a30 |
| Advanced tense/modality | a01–a06, a15–a16 | a07–a30 |
| Advanced voice/reporting | a07–a10 | a11–a30 |
| Advanced information structure | a11–a24 | a25–a30 |
| Advanced discourse/register | a25–a30 | none; consolidation only |

Within a family, authors choose the specific rule tag that fits the question.
The minimum recurrence target is one question in each listed recurrence level;
high-value contrast rules may receive two. A recurring question must use the
canonical tag and must not copy a `TopicRule` into the later level.

## Question-type mix

Every level must contain at least 12 questions. The intended default is:

| Level phase | Multiple choice | Fix sentence | Fill blank | Word order | Purpose |
| --- | ---: | ---: | ---: | ---: | --- |
| Basic b01–b12 | 9 | 1 | 1 | 1 | Preserve the shipped baseline while introducing production safely |
| Basic b13–b30 | 6 | 2 | 2 | 2 | Move from recognition to controlled production |
| Intermediate i01–i30 | 5 | 2 | 3 | 2 | Test contrasts and form selection in context |
| Advanced a01–a30 | 4 | 3 | 3 | 2 | Favor correction, production, and information structure |

The row totals 12. A level may add questions, but it must retain at least one
question of each type once it is past b12. Each question's explanation must
teach the tagged rule, including recurring questions. Fix-sentence prompts must
make the error unambiguous; fill-blank accepted answers must include only
grammatical variants; word-order tokens must preserve punctuation and intended
capitalization.

## Authoring and validation checklist

For each future cluster:

1. Copy the topic and canonical tags from this roadmap; do not invent a tag that
   duplicates an existing concept.
2. Define each new `TopicRule` exactly once at its canonical home level.
3. Add the planned recurrence questions to the later levels named above.
4. Keep each level at 12 or more questions and apply the type-mix row for its
   track/phase.
5. Use `npm test -- --runInBand` (including the content validator tests),
   `npx tsc --noEmit`, and `npm run lint` before marking the cluster complete.
6. Add the level to `docs/content-review.md` with `authoring-pass`; human review
   changes it to `human-review-pass` only after checking grammar, distractors,
   explanations, and typed-answer feedback.

The validator's existing global rule registry is the dry-run contract: a new
cluster passes when every question tag resolves to exactly one `TopicRule` and
no canonical tag is defined twice. The first authored cluster should be checked
against this document before the next cluster is started.

## Pass-rule tuning decision — 2026-08-23

Task 15 provides local aggregate Stats from the `egg:events` answer log, but
this repository contains no production play export or real-player sample from
which to estimate level difficulty. The available Stats fixtures therefore do
not support a responsible numerical retune. Keep the shipped defaults:

| Parameter | Decision | Rationale |
| --- | ---: | --- |
| `passStreak` | 3 | Retains the original mastery signal: three consecutive demonstrations of the rule. |
| `passVolume` | 8 | Retains the volume safeguard for learners who make occasional mistakes. |
| `mercyCap` | 12 | Matches the validated minimum bank size, so a level cannot exhaust its questions before mercy ends. |

The values remain injectable through `PassConfig`. Revisit them after Stats has
at least 20 completed level sessions across at least five players (or an
equivalent anonymized play export), comparing pass rate, median answers to
pass, and mercy-ended rate by level. Any future change must update the tuning
parameters in `docs/use-cases/english-grammar-review.md`, retain the validator's
configured `mercyCap` bank check, and add regression coverage for the changed
outcomes.
