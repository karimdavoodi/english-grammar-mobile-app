/** Basic track content cluster for levels b22–b30. */

import type { LevelInput, QuestionInput, TopicRule } from '../../types';

type McSpec = [rule: string, prompt: string, choices: string[], correctIndex: number];

function makeLevel(
  number: number,
  title: string,
  summary: string,
  rules: TopicRule[],
  specs: McSpec[],
  typedRule: string,
  faultySentence: string,
  typedPrompt: string,
  correctAnswer: string,
  words: string[],
  explanation: string,
): LevelInput {
  const id = `b${String(number).padStart(2, '0')}`;
  const questions: QuestionInput[] = specs.map(([rule, prompt, choices, correctIndex], index) => ({
    id: `${id}q${String(index + 1).padStart(2, '0')}`,
    levelId: id,
    rule,
    prompt,
    choices,
    correctIndex,
    choiceExplanations: choices.map((choice, choiceIndex) =>
      choiceIndex === correctIndex
        ? `“${choice}” is correct in this sentence.`
        : `“${choice}” does not fit the grammar rule being tested here.`,
    ),
  }));

  questions.push(
    {
      id: `${id}q10`, levelId: id, rule: typedRule, type: 'fix_sentence', faultySentence,
      prompt: typedPrompt, choices: [correctAnswer, 'is not correct', 'another form', 'a different form'], correctIndex: 0,
      choiceExplanations: [
        `“${correctAnswer}” corrects the faulty sentence.`,
        'This does not repair the sentence.',
        'This form does not fit the sentence.',
        'This form does not express the intended meaning.',
      ],
    },
    { id: `${id}q11`, levelId: id, rule: typedRule, type: 'fill_blank', prompt: typedPrompt, correctAnswer, acceptedAnswers: [correctAnswer], explanation },
    { id: `${id}q12`, levelId: id, rule: typedRule, type: 'word_order', sentenceWords: words, prompt: 'Arrange the words to make a correct sentence.', explanation },
  );

  return { id, trackId: 'basic', number, title, topic: { title, summary, rules }, questions };
}

