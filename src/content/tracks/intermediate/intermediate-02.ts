/** Intermediate track content cluster for levels i11–i20. */

import type { LevelInput, QuestionInput, TopicRule } from '../../types';

type McSpec = [rule: string, prompt: string, choices: string[], correctIndex: number];
type TypedSpec = { rule: string; faulty: string; prompt: string; answer: string; words: string[]; explanation: string };
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
  const id = `i${String(spec.number).padStart(2, '0')}`;
  const questions: QuestionInput[] = spec.questions.map(([rule, prompt, choices, correctIndex], index) => ({
    id: `${id}q${String(index + 1).padStart(2, '0')}`, levelId: id, rule, prompt, choices, correctIndex,
    choiceExplanations: choices.map((choice, choiceIndex) => choiceIndex === correctIndex
      ? `“${choice}” follows the ${rule} pattern in this context.`
      : `“${choice}” does not fit the ${rule} pattern here.`),
  }));
  const addFix = (item: TypedSpec, index: number) => questions.push({
    id: `${id}q${String(index).padStart(2, '0')}`, levelId: id, rule: item.rule, type: 'fix_sentence',
    faultySentence: item.faulty, prompt: item.prompt, choices: [item.answer, 'another form', 'an incorrect form', 'a different form'], correctIndex: 0,
    choiceExplanations: [`“${item.answer}” corrects the sentence using the target rule.`, 'This form does not fit the target structure.', 'This form leaves the error unresolved.', 'This form changes the intended meaning.'],
  });
  const addBlank = (item: TypedSpec, index: number) => questions.push({
    id: `${id}q${String(index).padStart(2, '0')}`, levelId: id, rule: item.rule, type: 'fill_blank', prompt: item.prompt,
    correctAnswer: item.answer, acceptedAnswers: [item.answer], explanation: item.explanation,
  });
  const addOrder = (item: TypedSpec, index: number) => questions.push({
    id: `${id}q${String(index).padStart(2, '0')}`, levelId: id, rule: item.rule, type: 'word_order', sentenceWords: item.words,
    prompt: 'Arrange the words to make a correct sentence.', explanation: item.explanation,
  });
  spec.fixes.forEach((item, index) => addFix(item, 6 + index));
  spec.blanks.forEach((item, index) => addBlank(item, 8 + index));
  spec.orders.forEach((item, index) => addOrder(item, 11 + index));
  return { id, trackId: 'intermediate', number: spec.number, title: spec.title, topic: { title: spec.title, summary: spec.summary, rules: spec.rules }, questions };
}

const rule = (name: string, title: string, explanation: string, example: string): TopicRule => ({ rule: name, title, explanation, example });

