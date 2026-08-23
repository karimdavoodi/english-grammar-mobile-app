/** Advanced track content cluster for levels a21–a30. */

import type { LevelInput, QuestionInput, TopicRule } from '../../types';

type McSpec = [rule: string, prompt: string, answer: string, distractors: string[]];
type TypedSpec = {
  rule: string;
  faulty: string;
  prompt: string;
  answer: string;
  words?: string[];
  explanation: string;
};
type LevelSpec = {
  number: number;
  title: string;
  summary: string;
  rules: TopicRule[];
  questions: McSpec[];
  fixes: TypedSpec[];
  blanks: TypedSpec[];
  orders: TypedSpec[];
};

function makeLevel(spec: LevelSpec): LevelInput {
  const id = `a${String(spec.number).padStart(2, '0')}`;
  const questions: QuestionInput[] = spec.questions.map(([rule, prompt, answer, distractors], index) => {
    const choices = [answer, ...distractors];
    return {
      id: `${id}q${String(index + 1).padStart(2, '0')}`,
      levelId: id,
      rule,
      prompt,
      choices,
      correctIndex: 0,
      choiceExplanations: choices.map((choice, choiceIndex) =>
        choiceIndex === 0
          ? `“${choice}” follows the ${rule} pattern in this context.`
          : `“${choice}” does not fit the ${rule} pattern here.`,
      ),
    };
  });
  const addFix = (item: TypedSpec, index: number) => questions.push({
    id: `${id}q${String(index).padStart(2, '0')}`,
    levelId: id,
    rule: item.rule,
    type: 'fix_sentence',
    faultySentence: item.faulty,
    prompt: item.prompt,
    choices: [item.answer, 'another form', 'an incorrect form', 'a different form'],
    correctIndex: 0,
    choiceExplanations: [
      `“${item.answer}” corrects the sentence using the target rule.`,
      'This form does not fit the target structure.',
      'This form leaves the error unresolved.',
      'This form changes the intended meaning.',
    ],
  });
  const addBlank = (item: TypedSpec, index: number) => questions.push({
    id: `${id}q${String(index).padStart(2, '0')}`,
    levelId: id,
    rule: item.rule,
    type: 'fill_blank',
    prompt: item.prompt,
    correctAnswer: item.answer,
    acceptedAnswers: [item.answer],
    explanation: item.explanation,
  });
  const addOrder = (item: TypedSpec, index: number) => questions.push({
    id: `${id}q${String(index).padStart(2, '0')}`,
    levelId: id,
    rule: item.rule,
    type: 'word_order',
    sentenceWords: item.words ?? [],
    prompt: 'Arrange the words to make a correct sentence.',
    explanation: item.explanation,
  });
  const firstTypedQuestion = spec.questions.length + 1;
  spec.fixes.forEach((item, index) => addFix(item, index + firstTypedQuestion));
  const firstBlankQuestion = firstTypedQuestion + spec.fixes.length;
  spec.blanks.forEach((item, index) => addBlank(item, index + firstBlankQuestion));
  const firstOrderQuestion = firstBlankQuestion + spec.blanks.length;
  spec.orders.forEach((item, index) => addOrder(item, index + firstOrderQuestion));
  return {
    id,
    trackId: 'advanced',
    number: spec.number,
    title: spec.title,
    topic: { title: spec.title, summary: spec.summary, rules: spec.rules },
    questions,
  };
}

const rule = (name: string, title: string, explanation: string, example: string): TopicRule => ({
  rule: name,
  title,
  explanation,
  example,
});
const mc = (ruleName: string, prompt: string, answer: string, distractors: string[]): McSpec => [
  ruleName,
  prompt,
  answer,
  distractors,
];
const typed = (
  ruleName: string,
  faulty: string,
  prompt: string,
  answer: string,
  explanation: string,
  words?: string[],
): TypedSpec => ({ rule: ruleName, faulty, prompt, answer, explanation, words });

