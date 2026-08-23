/** Advanced track content cluster for levels a01–a10. */

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
  const questions: QuestionInput[] = spec.questions.map(
    ([rule, prompt, answer, distractors], index) => {
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
    },
  );
  const addFix = (item: TypedSpec, index: number) =>
    questions.push({
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
  const addBlank = (item: TypedSpec, index: number) =>
    questions.push({
      id: `${id}q${String(index).padStart(2, '0')}`,
      levelId: id,
      rule: item.rule,
      type: 'fill_blank',
      prompt: item.prompt,
      correctAnswer: item.answer,
      acceptedAnswers: [item.answer],
      explanation: item.explanation,
    });
  const addOrder = (item: TypedSpec, index: number) =>
    questions.push({
      id: `${id}q${String(index).padStart(2, '0')}`,
      levelId: id,
      rule: item.rule,
      type: 'word_order',
      sentenceWords: item.words ?? [],
      prompt: 'Arrange the words to make a correct sentence.',
      explanation: item.explanation,
    });

  spec.fixes.forEach((item, index) => addFix(item, index + 6));
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

export const advancedCluster01: LevelInput[] = [
  makeLevel({
    number: 1,
    title: 'Advanced Tense Aspect',
    summary: 'Aspect choices distinguish completed, ongoing, repeated, and temporary states in nuanced contexts.',
    rules: [
      rule('aspectual_choice', 'Aspectual choice', 'Choose simple, continuous, or perfect aspect according to the time span and viewpoint.', 'She has been researching the issue for months.'),
      rule('stative_dynamic_shift', 'Stative and dynamic shifts', 'Some normally stative verbs take a continuous form when they describe a temporary or active experience.', 'I am thinking about your proposal.'),
    ],
    questions: [
      mc('aspectual_choice', 'By next June, she ___ on the project for a year.', 'will have been working', ['works', 'worked', 'is working']),
      mc('stative_dynamic_shift', 'I ___ what you mean now.', 'am beginning to understand', ['begin understand', 'understood', 'have understand']),
      mc('aspectual_choice', 'The researchers ___ three trials so far.', 'have completed', ['complete', 'were completing', 'had complete']),
      mc('stative_dynamic_shift', 'She ___ unusually quiet today.', 'is being', ['is', 'be', 'has been be']),
      mc('aspectual_choice', 'He ___ the same route every morning this week.', 'has been taking', ['takes yesterday', 'is take', 'had took']),
    ],
    fixes: [
      typed('aspectual_choice', 'She works here since 2020.', 'Correct the aspect.', 'She has worked here since 2020.', 'Since connects a past starting point with a state continuing to the present.'),
      typed('stative_dynamic_shift', 'I am knowing the answer now.', 'Correct the stative verb.', 'I know the answer now.', 'Know normally describes a state and does not need the continuous form.'),
    ],
    blanks: [
      typed('aspectual_choice', '', 'The team ___ (review) the evidence all afternoon.', 'has been reviewing', 'The continuous perfect presents an activity continuing over a period up to now.'),
      typed('stative_dynamic_shift', '', 'I ___ (think) about changing the design.', 'am thinking', 'Think takes the continuous form when it means considering something.'),
      typed('aspectual_choice', '', 'They ___ (already / solve) the main problem.', 'have already solved', 'The present perfect presents a completed result with present relevance.'),
    ],
    orders: [
      typed('aspectual_choice', '', '', 'She has been studying the data carefully.', 'The perfect continuous combines duration with a present viewpoint.', ['She', 'has', 'been', 'studying', 'the', 'data', 'carefully.']),
      typed('stative_dynamic_shift', '', '', 'I am considering your suggestion.', 'Consider takes the continuous form here because it describes an active process.', ['I', 'am', 'considering', 'your', 'suggestion.']),
    ],
  }),
  makeLevel({
    number: 2,
    title: 'Complex Narrative Time',
    summary: 'Narrative time is anchored with past perfect forms and controlled shifts into the historical present.',
    rules: [
      rule('past_time_anchoring', 'Past-time anchoring', 'Use past perfect to mark an event as earlier than another past reference point.', 'By noon, the guests had already left.'),
      rule('historical_present', 'Historical present', 'The present tense can make a past narrative vivid, especially in summaries and storytelling.', 'In 1969, the mission reaches the moon.'),
    ],
    questions: [
      mc('past_time_anchoring', 'When the ambulance arrived, the patient ___ consciousness.', 'had regained', ['regains', 'has regain', 'was regain']),
      mc('historical_present', 'In the final scene, the detective ___ the hidden letter.', 'finds', ['found yesterday', 'had find', 'is found']),
      mc('past_time_anchoring', 'She realised that she ___ the wrong file.', 'had opened', ['opens', 'has opening', 'was open']),
      mc('historical_present', 'The article then ___ how the policy changes society.', 'shows', ['showed had', 'is show', 'has showing']),
      mc('past_time_anchoring', 'They ___ the venue before the storm began.', 'had inspected', ['inspect', 'are inspect', 'have inspecting']),
    ],
    fixes: [
      typed('past_time_anchoring', 'He discovered that the train already left.', 'Correct the earlier past action.', 'He discovered that the train had already left.', 'Past perfect anchors the train departure before the discovery.'),
      typed('historical_present', 'The biography describes how the leader resigned and then escaped.', 'Use a consistent historical present.', 'The biography describes how the leader resigns and then escapes.', 'The historical present keeps the narrated sequence in the present tense.'),
    ],
    blanks: [
      typed('past_time_anchoring', '', 'By the time we arrived, the film ___ (start).', 'had started', 'Had started marks the earlier event in a past sequence.'),
      typed('historical_present', '', 'The story opens in Paris and ___ (move) to Rome.', 'moves', 'The historical present is used for a vivid plot summary.'),
      typed('past_time_anchoring', '', 'She was tired because she ___ (not sleep).', 'had not slept', 'The past perfect explains the cause before the past state.'),
    ],
    orders: [
      typed('past_time_anchoring', '', '', 'The meeting had ended before I arrived.', 'The past perfect event precedes the simple past reference point.', ['The', 'meeting', 'had', 'ended', 'before', 'I', 'arrived.']),
      typed('historical_present', '', '', 'The hero enters and sees the empty room.', 'The historical present presents consecutive narrative events vividly.', ['The', 'hero', 'enters', 'and', 'sees', 'the', 'empty', 'room.']),
    ],
  }),
  makeLevel({
    number: 3,
    title: 'Advanced Future Meaning',
    summary: 'Future forms express evidence-based prediction, intention, schedules, and arrangements from different viewpoints.',
    rules: [
      rule('future_as_prediction', 'Future prediction', 'Will, be going to, and present forms express different kinds of prediction and evidence.', 'Look at those clouds: it is going to rain.'),
      rule('future_as_arrangement', 'Future arrangements', 'The present continuous presents a definite personal arrangement in the future.', 'We are meeting the architect on Friday.'),
    ],
    questions: [
      mc('future_as_prediction', 'The forecast says temperatures ___ overnight.', 'will fall', ['falling will', 'are fell', 'have fall']),
      mc('future_as_arrangement', 'We ___ the board at ten tomorrow.', 'are meeting', ['meet are', 'will meeting', 'have met']),
      mc('future_as_prediction', 'Look out! You ___ that glass.', 'are going to drop', ['drop going', 'will dropped', 'are drop']),
      mc('future_as_arrangement', 'She ___ her dentist next Tuesday.', 'is seeing', ['sees is', 'will seeing', 'has see']),
      mc('future_as_prediction', 'I think the plan ___ succeed.', 'will', ['is going', 'does to', 'has']),
    ],
    fixes: [
      typed('future_as_prediction', 'Look at the ice; it will fall through.', 'Use an evidence-based prediction.', 'Look at the ice; it is going to fall through.', 'Be going to suits a prediction based on present evidence.'),
      typed('future_as_arrangement', 'They will meeting the client at noon.', 'Correct the arrangement.', 'They are meeting the client at noon.', 'The present continuous marks a fixed future arrangement.'),
    ],
    blanks: [
      typed('future_as_prediction', '', 'I am sure she ___ (pass) the exam.', 'will pass', 'Will expresses a confident prediction or personal belief.'),
      typed('future_as_arrangement', '', 'We ___ (fly) to Madrid next weekend.', 'are flying', 'The present continuous marks a planned arrangement.'),
      typed('future_as_prediction', '', 'That ladder is unstable; it ___ (collapse).', 'is going to collapse', 'Present evidence supports be going to.'),
    ],
    orders: [
      typed('future_as_arrangement', '', '', 'We are presenting the findings tomorrow.', 'The present continuous expresses the scheduled personal arrangement.', ['We', 'are', 'presenting', 'the', 'findings', 'tomorrow.']),
      typed('future_as_prediction', '', '', 'The evidence suggests that prices will rise.', 'Will follows a prediction based on an expressed judgement.', ['The', 'evidence', 'suggests', 'that', 'prices', 'will', 'rise.']),
    ],
  }),
  makeLevel({
    number: 4,
    title: 'Conditional Inversion',
    summary: 'Formal conditional inversion removes if and places were, had, or should before the subject.',
    rules: [
      rule('conditional_inversion', 'Conditional inversion', 'Formal conditionals can invert had, were, or should before the subject without if.', 'Had I known, I would have called.'),
      rule('implied_condition', 'Implied condition', 'A condition can remain implicit when the surrounding context makes the hypothetical meaning clear.', 'With more time, we could improve the design.'),
    ],
    questions: [
      mc('conditional_inversion', '___ the risks been explained, we would have waited.', 'Had', ['Have', 'Would', 'Did']),
      mc('conditional_inversion', '___ you require assistance, contact reception.', 'Should', ['Would', 'Had', 'Did']),
      mc('implied_condition', 'With a larger budget, the team ___ expand the trial.', 'could', ['will have', 'has to', 'did']),
      mc('conditional_inversion', '___ I in your position, I would reconsider.', 'Were', ['Was', 'Had', 'Would']),
      mc('implied_condition', 'The project might succeed, given ___ support.', 'adequate', ['adequately was', 'is adequate to', 'had adequate']),
    ],
    fixes: [
      typed('conditional_inversion', 'Had I knew the deadline, I would have acted.', 'Correct the inverted conditional.', 'Had I known the deadline, I would have acted.', 'Had is followed by the past participle in a formal third conditional.'),
      typed('implied_condition', 'With more staff, we will could finish sooner.', 'Correct the implied condition.', 'With more staff, we could finish sooner.', 'Could expresses the hypothetical result without an explicit if-clause.'),
    ],
    blanks: [
      typed('conditional_inversion', '', '___ the weather improve, the event will continue.', 'Should', 'Should-inversion introduces a formal possible condition.'),
      typed('implied_condition', '', 'Without your advice, I ___ have made a serious mistake.', 'might', 'Might expresses a hypothetical result of the implied condition.'),
      typed('conditional_inversion', '', '___ she been informed, she would have objected.', 'Had', 'Had plus the past participle inverts a third conditional.'),
    ],
    orders: [
      typed('conditional_inversion', '', '', 'Had we known, we would have stayed.', 'Had-inversion replaces if we had known in formal writing.', ['Had', 'we', 'known,', 'we', 'would', 'have', 'stayed.']),
      typed('implied_condition', '', '', 'With more evidence, the claim could be stronger.', 'The prepositional phrase implies the condition for the result.', ['With', 'more', 'evidence,', 'the', 'claim', 'could', 'be', 'stronger.']),
    ],
  }),
  makeLevel({
    number: 5,
    title: 'Advanced Mixed Conditionals',
    summary: 'Mixed conditionals connect an unreal past cause with a present result, or a present state with a past result.',
    rules: [
      rule('remote_past_present_result', 'Past condition, present result', 'Use past perfect in the if-clause and would plus a base verb for a present result.', 'If I had taken the job, I would live abroad now.'),
      rule('remote_present_past_result', 'Present condition, past result', 'Use past simple or were in the if-clause and would have plus a participle for a past result.', 'If she were more careful, she would not have made that error.'),
    ],
    questions: [
      mc('remote_past_present_result', 'If he had accepted the offer, he ___ in London now.', 'would live', ['would have lived', 'lives would', 'will live']),
      mc('remote_present_past_result', 'If I were more organised, I ___ the deadline yesterday.', 'would not have missed', ['will not miss', 'would not miss', 'did not miss']),
      mc('remote_past_present_result', 'If they had invested earlier, they ___ richer today.', 'would be', ['would have been', 'are would', 'will be']),
      mc('remote_present_past_result', 'If she knew the system, she ___ that mistake.', 'would not have made', ['does not make', 'will not make', 'would not make']),
      mc('remote_past_present_result', 'If we had chosen the train, we ___ at home by now.', 'would be', ['would have been', 'are', 'will be']),
    ],
    fixes: [
      typed('remote_past_present_result', 'If I had studied medicine, I would have work in a hospital now.', 'Correct the present result.', 'If I had studied medicine, I would work in a hospital now.', 'The present result uses would plus the base verb, not would have.'),
      typed('remote_present_past_result', 'If he were more patient, he would not lose his temper yesterday.', 'Correct the past result.', 'If he were more patient, he would not have lost his temper yesterday.', 'A past result uses would have plus the past participle.'),
    ],
    blanks: [
      typed('remote_past_present_result', '', 'If she had moved abroad, she ___ (speak) another language now.', 'would speak', 'The past condition has a present result.'),
      typed('remote_present_past_result', '', 'If I were braver, I ___ (apply) for that role last year.', 'would have applied', 'The present hypothetical state explains a past result.'),
      typed('remote_past_present_result', '', 'If we had saved more, we ___ (not worry) about money now.', 'would not be worrying', 'The present continuous result describes the current consequence.'),
    ],
    orders: [
      typed('remote_past_present_result', '', '', 'If I had left earlier, I would be there now.', 'The past perfect condition has a present would-result.', ['If', 'I', 'had', 'left', 'earlier,', 'I', 'would', 'be', 'there', 'now.']),
      typed('remote_present_past_result', '', '', 'If she were prepared, she would have succeeded.', 'The present state has a past perfect result.', ['If', 'she', 'were', 'prepared,', 'she', 'would', 'have', 'succeeded.']),
    ],
  }),
  makeLevel({
    number: 6,
    title: 'Subjunctive and Mandative Forms',
    summary: 'Formal recommendations and demands use the mandative subjunctive and established formulaic expressions.',
    rules: [
      rule('mandative_subjunctive', 'Mandative subjunctive', 'After verbs and adjectives of demand or importance, formal English can use the base form for all subjects.', 'The committee recommended that he attend.'),
      rule('formulaic_subjunctive', 'Formulaic subjunctive', 'Fixed phrases preserve subjunctive forms such as be in wishes, demands, and formal expressions.', 'Long live the republic.'),
    ],
    questions: [
      mc('mandative_subjunctive', 'They insisted that she ___ present.', 'be', ['is', 'was', 'being']),
      mc('mandative_subjunctive', 'It is vital that every member ___ informed.', 'remain', ['remains', 'remained', 'remaining']),
      mc('formulaic_subjunctive', '___ it be noted that the figures are provisional.', 'Let', ['Lets', 'Letting', 'Let to']),
      mc('mandative_subjunctive', 'The doctor recommended that he ___ smoking.', 'stop', ['stops', 'stopped', 'stopping']),
      mc('formulaic_subjunctive', 'The formal phrase is “___ peace prevail.”', 'May', ['Mays', 'May to', 'Might to']),
    ],
    fixes: [
      typed('mandative_subjunctive', 'The panel demanded that the report is revised.', 'Use a formal mandative form.', 'The panel demanded that the report be revised.', 'The mandative subjunctive uses be after a demand.'),
      typed('formulaic_subjunctive', 'Long lives the king.', 'Correct the formulaic expression.', 'Long live the king.', 'Formulaic subjunctive expressions use the base form live.'),
    ],
    blanks: [
      typed('mandative_subjunctive', '', 'It is essential that she ___ (remain) calm.', 'remain', 'The base form follows an adjective of importance in formal English.'),
      typed('mandative_subjunctive', '', 'They proposed that the rule ___ (change).', 'be changed', 'The passive mandative subjunctive uses be plus a past participle.'),
      typed('formulaic_subjunctive', '', 'Heaven ___ (help) us.', 'help', 'This fixed expression uses the base form after the subject.'),
    ],
    orders: [
      typed('mandative_subjunctive', '', '', 'The chair insisted that everyone be consulted.', 'Insist can introduce a formal mandative subjunctive clause.', ['The', 'chair', 'insisted', 'that', 'everyone', 'be', 'consulted.']),
      typed('formulaic_subjunctive', '', '', 'May the best team win.', 'May introduces a formal wish or blessing.', ['May', 'the', 'best', 'team', 'win.']),
    ],
  }),
  makeLevel({
    number: 7,
    title: 'Advanced Passive and Get-Passive',
    summary: 'Passive choices foreground events and participants, while get-passives often highlight change or involvement.',
    rules: [
      rule('get_passive', 'Get-passive constructions', 'Get-passives often describe a change of state or an event affecting the subject in less formal styles.', 'He got promoted last year.'),
      rule('passive_reporting_structure', 'Passive reporting structures', 'It is believed and he is believed to report information while keeping the source impersonal.', 'She is believed to have left.'),
    ],
    questions: [
      mc('get_passive', 'The old bridge ___ damaged in the storm.', 'got', ['did get be', 'was get', 'has getting']),
      mc('passive_reporting_structure', 'The witness is believed ___ abroad.', 'to be living', ['be live', 'living to', 'to living']),
      mc('get_passive', 'Try not to ___ caught in the traffic.', 'get', ['be get', 'getting to', 'got']),
      mc('passive_reporting_structure', 'The results are expected ___ tomorrow.', 'to be published', ['be publishing', 'publishing to', 'to publish be']),
      mc('get_passive', 'She ___ promoted after leading the team.', 'got', ['did got be', 'was get', 'getting']),
    ],
    fixes: [
      typed('get_passive', 'He got fire for missing the deadline.', 'Correct the get-passive.', 'He got fired for missing the deadline.', 'The get-passive needs the past participle fired.'),
      typed('passive_reporting_structure', 'She is believed to left the country.', 'Correct the reporting structure.', 'She is believed to have left the country.', 'A prior event after a reporting verb uses to have plus a participle.'),
    ],
    blanks: [
      typed('get_passive', '', 'The players ___ (get / exhaust) during the final.', 'got exhausted', 'Get plus the past participle presents a change of state.'),
      typed('passive_reporting_structure', '', 'The company is thought ___ (develop) a new process.', 'to be developing', 'To be developing reports an action believed to be in progress.'),
      typed('passive_reporting_structure', '', 'The artefact is known ___ (date) from the sixth century.', 'to date', 'The simple infinitive follows a present reporting claim.'),
    ],
    orders: [
      typed('get_passive', '', '', 'She got injured during the match.', 'The get-passive highlights the event affecting the subject.', ['She', 'got', 'injured', 'during', 'the', 'match.']),
      typed('passive_reporting_structure', '', '', 'He is believed to have escaped safely.', 'The perfect infinitive places the escape before the reporting viewpoint.', ['He', 'is', 'believed', 'to', 'have', 'escaped', 'safely.']),
    ],
  }),
  makeLevel({
    number: 8,
    title: 'Passive with Two Objects',
    summary: 'Verbs with two objects allow alternative passive structures, including personal and prepositional passives.',
    rules: [
      rule('double_object_passive', 'Double-object passives', 'With verbs such as give and send, either object can become the passive subject when the result is clear.', 'She was given a second chance.'),
      rule('prepositional_passive', 'Prepositional passives', 'The object of a preposition can become the subject while the preposition remains at the end.', 'This is the topic I was referring to.'),
    ],
    questions: [
      mc('double_object_passive', 'The students ___ extra time.', 'were given', ['gave were', 'were giving to', 'given were']),
      mc('prepositional_passive', 'The issue was ___ by the committee.', 'dealt with', ['dealt', 'dealing with', 'with dealt']),
      mc('double_object_passive', 'A detailed explanation ___ to the visitors.', 'was given', ['gave was', 'was giving', 'given had']),
      mc('prepositional_passive', 'That is the principle on which the system ___.', 'is based', ['bases on', 'is basing', 'based is']),
      mc('double_object_passive', 'The client ___ a full refund.', 'was sent', ['sent was to', 'was sending', 'send was']),
    ],
    fixes: [
      typed('double_object_passive', 'The assistant was explained the procedure.', 'Choose a grammatical passive.', 'The procedure was explained to the assistant.', 'Explain does not allow the person to become the direct passive subject.'),
      typed('prepositional_passive', 'This is the problem which we are dealing.', 'Keep the preposition in the passive.', 'This is the problem which we are dealing with.', 'The preposition remains after the verb in a prepositional passive.'),
    ],
    blanks: [
      typed('double_object_passive', '', 'The winner ___ (offer) a scholarship.', 'was offered', 'The recipient can become the subject of a passive offer.'),
      typed('prepositional_passive', '', 'The proposal was strongly ___ (object) by residents.', 'objected to', 'Object to keeps its preposition in the passive.'),
      typed('double_object_passive', '', 'A copy of the report ___ (send) to every member.', 'was sent', 'The thing transferred becomes the passive subject.'),
    ],
    orders: [
      typed('double_object_passive', '', '', 'She was offered a permanent position.', 'The indirect object becomes the passive subject with offer.', ['She', 'was', 'offered', 'a', 'permanent', 'position.']),
      typed('prepositional_passive', '', '', 'The matter was referred to the director.', 'The preposition stays with the passive verb.', ['The', 'matter', 'was', 'referred', 'to', 'the', 'director.']),
    ],
  }),
  makeLevel({
    number: 9,
    title: 'Advanced Reported Discourse',
    summary: 'Reported discourse balances optional backshift with the speaker’s current viewpoint and preserves modal meaning.',
    rules: [
      rule('backshift_optional', 'Optional backshift', 'Backshift is often optional when a reported fact remains current or generally true.', 'The lecturer said that water boils at 100°C.'),
      rule('reported_modality', 'Reported modality', 'Reported speech preserves the strength and time reference of modal meanings.', 'She said she might return later.'),
    ],
    questions: [
      mc('backshift_optional', 'The guide said that the museum ___ at nine.', 'opens', ['open did', 'has open', 'opening']),
      mc('reported_modality', 'He said he ___ be late.', 'might', ['must to', 'can to', 'will have']),
      mc('backshift_optional', 'She explained that the machine ___ correctly.', 'was working', ['working was', 'has work', 'is work']),
      mc('reported_modality', 'They warned us that the road ___ be closed.', 'could', ['could to', 'can have', 'would to']),
      mc('backshift_optional', 'The professor said that light ___ faster than sound.', 'travels', ['travelled had', 'is travel', 'has travelled']),
    ],
    fixes: [
      typed('backshift_optional', 'The scientist said that water boiled at 100°C and it still does.', 'Use an appropriate current fact.', 'The scientist said that water boils at 100°C and it still does.', 'A general truth can remain in the present after a past reporting verb.'),
      typed('reported_modality', 'She said she might to return later.', 'Correct the reported modal.', 'She said she might return later.', 'A modal is followed directly by the base verb.'),
    ],
    blanks: [
      typed('backshift_optional', '', 'He said that he ___ (need) more time.', 'needed', 'Backshift places a past report of a current need in the past tense.'),
      typed('reported_modality', '', 'She said that she ___ (may) join us later.', 'might', 'May commonly backshifts to might in reported speech.'),
      typed('backshift_optional', '', 'The manual states that the device ___ (require) two batteries.', 'requires', 'A current instruction can retain the present tense.'),
    ],
    orders: [
      typed('reported_modality', '', '', 'He said that the plan might change.', 'Might reports a possible change without adding to the modal.', ['He', 'said', 'that', 'the', 'plan', 'might', 'change.']),
      typed('backshift_optional', '', '', 'She explained that the rule still applies.', 'The present is retained because the rule remains current.', ['She', 'explained', 'that', 'the', 'rule', 'still', 'applies.']),
    ],
  }),
  makeLevel({
    number: 10,
    title: 'Quotative and Reporting Style',
    summary: 'Reporting verbs and quotative patterns organise direct speech while making the source and stance clear.',
    rules: [
      rule('quotative_inversion', 'Quotative inversion', 'Narrative reporting can place the reporting verb before the subject, especially after a quotation.', '“I agree,” replied Maya.'),
      rule('reporting_source', 'Reporting the source', 'Reporting structures identify whether information comes from a person, document, or less certain source.', 'According to the report, the figures have changed.'),
    ],
    questions: [
      mc('quotative_inversion', '“That is impossible,” ___ the witness.', 'replied', ['the replied', 'replying did', 'was reply']),
      mc('reporting_source', '___ the latest figures, demand has increased.', 'According to', ['According with', 'By according', 'According']),
      mc('quotative_inversion', '“Leave now,” ___ the officer.', 'ordered the officer', ['the officer ordered', 'ordering was the officer', 'was ordered the officer']),
      mc('reporting_source', 'The report ___ that the policy had failed.', 'suggests', ['suggest to', 'is suggest', 'suggesting has']),
      mc('quotative_inversion', '“I have finished,” ___ Noor.', 'said', ['said Noor did', 'was say', 'saying has']),
    ],
    fixes: [
      typed('quotative_inversion', '“I am ready,” said did the candidate.', 'Correct the quotative clause.', '“I am ready,” said the candidate.', 'Quotative inversion places the reporting verb before the subject without did.'),
      typed('reporting_source', 'According the report, the figures are stable.', 'Complete the source phrase.', 'According to the report, the figures are stable.', 'According to introduces the source of information.'),
    ],
    blanks: [
      typed('quotative_inversion', '', '“We object,” ___ (say) the residents.', 'said', 'Said can follow a quotation before the reporting subject.'),
      typed('reporting_source', '', 'The survey ___ (indicate) a change in public opinion.', 'indicates', 'A reporting verb presents what the survey communicates.'),
      typed('reporting_source', '', '___ (base) on the evidence, the claim is plausible.', 'Based', 'Based on introduces the evidence supporting a conclusion.'),
    ],
    orders: [
      typed('quotative_inversion', '', '', '“We agree,” replied the delegates.', 'The reporting verb is inverted after the direct quotation.', ['“We', 'agree,”', 'replied', 'the', 'delegates.']),
      typed('reporting_source', '', '', 'According to the study, the effect is temporary.', 'According to identifies the documentary source.', ['According', 'to', 'the', 'study,', 'the', 'effect', 'is', 'temporary.']),
    ],
  }),
];