export const basicCluster04: LevelInput[] = [
  makeLevel(22, 'Reported Speech: Statements', 'Reported speech tells us what someone said without repeating the exact words. Pronouns and time expressions may change.', [
    { rule: 'reported_statements_backshift', title: 'Backshift in reported statements', explanation: 'After a past reporting verb, present forms commonly move one step back: am becomes was, and will becomes would.', example: 'She said that she was tired.' },
    { rule: 'reported_pronouns_time', title: 'Pronouns and time in reported speech', explanation: 'Change pronouns and time expressions when the context requires it: today may become that day and tomorrow may become the next day.', example: 'He said, “I will come tomorrow.” → He said he would come the next day.' },
  ], [
    ['reported_statements_backshift', 'She said that she ___ tired.', ['is', 'was', 'were', 'be'], 1],
    ['reported_statements_backshift', 'Tom said he ___ finished the work.', ['has', 'had', 'have', 'having'], 1],
    ['reported_pronouns_time', 'Maya said, “I will call you tomorrow.” She said she would call me ___.', ['today', 'yesterday', 'the next day', 'last week'], 2],
    ['reported_pronouns_time', '“I am busy today.” → He said that he was busy ___.', ['tomorrow', 'that day', 'next year', 'last night'], 1],
    ['reported_statements_backshift', 'They said they ___ the film the night before.', ['see', 'have seen', 'had seen', 'are seeing'], 2],
    ['reported_statements_backshift', '“I can help.” → She said that she ___ help.', ['can', 'could', 'will', 'has'], 1],
    ['reported_pronouns_time', 'Ben said, “This is my bag.” → Ben said it was ___ bag.', ['your', 'their', 'his', 'our'], 2],
    ['reported_statements_backshift', 'He said he ___ arrive later.', ['would', 'will', 'is', 'has'], 0],
    ['reported_pronouns_time', '“We are leaving now.” → They said they were leaving ___.', ['then', 'tomorrow', 'last week', 'there'], 0],
  ], 'reported_statements_backshift', 'She said that she is tired.', 'She said that she ___ tired.', 'was', ['She', 'said', 'that', 'she', 'was', 'tired.'], 'After said, was is the usual backshifted form of am.'),
  makeLevel(23, 'Relative Clauses: Defining', 'Defining relative clauses identify the person or thing we mean. Use who for people and which or that for things.', [
    { rule: 'defining_relative_who_which', title: 'Who, which, and that', explanation: 'Use who for people and which for things. That can often be used for either in a defining relative clause.', example: 'The woman who lives next door has a dog.' },
    { rule: 'relative_pronoun_omission', title: 'Omitting the object pronoun', explanation: 'The object relative pronoun can be omitted, but the subject relative pronoun cannot.', example: 'The book (that) I bought is excellent.' },
  ], [
    ['defining_relative_who_which', 'The teacher ___ helped me was kind.', ['which', 'who', 'where', 'when'], 1],
    ['defining_relative_who_which', 'This is the phone ___ I bought yesterday.', ['who', 'where', 'which', 'when'], 2],
    ['defining_relative_who_which', 'The café ___ sells fresh bread is nearby.', ['who', 'which', 'when', 'whose'], 1],
    ['defining_relative_who_which', 'I met a musician ___ plays the violin.', ['which', 'who', 'where', 'what'], 1],
    ['relative_pronoun_omission', 'The film ___ we watched was funny.', ['who', 'where', 'that', 'when'], 2],
    ['relative_pronoun_omission', 'The person ___ I called did not answer.', ['which', 'whose', 'who', 'where'], 2],
    ['defining_relative_who_which', 'That is the house ___ has a red door.', ['who', 'which', 'when', 'whom'], 1],
    ['relative_pronoun_omission', 'The cake ___ she made was delicious.', ['where', 'that', 'who', 'when'], 1],
    ['defining_relative_who_which', 'I need a bag ___ is waterproof.', ['who', 'which', 'where', 'whose'], 1],
  ], 'defining_relative_who_which', 'The woman which lives next door is a doctor.', 'The woman ___ lives next door is a doctor.', 'who', ['The', 'woman', 'who', 'lives', 'next', 'door', 'is', 'a', 'doctor.'], 'Use who for a person that is the subject of the relative clause.'),
  makeLevel(24, 'Present Perfect: Experiences and Results', 'Use the present perfect for experiences without a finished time and for present results of past actions.', [
    { rule: 'present_perfect_experience', title: 'Experiences with ever and never', explanation: 'Use have or has plus a past participle to talk about experiences when the exact time is not important.', example: 'Have you ever visited Canada?' },
    { rule: 'present_perfect_result', title: 'Present results', explanation: 'Use the present perfect when a past action has a result that matters now; use just, already, or yet when appropriate.', example: 'She has just lost her keys.' },
  ], [
    ['present_perfect_experience', 'Have you ever ___ sushi?', ['eat', 'ate', 'eaten', 'eating'], 2],
    ['present_perfect_experience', 'I have never ___ to Japan.', ['be', 'been', 'was', 'being'], 1],
    ['present_perfect_result', 'She has just ___ her keys.', ['lose', 'lost', 'losing', 'loses'], 1],
    ['present_perfect_result', 'We have ___ finished the project.', ['yet', 'already', 'ever', 'never'], 1],
    ['present_perfect_experience', 'He ___ never seen snow.', ['have', 'has', 'is', 'did'], 1],
    ['present_perfect_result', 'Have they arrived ___?', ['already', 'just', 'yet', 'ever'], 2],
    ['present_perfect_experience', 'I ___ visited that museum twice.', ['have', 'has', 'am', 'did'], 0],
    ['present_perfect_result', 'The train has ___ left.', ['yet', 'never', 'just', 'ever'], 2],
    ['present_perfect_experience', 'She has ___ ridden a horse.', ['ever', 'never', 'last', 'yesterday'], 1],
  ], 'present_perfect_experience', 'Have you ever went to Italy?', 'Have you ever ___ to Italy?', 'been', ['Have', 'you', 'ever', 'been', 'to', 'Italy?'], 'Use the past participle been after have in a present-perfect experience question.'),
  makeLevel(25, 'Present Perfect Continuous', 'The present perfect continuous describes an activity that started in the past and continues now or has a visible present result.', [
    { rule: 'present_perfect_continuous_form', title: 'Have or has been + -ing', explanation: 'Form the present perfect continuous with have or has, been, and the -ing form of the main verb.', example: 'They have been waiting for an hour.' },
    { rule: 'present_perfect_simple_duration', title: 'Continuous or simple for duration', explanation: 'Use the continuous for ongoing activities and the present perfect simple for states or completed amounts.', example: 'I have been studying all morning.' },
  ], [
    ['present_perfect_continuous_form', 'She has been ___ since eight o’clock.', ['work', 'worked', 'working', 'works'], 2],
    ['present_perfect_continuous_form', 'They ___ been waiting for an hour.', ['has', 'have', 'are', 'did'], 1],
    ['present_perfect_simple_duration', 'How long ___ you been learning English?', ['has', 'have', 'are', 'did'], 1],
    ['present_perfect_continuous_form', 'I have been ___ all morning.', ['run', 'ran', 'running', 'runs'], 2],
    ['present_perfect_simple_duration', 'He has ___ three emails today.', ['been writing', 'write', 'wrote', 'writes'], 0],
    ['present_perfect_continuous_form', 'It has been ___ since lunch.', ['rain', 'raining', 'rained', 'rains'], 1],
    ['present_perfect_simple_duration', 'We have ___ here for two years.', ['live', 'lived', 'living', 'lives'], 1],
    ['present_perfect_continuous_form', 'Why are your hands dirty? I have been ___.', ['garden', 'gardened', 'gardening', 'gardens'], 2],
    ['present_perfect_simple_duration', 'She has ___ five pages so far.', ['written', 'been writing', 'write', 'wrote'], 0],
  ], 'present_perfect_continuous_form', 'They have been wait for an hour.', 'They have been ___ for an hour.', 'waiting', ['They', 'have', 'been', 'waiting', 'for', 'an', 'hour.'], 'The present perfect continuous uses been followed by the -ing form waiting.'),
  makeLevel(26, 'Second Conditional', 'The second conditional describes unreal, unlikely, or imaginary present or future situations.', [
    { rule: 'second_conditional_form', title: 'If + past, would + base verb', explanation: 'Use the past simple in the if-clause and would plus the base verb in the result clause.', example: 'If I had more time, I would travel.' },
    { rule: 'second_conditional_use', title: 'Imaginary present and future', explanation: 'Use the second conditional for hypothetical situations, not ordinary realistic plans.', example: 'If she were here, she would help us.' },
  ], [
    ['second_conditional_form', 'If I ___ rich, I would buy a house.', ['am', 'was', 'were', 'will be'], 2],
    ['second_conditional_form', 'She would travel if she ___ more money.', ['has', 'had', 'will have', 'would have'], 1],
    ['second_conditional_use', 'If we lived near the sea, we ___ swim every day.', ['will', 'would', 'can', 'are'], 1],
    ['second_conditional_form', 'What would you do if you ___ your job?', ['lose', 'lost', 'will lose', 'would lose'], 1],
    ['second_conditional_use', 'If he were taller, he ___ play basketball.', ['will', 'would', 'is', 'has'], 1],
    ['second_conditional_form', 'I would help you if I ___ the answer.', ['know', 'knew', 'will know', 'would know'], 1],
    ['second_conditional_use', 'If I ___ you, I would apologise.', ['am', 'was', 'were', 'will be'], 2],
    ['second_conditional_form', 'They would move if they ___ afford it.', ['can', 'could', 'will', 'would'], 1],
    ['second_conditional_use', 'If she had a car, she ___ drive to work.', ['will', 'would', 'does', 'is'], 1],
  ], 'second_conditional_form', 'If I will have time, I would help.', 'If I ___ time, I would help.', 'had', ['If', 'I', 'had', 'time,', 'I', 'would', 'help.'], 'The if-clause of the second conditional uses the past form had.'),
  makeLevel(27, 'Modals of Probability', 'May, might, and must express different degrees of certainty about present and past situations.', [
    { rule: 'modal_probability_present', title: 'Present probability', explanation: 'Use may or might for possibility and must when the evidence makes something very likely. Modals take the base verb.', example: 'She might be at home. / He must be tired.' },
    { rule: 'modal_probability_past', title: 'Past probability', explanation: 'Use may have, might have, or must have plus a past participle to make guesses about the past.', example: 'They must have missed the bus.' },
  ], [
    ['modal_probability_present', 'She ___ be at home; the lights are on.', ['must', 'must to', 'has', 'is'], 0],
    ['modal_probability_present', 'It ___ rain later, so take an umbrella.', ['might', 'might to', 'does', 'is'], 0],
    ['modal_probability_present', 'He ___ be tired after that long journey.', ['must', 'musts', 'has', 'does'], 0],
    ['modal_probability_present', 'They ___ be in the office, but I am not sure.', ['may', 'are may', 'have', 'do'], 0],
    ['modal_probability_past', 'She must have ___ the message.', ['forget', 'forgot', 'forgotten', 'forgetting'], 2],
    ['modal_probability_past', 'He might have ___ the wrong train.', ['take', 'took', 'taken', 'taking'], 2],
    ['modal_probability_past', 'They may have ___ already.', ['leave', 'left', 'leaving', 'leaves'], 1],
    ['modal_probability_present', 'The answer ___ be correct, but check it.', ['could', 'could to', 'is could', 'has'], 0],
    ['modal_probability_past', 'You must have ___ very hard.', ['work', 'worked', 'working', 'works'], 1],
  ], 'modal_probability_past', 'They must have went home.', 'They must have ___ home.', 'gone', ['They', 'must', 'have', 'gone', 'home.'], 'After must have, use the past participle gone.'),
  makeLevel(28, 'Linkers and Contrast', 'Linkers show relationships between ideas. Because gives a reason, so gives a result, although introduces contrast, and but joins contrasting clauses.', [
    { rule: 'because_so', title: 'Reasons and results', explanation: 'Use because before a reason and so before a result.', example: 'We stayed home because it rained, so we watched a film.' },
    { rule: 'although_but', title: 'Contrast linkers', explanation: 'Use although at the beginning of a contrasting clause and but to join two contrasting ideas; do not use although and but together.', example: 'Although it was cold, we went out, but we came home early.' },
  ], [
    ['because_so', 'I stayed home ___ I was ill.', ['so', 'because', 'although', 'but'], 1],
    ['because_so', 'It was raining, ___ we took an umbrella.', ['because', 'although', 'so', 'but'], 2],
    ['although_but', '___ she was tired, she finished the work.', ['Because', 'Although', 'So', 'But'], 1],
    ['although_but', 'The task was difficult, ___ we completed it.', ['although', 'because', 'but', 'so'], 2],
    ['because_so', 'He missed the bus, ___ he was late.', ['because', 'so', 'although', 'but'], 1],
    ['because_so', 'We cancelled the picnic because it ___ raining.', ['is', 'was', 'were', 'be'], 1],
    ['although_but', 'Although the room was small, it ___ comfortable.', ['but', 'was', 'because', 'so'], 1],
    ['because_so', 'She studied hard, so she ___ the test.', ['passed', 'because passed', 'although passed', 'but passed'], 0],
    ['although_but', 'I like the shirt, but it ___ too expensive.', ['is', 'because', 'although', 'so'], 0],
  ], 'although_but', 'Although it was cold, but we went out.', 'Although it was cold, ___ went out.', 'we', ['Although', 'it', 'was', 'cold,', 'we', 'went', 'out.'], 'Although already expresses the contrast, so no extra but is needed.'),
  makeLevel(29, 'Phrasal Verbs: Separable Basics', 'Some phrasal verbs have a particle that can move around a noun object. Pronoun objects must go between the verb and particle.', [
    { rule: 'phrasal_verb_particle_position', title: 'Particle position', explanation: 'With many separable phrasal verbs, a noun can come before or after the particle: turn off the light or turn the light off.', example: 'Please turn the radio off.' },
    { rule: 'phrasal_verb_object_type', title: 'Noun and pronoun objects', explanation: 'A pronoun object must come before the particle: turn it off, not turn off it.', example: 'Please pick it up.' },
  ], [
    ['phrasal_verb_particle_position', 'Please ___ the lights off before you leave.', ['turn', 'turn off', 'turning', 'turned'], 0],
    ['phrasal_verb_object_type', 'Please pick ___ up from the floor.', ['it', 'up it', 'it up', 'it to'], 0],
    ['phrasal_verb_particle_position', 'She ___ her coat on when it got cold.', ['put', 'put on', 'putting', 'puts on'], 0],
    ['phrasal_verb_object_type', 'Can you turn ___ off?', ['off it', 'it', 'it to', 'to it'], 1],
    ['phrasal_verb_particle_position', 'He took ___ his shoes at the door.', ['off', 'off his shoes', 'his shoes off', 'both B and C'], 3],
    ['phrasal_verb_particle_position', 'I need to ___ this word up.', ['look', 'look up', 'looking', 'looked'], 0],
    ['phrasal_verb_object_type', 'She picked ___ up carefully.', ['the glass', 'up it', 'it', 'it to'], 2],
    ['phrasal_verb_particle_position', 'Please fill ___ this form.', ['in', 'in out', 'out', 'over'], 0],
    ['phrasal_verb_object_type', 'They put ___ the meeting until Friday.', ['off it', 'it off', 'it to', 'off'], 1],
  ], 'phrasal_verb_object_type', 'Please turn off it.', 'Please turn ___ off.', 'it', ['Please', 'turn', 'it', 'off.'], 'A pronoun object goes between the phrasal verb and its particle.'),
  makeLevel(30, 'Basic Grammar Consolidation', 'This review combines core Basic grammar: tense, agreement, articles, prepositions, conditionals, and question forms.', [
    { rule: 'basic_grammar_consolidation', title: 'Core grammar review', explanation: 'Choose forms that agree with the subject and match the time, meaning, and structure of the sentence.', example: 'She has worked here since June.' },
  ], [
    ['basic_grammar_consolidation', 'She ___ to work every day.', ['go', 'goes', 'going', 'is go'], 1],
    ['basic_grammar_consolidation', 'I ___ dinner when he called.', ['cook', 'was cooking', 'cooked', 'am cooking'], 1],
    ['basic_grammar_consolidation', 'They have lived here ___ 2020.', ['for', 'since', 'at', 'on'], 1],
    ['basic_grammar_consolidation', 'There ___ two books on the table.', ['is', 'are', 'be', 'was'], 1],
    ['basic_grammar_consolidation', 'If it rains, we ___ stay home.', ['would', 'will', 'are', 'did'], 1],
    ['basic_grammar_consolidation', '___ you like some tea?', ['Do', 'Would', 'Are', 'Did'], 1],
    ['basic_grammar_consolidation', 'The letter ___ sent yesterday.', ['is', 'was', 'were', 'be'], 1],
    ['basic_grammar_consolidation', 'I am interested in ___ Spanish.', ['learn', 'to learn', 'learning', 'learned'], 2],
    ['basic_grammar_consolidation', 'She is ___ than her brother.', ['tall', 'taller', 'tallest', 'more tall'], 1],
  ], 'basic_grammar_consolidation', 'She have finished her work.', 'She ___ finished her work.', 'has', ['She', 'has', 'finished', 'her', 'work.'], 'The singular subject she takes has in the present perfect.'),
];