export const advancedCluster03: LevelInput[] = [
  makeLevel({
    number: 21,
    title: 'Advanced Inversion',
    summary: 'Inversion after restrictive adverbials and locative phrases creates formal emphasis and marked information order.',
    rules: [
      rule('subject_auxiliary_inversion', 'Subject-auxiliary inversion', 'Negative or restrictive fronted adverbials trigger inversion of the auxiliary and subject.', 'Rarely do we see such a clear result.'),
      rule('locative_inversion', 'Locative inversion', 'A locative phrase can precede the verb and place new information after it.', 'On the hill stood an old tower.'),
    ],
    questions: [
      mc('subject_auxiliary_inversion', 'Only after the meeting ___ the risk become clear.', 'did', ['the risk did', 'was', 'has']),
      mc('locative_inversion', 'At the end of the corridor ___ a quiet office.', 'was', ['it was', 'did', 'there had']),
      mc('subject_auxiliary_inversion', 'Under no circumstances ___ the files be copied.', 'should', ['the files should', 'should be', 'would they']),
      mc('locative_inversion', 'On the stage ___ three musicians.', 'stood', ['did stand', 'there was stood', 'stood they']),
    ],
    fixes: [
      typed('subject_auxiliary_inversion', 'Never I have encountered such a complex case.', 'Invert the subject and auxiliary.', 'Never have I encountered such a complex case.', 'Never at the front triggers subject-auxiliary inversion.'),
      typed('locative_inversion', 'Behind the building it stood a warehouse.', 'Remove the unnecessary subject.', 'Behind the building stood a warehouse.', 'Locative inversion places the new noun phrase after the verb without it.'),
      typed('subject_auxiliary_inversion', 'Rarely the committee does reject a proposal.', 'Use the formal inverted pattern.', 'Rarely does the committee reject a proposal.', 'The auxiliary precedes the subject after rarely.'),
    ],
    blanks: [
      typed('subject_auxiliary_inversion', '', 'Not until noon ___ (do) the results arrive.', 'did', 'Not until triggers inversion in the past tense.'),
      typed('locative_inversion', '', 'At the entrance ___ (stand) a security guard.', 'stood', 'The locative phrase introduces the place before the verb.'),
      typed('subject_auxiliary_inversion', '', 'Little ___ (she / know) about the change.', 'did she know', 'Little at the beginning requires auxiliary inversion.'),
    ],
    orders: [
      typed('subject_auxiliary_inversion', '', '', 'Seldom do we question the assumption.', 'Seldom triggers inversion of do and the subject.', ['Seldom', 'do', 'we', 'question', 'the', 'assumption.']),
      typed('locative_inversion', '', '', 'In the garden grew a tall tree.', 'The locative phrase precedes the verb and new subject.', ['In', 'the', 'garden', 'grew', 'a', 'tall', 'tree.']),
    ],
  }),
  makeLevel({
    number: 22,
    title: 'Extraposition and It-clauses',
    summary: 'It-clauses postpone heavy subjects while keeping the main clause easy to process.',
    rules: [
      rule('extraposition_it', 'Extraposition with it', 'A provisional it subject allows a long that-clause to appear later.', 'It was surprising that the plan succeeded.'),
      rule('anticipatory_it', 'Anticipatory it', 'Anticipatory it represents a later infinitive or clause that carries the meaning.', 'It is useful to compare the results.'),
    ],
    questions: [
      mc('extraposition_it', 'It is clear ___ the data are incomplete.', 'that', ['what that', 'to that', 'which']),
      mc('anticipatory_it', 'It was difficult ___ the old system.', 'to replace', ['replace to', 'that replacing', 'for replace']),
      mc('extraposition_it', '___ that no records were kept was alarming.', 'It was alarming', ['There alarming', 'That it was', 'It alarming']),
      mc('anticipatory_it', 'It is important ___ every source.', 'to check', ['checking to', 'check to', 'for check']),
    ],
    fixes: [
      typed('extraposition_it', 'That the deadline was missed it was unfortunate.', 'Use an extraposed subject.', 'It was unfortunate that the deadline was missed.', 'Extraposition places it in subject position and postpones the that-clause.'),
      typed('anticipatory_it', 'It is essential that to back up the files.', 'Choose one complement pattern.', 'It is essential to back up the files.', 'Essential can take anticipatory it with a to-infinitive.'),
      typed('extraposition_it', 'It surprised the team that did the test fail.', 'Correct the extraposed clause.', 'It surprised the team that the test failed.', 'The postponed clause uses normal statement order.'),
    ],
    blanks: [
      typed('extraposition_it', '', 'It was fortunate ___ (that) nobody was injured.', 'that', 'That introduces the postponed content clause.'),
      typed('anticipatory_it', '', 'It is sensible ___ (review) the figures.', 'to review', 'The later infinitive supplies the content of it.'),
      typed('extraposition_it', '', 'It became obvious ___ (that) the map was outdated.', 'that', 'That marks the clause whose content became obvious.'),
    ],
    orders: [
      typed('extraposition_it', '', '', 'It was surprising that the machine worked.', 'It holds subject position before the postponed clause.', ['It', 'was', 'surprising', 'that', 'the', 'machine', 'worked.']),
      typed('anticipatory_it', '', '', 'It is useful to record each result.', 'The to-infinitive follows the anticipatory it construction.', ['It', 'is', 'useful', 'to', 'record', 'each', 'result.']),
    ],
  }),
  makeLevel({
    number: 23,
    title: 'Coordination and Parallelism',
    summary: 'Parallel coordination keeps grammatical forms and scopes aligned across joined phrases and clauses.',
    rules: [
      rule('parallel_structure', 'Parallel structure', 'Items joined in a series should use matching grammatical forms.', 'The role requires planning, writing, and editing.'),
      rule('coordination_scope', 'Coordination scope', 'Coordinators join the intended constituents and punctuation makes their scope clear.', 'The report was concise but comprehensive.'),
    ],
    questions: [
      mc('parallel_structure', 'The role involves planning, writing, and ___.', 'editing', ['to edit', 'edited', 'edit']),
      mc('coordination_scope', 'She ordered the files and ___ the index.', 'checked', ['checking', 'to checking', 'check']),
      mc('parallel_structure', 'The policy is intended to reduce waste and ___ costs.', 'lower', ['lowering', 'lowered', 'to lowering']),
      mc('coordination_scope', 'The team reviewed the draft, and the editor ___ it.', 'approved', ['approval', 'approving', 'to approve']),
    ],
    fixes: [
      typed('parallel_structure', 'The course teaches analysis, writing reports, and presentation.', 'Make the series parallel.', 'The course teaches analysis, report writing, and presentation.', 'Coordinated noun phrases should share the same form.'),
      typed('coordination_scope', 'The manager asked us to revise the plan and the budget was checked.', 'Coordinate the clauses clearly.', 'The manager asked us to revise the plan, and the budget was checked.', 'A comma separates the two independent coordinated clauses.'),
      typed('parallel_structure', 'They aim to improve quality and reducing costs.', 'Match the coordinated verb forms.', 'They aim to improve quality and reduce costs.', 'The two verbs share the to-infinitive complement.'),
    ],
    blanks: [
      typed('parallel_structure', '', 'The project requires testing, measuring, and ___.', 'reporting', 'The series uses three matching gerund forms.'),
      typed('coordination_scope', '', 'The data were incomplete, ___ the conclusion remained useful.', 'but', 'But coordinates the contrasting clauses.'),
      typed('parallel_structure', '', 'The editor will check the facts and ___ the wording.', 'polish', 'The second verb is coordinated with will check.'),
    ],
    orders: [
      typed('parallel_structure', '', '', 'The job involves reading, analysing, and summarising evidence.', 'Each item in the series is a gerund.', ['The', 'job', 'involves', 'reading,', 'analysing,', 'and', 'summarising', 'evidence.']),
      typed('coordination_scope', '', '', 'The method is simple but highly effective.', 'But joins two coordinated adjective phrases.', ['The', 'method', 'is', 'simple', 'but', 'highly', 'effective.']),
    ],
  }),
  makeLevel({
    number: 24,
    title: 'Ellipsis and Gapping',
    summary: 'Ellipsis avoids repetition, while gapping removes repeated verbs from coordinated clauses.',
    rules: [
      rule('gapping', 'Gapping', 'Gapping omits a repeated verb and auxiliary in a non-initial coordinated clause.', 'Mina chose the venue, and Theo the date.'),
      rule('comparative_ellipsis', 'Comparative ellipsis', 'Comparatives can omit repeated material when the comparison remains clear.', 'The second test was more reliable than the first.'),
    ],
    questions: [
      mc('gapping', 'I approved the design, and Sam ___ the budget.', 'the', ['approved the', 'did approved', 'was the']),
      mc('comparative_ellipsis', 'The revised model is faster than the original ___.', 'one', ['is', 'does', 'model is']),
      mc('gapping', 'Nora selected the topic, and Lee ___ the method.', 'the', ['selected the', 'did selected', 'was selected']),
      mc('comparative_ellipsis', 'This explanation is clearer than the previous ___.', 'one', ['was', 'does', 'explained']),
    ],
    fixes: [
      typed('gapping', 'The first group chose the room, and the second group chose the time.', 'Use gapping to avoid repetition.', 'The first group chose the room, and the second the time.', 'Gapping removes the repeated chose from the second coordinated clause.'),
      typed('comparative_ellipsis', 'The new version is more efficient than is the old one.', 'Use the ordinary comparative ellipsis.', 'The new version is more efficient than the old one.', 'The repeated verb can be omitted after a clear comparative.'),
      typed('gapping', 'I prepared the slides, and Priya prepared the handout.', 'Make the second clause elliptical.', 'I prepared the slides, and Priya the handout.', 'The shared verb is recoverable and need not be repeated.'),
    ],
    blanks: [
      typed('gapping', '', 'The board approved the budget, and the staff ___ the schedule.', 'the', 'Gapping leaves the second subject and object after coordination.'),
      typed('comparative_ellipsis', '', 'The final draft is shorter than the earlier ___.', 'one', 'One stands for the repeated singular noun draft.'),
      typed('gapping', '', 'I chose the location, and Alex ___ the date.', 'the', 'The omitted verb is understood from the first clause.'),
    ],
    orders: [
      typed('gapping', '', '', 'The analyst checked the figures, and the editor the prose.', 'The second clause omits the repeated verb checked.', ['The', 'analyst', 'checked', 'the', 'figures,', 'and', 'the', 'editor', 'the', 'prose.']),
      typed('comparative_ellipsis', '', '', 'This route is safer than the other one.', 'One replaces the repeated noun route.', ['This', 'route', 'is', 'safer', 'than', 'the', 'other', 'one.']),
    ],
  }),
  makeLevel({ number: 25, title: 'Concession and Scalar Meaning', summary: 'Concessive clauses mark unexpected contrasts, while scalar expressions strengthen or widen the contrast.', rules: [rule('concessive_clause', 'Concessive clauses', 'Although and even though introduce a condition that contrasts with the main result.', 'Although the route was long, it was efficient.'), rule('scalar_even_if', 'Scalar even if', 'Even if presents a hypothetical condition that would not change the result.', 'Even if it rains, the event will continue.')], questions: [mc('concessive_clause', '___ the delay, the work was completed.', 'Despite', ['Although of', 'Even despite of', 'Despite that of']), mc('scalar_even_if', '___ the cost rises, we will finish the project.', 'Even if', ['Even although if', 'Despite if', 'If even']), mc('concessive_clause', 'Although it was late, ___ working.', 'they continued', ['continued they to', 'they continuing', 'did they continued']), mc('scalar_even_if', 'The plan will proceed even if the figures ___ change.', 'do', ['are', 'does', 'will to'])], fixes: [typed('concessive_clause', 'Although of the risks, they continued.', 'Choose a concessive preposition.', 'Despite the risks, they continued.', 'Despite is followed directly by a noun phrase.'), typed('scalar_even_if', 'Even if it will rain, the match will start.', 'Correct the hypothetical condition.', 'Even if it rains, the match will start.', 'The present tense follows even if for a future condition.'), typed('concessive_clause', 'Despite the road was closed, we arrived.', 'Use a clause linker or a noun phrase.', 'Although the road was closed, we arrived.', 'Although introduces a finite concessive clause.')], blanks: [typed('concessive_clause', '', '___ (although) the task was difficult, it was worthwhile.', 'Although', 'Although introduces the contrasting finite clause.'), typed('scalar_even_if', '', 'We will continue even if demand ___ (fall).', 'falls', 'A present form follows even if for a future condition.'), typed('concessive_clause', '', '___ (despite) the warning, the test went ahead.', 'Despite', 'Despite takes a noun phrase rather than a finite clause.')], orders: [typed('concessive_clause', '', '', 'Although the evidence was limited, the claim was plausible.', 'The although clause presents an unexpected contrast.', ['Although', 'the', 'evidence', 'was', 'limited,', 'the', 'claim', 'was', 'plausible.']), typed('scalar_even_if', '', '', 'Even if conditions change, the principle remains valid.', 'Even if marks a condition that does not affect the result.', ['Even', 'if', 'conditions', 'change,', 'the', 'principle', 'remains', 'valid.'])] }),
  makeLevel({ number: 26, title: 'Academic and Formal Cohesion', summary: 'Formal linking expressions show addition, contrast, cause, and consequence across academic sentences.', rules: [rule('academic_linking', 'Academic linking', 'Formal connectors make logical relationships between claims explicit.', 'Furthermore, the second sample confirms the pattern.'), rule('resultative_cohesion', 'Resultative cohesion', 'Therefore, thus, and consequently introduce results that follow from preceding information.', 'The sample was small; consequently, the result is tentative.')], questions: [mc('academic_linking', 'The sample was small; ___, it was carefully selected.', 'nevertheless', ['nevertheless of', 'despite', 'whereas']), mc('resultative_cohesion', 'The evidence was incomplete; ___, no firm conclusion was possible.', 'therefore', ['therefore that', 'because', 'although']), mc('academic_linking', '___, the findings support the original hypothesis.', 'Furthermore', ['Further that', 'Despite', 'Where']), mc('resultative_cohesion', 'The device failed and ___ the test was repeated.', 'consequently', ['consequence', 'consequently that', 'consequent'])], fixes: [typed('academic_linking', 'Despite, the evidence was limited, the claim was useful.', 'Replace the misplaced linker.', 'Although the evidence was limited, the claim was useful.', 'Although directly introduces a finite clause.'), typed('resultative_cohesion', 'The result was inconsistent, consequently we repeated the test.', 'Punctuate the sentence link.', 'The result was inconsistent; consequently, we repeated the test.', 'A semicolon and comma clearly mark consequently between independent clauses.'), typed('academic_linking', 'Furthermore of the cost, the method is impractical.', 'Use an appropriate formal connector.', 'In addition to the cost, the method is impractical.', 'In addition to can introduce a noun phrase.')], blanks: [typed('academic_linking', '', 'The method is inexpensive; ___ (however), it is reliable.', 'however', 'However marks contrast between the two clauses.'), typed('resultative_cohesion', '', 'The controls failed; ___ (consequently), the results were discarded.', 'consequently', 'Consequently introduces the result of the failed controls.'), typed('academic_linking', '', '___ (moreover), the second trial produced the same pattern.', 'Moreover', 'Moreover adds a further supporting point.')], orders: [typed('resultative_cohesion', '', '', 'The sample was biased; consequently, the estimate was revised.', 'Consequently introduces the result after a semicolon.', ['The', 'sample', 'was', 'biased;', 'consequently,', 'the', 'estimate', 'was', 'revised.']), typed('academic_linking', '', '', 'Moreover, the approach is easy to replicate.', 'Moreover adds another formal supporting point.', ['Moreover,', 'the', 'approach', 'is', 'easy', 'to', 'replicate.'])] }),
  makeLevel({ number: 27, title: 'Stance, Certainty, and Qualification', summary: 'Stance expressions qualify claims and distinguish confidence from evidence.', rules: [rule('stance_noun_phrase', 'Stance noun phrases', 'Noun phrases such as there is evidence that express the writer’s stance toward a claim.', 'There is strong evidence that the effect is real.'), rule('certainty_qualification', 'Certainty qualification', 'Qualifiers calibrate how strongly a claim is presented.', 'The results appear to indicate a modest improvement.')], questions: [mc('stance_noun_phrase', 'There is little evidence ___ the treatment works.', 'that', ['for that the', 'what', 'to that']), mc('certainty_qualification', 'The findings ___ suggest a relationship.', 'appear to', ['appear that to', 'are appearing', 'appearing to']), mc('stance_noun_phrase', 'There is no reason ___ the result is accidental.', 'to believe', ['believe to', 'that believing', 'for believe']), mc('certainty_qualification', 'The change is ___ significant.', 'potentially', ['potential', 'potentially to', 'potency'])], fixes: [typed('stance_noun_phrase', 'There are strong evidence that the method works.', 'Correct agreement in the stance phrase.', 'There is strong evidence that the method works.', 'Evidence is uncountable here, so the phrase takes there is.'), typed('certainty_qualification', 'The data definitely appear to perhaps support the claim.', 'Reduce the conflicting certainty markers.', 'The data appear to support the claim.', 'A measured stance avoids stacking incompatible qualifiers.'), typed('stance_noun_phrase', 'There is evidence for the device is safe.', 'Complete the complement correctly.', 'There is evidence that the device is safe.', 'Evidence takes a that-clause directly in this construction.')], blanks: [typed('stance_noun_phrase', '', 'There is some evidence ___ (that) the policy helped.', 'that', 'That introduces the proposition supported by the evidence.'), typed('certainty_qualification', '', 'The results ___ (appear) to be consistent.', 'appear', 'Appear to expresses cautious interpretation.'), typed('certainty_qualification', '', 'The effect is ___ (relatively) small.', 'relatively', 'Relatively qualifies the degree of smallness.')], orders: [typed('stance_noun_phrase', '', '', 'There is limited evidence that the change mattered.', 'There is introduces the stance noun phrase.', ['There', 'is', 'limited', 'evidence', 'that', 'the', 'change', 'mattered.']), typed('certainty_qualification', '', '', 'The results appear to support a cautious conclusion.', 'Appear to qualifies the strength of the claim.', ['The', 'results', 'appear', 'to', 'support', 'a', 'cautious', 'conclusion.'])] }),
  makeLevel({ number: 28, title: 'Lexical Grammar and Valency', summary: 'Verb valency and light-verb collocations determine which complements and nouns combine naturally.', rules: [rule('valency_alternation', 'Valency alternation', 'Valency describes the complements a verb licenses and how those complements can alternate.', 'The researcher explained the result to the panel.'), rule('light_verb_collocation', 'Light-verb collocations', 'Light verbs form conventional meanings with abstract nouns, such as make a decision.', 'The committee made a decision.')], questions: [mc('valency_alternation', 'The lecturer explained the rule ___ the class.', 'to', ['for to', 'at to', 'with']), mc('light_verb_collocation', 'The panel ___ a decision after lunch.', 'made', ['did', 'created', 'put']), mc('valency_alternation', 'They discussed ___ the proposal.', 'the proposal', ['about the proposal', 'to the proposal', 'on about']), mc('light_verb_collocation', 'We need to ___ progress quickly.', 'make', ['do', 'take', 'put'])], fixes: [typed('valency_alternation', 'She explained us the procedure.', 'Use the licensed complement pattern.', 'She explained the procedure to us.', 'Explain takes the thing explained as its object and the recipient with to.'), typed('light_verb_collocation', 'The team did a decision yesterday.', 'Replace the incorrect light verb.', 'The team made a decision yesterday.', 'Make a decision is the conventional collocation.'), typed('valency_alternation', 'They suggested us to postpone the launch.', 'Use an appropriate suggestion complement.', 'They suggested postponing the launch to us.', 'Suggest takes an -ing clause or a that-clause, not object plus infinitive.')], blanks: [typed('valency_alternation', '', 'The guide explained the route ___ (to) the visitors.', 'to', 'To introduces the recipient of an explanation.'), typed('light_verb_collocation', '', 'The researchers ___ (take) measures to reduce risk.', 'took', 'Take measures is the conventional collocation.'), typed('light_verb_collocation', '', 'The new policy will ___ (make) a difference.', 'make', 'Make a difference is a fixed light-verb combination.')], orders: [typed('valency_alternation', '', '', 'She explained the procedure to the trainees.', 'Explain takes the explained thing before the recipient with to.', ['She', 'explained', 'the', 'procedure', 'to', 'the', 'trainees.']), typed('light_verb_collocation', '', '', 'The changes made a significant difference.', 'Make a difference is the conventional collocation.', ['The', 'changes', 'made', 'a', 'significant', 'difference.'])] }),
  makeLevel({ number: 29, title: 'Register, Variation, and Editing', summary: 'Editing choices distinguish standard formal usage from informal or regionally variable alternatives.', rules: [rule('standard_edited_english', 'Standard edited English', 'Formal edited prose follows conventions that improve clarity and acceptability across audiences.', 'The committee has not yet reached a decision.'), rule('register_variant_choice', 'Register and variant choice', 'A form can be grammatical yet unsuitable for a formal context or a particular audience.', 'The findings were obtained from three sites.')], questions: [mc('standard_edited_english', 'Which sentence is most suitable for a formal report?', 'The committee has not reached a decision.', ['The committee ain’t decided.', 'The committee hasnt decided.', 'The committee did not reach no decision.']), mc('register_variant_choice', 'Choose the formal alternative to “a lot of evidence”.', 'substantial evidence', ['big evidence', 'loads evidence', 'many evidence']), mc('standard_edited_english', 'The report was written ___ clear English.', 'in', ['on', 'at', 'by']), mc('register_variant_choice', 'Which phrase is suitable for a cautious academic claim?', 'The results may indicate', ['The results totally prove', 'The results are dead certain', 'The results kinda show'])], fixes: [typed('standard_edited_english', 'The report do not contain no references.', 'Edit the double negative and agreement.', 'The report does not contain any references.', 'Standard edited English uses does with a singular subject and any after negation.'), typed('register_variant_choice', 'The results kinda prove the theory.', 'Replace the informal overstatement.', 'The results may support the theory.', 'May support is formal and appropriately cautious.'), typed('standard_edited_english', 'We have less errors in the revised version.', 'Use the standard count-noun form.', 'We have fewer errors in the revised version.', 'Fewer is preferred with countable plural nouns in edited prose.')], blanks: [typed('standard_edited_english', '', 'The study provides ___ (substantial) evidence.', 'substantial', 'Substantial is a formal adjective for a considerable amount.'), typed('register_variant_choice', '', 'The results ___ (may) indicate a difference.', 'may', 'May presents a cautious formal claim.'), typed('standard_edited_english', '', 'There were ___ (fewer) errors in the final draft.', 'fewer', 'Fewer modifies the countable plural noun errors.')], orders: [typed('standard_edited_english', '', '', 'The findings may indicate a modest improvement.', 'May indicate is a suitably cautious formal expression.', ['The', 'findings', 'may', 'indicate', 'a', 'modest', 'improvement.']), typed('register_variant_choice', '', '', 'The revised wording is appropriate for a formal report.', 'The vocabulary and structure fit edited formal prose.', ['The', 'revised', 'wording', 'is', 'appropriate', 'for', 'a', 'formal', 'report.'])] }),
  makeLevel({ number: 30, title: 'Advanced Grammar Consolidation', summary: 'This final level combines advanced clause structure, cohesion, stance, valency, and register in extended contexts.', rules: [rule('advanced_grammar_consolidation', 'Advanced grammar consolidation', 'Advanced grammar choices work together: structure, cohesion, stance, and register must fit the intended meaning.', 'Although the evidence was limited, the results appear to support the conclusion.')], questions: [mc('advanced_grammar_consolidation', '___ the evidence was limited, the conclusion remained plausible.', 'Although', ['Despite that', 'Even of', 'Whereas of']), mc('advanced_grammar_consolidation', 'The results ___ indicate a small improvement.', 'appear to', ['appear that to', 'are appear', 'appearing']), mc('advanced_grammar_consolidation', 'The adviser explained the change ___ the committee.', 'to', ['for', 'at to', 'with to']), mc('advanced_grammar_consolidation', 'Only after the review ___ the error become visible.', 'did', ['the error did', 'was', 'has']), mc('advanced_grammar_consolidation', 'The team made a decision and ___ the report.', 'revised', ['revision', 'revising to', 'did revised'])], fixes: [typed('advanced_grammar_consolidation', 'Although of the limitations, the findings appear prove useful.', 'Edit the sentence for grammar and stance.', 'Despite the limitations, the findings appear to be useful.', 'Despite takes a noun phrase, while appear takes a to-infinitive.'), typed('advanced_grammar_consolidation', 'Only after the audit the committee did change its policy.', 'Place the inverted auxiliary correctly.', 'Only after the audit did the committee change its policy.', 'A restrictive fronted phrase places did before the subject.'), typed('advanced_grammar_consolidation', 'The report explains us the result clearly.', 'Use the standard valency pattern.', 'The report explains the result to us clearly.', 'Explain takes the thing explained as its object and the recipient with to.')], blanks: [typed('advanced_grammar_consolidation', '', 'The evidence ___ (appear) to support the claim.', 'appears', 'Appear to presents a cautious interpretation of the evidence.'), typed('advanced_grammar_consolidation', '', '___ (despite) the uncertainty, the procedure was retained.', 'Despite', 'Despite introduces the noun phrase the uncertainty.'), typed('advanced_grammar_consolidation', '', 'Only then ___ (do) the pattern become clear.', 'did', 'Only then triggers past-tense inversion with did.')], orders: [typed('advanced_grammar_consolidation', '', '', 'Although cautious, the conclusion is well supported.', 'The concessive adjective phrase modifies the conclusion.', ['Although', 'cautious,', 'the', 'conclusion', 'is', 'well', 'supported.']), typed('advanced_grammar_consolidation', '', '', 'Only after review did the findings appear reliable.', 'The fronted restrictive phrase triggers inversion.', ['Only', 'after', 'review', 'did', 'the', 'findings', 'appear', 'reliable.'])] }),
];
