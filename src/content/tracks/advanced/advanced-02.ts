/** Advanced track content cluster for levels a11–a20. */

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
  spec.fixes.forEach((item, index) => addFix(item, index + 5));
  spec.blanks.forEach((item, index) => addBlank(item, index + 8));
  spec.orders.forEach((item, index) => addOrder(item, index + 11));
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

export const advancedCluster02: LevelInput[] = [
  makeLevel({
    number: 11,
    title: 'Relative Clauses and Information Structure',
    summary: 'Relative clauses attach modifiers clearly and distinguish restrictive from supplementary information.',
    rules: [
      rule('relative_clause_attachment', 'Relative clause attachment', 'Place a relative clause next to the noun it modifies and use a suitable relative form.', 'The report that the committee released clarified the policy.'),
      rule('resumptive_reference', 'Resumptive reference', 'Formal English normally omits a repeated object after a relative pronoun.', 'The proposal that we discussed was approved.'),
    ],
    questions: [
      mc('relative_clause_attachment', 'The engineer ___ designed the bridge won the award.', 'who', ['which he', 'where', 'whose']),
      mc('resumptive_reference', 'The book that I recommended ___ useful.', 'was', ['it was', 'was it', 'being']),
      mc('relative_clause_attachment', 'The office, ___ overlooks the harbour, is being renovated.', 'which', ['where it', 'what', 'whose it']),
      mc('resumptive_reference', 'The issue ___ we discussed remains unresolved.', 'that', ['that it', 'where it', 'what it']),
    ],
    fixes: [
      typed('relative_clause_attachment', 'The analyst spoke to the manager who was waiting in the lobby.', 'Make the attachment clear if the analyst was waiting.', 'The analyst who was waiting in the lobby spoke to the manager.', 'Place the relative clause directly after the noun it modifies.'),
      typed('resumptive_reference', 'The plan which we approved it starts tomorrow.', 'Remove the repeated object.', 'The plan which we approved starts tomorrow.', 'The relative pronoun already represents the object of approved.'),
      typed('relative_clause_attachment', 'The laboratory, that opened last year, is expanding.', 'Correct the non-defining relative clause.', 'The laboratory, which opened last year, is expanding.', 'Non-defining clauses use which rather than that after a comma.'),
    ],
    blanks: [
      typed('relative_clause_attachment', '', 'The researcher ___ (who / whom) led the study presented the findings.', 'who', 'Who is the subject of led in the relative clause.'),
      typed('resumptive_reference', '', 'The evidence ___ we found was conclusive.', 'that', 'That introduces the object relative clause without a repeated pronoun.'),
      typed('relative_clause_attachment', '', 'The village in ___ she grew up has changed.', 'which', 'Which follows the preposition in in a formal relative clause.'),
    ],
    orders: [
      typed('relative_clause_attachment', '', '', 'The report that we received was incomplete.', 'The defining clause follows the noun it identifies.', ['The', 'report', 'that', 'we', 'received', 'was', 'incomplete.']),
      typed('resumptive_reference', '', '', 'The candidate whom we interviewed accepted the offer.', 'Whom represents the object and is not followed by it.', ['The', 'candidate', 'whom', 'we', 'interviewed', 'accepted', 'the', 'offer.']),
    ],
  }),
  makeLevel({
    number: 12,
    title: 'Nominal Relative Clauses',
    summary: 'Nominal relatives function as noun phrases and express things, people, or choices without an antecedent.',
    rules: [
      rule('nominal_relative_what', 'Nominal relative what', 'What means the thing or things that and introduces a clause functioning as a noun phrase.', 'What she said surprised everyone.'),
      rule('nominal_relative_whoever', 'Nominal relative whoever', 'Whoever and whatever refer generally to any person or thing meeting the condition.', 'Whoever arrives first can choose a seat.'),
    ],
    questions: [
      mc('nominal_relative_what', '___ he proposed was financially realistic.', 'What', ['Which what', 'That what', 'The what']),
      mc('nominal_relative_whoever', '___ answers correctly may leave early.', 'Whoever', ['Who he', 'The whoever', 'Whomsoever he']),
      mc('nominal_relative_what', 'Take ___ you need from the cupboard.', 'whatever', ['what it', 'that whatever', 'which']),
      mc('nominal_relative_whoever', 'We will support ___ the panel selects.', 'whoever', ['who he', 'the whoever', 'whom is']),
    ],
    fixes: [
      typed('nominal_relative_what', 'What that she explained was helpful.', 'Use one nominal relative marker.', 'What she explained was helpful.', 'What already means the thing that, so that is unnecessary.'),
      typed('nominal_relative_whoever', 'Whoever he will apply may request an interview.', 'Correct the nominal relative clause.', 'Whoever applies may request an interview.', 'Whoever is the subject of the clause and does not take will for a general condition.'),
      typed('nominal_relative_what', 'I cannot accept which you have suggested.', 'Replace the incorrect nominal relative.', 'I cannot accept what you have suggested.', 'What introduces the thing that has been suggested.'),
    ],
    blanks: [
      typed('nominal_relative_what', '', '___ matters most is reliability.', 'What', 'What functions as the noun phrase meaning the thing that matters.'),
      typed('nominal_relative_whoever', '', '___ you invite will need a pass.', 'Whoever', 'Whoever refers to any person you invite.'),
      typed('nominal_relative_what', '', 'Choose ___ seems most practical.', 'whatever', 'Whatever means anything that seems most practical.'),
    ],
    orders: [
      typed('nominal_relative_what', '', '', 'What the witness described was remarkable.', 'The nominal relative clause is the subject of was.', ['What', 'the', 'witness', 'described', 'was', 'remarkable.']),
      typed('nominal_relative_whoever', '', '', 'Whoever finishes first will present the results.', 'Whoever introduces the subject of the main clause.', ['Whoever', 'finishes', 'first', 'will', 'present', 'the', 'results.']),
    ],
  }),
  makeLevel({
    number: 13,
    title: 'Advanced Complementation',
    summary: 'Complement patterns control whether clauses take infinitives, -ing forms, or that-clauses after complex verbs.',
    rules: [
      rule('complex_complementation', 'Complex complementation', 'Different verbs select different complement patterns, including that-clauses, infinitives, and gerunds.', 'The committee recommended that the plan be revised.'),
      rule('raising_verbs', 'Raising verbs', 'Raising verbs allow the apparent subject of an infinitive to relate to the main clause without assigning it a main-clause role.', 'The results appear to confirm the hypothesis.'),
    ],
    questions: [
      mc('complex_complementation', 'They insisted ___ the contract immediately.', 'on signing', ['to sign on', 'that signing on', 'sign']),
      mc('raising_verbs', 'The results appear ___ the original prediction.', 'to support', ['supporting to', 'that support', 'to supporting']),
      mc('complex_complementation', 'She suggested ___ the meeting.', 'postponing', ['to postpone it to', 'postpone to', 'that postponing']),
      mc('raising_verbs', 'The device is believed ___ safe.', 'to be', ['being to', 'that it is to', 'be to']),
    ],
    fixes: [
      typed('complex_complementation', 'The adviser recommended us to revise the proposal.', 'Use the appropriate complement pattern.', 'The adviser recommended that we revise the proposal.', 'Recommend takes a that-clause or an -ing complement, not an object plus infinitive.'),
      typed('raising_verbs', 'The figures appear that they contradict the forecast.', 'Correct the raising construction.', 'The figures appear to contradict the forecast.', 'Appear takes an infinitive complement in this construction.'),
      typed('complex_complementation', 'He avoided to answer the question.', 'Correct the complement after avoid.', 'He avoided answering the question.', 'Avoid is followed by an -ing form.'),
    ],
    blanks: [
      typed('complex_complementation', '', 'The board agreed ___ (extend) the deadline.', 'to extend', 'Agree takes a to-infinitive when the subject undertakes an action.'),
      typed('raising_verbs', '', 'The proposal seems ___ (address) the main concern.', 'to address', 'Seem takes a to-infinitive complement.'),
      typed('complex_complementation', '', 'They objected to ___ (change) the schedule.', 'changing', 'The preposition to is followed by an -ing form here.'),
    ],
    orders: [
      typed('raising_verbs', '', '', 'The findings seem to support the theory.', 'Seem is followed by a to-infinitive.', ['The', 'findings', 'seem', 'to', 'support', 'the', 'theory.']),
      typed('complex_complementation', '', '', 'The panel recommended revising the procedure.', 'Recommend can take an -ing complement.', ['The', 'panel', 'recommended', 'revising', 'the', 'procedure.']),
    ],
  }),
  makeLevel({
    number: 14,
    title: 'Control and Infinitive Subjects',
    summary: 'Control constructions distinguish the understood subject of an infinitive from an explicit for-to subject.',
    rules: [
      rule('control_infinitive', 'Control infinitives', 'In control constructions, a noun phrase in the main clause supplies the understood subject of the infinitive.', 'The students agreed to revise the draft.'),
      rule('for_to_subject', 'For-to subjects', 'Use for plus a noun phrase before an infinitive when its subject differs from the main-clause subject.', 'It is important for every applicant to register.'),
    ],
    questions: [
      mc('control_infinitive', 'The manager persuaded the team ___ earlier.', 'to leave', ['leaving to', 'that leave', 'leave to']),
      mc('for_to_subject', 'It is unusual ___ the machine to fail.', 'for', ['of it to', 'to for', 'that for']),
      mc('control_infinitive', 'The witness refused ___ the statement.', 'to sign', ['signing to', 'that sign', 'sign to']),
      mc('for_to_subject', 'There is no reason ___ us to delay.', 'for', ['of for', 'to for', 'that']),
    ],
    fixes: [
      typed('control_infinitive', 'The coach encouraged to the players practise daily.', 'Correct the object-control construction.', 'The coach encouraged the players to practise daily.', 'Encourage takes an object followed by a to-infinitive.'),
      typed('for_to_subject', 'It was difficult the interns to understand the procedure.', 'Add the explicit infinitive subject marker.', 'It was difficult for the interns to understand the procedure.', 'For introduces the subject of the infinitive.'),
      typed('control_infinitive', 'The child promised her mother to behave.', 'Make the controlled subject clear.', 'The child promised to behave for her mother.', 'Promise controls its own subject; an object cannot intervene before the infinitive.'),
    ],
    blanks: [
      typed('control_infinitive', '', 'The committee allowed the visitors ___ (enter).', 'to enter', 'Allow takes an object plus a to-infinitive.'),
      typed('for_to_subject', '', 'It is essential ___ applicants to provide identification.', 'for', 'For introduces applicants as the subject of to provide.'),
      typed('control_infinitive', '', 'She managed ___ (solve) the puzzle.', 'to solve', 'Manage takes a to-infinitive.'),
    ],
    orders: [
      typed('for_to_subject', '', '', 'It is useful for students to compare examples.', 'For marks the subject of the infinitive.', ['It', 'is', 'useful', 'for', 'students', 'to', 'compare', 'examples.']),
      typed('control_infinitive', '', '', 'The guide encouraged us to ask questions.', 'The object us controls the understood subject of ask.', ['The', 'guide', 'encouraged', 'us', 'to', 'ask', 'questions.']),
    ],
  }),
  makeLevel({
    number: 15,
    title: 'Modality and Evidentiality',
    summary: 'Modal choices grade certainty while evidential expressions show how a claim is supported.',
    rules: [
      rule('epistemic_modality_scale', 'Epistemic modality scale', 'Epistemic modals express different degrees of certainty about a proposition.', 'The delay may be caused by a technical fault.'),
      rule('evidential_language', 'Evidential language', 'Evidential phrases identify whether a claim comes from observation, report, or inference.', 'The evidence suggests that demand is falling.'),
    ],
    questions: [
      mc('epistemic_modality_scale', 'The lights are on, so someone ___ be inside.', 'must', ['should to', 'can to', 'would have']),
      mc('evidential_language', 'The data ___ indicate a seasonal pattern.', 'appear to', ['appear that to', 'are appearing to have', 'appearing']),
      mc('epistemic_modality_scale', 'The parcel ___ have arrived; the doorbell rang.', 'may', ['must to have', 'can has', 'should have to']),
      mc('evidential_language', 'According to witnesses, the vehicle ___ left at noon.', 'appears to have', ['appears that have', 'is appear to', 'appearing have']),
    ],
    fixes: [
      typed('epistemic_modality_scale', 'The explanation must to be wrong.', 'Correct the epistemic modal.', 'The explanation must be wrong.', 'A modal is followed directly by the base form without to.'),
      typed('evidential_language', 'The results suggest us that the treatment works.', 'Use an appropriate evidential pattern.', 'The results suggest that the treatment works.', 'Suggest takes a that-clause here, not an indirect object.'),
      typed('epistemic_modality_scale', 'She may has misunderstood the instruction.', 'Correct the modal perfect.', 'She may have misunderstood the instruction.', 'May is followed by have plus the past participle for a possible past event.'),
    ],
    blanks: [
      typed('epistemic_modality_scale', '', 'The keys are missing, so he ___ (must / lose) them.', 'must have lost', 'Must have expresses a strong inference about the past.'),
      typed('evidential_language', '', 'The witness report ___ (indicate) that the door was open.', 'indicates', 'The report is the grammatical subject of indicates.'),
      typed('epistemic_modality_scale', '', 'They ___ (might / overlook) a crucial detail.', 'might have overlooked', 'Might have expresses a tentative past inference.'),
    ],
    orders: [
      typed('evidential_language', '', '', 'The evidence appears to support her account.', 'Appear to presents an inference based on evidence.', ['The', 'evidence', 'appears', 'to', 'support', 'her', 'account.']),
      typed('epistemic_modality_scale', '', '', 'The package must have been delivered yesterday.', 'Must have been marks a strong past inference.', ['The', 'package', 'must', 'have', 'been', 'delivered', 'yesterday.']),
    ],
  }),
  makeLevel({
    number: 16,
    title: 'Politeness and Interpersonal Modality',
    summary: 'Tentative forms and negative-politeness strategies soften requests, disagreement, and imposition.',
    rules: [
      rule('tentative_language', 'Tentative language', 'Could, would, and hedging expressions make requests and claims less direct.', 'Would you mind checking the figures?'),
      rule('negative_politeness', 'Negative politeness', 'Negative-politeness forms acknowledge the listener’s freedom and minimise an imposition.', 'I was wondering if you could send the file.'),
    ],
    questions: [
      mc('tentative_language', '___ you possibly review this draft?', 'Could', ['Can to', 'Would to', 'Should have']),
      mc('negative_politeness', 'I was wondering ___ you could help.', 'if', ['that if', 'what if that', 'would if']),
      mc('tentative_language', 'It ___ be worth reconsidering the date.', 'might', ['might to', 'can have to', 'would be to']),
      mc('negative_politeness', 'Would you mind ___ the window?', 'closing', ['to close', 'close to', 'that close']),
    ],
    fixes: [
      typed('tentative_language', 'Can you to send the figures when convenient?', 'Use a polite modal correctly.', 'Could you send the figures when convenient?', 'Could plus the base verb makes the request more tentative.'),
      typed('negative_politeness', 'I wonder that you could check this.', 'Complete the indirect request.', 'I wonder if you could check this.', 'If introduces the content of the indirect question.'),
      typed('tentative_language', 'You must perhaps reconsider the wording.', 'Place the hedge naturally.', 'You might want to reconsider the wording.', 'Might want to is a less forceful suggestion than must.'),
    ],
    blanks: [
      typed('tentative_language', '', '___ (would) you mind waiting a moment?', 'Would', 'Would you mind is a conventional polite request.'),
      typed('negative_politeness', '', 'I was hoping ___ you could clarify the last point.', 'that', 'That introduces the content of the softened hope.'),
      typed('tentative_language', '', 'Perhaps we ___ (could) postpone the decision.', 'could', 'Could presents the suggestion tentatively.'),
    ],
    orders: [
      typed('negative_politeness', '', '', 'I was wondering if you could help us.', 'The indirect question softens the request.', ['I', 'was', 'wondering', 'if', 'you', 'could', 'help', 'us.']),
      typed('tentative_language', '', '', 'Would you be able to join the call?', 'Would you be able to is a polite ability request.', ['Would', 'you', 'be', 'able', 'to', 'join', 'the', 'call?']),
    ],
  }),
  makeLevel({
    number: 17,
    title: 'Article Meaning and Genericity',
    summary: 'Articles distinguish generic kinds, particular instances, and institutional uses of familiar places.',
    rules: [
      rule('generic_reference', 'Generic reference', 'Singular count nouns use a or the for generic statements, while plurals can refer to kinds without an article.', 'Tigers are endangered animals.'),
      rule('institutional_zero_article', 'Institutional zero article', 'Zero article can mark an institution used for its primary social purpose.', 'She is at university this year.'),
    ],
    questions: [
      mc('generic_reference', '___ elephants are highly social animals.', 'Ø', ['The an', 'A', 'An the']),
      mc('institutional_zero_article', 'He was taken to ___ hospital after the accident.', 'the', ['Ø', 'a the', 'an']),
      mc('generic_reference', '___ smartphone has changed daily communication.', 'The', ['Ø a', 'An the', 'Smartphone a']),
      mc('institutional_zero_article', 'Her son is studying at ___ university.', 'Ø', ['the an', 'a the', 'an the']),
    ],
    fixes: [
      typed('generic_reference', 'A elephants live in family groups.', 'Correct the generic plural.', 'Elephants live in family groups.', 'Plural nouns can refer to a whole kind without an article.'),
      typed('institutional_zero_article', 'She is in the bed because she is sleeping.', 'Use the institutional expression.', 'She is in bed because she is sleeping.', 'Bed takes zero article when it refers to its ordinary purpose.'),
      typed('generic_reference', 'The science helps us understand nature in general.', 'Remove the unnecessary generic article.', 'Science helps us understand nature in general.', 'Abstract uncountable nouns commonly take zero article for general meaning.'),
    ],
    blanks: [
      typed('generic_reference', '', '___ whale is a mammal.', 'A', 'A singular count noun with generic meaning can take a.'),
      typed('institutional_zero_article', '', 'They go to ___ school by bus.', 'Ø', 'School takes zero article when referring to its normal educational function.'),
      typed('generic_reference', '', '___ internet has changed how we work.', 'The', 'The identifies the shared global system as a unique concept.'),
    ],
    orders: [
      typed('generic_reference', '', '', 'Birds build nests in many different ways.', 'The plural bare noun refers generically to the kind.', ['Birds', 'build', 'nests', 'in', 'many', 'different', 'ways.']),
      typed('institutional_zero_article', '', '', 'She went to prison as a convicted criminal.', 'Prison has zero article for its institutional purpose.', ['She', 'went', 'to', 'prison', 'as', 'a', 'convicted', 'criminal.']),
    ],
  }),
  makeLevel({
    number: 18,
    title: 'Determiners and Information Packaging',
    summary: 'Distributive determiners and predeterminers package quantity and scope precisely before noun phrases.',
    rules: [
      rule('distributive_determiners', 'Distributive determiners', 'Each and every distribute reference across members of a set but differ in emphasis and grammar.', 'Each applicant received individual feedback.'),
      rule('predeterminers', 'Predeterminers', 'All, both, and half occur before central determiners to package quantity.', 'Both the proposals require further work.'),
    ],
    questions: [
      mc('distributive_determiners', '___ of the two options has advantages.', 'Each', ['Every of', 'All each', 'Both each']),
      mc('predeterminers', '___ the available evidence supports the conclusion.', 'All', ['Every of', 'Each all', 'Both every']),
      mc('distributive_determiners', '___ participant must sign separately.', 'Every', ['Every of', 'All each', 'Both a']),
      mc('predeterminers', '___ my colleagues agreed with the proposal.', 'Both', ['Every my', 'Each my', 'All both']),
    ],
    fixes: [
      typed('distributive_determiners', 'Every of the answers was plausible.', 'Correct the distributive phrase.', 'Each of the answers was plausible.', 'Each can be followed by of plus a definite plural noun phrase.'),
      typed('predeterminers', 'Both the two reports were incomplete.', 'Avoid the doubled determiner.', 'Both reports were incomplete.', 'Both already identifies the two reports, so the extra the two is unnecessary.'),
      typed('distributive_determiners', 'Each students received a certificate.', 'Correct the determiner and noun number.', 'Each student received a certificate.', 'Each takes a singular count noun.'),
    ],
    blanks: [
      typed('distributive_determiners', '', '___ of the machines requires maintenance.', 'Each', 'Each of introduces individual members of a definite set.'),
      typed('predeterminers', '', '___ half the budget was spent on training.', 'Nearly', 'Nearly can modify the predeterminer phrase half the budget.'),
      typed('distributive_determiners', '', '___ candidate has a different task.', 'Every', 'Every distributes the task across all candidates.'),
    ],
    orders: [
      typed('predeterminers', '', '', 'Both the proposed solutions have limitations.', 'Both precedes the central determiner the.', ['Both', 'the', 'proposed', 'solutions', 'have', 'limitations.']),
      typed('distributive_determiners', '', '', 'Each of the teams submitted a report.', 'Each of takes a definite plural noun phrase.', ['Each', 'of', 'the', 'teams', 'submitted', 'a', 'report.']),
    ],
  }),
  makeLevel({
    number: 19,
    title: 'Focus and Prosody in Writing',
    summary: 'Fronting and focus particles highlight contrast or priority while preserving the intended information structure.',
    rules: [
      rule('focus_fronting', 'Focus fronting', 'Fronting moves a marked phrase to the beginning to give it contrastive or emphatic focus.', 'This point I cannot accept.'),
      rule('focus_particle', 'Focus particles', 'Only, even, and also change which part of a sentence receives focus.', 'Only the director can approve the change.'),
    ],
    questions: [
      mc('focus_fronting', '___ the final paragraph, I found unclear.', 'The final paragraph', ['It was the final paragraph', 'The final paragraph it', 'Final paragraph was']),
      mc('focus_particle', '___ Maria understood the technical detail.', 'Only', ['Only that', 'Even only that', 'The only did']),
      mc('focus_fronting', '___ did the committee reject.', 'The proposal', ['The proposal it', 'It the proposal', 'Proposal was it']),
      mc('focus_particle', 'The change will affect ___ the budget.', 'even', ['even it', 'the even', 'it even that']),
    ],
    fixes: [
      typed('focus_fronting', 'This conclusion I do not agree with it.', 'Remove the repeated object after fronting.', 'This conclusion I do not agree with.', 'The fronted phrase is already the object of the prepositional verb.'),
      typed('focus_particle', 'Only the manager can approve not the assistant.', 'Place only before its focus.', 'Only the manager, not the assistant, can approve it.', 'Only should immediately precede the focused noun phrase.'),
      typed('focus_fronting', 'The results were surprising, these I had not expected.', 'Use a clear focused structure.', 'The results, I had not expected.', 'A fronted object can be separated by a comma without a repeated pronoun.'),
    ],
    blanks: [
      typed('focus_fronting', '', '___ the timing, I question.', 'The timing', 'The fronted object is the focus of question.'),
      typed('focus_particle', '', '___ the director received a copy.', 'Only', 'Only focuses the director as the sole recipient.'),
      typed('focus_particle', '', 'She invited ___ John to the discussion.', 'even', 'Even adds emphasis to the unexpected participant.'),
    ],
    orders: [
      typed('focus_fronting', '', '', 'This recommendation I cannot support.', 'The fronted object receives contrastive focus.', ['This', 'recommendation', 'I', 'cannot', 'support.']),
      typed('focus_particle', '', '', 'Only experienced staff may operate the system.', 'Only directly focuses experienced staff.', ['Only', 'experienced', 'staff', 'may', 'operate', 'the', 'system.']),
    ],
  }),
  makeLevel({
    number: 20,
    title: 'Clefts and Pseudo-clefts',
    summary: 'Cleft constructions divide information into a focused element and a clause to manage contrast and emphasis.',
    rules: [
      rule('pseudo_cleft', 'Pseudo-clefts', 'A what-clause pseudo-cleft presents an event or thing first and identifies it after be.', 'What we need is a clearer plan.'),
      rule('reversed_cleft', 'Reversed clefts', 'A reversed pseudo-cleft places the focused noun phrase before the identifying what-clause.', 'A clearer plan is what we need.'),
    ],
    questions: [
      mc('pseudo_cleft', 'What the team needs ___ more time.', 'is', ['are it', 'be to', 'is it']),
      mc('reversed_cleft', 'A clearer explanation is ___ the readers need.', 'what', ['that what', 'which it', 'what that']),
      mc('pseudo_cleft', 'What surprised me ___ the speed of the response.', 'was', ['were it', 'was it that', 'be']),
      mc('reversed_cleft', 'The main issue is ___ the data are incomplete.', 'that', ['what that', 'which what', 'that what']),
    ],
    fixes: [
      typed('pseudo_cleft', 'What we need are a reliable method.', 'Make the pseudo-cleft agree.', 'What we need is a reliable method.', 'The focused singular noun phrase controls agreement with is.'),
      typed('reversed_cleft', 'A reliable method is what do we need.', 'Correct the identifying clause.', 'A reliable method is what we need.', 'The what-clause uses statement order, not question order.'),
      typed('pseudo_cleft', 'What mattered most it was the evidence.', 'Remove the extra subject.', 'What mattered most was the evidence.', 'The what-clause is already the subject of the cleft.'),
    ],
    blanks: [
      typed('pseudo_cleft', '', 'What matters is ___ the process is transparent.', 'that', 'That introduces the focused complement clause.'),
      typed('reversed_cleft', '', 'A fair procedure is ___ everyone expects.', 'what', 'What introduces the clause identifying the focused noun phrase.'),
      typed('pseudo_cleft', '', 'What the audit revealed ___ several omissions.', 'were', 'The plural focused noun phrase several omissions controls were.'),
    ],
    orders: [
      typed('pseudo_cleft', '', '', 'What we need is a practical solution.', 'The what-clause presents the information being identified.', ['What', 'we', 'need', 'is', 'a', 'practical', 'solution.']),
      typed('reversed_cleft', '', '', 'A practical solution is what the team needs.', 'The focused noun phrase precedes its identifying what-clause.', ['A', 'practical', 'solution', 'is', 'what', 'the', 'team', 'needs.']),
    ],
  }),
];