export const intermediateCluster02: LevelInput[] = [
  makeLevel({ number: 11, title: 'Non-defining Relative Clauses', summary: 'Non-defining relative clauses add extra information and are separated by commas.', rules: [
    rule('nondefining_relative_clause', 'Non-defining clauses', 'Use commas around a relative clause that adds non-essential information.', 'My sister, who lives in Leeds, is visiting.'),
    rule('relative_which_reference', 'Which to refer to a clause', 'Use which after a comma to comment on the whole preceding idea.', 'He missed the train, which caused a delay.'),
  ], questions: [
    ['nondefining_relative_clause', 'My aunt, ___ lives in Bristol, is a doctor.', ['who', 'which', 'where', 'whose'], 0], ['relative_which_reference', 'The shop closed early, ___ surprised us.', ['who', 'what', 'which', 'where'], 2], ['nondefining_relative_clause', 'Paris, ___ is the capital of France, attracts many visitors.', ['that', 'which', 'who', 'where'], 1], ['nondefining_relative_clause', 'Our teacher, ___ lessons are always lively, is popular.', ['who', 'whose', 'which', 'where'], 1], ['relative_which_reference', 'She passed the exam, ___ made her parents happy.', ['that', 'who', 'which', 'what'], 2],
  ], fixes: [
    { rule: 'nondefining_relative_clause', faulty: 'My brother who lives in York is visiting.', prompt: 'My brother, ___ lives in York, is visiting.', answer: 'who', words: [], explanation: 'Commas mark the non-essential information about the brother.' },
    { rule: 'relative_which_reference', faulty: 'He forgot the key, that caused a problem.', prompt: 'He forgot the key, ___ caused a problem.', answer: 'which', words: [], explanation: 'Which can refer back to the whole preceding clause after a comma.' },
  ], blanks: [
    { rule: 'nondefining_relative_clause', faulty: '', prompt: 'The museum, ___ opened in 1900, is free today.', answer: 'which', words: [], explanation: 'Which introduces extra information about the museum.' },
    { rule: 'relative_which_reference', faulty: '', prompt: 'They cancelled the flight, ___ disappointed everyone.', answer: 'which', words: [], explanation: 'Which refers to the preceding event.' },
    { rule: 'nondefining_relative_clause', faulty: '', prompt: 'My colleague, ___ I met yesterday, starts tomorrow.', answer: 'whom', words: [], explanation: 'Whom is the formal object form in a non-defining clause.' },
  ], orders: [
    { rule: 'nondefining_relative_clause', faulty: '', prompt: '', answer: '', words: ['The', 'car,', 'which', 'is', 'electric,', 'is', 'quiet.'], explanation: 'The commas set off the extra relative information.' },
    { rule: 'relative_which_reference', faulty: '', prompt: '', answer: '', words: ['She', 'won,', 'which', 'made', 'us', 'proud.'], explanation: 'Which comments on the complete preceding event.' },
  ] }),
  makeLevel({ number: 12, title: 'Reduced Relative Clauses', summary: 'Reduced relatives use participles to make descriptions more concise.', rules: [
    rule('reduced_relative_present_participle', 'Present-participle relatives', 'Use an -ing participle when the noun performs the action.', 'The people waiting outside can come in.'),
    rule('reduced_relative_past_participle', 'Past-participle relatives', 'Use a past participle when the noun receives the action.', 'The documents sent yesterday have arrived.'),
  ], questions: [
    ['reduced_relative_present_participle', 'The woman ___ at the desk is my manager.', ['sit', 'sat', 'sitting', 'to sit'], 2], ['reduced_relative_past_participle', 'The letters ___ yesterday are on the table.', ['send', 'sent', 'sending', 'to send'], 1], ['reduced_relative_present_participle', 'Students ___ for the test need quiet.', ['revised', 'revising', 'revise', 'to revise'], 1], ['reduced_relative_past_participle', 'The goods ___ from Italy arrived safely.', ['imported', 'importing', 'import', 'to import'], 0], ['reduced_relative_present_participle', 'The dog ___ in the garden belongs to Sam.', ['played', 'playing', 'plays', 'play'], 1],
  ], fixes: [
    { rule: 'reduced_relative_present_participle', faulty: 'The man stood by the door is my uncle.', prompt: 'The man ___ by the door is my uncle.', answer: 'standing', words: [], explanation: 'Use the present participle for a man who is performing the action.' },
    { rule: 'reduced_relative_past_participle', faulty: 'The report writing by Ana was clear.', prompt: 'The report ___ by Ana was clear.', answer: 'written', words: [], explanation: 'Use the past participle because the report receives the writing.' },
  ], blanks: [
    { rule: 'reduced_relative_present_participle', faulty: '', prompt: 'The children ___ outside are waiting for lunch.', answer: 'playing', words: [], explanation: 'Playing describes children who perform the action.' },
    { rule: 'reduced_relative_past_participle', faulty: '', prompt: 'The painting ___ in 1890 is valuable.', answer: 'created', words: [], explanation: 'Created is a past participle describing a completed action.' },
    { rule: 'reduced_relative_present_participle', faulty: '', prompt: 'People ___ this course should register online.', answer: 'taking', words: [], explanation: 'Taking means people who are taking the course.' },
  ], orders: [
    { rule: 'reduced_relative_present_participle', faulty: '', prompt: '', answer: '', words: ['The', 'man', 'waiting', 'outside', 'is', 'my', 'brother.'], explanation: 'The -ing phrase reduces who is waiting.' },
    { rule: 'reduced_relative_past_participle', faulty: '', prompt: '', answer: '', words: ['The', 'keys', 'found', 'yesterday', 'are', 'mine.'], explanation: 'Found reduces which were found.' },
  ] }),
  makeLevel({ number: 13, title: 'Gerunds and Infinitives: Verb Patterns', summary: 'Some verbs select a gerund, while others select a to-infinitive.', rules: [
    rule('verb_gerund_pattern', 'Gerund verb patterns', 'Verbs such as avoid, enjoy, and finish are followed by an -ing form.', 'She avoided making a mistake.'),
    rule('verb_infinitive_pattern', 'Infinitive verb patterns', 'Verbs such as decide, hope, and plan are followed by to plus the base verb.', 'They decided to leave early.'),
  ], questions: [
    ['verb_gerund_pattern', 'He avoids ___ late.', ['arrive', 'to arrive', 'arriving', 'arrived'], 2], ['verb_infinitive_pattern', 'We decided ___ by train.', ['travel', 'travelling', 'to travel', 'travelled'], 2], ['verb_gerund_pattern', 'She enjoys ___ novels.', ['read', 'to read', 'reading', 'reads'], 2], ['verb_infinitive_pattern', 'I hope ___ you soon.', ['see', 'seeing', 'to see', 'saw'], 2], ['verb_gerund_pattern', 'They finished ___ the room.', ['clean', 'to clean', 'cleaning', 'cleaned'], 2],
  ], fixes: [
    { rule: 'verb_gerund_pattern', faulty: 'I enjoy to swim.', prompt: 'I enjoy ___ .', answer: 'swimming', words: [], explanation: 'Enjoy is followed by a gerund, not a to-infinitive.' },
    { rule: 'verb_infinitive_pattern', faulty: 'She decided leaving early.', prompt: 'She decided ___ early.', answer: 'to leave', words: [], explanation: 'Decide is followed by a to-infinitive.' },
  ], blanks: [
    { rule: 'verb_gerund_pattern', faulty: '', prompt: 'He kept ___ despite the noise.', answer: 'working', words: [], explanation: 'Keep is followed by an -ing form.' },
    { rule: 'verb_infinitive_pattern', faulty: '', prompt: 'They agreed ___ us.', answer: 'to help', words: [], explanation: 'Agree is followed by a to-infinitive.' },
    { rule: 'verb_gerund_pattern', faulty: '', prompt: 'She suggested ___ a taxi.', answer: 'taking', words: [], explanation: 'Suggest is followed by a gerund in this pattern.' },
  ], orders: [
    { rule: 'verb_gerund_pattern', faulty: '', prompt: '', answer: '', words: ['He', 'avoids', 'driving', 'at', 'night.'], explanation: 'Avoid takes an -ing complement.' },
    { rule: 'verb_infinitive_pattern', faulty: '', prompt: '', answer: '', words: ['We', 'plan', 'to', 'visit', 'Rome.'], explanation: 'Plan takes a to-infinitive.' },
  ] }),
  makeLevel({ number: 14, title: 'Meaning Changes with Gerund or Infinitive', summary: 'Remember, stop, and try change meaning depending on whether they take a gerund or infinitive.', rules: [
    rule('gerund_infinitive_meaning_change', 'Meaning-changing patterns', 'Stop doing ends an activity, while stop to do interrupts one activity in order to do another.', 'He stopped smoking. / He stopped to smoke.'),
    rule('remember_regret_patterns', 'Remember and regret', 'Remember doing recalls a past event; remember to do means not forget a future action.', 'I remember meeting her. / Remember to call.'),
  ], questions: [
    ['gerund_infinitive_meaning_change', 'She stopped ___ because she was tired of the job.', ['work', 'to work', 'working', 'worked'], 2], ['remember_regret_patterns', 'Remember ___ the lights before leaving.', ['switching off', 'to switch off', 'switch off', 'switched off'], 1], ['gerund_infinitive_meaning_change', 'He stopped ___ a rest on the way.', ['taking', 'to take', 'take', 'took'], 1], ['remember_regret_patterns', 'I remember ___ that film years ago.', ['watch', 'to watch', 'watching', 'watched'], 2], ['gerund_infinitive_meaning_change', 'Try ___ the lid more gently.', ['turning', 'to turn', 'turn', 'turned'], 0],
  ], fixes: [
    { rule: 'gerund_infinitive_meaning_change', faulty: 'He stopped to smoke last year.', prompt: 'He stopped ___ last year.', answer: 'smoking', words: [], explanation: 'Stopped smoking means he ended the habit.' },
    { rule: 'remember_regret_patterns', faulty: 'Remember locking the door tonight.', prompt: 'Remember ___ the door tonight.', answer: 'to lock', words: [], explanation: 'Remember to lock means do not forget a future action.' },
  ], blanks: [
    { rule: 'remember_regret_patterns', faulty: '', prompt: 'She regrets ___ the secret.', answer: 'telling', words: [], explanation: 'Regret plus a gerund refers to something done in the past.' },
    { rule: 'gerund_infinitive_meaning_change', faulty: '', prompt: 'Try ___ the computer again.', answer: 'restarting', words: [], explanation: 'Try plus a gerund suggests an experiment or method.' },
    { rule: 'remember_regret_patterns', faulty: '', prompt: 'I regret ___ you that the event is cancelled.', answer: 'to tell', words: [], explanation: 'Regret to tell introduces an unpleasant announcement.' },
  ], orders: [
    { rule: 'gerund_infinitive_meaning_change', faulty: '', prompt: '', answer: '', words: ['She', 'stopped', 'to', 'buy', 'some', 'bread.'], explanation: 'Stopped to buy means she paused another activity for this purpose.' },
    { rule: 'remember_regret_patterns', faulty: '', prompt: '', answer: '', words: ['I', 'remember', 'meeting', 'him', 'there.'], explanation: 'Remember meeting recalls a past experience.' },
  ] }),
  makeLevel({ number: 15, title: 'Modal Deduction and Speculation', summary: 'Modal verbs express how certain we are about present and past possibilities.', rules: [
    rule('modal_deduction_present', 'Present deduction', 'Use must, may, might, or cannot plus a base or be form to assess a present situation.', 'She must be at work.'),
    rule('modal_deduction_past', 'Past deduction', 'Use modal plus have plus a past participle to speculate about a past event.', 'They might have missed the bus.'),
  ], questions: [
    ['modal_deduction_present', 'The lights are on, so they ___ be home.', ['must', 'would', 'should have', 'cannot'], 0], ['modal_deduction_past', 'He is not here. He ___ have forgotten.', ['must', 'might', 'can', 'should'], 1], ['modal_deduction_present', 'That ___ be Anna; she is abroad.', ['must', 'might', 'cannot', 'would'], 2], ['modal_deduction_past', 'She looks tired. She ___ have slept badly.', ['may', 'can', 'will', 'does'], 0], ['modal_deduction_present', 'It ___ be the delivery; it is too early.', ['must', 'might', 'cannot', 'should have'], 1],
  ], fixes: [
    { rule: 'modal_deduction_present', faulty: 'This must to be the answer.', prompt: 'This ___ be the answer.', answer: 'must', words: [], explanation: 'A modal is followed directly by the base form without to.' },
    { rule: 'modal_deduction_past', faulty: 'They might missed the train.', prompt: 'They might ___ the train.', answer: 'have missed', words: [], explanation: 'Past deduction uses modal + have + past participle.' },
  ], blanks: [
    { rule: 'modal_deduction_past', faulty: '', prompt: 'He is smiling; he must ___ good news.', answer: 'have received', words: [], explanation: 'Must have received makes a strong deduction about the past.' },
    { rule: 'modal_deduction_present', faulty: '', prompt: 'The answer might ___ correct.', answer: 'be', words: [], explanation: 'Might is followed by the base form be.' },
    { rule: 'modal_deduction_past', faulty: '', prompt: 'She cannot ___ the message yet.', answer: 'have read', words: [], explanation: 'Cannot have read expresses an impossible past deduction.' },
  ], orders: [
    { rule: 'modal_deduction_present', faulty: '', prompt: '', answer: '', words: ['He', 'must', 'be', 'very', 'busy.'], explanation: 'Must be expresses a strong present deduction.' },
    { rule: 'modal_deduction_past', faulty: '', prompt: '', answer: '', words: ['They', 'may', 'have', 'missed', 'the', 'bus.'], explanation: 'May have missed expresses a past possibility.' },
  ] }),
  makeLevel({ number: 16, title: 'Obligation, Necessity, and Permission', summary: 'Modal and semi-modal forms show obligation, permission, and whether an action was necessary.', rules: [
    rule('past_obligation', 'Past obligation', 'Use had to for a past obligation and was or were supposed to for an expected action.', 'We had to leave early.'),
    rule('absence_of_obligation', 'No obligation', 'Use did not have to when an action was unnecessary; it does not mean the action was forbidden.', 'You did not have to pay.'),
  ], questions: [
    ['past_obligation', 'We ___ wear uniforms at school.', ['must', 'had to', 'have to', 'should'], 1], ['absence_of_obligation', 'You ___ bring a towel; one was provided.', ['must not', 'could not', 'did not have to', 'should not'], 2], ['past_obligation', 'She was ___ to arrive at nine.', ['supposed', 'must', 'have', 'allowed'], 0], ['absence_of_obligation', 'They ___ pay for entry because it was free.', ['did not have to', 'must not', 'could not', 'should not have'], 0], ['past_obligation', 'I ___ finish the form before applying.', ['had to', 'must have', 'could', 'might'], 0],
  ], fixes: [
    { rule: 'past_obligation', faulty: 'I must to leave yesterday.', prompt: 'I ___ leave yesterday.', answer: 'had to', words: [], explanation: 'Had to expresses an obligation in the past.' },
    { rule: 'absence_of_obligation', faulty: 'We must not buy tickets; entry was free.', prompt: 'We ___ buy tickets; entry was free.', answer: 'did not have to', words: [], explanation: 'Did not have to means buying tickets was unnecessary, not forbidden.' },
  ], blanks: [
    { rule: 'past_obligation', faulty: '', prompt: 'He ___ to work late last night.', answer: 'had', words: [], explanation: 'Had to is the past form of have to.' },
    { rule: 'absence_of_obligation', faulty: '', prompt: 'You ___ have brought food; there was plenty.', answer: 'did not have to', words: [], explanation: 'This says bringing food was unnecessary.' },
    { rule: 'past_obligation', faulty: '', prompt: 'We were ___ to call before visiting.', answer: 'supposed', words: [], explanation: 'Were supposed to describes an expected past action.' },
  ], orders: [
    { rule: 'past_obligation', faulty: '', prompt: '', answer: '', words: ['She', 'had', 'to', 'cancel', 'the', 'trip.'], explanation: 'Had to expresses past necessity.' },
    { rule: 'absence_of_obligation', faulty: '', prompt: '', answer: '', words: ['You', 'did', 'not', 'have', 'to', 'wait.'], explanation: 'Did not have to expresses absence of necessity.' },
  ] }),
  makeLevel({ number: 17, title: 'Articles with Abstract and Proper Nouns', summary: 'Article choice changes with abstract meaning, institutions, places, and proper names.', rules: [
    rule('abstract_noun_article', 'Articles with abstract nouns', 'Use zero article for abstract ideas in general and the for a specific instance or shared reference.', 'Education matters. The education he received was excellent.'),
    rule('proper_noun_article', 'Articles with proper nouns', 'Most names take no article, but geographical groups and some places conventionally take the.', 'She lives in Canada. They crossed the Atlantic.'),
  ], questions: [
    ['abstract_noun_article', '___ patience is useful in difficult work.', ['A', 'An', 'The', 'nothing'], 3], ['abstract_noun_article', '___ advice you gave me was helpful.', ['A', 'An', 'The', 'nothing'], 2], ['proper_noun_article', 'They sailed across ___ Pacific.', ['a', 'an', 'the', 'nothing'], 2], ['proper_noun_article', 'She studies at ___ Oxford University.', ['a', 'an', 'the', 'nothing'], 3], ['abstract_noun_article', 'He needs ___ courage to speak publicly.', ['a', 'an', 'the', 'nothing'], 3],
  ], fixes: [
    { rule: 'abstract_noun_article', faulty: 'The honesty is important in friendship.', prompt: '___ honesty is important in friendship.', answer: 'nothing', words: [], explanation: 'Abstract honesty is general here, so it takes zero article.' },
    { rule: 'proper_noun_article', faulty: 'They visited the France last summer.', prompt: 'They visited ___ France last summer.', answer: 'nothing', words: [], explanation: 'Most country names, including France, take no article.' },
  ], blanks: [
    { rule: 'abstract_noun_article', faulty: '', prompt: '___ information in this report is confidential.', answer: 'The', words: [], explanation: 'The identifies specific information in this report.' },
    { rule: 'proper_noun_article', faulty: '', prompt: 'We travelled through ___ Netherlands.', answer: 'the', words: [], explanation: 'The Netherlands is a conventional geographical name with the.' },
    { rule: 'abstract_noun_article', faulty: '', prompt: '___ freedom is a basic human value.', answer: 'nothing', words: [], explanation: 'Freedom is used as a general abstract idea.' },
  ], orders: [
    { rule: 'abstract_noun_article', faulty: '', prompt: '', answer: '', words: ['The', 'knowledge', 'in', 'this', 'book', 'is', 'useful.'], explanation: 'The identifies specific knowledge in this book.' },
    { rule: 'proper_noun_article', faulty: '', prompt: '', answer: '', words: ['They', 'crossed', 'the', 'Atlantic', 'Ocean.'], explanation: 'The is used with this ocean name.' },
  ] }),
  makeLevel({ number: 18, title: 'Noun Clauses', summary: 'Noun clauses can function as subjects or objects and embedded questions use statement word order.', rules: [
    rule('noun_clause_that', 'That noun clauses', 'A that-clause can report a belief, fact, or statement as a noun-like unit.', 'I believe that she is right.'),
    rule('embedded_question', 'Embedded questions', 'Embedded questions use statement word order and do not use do, does, or did for inversion.', 'Do you know where he lives?'),
  ], questions: [
    ['noun_clause_that', 'I believe ___ she is honest.', ['what', 'that', 'if', 'which'], 1], ['embedded_question', 'Do you know where ___?', ['does he live', 'he lives', 'is he living', 'he does live'], 1], ['noun_clause_that', 'The fact ___ he called surprised me.', ['what', 'who', 'that', 'where'], 2], ['embedded_question', 'Can you tell me what time ___?', ['does it start', 'it starts', 'starts it', 'is it start'], 1], ['noun_clause_that', '___ she passed was excellent news.', ['That', 'What', 'Where', 'Which'], 0],
  ], fixes: [
    { rule: 'embedded_question', faulty: 'I wonder where does she work.', prompt: 'I wonder where ___ .', answer: 'she works', words: [], explanation: 'An embedded question uses subject-verb statement order.' },
    { rule: 'noun_clause_that', faulty: 'He knows she is ready that.', prompt: 'He knows ___ she is ready.', answer: 'that', words: [], explanation: 'That introduces the reported noun clause.' },
  ], blanks: [
    { rule: 'embedded_question', faulty: '', prompt: 'Could you explain why ___ late?', answer: 'they are', words: [], explanation: 'The embedded clause keeps statement order.' },
    { rule: 'noun_clause_that', faulty: '', prompt: 'It is clear ___ we need more time.', answer: 'that', words: [], explanation: 'That introduces the content of what is clear.' },
    { rule: 'embedded_question', faulty: '', prompt: 'I do not know what ___ next.', answer: 'to do', words: [], explanation: 'What to do is an embedded question with an infinitive.' },
  ], orders: [
    { rule: 'embedded_question', faulty: '', prompt: '', answer: '', words: ['Do', 'you', 'know', 'where', 'she', 'works?'], explanation: 'The embedded question has statement order.' },
    { rule: 'noun_clause_that', faulty: '', prompt: '', answer: '', words: ['I', 'think', 'that', 'he', 'is', 'right.'], explanation: 'That introduces the object noun clause.' },
  ] }),
  makeLevel({ number: 19, title: 'Adverbial Clauses', summary: 'Time, reason, and purpose clauses connect events and control tense and meaning.', rules: [
    rule('time_clause_future', 'Future time clauses', 'After when, as soon as, and once, use present forms for future time rather than will.', 'When she arrives, we will start.'),
    rule('reason_purpose_clause', 'Reason and purpose', 'Because gives a reason, while so that introduces a purpose or intended result.', 'He left early so that he could park.'),
  ], questions: [
    ['time_clause_future', 'When he ___, we will eat.', ['will arrive', 'arrives', 'arrived', 'is arrive'], 1], ['reason_purpose_clause', 'She stayed home ___ she was ill.', ['so that', 'because', 'although', 'unless'], 1], ['time_clause_future', 'Call me as soon as you ___.', ['will finish', 'finished', 'finish', 'are finish'], 2], ['reason_purpose_clause', 'He spoke quietly so that nobody ___ hear.', ['will', 'could', 'can to', 'would to'], 1], ['time_clause_future', 'Once they ___, the meeting can begin.', ['will sit', 'sit', 'sat', 'are sit'], 1],
  ], fixes: [
    { rule: 'time_clause_future', faulty: 'When I will arrive, I will call.', prompt: 'When I ___, I will call.', answer: 'arrive', words: [], explanation: 'Use present simple in a future time clause after when.' },
    { rule: 'reason_purpose_clause', faulty: 'He left early because to catch the train.', prompt: 'He left early ___ catch the train.', answer: 'to', words: [], explanation: 'To plus the base verb expresses purpose.' },
  ], blanks: [
    { rule: 'time_clause_future', faulty: '', prompt: 'I will text you after I ___ home.', answer: 'get', words: [], explanation: 'After introduces a future time clause with present simple.' },
    { rule: 'reason_purpose_clause', faulty: '', prompt: 'We took notes so that we ___ remember the details.', answer: 'could', words: [], explanation: 'Could expresses the intended ability in the purpose clause.' },
    { rule: 'reason_purpose_clause', faulty: '', prompt: 'She wore boots because the ground ___ wet.', answer: 'was', words: [], explanation: 'Because introduces the reason for the action.' },
  ], orders: [
    { rule: 'time_clause_future', faulty: '', prompt: '', answer: '', words: ['When', 'she', 'arrives,', 'we', 'will', 'start.'], explanation: 'The time clause uses present simple for future time.' },
    { rule: 'reason_purpose_clause', faulty: '', prompt: '', answer: '', words: ['He', 'whispered', 'so', 'that', 'the', 'baby', 'could', 'sleep.'], explanation: 'So that introduces the intended purpose.' },
  ] }),
  makeLevel({ number: 20, title: 'Participle Clauses', summary: 'Participle clauses connect actions efficiently when the understood subject is the same.', rules: [
    rule('participle_clause_cause', 'Participle clauses for cause', 'A present or past participle clause can give a reason for the main clause.', 'Feeling tired, she went home.'),
    rule('participle_clause_time', 'Participle clauses for time', 'Participle clauses can show an action happening before or at the same time as the main action.', 'Having finished work, he left.'),
  ], questions: [
    ['participle_clause_cause', '___ exhausted, he went straight to bed.', ['Feel', 'Feeling', 'Felt', 'To feel'], 1], ['participle_clause_time', '___ the report, she sent it to her manager.', ['Finish', 'Finished', 'Having finished', 'To finishing'], 2], ['participle_clause_cause', '___ by the news, they cancelled the event.', ['Shock', 'Shocking', 'Shocked', 'To shock'], 2], ['participle_clause_time', '___ along the beach, I found a shell.', ['Walk', 'Walking', 'Walked', 'To walk'], 1], ['participle_clause_cause', '___ no ticket, she could not enter.', ['Have', 'Having', 'Had', 'To have'], 1],
  ], fixes: [
    { rule: 'participle_clause_cause', faulty: 'Frightening by the noise, the child cried.', prompt: '___ by the noise, the child cried.', answer: 'Frightened', words: [], explanation: 'The child received the frightening action, so use the past participle.' },
    { rule: 'participle_clause_time', faulty: 'Having finish dinner, we watched a film.', prompt: 'Having ___ dinner, we watched a film.', answer: 'finished', words: [], explanation: 'Having is followed by a past participle for an earlier action.' },
  ], blanks: [
    { rule: 'participle_clause_cause', faulty: '', prompt: '___ the instructions, he made a mistake.', answer: 'Misunderstanding', words: [], explanation: 'The -ing clause gives the cause of the mistake.' },
    { rule: 'participle_clause_time', faulty: '', prompt: '___ the door, she walked away.', answer: 'Having locked', words: [], explanation: 'Having plus a past participle shows the earlier action.' },
    { rule: 'participle_clause_cause', faulty: '', prompt: '___ with the result, they celebrated.', answer: 'Pleased', words: [], explanation: 'Pleased describes the people who experienced the feeling.' },
  ], orders: [
    { rule: 'participle_clause_cause', faulty: '', prompt: '', answer: '', words: ['Feeling', 'ill,', 'she', 'stayed', 'home.'], explanation: 'The participle clause gives the reason for staying home.' },
    { rule: 'participle_clause_time', faulty: '', prompt: '', answer: '', words: ['Having', 'finished', 'work,', 'he', 'went', 'home.'], explanation: 'Having finished shows the earlier completed action.' },
  ] }),
];
