/**
 * Basic track — the v1 authored level corpus as pure data.
 *
 * Task 4 shipped the Past Perfect reference level; Task 5 completes the track
 * with the remaining MVP levels (12 total, sequential 1..12). This file is data
 * only — no game logic — per the governing principle: the app is a player, the
 * content is a database. Every level here must pass `validateContent()`.
 *
 * Rule-identity contract (see docs/schema §1): each `TopicRule.rule` is defined
 * exactly once, in the level where it is introduced. Later levels may tag a
 * question with an earlier level's rule tag (the "recurring rule" mechanic that
 * lets the Weakness Queue resurface in later levels), but never re-define it.
 * Levels b02+ therefore carry a couple of recurring-tagged questions each.
 *
 * Content review: every level has a checklist entry in `docs/content-review.md`.
 */

import type { Level, Track } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Level 1 — Present Simple
// ─────────────────────────────────────────────────────────────────────────────

const presentSimpleLevel: Level = {
  id: 'b01',
  trackId: 'basic',
  number: 1,
  title: 'Present Simple',
  topic: {
    title: 'Present Simple',
    summary:
      'The present simple describes habits, routines, and facts that are generally true. With he, she, and it, the verb adds -s.',
    rules: [
      {
        rule: 'present_simple_form',
        title: 'Form: he/she/it + verb-s',
        explanation:
          "Use the base verb for I/you/we/they (I work) and add -s (or -es) for he/she/it (she works). Negatives use do not/don't or does not/doesn't + the base verb; questions use do/does + subject + base verb.",
        example: 'She works in a hospital. / Do you like coffee?',
      },
      {
        rule: 'present_simple_usage',
        title: 'Use: habits, routines, and facts',
        explanation:
          'Use the present simple for repeated actions and routines (I drink tea every morning), general facts (Water boils at 100 °C), and fixed schedules (The bus leaves at six).',
        example: 'He plays tennis on Sundays.',
      },
    ],
  },
  questions: [
    {
      id: 'b01q01',
      levelId: 'b01',
      rule: 'present_simple_form',
      prompt: 'My sister ___ in a bank.',
      choices: ['works', 'work', 'working', 'is work'],
      correctIndex: 0,
      choiceExplanations: [
        "'Works' is correct: with 'my sister' (she), the present-simple verb takes -s.",
        "'Work' is wrong: the base form is used for I/you/we/they, not for she.",
        "'Working' is wrong: the -ing form needs a helper verb (is working), and this is a routine, not an action happening now.",
        "'Is work' is wrong: 'is' is never followed by the base verb.",
      ],
    },
    {
      id: 'b01q02',
      levelId: 'b01',
      rule: 'present_simple_form',
      prompt: 'They ___ English every day.',
      choices: ['studies', 'study', 'is studying', 'studying'],
      correctIndex: 1,
      choiceExplanations: [
        "'Studies' is wrong: -s is added only for he/she/it, and 'they' takes the base form.",
        "'Study' is correct: 'they' takes the base verb in the present simple.",
        "'Is studying' is wrong: present continuous fits an action happening now, not a daily habit.",
        "'Studying' is wrong: the -ing form cannot stand alone as the main verb.",
      ],
    },
    {
      id: 'b01q03',
      levelId: 'b01',
      rule: 'present_simple_form',
      prompt: 'He ___ his car to work.',
      choices: ['drive', 'is driving', 'drives', 'driving'],
      correctIndex: 2,
      choiceExplanations: [
        "'Drive' is wrong: the base form is for I/you/we/they, not for he.",
        "'Is driving' is wrong: it describes an action in progress now, not a regular habit.",
        "'Drives' is correct: with 'he', the present-simple verb adds -s.",
        "'Driving' is wrong: the -ing form needs a helper verb to be a main verb.",
      ],
    },
    {
      id: 'b01q04',
      levelId: 'b01',
      rule: 'present_simple_form',
      prompt: '___ you like pizza?',
      choices: ['Does', 'Is', 'Are', 'Do'],
      correctIndex: 3,
      choiceExplanations: [
        "'Does' is wrong: 'does' is used with he/she/it, and the subject here is 'you'.",
        "'Is' is wrong: questions with 'like' need the auxiliary do/does, not the verb 'to be'.",
        "'Are' is wrong: 'are' is the verb 'to be' and cannot form a question with 'like'.",
        "'Do' is correct: 'you' takes the auxiliary 'do' in present-simple questions.",
      ],
    },
    {
      id: 'b01q05',
      levelId: 'b01',
      rule: 'present_simple_form',
      prompt: 'She ___ TV in the evening.',
      choices: ['watch', 'watches', 'is watching', 'watching'],
      correctIndex: 1,
      choiceExplanations: [
        "'Watch' is wrong: the base form is for I/you/we/they, not for she.",
        "'Watches' is correct: after -ch, she adds -es in the present simple.",
        "'Is watching' is wrong: present continuous is for an action happening now, not an evening habit.",
        "'Watching' is wrong: the -ing form cannot be the main verb alone.",
      ],
    },
    {
      id: 'b01q06',
      levelId: 'b01',
      rule: 'present_simple_form',
      prompt: 'The shop ___ at nine o’clock.',
      choices: ['opens', 'open', 'is open', 'opening'],
      correctIndex: 0,
      choiceExplanations: [
        "'Opens' is correct: 'the shop' (it) takes the -s form in the present simple.",
        "'Open' is wrong: the base form is for I/you/we/they, not for it.",
        "'Is open' is wrong: that states a state, not the shop's fixed daily schedule.",
        "'Opening' is wrong: the -ing form needs a helper verb and does not fit a schedule fact.",
      ],
    },
    {
      id: 'b01q07',
      levelId: 'b01',
      rule: 'present_simple_usage',
      prompt: 'Water ___ at 100 degrees Celsius.',
      choices: ['boil', 'is boiling', 'boils', 'boiled'],
      correctIndex: 2,
      choiceExplanations: [
        "'Boil' is wrong: a general fact uses the -s form because water is a singular subject (it).",
        "'Is boiling' is wrong: present continuous is for an action happening now, not a general truth.",
        "'Boils' is correct: the present simple states a general fact.",
        "'Boiled' is wrong: past simple describes a finished past event, not a timeless fact.",
      ],
    },
    {
      id: 'b01q08',
      levelId: 'b01',
      rule: 'present_simple_usage',
      prompt: 'We ___ to the gym every morning.',
      choices: ['goes', 'going', 'go', 'are go'],
      correctIndex: 2,
      choiceExplanations: [
        "'Goes' is wrong: -es is for he/she/it; the subject is 'we'.",
        "'Going' is wrong: the -ing form cannot be the main verb alone here.",
        "'Go' is correct: a daily routine with 'we' takes the base form.",
        "'Are go' is wrong: 'are' is never followed by the base verb.",
      ],
    },
    {
      id: 'b01q09',
      levelId: 'b01',
      rule: 'present_simple_usage',
      prompt: 'He ___ football on Saturdays.',
      choices: ['is playing', 'play', 'plays', 'playing'],
      correctIndex: 2,
      choiceExplanations: [
        "'Is playing' is wrong: that describes right now, but Saturdays is a repeated habit.",
        "'Play' is wrong: the base form is for I/you/we/they, not for he.",
        "'Plays' is correct: the present simple describes a habit on Saturdays.",
        "'Playing' is wrong: the -ing form cannot be the main verb alone.",
      ],
    },
    {
      id: 'b01q10',
      levelId: 'b01',
      rule: 'present_simple_usage',
      prompt: 'The train ___ at six every day.',
      choices: ['leave', 'is leaving', 'leaving', 'leaves'],
      correctIndex: 3,
      choiceExplanations: [
        "'Leave' is wrong: the base form is for I/you/we/they, not for it.",
        "'Is leaving' is wrong: present continuous fits an action in progress now, not a fixed daily schedule.",
        "'Leaving' is wrong: the -ing form needs a helper verb to be a main verb.",
        "'Leaves' is correct: the present simple states a fixed schedule.",
      ],
    },
    {
      id: 'b01q11',
      levelId: 'b01',
      rule: 'present_simple_usage',
      prompt: 'I ___ coffee, but I don’t like tea.',
      choices: ['drinks', 'drink', 'am drinking', 'drinking'],
      correctIndex: 1,
      choiceExplanations: [
        "'Drinks' is wrong: -s is for he/she/it, not for 'I'.",
        "'Drink' is correct: a personal habit with 'I' takes the base form.",
        "'Am drinking' is wrong: present continuous is for now, not a general preference.",
        "'Drinking' is wrong: the -ing form cannot be the main verb alone.",
      ],
    },
    {
      id: 'b01q12',
      levelId: 'b01',
      rule: 'present_simple_usage',
      prompt: 'Cats ___ milk.',
      choices: ['like', 'likes', 'liking', 'is like'],
      correctIndex: 0,
      choiceExplanations: [
        "'Like' is correct: 'cats' (they) takes the base form, and a general fact uses the present simple.",
        "'Likes' is wrong: -s is for he/she/it, and 'cats' is plural.",
        "'Liking' is wrong: the -ing form cannot be the main verb alone.",
        "'Is like' is wrong: 'is' is never followed by the base verb.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 2 — Present Continuous
// ─────────────────────────────────────────────────────────────────────────────

const presentContinuousLevel: Level = {
  id: 'b02',
  trackId: 'basic',
  number: 2,
  title: 'Present Continuous',
  topic: {
    title: 'Present Continuous',
    summary:
      'The present continuous describes an action happening now or around now, and temporary situations. It is formed with am/is/are + verb-ing.',
    rules: [
      {
        rule: 'present_continuous_form',
        title: 'Form: am/is/are + verb-ing',
        explanation:
          "Formed with am/is/are + the -ing form of the verb (I am working, she is working, we are working). Negatives add not (isn't/aren't); questions put am/is/are before the subject.",
        example: 'They are watching a film right now.',
      },
      {
        rule: 'present_simple_vs_continuous',
        title: 'Present Simple vs Present Continuous',
        explanation:
          'Use the present continuous for actions in progress now or temporary situations; use the present simple for habits and permanent facts. A word like "now" or "today" points to continuous; "every day" points to simple.',
        example: 'She is working today, but she works at a clinic every week.',
      },
    ],
  },
  questions: [
    {
      id: 'b02q01',
      levelId: 'b02',
      rule: 'present_continuous_form',
      prompt: 'Listen! The baby ___ .',
      choices: ['cries', 'is crying', 'cry', 'crying'],
      correctIndex: 1,
      choiceExplanations: [
        "'Cries' is wrong: the present simple fits a habit, not the action happening right now that 'Listen!' points to.",
        "'Is crying' is correct: present continuous (is + crying) describes the action happening now.",
        "'Cry' is wrong: the base form needs the right subject and does not fit an action in progress.",
        "'Crying' is wrong: the -ing form must be paired with am/is/are.",
      ],
    },
    {
      id: 'b02q02',
      levelId: 'b02',
      rule: 'present_continuous_form',
      prompt: 'We ___ lunch right now.',
      choices: ['are having', 'have', 'is having', 'having'],
      correctIndex: 0,
      choiceExplanations: [
        "'Are having' is correct: 'we' takes 'are' + the -ing form for an action happening now.",
        "'Have' is wrong: the present simple would describe a habit, not what is happening at this moment.",
        "'Is having' is wrong: 'is' goes with he/she/it, not 'we'.",
        "'Having' is wrong: the -ing form needs am/is/are.",
      ],
    },
    {
      id: 'b02q03',
      levelId: 'b02',
      rule: 'present_continuous_form',
      prompt: 'She ___ a book at the moment.',
      choices: ['reads', 'is reading', 'read', 'is read'],
      correctIndex: 1,
      choiceExplanations: [
        "'Reads' is wrong: the present simple describes a habit; 'at the moment' signals an action in progress now.",
        "'Is reading' is correct: present continuous (is + reading) fits 'at the moment'.",
        "'Read' is wrong: the base form does not fit a singular subject doing something now.",
        "'Is read' is wrong: that is passive voice, but the book is being read, not reading itself.",
      ],
    },
    {
      id: 'b02q04',
      levelId: 'b02',
      rule: 'present_continuous_form',
      prompt: '___ they coming to the party?',
      choices: ['Does', 'Is', 'Are', 'Do'],
      correctIndex: 2,
      choiceExplanations: [
        "'Does' is wrong: 'does' makes a present-simple question, and the verb here is 'coming', not a base form.",
        "'Is' is wrong: 'is' goes with he/she/it, not 'they'.",
        "'Are' is correct: 'they' takes 'are' before the -ing form in a present-continuous question.",
        "'Do' is wrong: 'do' cannot precede 'coming'; a present-continuous question needs am/is/are.",
      ],
    },
    {
      id: 'b02q05',
      levelId: 'b02',
      rule: 'present_continuous_form',
      prompt: 'He ___ for the bus now.',
      choices: ['waits', 'is waiting', 'wait', 'is wait'],
      correctIndex: 1,
      choiceExplanations: [
        "'Waits' is wrong: the present simple describes a habit; 'now' signals an action in progress.",
        "'Is waiting' is correct: present continuous (is + waiting) fits the action happening now.",
        "'Wait' is wrong: the base form does not fit a singular subject in an ongoing action.",
        "'Is wait' is wrong: 'is' must be followed by the -ing form, not the base verb.",
      ],
    },
    {
      id: 'b02q06',
      levelId: 'b02',
      rule: 'present_simple_vs_continuous',
      prompt: 'I usually ___ tea, but today I ___ coffee.',
      choices: ['am drinking / drink', 'drink / am drinking', 'drink / drink', 'am drinking / am drinking'],
      correctIndex: 1,
      choiceExplanations: [
        "'Am drinking / drink' is wrong: the usual habit takes the present simple, and the exception today takes the continuous.",
        "'Drink / am drinking' is correct: 'usually' signals the habit (present simple), and 'today' signals the temporary change (present continuous).",
        "'Drink / drink' is wrong: the second verb ignores 'today', which points to a temporary action.",
        "'Am drinking / am drinking' is wrong: the first verb is a usual habit and should be present simple.",
      ],
    },
    {
      id: 'b02q07',
      levelId: 'b02',
      rule: 'present_simple_vs_continuous',
      prompt: 'Look! It ___ outside.',
      choices: ['snows', 'snow', 'is snowing', 'snowing'],
      correctIndex: 2,
      choiceExplanations: [
        "'Snows' is wrong: 'Look!' points to what is happening right now, so the present simple is wrong.",
        "'Snow' is wrong: the base form does not fit a singular subject in an action in progress.",
        "'Is snowing' is correct: 'Look!' signals an action happening at this moment.",
        "'Snowing' is wrong: the -ing form needs am/is/are.",
      ],
    },
    {
      id: 'b02q08',
      levelId: 'b02',
      rule: 'present_simple_vs_continuous',
      prompt: 'She ___ in London now, but she ___ in Paris every summer.',
      choices: ['lives / is staying', 'is living / stays', 'is living / is staying', 'lives / stays'],
      correctIndex: 1,
      choiceExplanations: [
        "'Lives / is staying' is wrong: a permanent residence takes the present simple, not the continuous.",
        "'Is living / stays' is correct: the temporary situation now takes the continuous, and the yearly habit takes the simple.",
        "'Is living / is staying' is wrong: 'every summer' is a habit and needs the present simple.",
        "'Lives / stays' is wrong: the first verb ignores 'now', which signals a temporary situation.",
      ],
    },
    {
      id: 'b02q09',
      levelId: 'b02',
      rule: 'present_simple_vs_continuous',
      prompt: 'Every day he ___ to school, but today he ___ the bus.',
      choices: ['is walking / takes', 'walks / is taking', 'walks / takes', 'is walking / is taking'],
      correctIndex: 1,
      choiceExplanations: [
        "'Is walking / takes' is wrong: 'every day' is a habit and needs the present simple.",
        "'Walks / is taking' is correct: the daily habit takes the present simple, and today's exception takes the present continuous.",
        "'Walks / takes' is wrong: the second verb ignores 'today', which signals a change from the routine.",
        "'Is walking / is taking' is wrong: the first verb ignores 'every day', which signals a habit.",
      ],
    },
    {
      id: 'b02q10',
      levelId: 'b02',
      rule: 'present_simple_vs_continuous',
      prompt: 'The sun ___ in the east. It ___ right now.',
      choices: ['is rising / rises', 'rises / is rising', 'rises / rises', 'is rising / is rising'],
      correctIndex: 1,
      choiceExplanations: [
        "'Is rising / rises' is wrong: a general fact takes the present simple, and 'right now' takes the continuous.",
        "'Rises / is rising' is correct: the eternal fact takes the present simple, and the current action takes the continuous.",
        "'Rises / rises' is wrong: the second verb ignores 'right now'.",
        "'Is rising / is rising' is wrong: a general fact about the sun must use the present simple.",
      ],
    },
    // Recurring: present_simple_form (defined in b01)
    {
      id: 'b02q11',
      levelId: 'b02',
      rule: 'present_simple_form',
      prompt: 'My father ___ up at six every day.',
      choices: ['is getting', 'get', 'gets', 'getting'],
      correctIndex: 2,
      choiceExplanations: [
        "'Is getting' is wrong: present continuous describes now, but 'every day' signals a habit.",
        "'Get' is wrong: the base form is for I/you/we/they, not for he.",
        "'Gets' is correct: a daily routine with 'my father' (he) takes the present-simple -s form.",
        "'Getting' is wrong: the -ing form needs am/is/are.",
      ],
    },
    {
      id: 'b02q12',
      levelId: 'b02',
      rule: 'present_simple_form',
      prompt: '___ your sister play the piano?',
      choices: ['Does', 'Is', 'Are', 'Do'],
      correctIndex: 0,
      choiceExplanations: [
        "'Does' is correct: 'your sister' (she) takes 'does' in a present-simple question.",
        "'Is' is wrong: the verb here is 'play', not an -ing form, so this is not a continuous question.",
        "'Are' is wrong: 'are' is for plural subjects and cannot form this question.",
        "'Do' is wrong: 'do' is used with I/you/we/they, not with she.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 3 — Past Simple
// ─────────────────────────────────────────────────────────────────────────────

const pastSimpleLevel: Level = {
  id: 'b03',
  trackId: 'basic',
  number: 3,
  title: 'Past Simple',
  topic: {
    title: 'Past Simple',
    summary:
      'The past simple describes finished actions and events in the past. Regular verbs add -ed; many common verbs are irregular.',
    rules: [
      {
        rule: 'past_simple_form',
        title: 'Form: regular -ed and irregular verbs',
        explanation:
          "Regular verbs add -ed (work → worked). Irregular verbs change form (go → went, see → saw, eat → ate). The form is the same for all subjects, and negatives/questions use did + the base verb (He didn't go; Did you see her?).",
        example: 'I visited Rome last year. / She went home early.',
      },
      {
        rule: 'past_simple_usage',
        title: 'Use: finished actions with past time markers',
        explanation:
          'Use the past simple for actions and states that finished at a specific time in the past, often with markers like yesterday, last week, ago, or in 2010. The action is complete and has no connection to now.',
        example: 'We watched a film yesterday evening.',
      },
    ],
  },
  questions: [
    {
      id: 'b03q01',
      levelId: 'b03',
      rule: 'past_simple_form',
      prompt: 'She ___ to the meeting yesterday.',
      choices: ['go', 'went', 'goes', 'gone'],
      correctIndex: 1,
      choiceExplanations: [
        "'Go' is wrong: the base form is not used for a finished past event.",
        "'Went' is correct: 'went' is the irregular past-simple form of 'go'.",
        "'Goes' is wrong: the present simple describes a habit, but 'yesterday' signals the past.",
        "'Gone' is wrong: 'gone' is the past participle and needs a helper verb (has gone / had gone).",
      ],
    },
    {
      id: 'b03q02',
      levelId: 'b03',
      rule: 'past_simple_form',
      prompt: 'They ___ the museum last weekend.',
      choices: ['visit', 'visits', 'visited', 'visiting'],
      correctIndex: 2,
      choiceExplanations: [
        "'Visit' is wrong: the base form does not express a finished past action.",
        "'Visits' is wrong: the -s form is present simple for he/she/it, not past.",
        "'Visited' is correct: regular verbs add -ed for the past simple.",
        "'Visiting' is wrong: the -ing form needs a helper verb and does not fit a finished event.",
      ],
    },
    {
      id: 'b03q03',
      levelId: 'b03',
      rule: 'past_simple_form',
      prompt: 'I ___ a strange noise last night.',
      choices: ['hear', 'hears', 'am hearing', 'heard'],
      correctIndex: 3,
      choiceExplanations: [
        "'Hear' is wrong: the base form does not express a finished past action.",
        "'Hears' is wrong: present simple -s form, but the event is in the past.",
        "'Am hearing' is wrong: present continuous describes now, not last night.",
        "'Heard' is correct: 'heard' is the irregular past-simple form of 'hear'.",
      ],
    },
    {
      id: 'b03q04',
      levelId: 'b03',
      rule: 'past_simple_form',
      prompt: '___ you call her yesterday?',
      choices: ['Do', 'Did', 'Does', 'Have'],
      correctIndex: 1,
      choiceExplanations: [
        "'Do' is wrong: 'do' is present; 'yesterday' signals a past question.",
        "'Did' is correct: past-simple questions use 'did' + the base verb.",
        "'Does' is wrong: 'does' is present simple and is for he/she/it.",
        "'Have' is wrong: 'have' would make a present-perfect question, which does not take a past time marker like 'yesterday'.",
      ],
    },
    {
      id: 'b03q05',
      levelId: 'b03',
      rule: 'past_simple_form',
      prompt: 'He didn’t ___ the email.',
      choices: ['sent', 'send', 'sends', 'sending'],
      correctIndex: 1,
      choiceExplanations: [
        "'Sent' is wrong: after 'didn't', the verb returns to the base form.",
        "'Send' is correct: negatives with 'didn't' take the base verb, whatever the tense of the main verb.",
        "'Sends' is wrong: 'sends' is present simple and never follows 'didn't'.",
        "'Sending' is wrong: the -ing form cannot follow 'didn't'.",
      ],
    },
    {
      id: 'b03q06',
      levelId: 'b03',
      rule: 'past_simple_form',
      prompt: 'They ___ dinner at eight o’clock last night.',
      choices: ['eat', 'eats', 'ate', 'eaten'],
      correctIndex: 2,
      choiceExplanations: [
        "'Eat' is wrong: the base form does not express a finished past action.",
        "'Eats' is wrong: present simple for he/she/it, but the dinner was last night.",
        "'Ate' is correct: 'ate' is the irregular past-simple form of 'eat'.",
        "'Eaten' is wrong: 'eaten' is the past participle and needs a helper verb (has eaten / had eaten).",
      ],
    },
    {
      id: 'b03q07',
      levelId: 'b03',
      rule: 'past_simple_usage',
      prompt: 'We ___ to Spain two years ago.',
      choices: ['travel', 'travels', 'are traveling', 'traveled'],
      correctIndex: 3,
      choiceExplanations: [
        "'Travel' is wrong: the base form does not fit a finished past trip.",
        "'Travels' is wrong: present simple for he/she/it, and the trip was two years ago.",
        "'Are traveling' is wrong: present continuous describes now, not two years ago.",
        "'Traveled' is correct: 'ago' marks a finished past time, so the past simple fits.",
      ],
    },
    {
      id: 'b03q08',
      levelId: 'b03',
      rule: 'past_simple_usage',
      prompt: 'The concert ___ at nine last night.',
      choices: ['starts', 'started', 'is starting', 'starting'],
      correctIndex: 1,
      choiceExplanations: [
        "'Starts' is wrong: present simple fits a schedule, but the concert was last night.",
        "'Started' is correct: 'last night' marks a finished past event.",
        "'Is starting' is wrong: present continuous describes now, not a past event.",
        "'Starting' is wrong: the -ing form needs a helper verb.",
      ],
    },
    {
      id: 'b03q09',
      levelId: 'b03',
      rule: 'past_simple_usage',
      prompt: 'I ___ my keys this morning.',
      choices: ['lose', 'am losing', 'lost', 'losing'],
      correctIndex: 2,
      choiceExplanations: [
        "'Lose' is wrong: the base form does not express a finished past action.",
        "'Am losing' is wrong: present continuous describes a process now, not an event this morning.",
        "'Lost' is correct: 'this morning' is a past time, so the past simple fits.",
        "'Losing' is wrong: the -ing form needs a helper verb.",
      ],
    },
    {
      id: 'b03q10',
      levelId: 'b03',
      rule: 'past_simple_usage',
      prompt: 'When ___ you move here?',
      choices: ['do', 'does', 'are', 'did'],
      correctIndex: 3,
      choiceExplanations: [
        "'Do' is wrong: 'do' is present, but the question is about a past move.",
        "'Does' is wrong: present simple for he/she/it, not a past question.",
        "'Are' is wrong: 'are' cannot form a question with the base verb 'move'.",
        "'Did' is correct: past-simple questions use 'did' + the base verb.",
      ],
    },
    // Recurring: present_simple_form (defined in b01)
    {
      id: 'b03q11',
      levelId: 'b03',
      rule: 'present_simple_form',
      prompt: 'My brother ___ chess on Sundays.',
      choices: ['play', 'is playing', 'plays', 'playing'],
      correctIndex: 2,
      choiceExplanations: [
        "'Play' is wrong: the base form is for I/you/we/they, not for he.",
        "'Is playing' is wrong: present continuous fits now, not 'on Sundays'.",
        "'Plays' is correct: a Sunday habit with 'my brother' (he) takes the present-simple -s form.",
        "'Playing' is wrong: the -ing form needs a helper verb.",
      ],
    },
    {
      id: 'b03q12',
      levelId: 'b03',
      rule: 'present_simple_form',
      prompt: '___ your parents work in the city?',
      choices: ['Does', 'Do', 'Is', 'Are'],
      correctIndex: 1,
      choiceExplanations: [
        "'Does' is wrong: 'does' is for he/she/it, but 'your parents' is plural.",
        "'Do' is correct: plural subjects take 'do' in present-simple questions.",
        "'Is' is wrong: the verb is 'work', not an -ing form, so this is not a continuous question.",
        "'Are' is wrong: 'are' cannot form a question with the base verb 'work'.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 4 — Past Continuous
// ─────────────────────────────────────────────────────────────────────────────

const pastContinuousLevel: Level = {
  id: 'b04',
  trackId: 'basic',
  number: 4,
  title: 'Past Continuous',
  topic: {
    title: 'Past Continuous',
    summary:
      'The past continuous describes an action that was in progress at a moment in the past, often interrupted by a shorter past-simple action.',
    rules: [
      {
        rule: 'past_continuous_form',
        title: 'Form: was/were + verb-ing',
        explanation:
          "Formed with was (I/he/she/it) or were (you/we/they) + the -ing form of the verb. It sets the background action in the past (I was reading).",
        example: 'They were playing football at five o’clock.',
      },
      {
        rule: 'past_simple_vs_continuous',
        title: 'Past Continuous vs Past Simple',
        explanation:
          'Use the past continuous for the longer background action in progress, and the past simple for the shorter action that interrupts it (While I was cooking, the phone rang). "When" often joins the interrupting action to the background one.',
        example: 'I was driving home when it started to rain.',
      },
    ],
  },
  questions: [
    {
      id: 'b04q01',
      levelId: 'b04',
      rule: 'past_continuous_form',
      prompt: 'At nine last night, we ___ dinner.',
      choices: ['had', 'were having', 'are having', 'having'],
      correctIndex: 1,
      choiceExplanations: [
        "'Had' is wrong: the past simple is a finished event; 'at nine last night' sets a moment in progress.",
        "'Were having' is correct: past continuous (were + having) describes an action in progress at a past moment.",
        "'Are having' is wrong: that is present continuous, but the moment was last night.",
        "'Having' is wrong: the -ing form needs was/were.",
      ],
    },
    {
      id: 'b04q02',
      levelId: 'b04',
      rule: 'past_continuous_form',
      prompt: 'I ___ TV when the lights went out.',
      choices: ['watched', 'am watching', 'was watching', 'watching'],
      correctIndex: 2,
      choiceExplanations: [
        "'Watched' is wrong: the past simple would make watching a finished event, but the watching was in progress when something happened.",
        "'Am watching' is wrong: present continuous describes now, not the past.",
        "'Was watching' is correct: past continuous (was + watching) sets the action in progress in the past.",
        "'Watching' is wrong: the -ing form needs a helper verb.",
      ],
    },
    {
      id: 'b04q03',
      levelId: 'b04',
      rule: 'past_continuous_form',
      prompt: 'They ___ football at five o’clock yesterday.',
      choices: ['were playing', 'played', 'are playing', 'play'],
      correctIndex: 0,
      choiceExplanations: [
        "'Were playing' is correct: 'at five o'clock yesterday' is a past moment, and past continuous shows the action in progress then.",
        "'Played' is wrong: the past simple is a finished event, not an action in progress at a set time.",
        "'Are playing' is wrong: present continuous describes now, not yesterday.",
        "'Play' is wrong: the present simple does not fit a past time.",
      ],
    },
    {
      id: 'b04q04',
      levelId: 'b04',
      rule: 'past_continuous_form',
      prompt: 'She ___ to music when I called.',
      choices: ['listened', 'was listening', 'is listening', 'listening'],
      correctIndex: 1,
      choiceExplanations: [
        "'Listened' is wrong: the past simple is a finished event, but the listening was in progress when I called.",
        "'Was listening' is correct: past continuous (was + listening) sets the action in progress at the moment of the call.",
        "'Is listening' is wrong: present continuous describes now, not the past.",
        "'Listening' is wrong: the -ing form needs a helper verb.",
      ],
    },
    {
      id: 'b04q05',
      levelId: 'b04',
      rule: 'past_continuous_form',
      prompt: 'We ___ home when the storm began.',
      choices: ['drive', 'were driving', 'drove', 'are driving'],
      correctIndex: 1,
      choiceExplanations: [
        "'Drive' is wrong: the base form does not fit a past action.",
        "'Were driving' is correct: past continuous (were + driving) describes the action in progress when the storm began.",
        "'Drove' is wrong: the past simple would present the driving as finished, not as background to the storm.",
        "'Are driving' is wrong: present continuous describes now, not the past.",
      ],
    },
    {
      id: 'b04q06',
      levelId: 'b04',
      rule: 'past_simple_vs_continuous',
      prompt: 'While I ___ , the phone rang.',
      choices: ['cooked', 'was cooking', 'cook', 'am cooking'],
      correctIndex: 1,
      choiceExplanations: [
        "'Cooked' is wrong: 'while' sets a longer action in progress, which needs the past continuous.",
        "'Was cooking' is correct: 'while' + past continuous sets the background action; the phone rang during it.",
        "'Cook' is wrong: the present simple does not fit a past action.",
        "'Am cooking' is wrong: present continuous describes now, not the past.",
      ],
    },
    {
      id: 'b04q07',
      levelId: 'b04',
      rule: 'past_simple_vs_continuous',
      prompt: 'When the teacher arrived, the students ___ .',
      choices: ['talked', 'were talking', 'are talking', 'talk'],
      correctIndex: 1,
      choiceExplanations: [
        "'Talked' is wrong: the past simple would make the talking finished before the teacher arrived, but it was still in progress.",
        "'Were talking' is correct: the students were in the middle of talking when the teacher arrived.",
        "'Are talking' is wrong: present continuous describes now, not the past.",
        "'Talk' is wrong: the present simple does not fit a past scene.",
      ],
    },
    {
      id: 'b04q08',
      levelId: 'b04',
      rule: 'past_simple_vs_continuous',
      prompt: 'It ___ when we left the house.',
      choices: ['rained', 'rains', 'was raining', 'is raining'],
      correctIndex: 2,
      choiceExplanations: [
        "'Rained' is wrong: the past simple presents the rain as a finished event, not as ongoing when we left.",
        "'Rains' is wrong: the present simple does not fit a past scene.",
        "'Was raining' is correct: the rain was in progress at the moment we left.",
        "'Is raining' is wrong: present continuous describes now, not the past.",
      ],
    },
    {
      id: 'b04q09',
      levelId: 'b04',
      rule: 'past_simple_vs_continuous',
      prompt: 'I ___ down the street when I saw an old friend.',
      choices: ['walk', 'was walking', 'walked', 'am walking'],
      correctIndex: 1,
      choiceExplanations: [
        "'Walk' is wrong: the base form does not fit a past action.",
        "'Was walking' is correct: past continuous sets the action in progress when the seeing happened.",
        "'Walked' is wrong: the past simple would present the walking as finished, but it was the background to seeing my friend.",
        "'Am walking' is wrong: present continuous describes now, not the past.",
      ],
    },
    {
      id: 'b04q10',
      levelId: 'b04',
      rule: 'past_simple_vs_continuous',
      prompt: 'They ___ chess when I came in.',
      choices: ['play', 'were playing', 'played', 'are playing'],
      correctIndex: 1,
      choiceExplanations: [
        "'Play' is wrong: the base form does not fit a past action.",
        "'Were playing' is correct: past continuous shows the game in progress when I came in.",
        "'Played' is wrong: the past simple would present the game as finished, not in progress.",
        "'Are playing' is wrong: present continuous describes now, not the past.",
      ],
    },
    // Recurring: past_simple_form (defined in b03)
    {
      id: 'b04q11',
      levelId: 'b04',
      rule: 'past_simple_form',
      prompt: 'We ___ to the beach last summer.',
      choices: ['went', 'go', 'goes', 'going'],
      correctIndex: 0,
      choiceExplanations: [
        "'Went' is correct: 'last summer' marks a finished past time, and 'went' is the irregular past of 'go'.",
        "'Go' is wrong: the base form does not fit a finished past trip.",
        "'Goes' is wrong: present simple for he/she/it, not a past event.",
        "'Going' is wrong: the -ing form needs a helper verb.",
      ],
    },
    {
      id: 'b04q12',
      levelId: 'b04',
      rule: 'past_simple_form',
      prompt: 'She ___ her homework before dinner.',
      choices: ['finish', 'finishes', 'finished', 'finishing'],
      correctIndex: 2,
      choiceExplanations: [
        "'Finish' is wrong: the base form does not express a finished past action.",
        "'Finishes' is wrong: present simple for she, but the homework is done.",
        "'Finished' is correct: 'finished' is the regular past-simple form of 'finish'.",
        "'Finishing' is wrong: the -ing form needs a helper verb.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 5 — Present Perfect
// ─────────────────────────────────────────────────────────────────────────────

const presentPerfectLevel: Level = {
  id: 'b05',
  trackId: 'basic',
  number: 5,
  title: 'Present Perfect',
  topic: {
    title: 'Present Perfect',
    summary:
      'The present perfect links the past to now: an action at an unspecified past time, a change, or an experience, whose result still matters. It is formed with has/have + the past participle.',
    rules: [
      {
        rule: 'present_perfect_form',
        title: 'Form: has/have + past participle',
        explanation:
          "Formed with has (he/she/it) or have (I/you/we/they) + the past participle (worked, gone, seen). Negatives add not (hasn't/haven't); questions put has/have before the subject. Words like just, already, yet, ever, never, and since often go with it.",
        example: 'She has already finished. / Have you ever been to Spain?',
      },
      {
        rule: 'present_perfect_vs_past_simple',
        title: 'Present Perfect vs Past Simple',
        explanation:
          'Use the present perfect when the exact time is not stated or when the result matters now (I have lost my keys — I cannot find them). Use the past simple when the time is finished and specific (I lost my keys yesterday).',
        example: 'He has visited Rome (experience). / He visited Rome in 2019 (specific past time).',
      },
    ],
  },
  questions: [
    {
      id: 'b05q01',
      levelId: 'b05',
      rule: 'present_perfect_form',
      prompt: 'She ___ her homework already.',
      choices: ['finished', 'has finished', 'is finishing', 'finishes'],
      correctIndex: 1,
      choiceExplanations: [
        "'Finished' is wrong: without a specific past time, the finished action that matters now needs the present perfect.",
        "'Has finished' is correct: 'already' signals the present perfect, and 'she' takes 'has'.",
        "'Is finishing' is wrong: present continuous means the action is still in progress.",
        "'Finishes' is wrong: the present simple describes a habit, not a completed action.",
      ],
    },
    {
      id: 'b05q02',
      levelId: 'b05',
      rule: 'present_perfect_form',
      prompt: 'We ___ this film twice.',
      choices: ['see', 'have seen', 'saw', 'are seeing'],
      correctIndex: 1,
      choiceExplanations: [
        "'See' is wrong: the base form does not express a completed experience.",
        "'Have seen' is correct: 'we' takes 'have' + the past participle for an experience up to now.",
        "'Saw' is wrong: the past simple needs a specific past time, which is not given here.",
        "'Are seeing' is wrong: present continuous describes the action happening now.",
      ],
    },
    {
      id: 'b05q03',
      levelId: 'b05',
      rule: 'present_perfect_form',
      prompt: 'I ___ never been to Japan.',
      choices: ['have', 'has', 'am', 'did'],
      correctIndex: 0,
      choiceExplanations: [
        "'Have' is correct: 'I' takes 'have' + the past participle in the present perfect.",
        "'Has' is wrong: 'has' is used with he/she/it, not with 'I'.",
        "'Am' is wrong: 'am' would start a present-continuous form, but 'been' needs 'have'.",
        "'Did' is wrong: 'did' makes a past-simple question and cannot precede 'been'.",
      ],
    },
    {
      id: 'b05q04',
      levelId: 'b05',
      rule: 'present_perfect_form',
      prompt: '___ you ever eaten sushi?',
      choices: ['Did', 'Have', 'Do', 'Are'],
      correctIndex: 1,
      choiceExplanations: [
        "'Did' is wrong: 'did' makes a past-simple question and does not go with the participle 'eaten'.",
        "'Have' is correct: present-perfect questions about experience use 'have' + past participle.",
        "'Do' is wrong: 'do' cannot precede the participle 'eaten'.",
        "'Are' is wrong: 'are' would need an -ing form, not 'eaten'.",
      ],
    },
    {
      id: 'b05q05',
      levelId: 'b05',
      rule: 'present_perfect_form',
      prompt: 'He ___ just left.',
      choices: ['has', 'have', 'is', 'did'],
      correctIndex: 0,
      choiceExplanations: [
        "'Has' is correct: 'he' takes 'has' with the participle 'left', and 'just' signals a very recent event.",
        "'Have' is wrong: 'have' is used with I/you/we/they, not with he.",
        "'Is' is wrong: 'is' would make a continuous form, but 'left' is a participle.",
        "'Did' is wrong: 'did' makes a past-simple form and does not go with 'just left'.",
      ],
    },
    {
      id: 'b05q06',
      levelId: 'b05',
      rule: 'present_perfect_form',
      prompt: 'They haven’t ___ the report yet.',
      choices: ['wrote', 'write', 'written', 'writing'],
      correctIndex: 2,
      choiceExplanations: [
        "'Wrote' is wrong: 'wrote' is the past simple form and does not follow 'haven't'.",
        "'Write' is wrong: after 'haven't', the main verb must be the past participle.",
        "'Written' is correct: 'haven't' + the past participle 'written' forms the present perfect.",
        "'Writing' is wrong: the -ing form does not follow 'haven't'.",
      ],
    },
    {
      id: 'b05q07',
      levelId: 'b05',
      rule: 'present_perfect_vs_past_simple',
      prompt: 'I ___ my keys. I can’t find them anywhere.',
      choices: ['lost', 'have lost', 'lose', 'am losing'],
      correctIndex: 1,
      choiceExplanations: [
        "'Lost' is wrong: the past simple would need a specific past time, and here the result matters now.",
        "'Have lost' is correct: the loss happened in the past and its result (I can't find them) matters now.",
        "'Lose' is wrong: the present simple does not fit a finished past event.",
        "'Am losing' is wrong: present continuous means I am losing them right now, which is not the meaning.",
      ],
    },
    {
      id: 'b05q08',
      levelId: 'b05',
      rule: 'present_perfect_vs_past_simple',
      prompt: 'She ___ Paris in 2019.',
      choices: ['has visited', 'visits', 'visited', 'is visiting'],
      correctIndex: 2,
      choiceExplanations: [
        "'Has visited' is wrong: 'in 2019' is a finished, specific past time, which belongs with the past simple.",
        "'Visits' is wrong: the present simple does not fit a past event.",
        "'Visited' is correct: a specific finished time ('in 2019') takes the past simple.",
        "'Is visiting' is wrong: present continuous describes the visit happening now.",
      ],
    },
    {
      id: 'b05q09',
      levelId: 'b05',
      rule: 'present_perfect_vs_past_simple',
      prompt: 'We ___ here since 2020.',
      choices: ['lived', 'have lived', 'live', 'are living'],
      correctIndex: 1,
      choiceExplanations: [
        "'Lived' is wrong: the past simple would make the living finished, but it continues to now.",
        "'Have lived' is correct: 'since 2020' connects the past to the present, so the present perfect fits.",
        "'Live' is wrong: the present simple cannot express a period that began in the past.",
        "'Are living' is wrong: present continuous describes now, not a period from 2020.",
      ],
    },
    {
      id: 'b05q10',
      levelId: 'b05',
      rule: 'present_perfect_vs_past_simple',
      prompt: 'He ___ his leg, so he can’t play today.',
      choices: ['breaks', 'broke', 'has broken', 'is breaking'],
      correctIndex: 2,
      choiceExplanations: [
        "'Breaks' is wrong: the present simple does not fit a past accident.",
        "'Broke' is wrong: the past simple focuses on the past event, but here the result (can't play) matters now.",
        "'Has broken' is correct: the accident is in the past and its result matters now, so the present perfect fits.",
        "'Is breaking' is wrong: present continuous means it is happening right now.",
      ],
    },
    // Recurring: past_simple_form (defined in b03)
    {
      id: 'b05q11',
      levelId: 'b05',
      rule: 'past_simple_form',
      prompt: 'They ___ the museum last week.',
      choices: ['visited', 'visit', 'visits', 'visiting'],
      correctIndex: 0,
      choiceExplanations: [
        "'Visited' is correct: 'last week' marks a finished past time, so the past simple fits.",
        "'Visit' is wrong: the base form does not express a finished past action.",
        "'Visits' is wrong: present simple for he/she/it, not a past event.",
        "'Visiting' is wrong: the -ing form needs a helper verb.",
      ],
    },
    {
      id: 'b05q12',
      levelId: 'b05',
      rule: 'past_simple_form',
      prompt: 'I ___ a great book last month.',
      choices: ['read', 'reads', 'reading', 'am read'],
      correctIndex: 0,
      choiceExplanations: [
        "'Read' is correct: the past-simple form of 'read' is spelled the same but pronounced like 'red', and 'last month' is a finished past time.",
        "'Reads' is wrong: present simple for he/she/it, not a past event.",
        "'Reading' is wrong: the -ing form needs a helper verb.",
        "'Am read' is wrong: that is passive voice; the sentence needs an active past verb.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 6 — Future: will and going to
// ─────────────────────────────────────────────────────────────────────────────

const futureLevel: Level = {
  id: 'b06',
  trackId: 'basic',
  number: 6,
  title: 'Future: will and going to',
  topic: {
    title: 'Future: will and going to',
    summary:
      'English has two common ways to talk about the future: will + base verb for predictions and spontaneous decisions, and (be) going to + base verb for plans and intentions.',
    rules: [
      {
        rule: 'future_will',
        title: 'Form: will + base verb',
        explanation:
          "Formed with will + the base verb (will go, will see). It is the same for all subjects, and the negative is won't (will not). Use it for predictions, promises, offers, and decisions made at the moment of speaking.",
        example: 'I think it will rain later. / I’ll help you carry that.',
      },
      {
        rule: 'will_vs_going_to',
        title: 'Will vs Going to',
        explanation:
          "Use be going to for plans made before the moment of speaking and for predictions based on present evidence (Look at those clouds — it's going to rain). Use will for spontaneous decisions and general predictions (I'll answer the phone).",
        example: 'We are going to move next month (plan). / The doorbell is ringing — I’ll get it (spontaneous).',
      },
    ],
  },
  questions: [
    {
      id: 'b06q01',
      levelId: 'b06',
      rule: 'future_will',
      prompt: 'Don’t worry. I ___ help you.',
      choices: ['am helping', 'will', 'will be', 'do'],
      correctIndex: 1,
      choiceExplanations: [
        "'Am helping' is wrong: the offer is made now, not an action already in progress.",
        "'Will' is correct: a spontaneous offer at the moment of speaking takes 'will'.",
        "'Will be' is wrong: 'will be help' is not a correct form — 'will' is followed by the base verb.",
        "'Do' is wrong: 'do' is present simple and does not express a future offer.",
      ],
    },
    {
      id: 'b06q02',
      levelId: 'b06',
      rule: 'future_will',
      prompt: 'I think it ___ rain this afternoon.',
      choices: ['will', 'rains', 'is raining', 'rained'],
      correctIndex: 0,
      choiceExplanations: [
        "'Will' is correct: 'I think' introduces a prediction, which takes 'will' + base verb.",
        "'Rains' is wrong: the present simple describes a habit, not a future prediction.",
        "'Is raining' is wrong: present continuous means it is raining now, not later.",
        "'Rained' is wrong: the past simple does not fit a future prediction.",
      ],
    },
    {
      id: 'b06q03',
      levelId: 'b06',
      rule: 'future_will',
      prompt: 'I promise I ___ call you tonight.',
      choices: ['am calling', 'will call', 'call', 'called'],
      correctIndex: 1,
      choiceExplanations: [
        "'Am calling' is wrong: present continuous means the call is happening now, not a promise for later.",
        "'Will call' is correct: a promise about the future takes 'will' + base verb.",
        "'Call' is wrong: the present simple does not express a future promise.",
        "'Called' is wrong: the past simple does not fit a future promise.",
      ],
    },
    {
      id: 'b06q04',
      levelId: 'b06',
      rule: 'future_will',
      prompt: '___ you open the window, please?',
      choices: ['Are', 'Do', 'Will', 'Does'],
      correctIndex: 2,
      choiceExplanations: [
        "'Are' is wrong: 'are' would need an -ing form, not the base verb 'open'.",
        "'Do' is wrong: a polite request about the future takes 'will', not 'do'.",
        "'Will' is correct: 'will' forms a polite request about the future.",
        "'Does' is wrong: 'does' is present simple and does not fit this request.",
      ],
    },
    {
      id: 'b06q05',
      levelId: 'b06',
      rule: 'will_vs_going_to',
      prompt: 'Look at those clouds! It ___ rain.',
      choices: ['will', 'is going to', 'rains', 'rained'],
      correctIndex: 1,
      choiceExplanations: [
        "'Will' is wrong: 'will' makes a general prediction, but here there is visible evidence in the clouds.",
        "'Is going to' is correct: predictions based on present evidence take 'going to'.",
        "'Rains' is wrong: the present simple does not fit a future prediction.",
        "'Rained' is wrong: the past simple does not fit a prediction about now.",
      ],
    },
    {
      id: 'b06q06',
      levelId: 'b06',
      rule: 'will_vs_going_to',
      prompt: 'I ___ a doctor when I grow up.',
      choices: ['am going to be', 'will be', 'am', 'be'],
      correctIndex: 0,
      choiceExplanations: [
        "'Am going to be' is correct: a long-held intention for the future takes 'going to'.",
        "'Will be' is wrong: 'will' suits a spontaneous decision, but this is a considered intention.",
        "'Am' is wrong: 'am' alone cannot express a future intention with 'a doctor'.",
        "'Be' is wrong: 'be' needs an auxiliary to form a future.",
      ],
    },
    {
      id: 'b06q07',
      levelId: 'b06',
      rule: 'will_vs_going_to',
      prompt: 'The phone is ringing. I ___ it!',
      choices: ['am going to answer', 'will answer', 'answer', 'answered'],
      correctIndex: 1,
      choiceExplanations: [
        "'Am going to answer' is wrong: 'going to' fits a pre-planned action, but this decision is made at the moment of speaking.",
        "'Will answer' is correct: a spontaneous decision made now takes 'will'.",
        "'Answer' is wrong: the present simple does not fit an immediate future decision.",
        "'Answered' is wrong: the past simple does not fit a future action.",
      ],
    },
    {
      id: 'b06q08',
      levelId: 'b06',
      rule: 'will_vs_going_to',
      prompt: 'We ___ dinner with friends tomorrow — we booked a table.',
      choices: ['will have', 'have', 'are going to have', 'had'],
      correctIndex: 2,
      choiceExplanations: [
        "'Will have' is wrong: the dinner was arranged before speaking, so 'going to' fits better.",
        "'Have' is wrong: the present simple does not express a future arrangement.",
        "'Are going to have' is correct: a pre-arranged plan takes 'going to'.",
        "'Had' is wrong: the past simple does not fit a future event.",
      ],
    },
    {
      id: 'b06q09',
      levelId: 'b06',
      rule: 'future_will',
      prompt: 'She ___ probably pass the exam.',
      choices: ['passes', 'will pass', 'is passing', 'passed'],
      correctIndex: 1,
      choiceExplanations: [
        "'Passes' is wrong: the present simple does not express a future prediction.",
        "'Will pass' is correct: 'probably' marks a prediction, which takes 'will'.",
        "'Is passing' is wrong: present continuous means the exam is happening now.",
        "'Passed' is wrong: the past simple does not fit a future prediction.",
      ],
    },
    {
      id: 'b06q10',
      levelId: 'b06',
      rule: 'will_vs_going_to',
      prompt: 'It’s decided: we ___ a new house.',
      choices: ['will buy', 'buy', 'bought', 'are going to buy'],
      correctIndex: 3,
      choiceExplanations: [
        "'Will buy' is wrong: 'it's decided' signals a plan made before speaking, so 'going to' fits.",
        "'Buy' is wrong: the present simple does not express a future plan.",
        "'Bought' is wrong: the past simple does not fit a future event.",
        "'Are going to buy' is correct: a firm plan made before the moment of speaking takes 'going to'.",
      ],
    },
    // Recurring: present_continuous_form (defined in b02) — future arrangements
    {
      id: 'b06q11',
      levelId: 'b06',
      rule: 'present_continuous_form',
      prompt: 'We ___ lunch with Sam tomorrow at one.',
      choices: ['have', 'are having', 'had', 'having'],
      correctIndex: 1,
      choiceExplanations: [
        "'Have' is wrong: the present simple does not express an arranged future event.",
        "'Are having' is correct: the present continuous is often used for fixed future arrangements.",
        "'Had' is wrong: the past simple does not fit a future event.",
        "'Having' is wrong: the -ing form needs am/is/are.",
      ],
    },
    {
      id: 'b06q12',
      levelId: 'b06',
      rule: 'present_continuous_form',
      prompt: 'They ___ to Paris next week — the tickets are booked.',
      choices: ['are flying', 'fly', 'flew', 'flying'],
      correctIndex: 0,
      choiceExplanations: [
        "'Are flying' is correct: the present continuous expresses a fixed future arrangement.",
        "'Fly' is wrong: the present simple does not express a booked future trip.",
        "'Flew' is wrong: the past simple does not fit a future event.",
        "'Flying' is wrong: the -ing form needs am/is/are.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 7 — Modal verbs: can, could, must, should
// ─────────────────────────────────────────────────────────────────────────────

const modalLevel: Level = {
  id: 'b07',
  trackId: 'basic',
  number: 7,
  title: 'Modal verbs: can, could, must, should',
  topic: {
    title: 'Modal verbs: can, could, must, should',
    summary:
      'Modal verbs add meaning like ability, permission, obligation, and advice. They never change form and are always followed by the base verb.',
    rules: [
      {
        rule: 'modal_ability_permission',
        title: 'Ability and permission: can and could',
        explanation:
          "Use can for ability and permission in the present (She can swim; Can I go out?), and could for past ability or polite requests (When I was young, I could run fast; Could you help me?). Modals never add -s and take the base verb.",
        example: 'He can speak three languages. / Could I borrow your pen?',
      },
      {
        rule: 'modal_obligation_advice',
        title: 'Obligation and advice: must and should',
        explanation:
          "Use must for strong obligation or necessity (You must wear a seatbelt), mustn't for prohibition (You mustn't smoke here), should for advice (You should rest), and don't have to for absence of necessity (You don't have to pay).",
        example: 'You should drink more water. / You must not park here.',
      },
    ],
  },
  questions: [
    {
      id: 'b07q01',
      levelId: 'b07',
      rule: 'modal_ability_permission',
      prompt: 'She ___ speak three languages.',
      choices: ['can', 'cans', 'can to', 'is can'],
      correctIndex: 0,
      choiceExplanations: [
        "'Can' is correct: 'can' expresses ability and is followed by the base verb 'speak'.",
        "'Cans' is wrong: modals never add -s, even for he/she/it.",
        "'Can to' is wrong: modals are followed by the base verb without 'to'.",
        "'Is can' is wrong: 'can' is not used with 'is'.",
      ],
    },
    {
      id: 'b07q02',
      levelId: 'b07',
      rule: 'modal_ability_permission',
      prompt: 'When I was young, I ___ run very fast.',
      choices: ['can', 'could', 'caned', 'am'],
      correctIndex: 1,
      choiceExplanations: [
        "'Can' is wrong: 'can' expresses present ability, but this is about the past.",
        "'Could' is correct: 'could' expresses past ability.",
        "'Caned' is wrong: modals do not have past forms like '-ed'.",
        "'Am' is wrong: 'am' cannot express ability.",
      ],
    },
    {
      id: 'b07q03',
      levelId: 'b07',
      rule: 'modal_ability_permission',
      prompt: '___ I borrow your pen?',
      choices: ['Can', 'Cans', 'To can', 'Is'],
      correctIndex: 0,
      choiceExplanations: [
        "'Can' is correct: 'can' asks for permission in a present question.",
        "'Cans' is wrong: modals never add -s.",
        "'To can' is wrong: 'to' never precedes a modal.",
        "'Is' is wrong: 'is' cannot ask this permission question with 'borrow'.",
      ],
    },
    {
      id: 'b07q04',
      levelId: 'b07',
      rule: 'modal_ability_permission',
      prompt: 'He ___ swim when he was five.',
      choices: ['can', 'could', 'cans', 'is'],
      correctIndex: 1,
      choiceExplanations: [
        "'Can' is wrong: 'can' is present, but the swimming is in the past.",
        "'Could' is correct: 'could' expresses past ability.",
        "'Cans' is wrong: modals never add -s.",
        "'Is' is wrong: 'is' cannot express ability.",
      ],
    },
    {
      id: 'b07q05',
      levelId: 'b07',
      rule: 'modal_obligation_advice',
      prompt: 'You ___ wear a helmet on a motorbike.',
      choices: ['must', 'must to', 'can', 'is'],
      correctIndex: 0,
      choiceExplanations: [
        "'Must' is correct: 'must' expresses strong obligation.",
        "'Must to' is wrong: modals are followed by the base verb without 'to'.",
        "'Can' is wrong: 'can' expresses ability or permission, not a legal obligation.",
        "'Is' is wrong: 'is' cannot express obligation with 'wear'.",
      ],
    },
    {
      id: 'b07q06',
      levelId: 'b07',
      rule: 'modal_obligation_advice',
      prompt: 'You look tired. You ___ go to bed.',
      choices: ['must', 'should', 'can', 'is'],
      correctIndex: 1,
      choiceExplanations: [
        "'Must' is wrong: 'must' is too strong for a suggestion based on how someone looks.",
        "'Should' is correct: 'should' gives advice, which fits the situation.",
        "'Can' is wrong: 'can' expresses ability, not advice.",
        "'Is' is wrong: 'is' cannot form this advice sentence.",
      ],
    },
    {
      id: 'b07q07',
      levelId: 'b07',
      rule: 'modal_obligation_advice',
      prompt: 'You ___ smoke here — the sign says it’s forbidden.',
      choices: ['mustn’t', 'must to', 'don’t have to', 'is must'],
      correctIndex: 0,
      choiceExplanations: [
        "'Mustn't' is correct: 'mustn't' expresses prohibition.",
        "'Must to' is wrong: modals never take 'to'.",
        "'Don't have to' is wrong: that means 'it is not necessary', not 'it is forbidden'.",
        "'Is must' is wrong: 'is' is never combined with a modal.",
      ],
    },
    {
      id: 'b07q08',
      levelId: 'b07',
      rule: 'modal_obligation_advice',
      prompt: 'We ___ pay for the tickets; they’re free.',
      choices: ['don’t have to', 'mustn’t', 'must', 'should'],
      correctIndex: 0,
      choiceExplanations: [
        "'Don't have to' is correct: the tickets are free, so paying is not necessary.",
        "'Mustn't' is wrong: that means it is forbidden to pay, which is not the meaning.",
        "'Must' is wrong: 'must pay' means it is necessary, but the tickets are free.",
        "'Should' is wrong: 'should pay' would be advice, not a statement of no necessity.",
      ],
    },
    {
      id: 'b07q09',
      levelId: 'b07',
      rule: 'modal_obligation_advice',
      prompt: 'If you have a headache, you ___ take a rest.',
      choices: ['should', 'should to', 'is should', 'can to'],
      correctIndex: 0,
      choiceExplanations: [
        "'Should' is correct: 'should' gives advice, which fits a health suggestion.",
        "'Should to' is wrong: modals are followed by the base verb without 'to'.",
        "'Is should' is wrong: 'is' is never combined with a modal.",
        "'Can to' is wrong: 'to' never follows a modal.",
      ],
    },
    {
      id: 'b07q10',
      levelId: 'b07',
      rule: 'modal_ability_permission',
      prompt: '___ I use your phone, please?',
      choices: ['Do', 'Can', 'Cans', 'Is'],
      correctIndex: 1,
      choiceExplanations: [
        "'Do' is wrong: 'do' cannot ask this permission question with 'use'.",
        "'Can' is correct: 'can' asks for permission politely.",
        "'Cans' is wrong: modals never add -s.",
        "'Is' is wrong: 'is' cannot form this question with the base verb 'use'.",
      ],
    },
    // Recurring: present_simple_form (defined in b01)
    {
      id: 'b07q11',
      levelId: 'b07',
      rule: 'present_simple_form',
      prompt: 'My cousin ___ in a pharmacy.',
      choices: ['work', 'works', 'working', 'is work'],
      correctIndex: 1,
      choiceExplanations: [
        "'Work' is wrong: the base form is for I/you/we/they, not for he/she.",
        "'Works' is correct: 'my cousin' (he/she) takes the present-simple -s form.",
        "'Working' is wrong: the -ing form needs a helper verb.",
        "'Is work' is wrong: 'is' is never followed by the base verb.",
      ],
    },
    {
      id: 'b07q12',
      levelId: 'b07',
      rule: 'present_simple_form',
      prompt: '___ your teacher give you homework every day?',
      choices: ['Does', 'Do', 'Is', 'Are'],
      correctIndex: 0,
      choiceExplanations: [
        "'Does' is correct: 'your teacher' (he/she) takes 'does' in a present-simple question.",
        "'Do' is wrong: 'do' is used with I/you/we/they, not with a singular subject like 'your teacher'.",
        "'Is' is wrong: the verb is 'give', not an -ing form, so this is not a continuous question.",
        "'Are' is wrong: 'are' cannot form this question with the base verb 'give'.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 8 — Articles: a/an/the
// ─────────────────────────────────────────────────────────────────────────────

const articlesLevel: Level = {
  id: 'b08',
  trackId: 'basic',
  number: 8,
  title: 'Articles: a, an, the',
  topic: {
    title: 'Articles: a, an, the',
    summary:
      'Use a or an for one non-specific thing, the for something specific or already known, and no article for general plurals and uncountable nouns.',
    rules: [
      {
        rule: 'articles_a_an',
        title: 'a vs an',
        explanation:
          "Use a before a consonant sound and an before a vowel sound: a book, an apple, an hour (h is silent), a university (starts with a 'y' sound). The choice follows the sound, not the letter.",
        example: 'She is a teacher. / He waited for an hour.',
      },
      {
        rule: 'articles_the_zero',
        title: 'the vs no article',
        explanation:
          "Use the when the listener knows which one — something specific or unique (the sun, the book I told you about). Use no article for general plurals and uncountable nouns (Dogs are loyal; I love music).",
        example: 'The water in this glass is cold. / Cats like milk.',
      },
    ],
  },
  questions: [
    {
      id: 'b08q01',
      levelId: 'b08',
      rule: 'articles_a_an',
      prompt: 'I saw ___ elephant at the zoo.',
      choices: ['a', 'an', 'the', 'nothing'],
      correctIndex: 1,
      choiceExplanations: [
        "'A' is wrong: 'elephant' starts with a vowel sound, so it takes 'an'.",
        "'An' is correct: 'elephant' begins with a vowel sound.",
        "'The' is wrong: 'the' would mean a specific, known elephant, but this is the first mention.",
        "'Nothing' is wrong: a singular countable noun like 'elephant' needs an article.",
      ],
    },
    {
      id: 'b08q02',
      levelId: 'b08',
      rule: 'articles_a_an',
      prompt: 'She is ___ doctor.',
      choices: ['a', 'an', 'the', 'nothing'],
      correctIndex: 0,
      choiceExplanations: [
        "'A' is correct: 'doctor' starts with a consonant sound and is one non-specific doctor.",
        "'An' is wrong: 'an' is used before vowel sounds, and 'doctor' begins with a consonant.",
        "'The' is wrong: 'the' would name a specific doctor, but we are naming her profession.",
        "'Nothing' is wrong: a singular countable noun naming a job needs an article.",
      ],
    },
    {
      id: 'b08q03',
      levelId: 'b08',
      rule: 'articles_a_an',
      prompt: 'He waited for ___ hour.',
      choices: ['a', 'an', 'the', 'nothing'],
      correctIndex: 1,
      choiceExplanations: [
        "'A' is wrong: in 'hour', the 'h' is silent, so the word starts with a vowel sound and takes 'an'.",
        "'An' is correct: 'hour' starts with a vowel sound (silent 'h').",
        "'The' is wrong: 'the' would mean a specific known hour, but this is one hour in general.",
        "'Nothing' is wrong: a singular countable noun like 'hour' needs an article.",
      ],
    },
    {
      id: 'b08q04',
      levelId: 'b08',
      rule: 'articles_a_an',
      prompt: 'They live in ___ university town.',
      choices: ['a', 'an', 'the', 'nothing'],
      correctIndex: 0,
      choiceExplanations: [
        "'A' is correct: 'university' starts with a 'y' (consonant) sound, so it takes 'a'.",
        "'An' is wrong: 'university' starts with a consonant sound despite its first letter being 'u'.",
        "'The' is wrong: 'the' would mean a specific known town, but this is one university town in general.",
        "'Nothing' is wrong: 'town' is a singular countable noun and needs an article.",
      ],
    },
    {
      id: 'b08q05',
      levelId: 'b08',
      rule: 'articles_a_an',
      prompt: 'We need ___ umbrella.',
      choices: ['a', 'an', 'the', 'nothing'],
      correctIndex: 1,
      choiceExplanations: [
        "'A' is wrong: 'umbrella' starts with a vowel sound, so it takes 'an'.",
        "'An' is correct: 'umbrella' begins with a vowel sound.",
        "'The' is wrong: 'the' would mean a specific umbrella already known, but this is any umbrella.",
        "'Nothing' is wrong: a singular countable noun like 'umbrella' needs an article.",
      ],
    },
    {
      id: 'b08q06',
      levelId: 'b08',
      rule: 'articles_the_zero',
      prompt: 'I love ___ music.',
      choices: ['the', 'a', 'an', 'nothing'],
      correctIndex: 3,
      choiceExplanations: [
        "'The' is wrong: 'the music' would mean specific music, but here music is a general idea.",
        "'A' is wrong: 'music' is uncountable and cannot take 'a'.",
        "'An' is wrong: 'an' is for singular countable nouns, and 'music' is uncountable.",
        "'Nothing' is correct: uncountable nouns in a general meaning take no article.",
      ],
    },
    {
      id: 'b08q07',
      levelId: 'b08',
      rule: 'articles_the_zero',
      prompt: '___ sun rises in the east.',
      choices: ['A', 'An', 'The', 'nothing'],
      correctIndex: 2,
      choiceExplanations: [
        "'A' is wrong: there is only one sun, so the definite article fits.",
        "'An' is wrong: 'an' is for non-specific singular nouns with vowel sounds.",
        "'The' is correct: the sun is unique, so it takes 'the'.",
        "'Nothing' is wrong: a unique noun like 'sun' needs the definite article.",
      ],
    },
    {
      id: 'b08q08',
      levelId: 'b08',
      rule: 'articles_the_zero',
      prompt: '___ water in this glass is cold.',
      choices: ['A', 'An', 'The', 'nothing'],
      correctIndex: 2,
      choiceExplanations: [
        "'A' is wrong: 'water' is uncountable and cannot take 'a'.",
        "'An' is wrong: 'an' is for singular countable nouns.",
        "'The' is correct: we mean the specific water in this glass, so 'the' fits.",
        "'Nothing' is wrong: no article would mean water in general, but we mean this specific glass.",
      ],
    },
    {
      id: 'b08q09',
      levelId: 'b08',
      rule: 'articles_the_zero',
      prompt: '___ dogs are loyal animals.',
      choices: ['The', 'A', 'An', 'nothing'],
      correctIndex: 3,
      choiceExplanations: [
        "'The' is wrong: 'the dogs' would mean particular dogs, but this is about dogs in general.",
        "'A' is wrong: 'dogs' is plural and cannot take 'a'.",
        "'An' is wrong: 'an' is for singular countable nouns.",
        "'Nothing' is correct: general plural nouns take no article.",
      ],
    },
    {
      id: 'b08q10',
      levelId: 'b08',
      rule: 'articles_the_zero',
      prompt: 'We visited ___ Eiffel Tower.',
      choices: ['a', 'an', 'the', 'nothing'],
      correctIndex: 2,
      choiceExplanations: [
        "'A' is wrong: the Eiffel Tower is a unique, well-known landmark, so 'a' is wrong.",
        "'An' is wrong: 'an' is for non-specific nouns with vowel sounds.",
        "'The' is correct: unique landmarks take the definite article.",
        "'Nothing' is wrong: a specific unique landmark needs 'the'.",
      ],
    },
    // Recurring: present_simple_form (defined in b01)
    {
      id: 'b08q11',
      levelId: 'b08',
      rule: 'present_simple_form',
      prompt: 'The baby ___ when she is hungry.',
      choices: ['cries', 'cry', 'crying', 'is cry'],
      correctIndex: 0,
      choiceExplanations: [
        "'Cries' is correct: 'the baby' (she) takes the present-simple -es form.",
        "'Cry' is wrong: the base form is for I/you/we/they, not for she.",
        "'Crying' is wrong: the -ing form needs a helper verb.",
        "'Is cry' is wrong: 'is' is never followed by the base verb.",
      ],
    },
    {
      id: 'b08q12',
      levelId: 'b08',
      rule: 'present_simple_form',
      prompt: 'My parents ___ early every day.',
      choices: ['wakes', 'wake', 'waking', 'is wake'],
      correctIndex: 1,
      choiceExplanations: [
        "'Wakes' is wrong: -s is for he/she/it, and 'my parents' is plural.",
        "'Wake' is correct: a daily habit with a plural subject takes the base form.",
        "'Waking' is wrong: the -ing form needs a helper verb.",
        "'Is wake' is wrong: 'is' is never followed by the base verb.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 9 — Comparatives and Superlatives
// ─────────────────────────────────────────────────────────────────────────────

const comparativesLevel: Level = {
  id: 'b09',
  trackId: 'basic',
  number: 9,
  title: 'Comparatives and Superlatives',
  topic: {
    title: 'Comparatives and Superlatives',
    summary:
      'Use the comparative to compare two things (taller, more expensive) and the superlative for three or more (the tallest, the most expensive).',
    rules: [
      {
        rule: 'comparatives',
        title: 'Form: -er or more + adjective',
        explanation:
          "Short adjectives add -er (tall → taller, big → bigger); longer adjectives use more (more expensive). Always compare with than (She is taller than me). Irregulars: good → better, bad → worse, far → farther.",
        example: 'This box is heavier than that one.',
      },
      {
        rule: 'superlatives',
        title: 'Form: the -est or the most + adjective',
        explanation:
          "Short adjectives add -est (tall → tallest, big → biggest); longer adjectives use the most (the most expensive). The superlative always takes the and usually mentions a group (the tallest in the class). Irregulars: good → best, bad → worst.",
        example: 'She is the best student in the class.',
      },
    ],
  },
  questions: [
    {
      id: 'b09q01',
      levelId: 'b09',
      rule: 'comparatives',
      prompt: 'A car is ___ than a bicycle.',
      choices: ['faster', 'more fast', 'fastest', 'fast'],
      correctIndex: 0,
      choiceExplanations: [
        "'Faster' is correct: short adjectives like 'fast' add -er in the comparative.",
        "'More fast' is wrong: 'more' is used with longer adjectives, not with a short one like 'fast'.",
        "'Fastest' is wrong: the superlative compares three or more, but this compares two things.",
        "'Fast' is wrong: the base form does not make a comparison with 'than'.",
      ],
    },
    {
      id: 'b09q02',
      levelId: 'b09',
      rule: 'comparatives',
      prompt: 'This book is ___ than that one.',
      choices: ['interestinger', 'more interesting', 'most interesting', 'interesting'],
      correctIndex: 1,
      choiceExplanations: [
        "'Interestinger' is wrong: long adjectives do not add -er.",
        "'More interesting' is correct: long adjectives like 'interesting' use 'more' in the comparative.",
        "'Most interesting' is wrong: 'most' is the superlative, but this compares just two books.",
        "'Interesting' is wrong: the base form does not make a comparison with 'than'.",
      ],
    },
    {
      id: 'b09q03',
      levelId: 'b09',
      rule: 'comparatives',
      prompt: 'My brother is taller ___ me.',
      choices: ['then', 'as', 'than', 'to'],
      correctIndex: 2,
      choiceExplanations: [
        "'Then' is wrong: 'then' is a time word; comparisons need 'than'.",
        "'As' is wrong: 'as' makes an equal comparison (as tall as), not a comparative.",
        "'Than' is correct: comparatives introduce the second item with 'than'.",
        "'To' is wrong: 'to' does not follow a comparative adjective.",
      ],
    },
    {
      id: 'b09q04',
      levelId: 'b09',
      rule: 'comparatives',
      prompt: 'Today is ___ than yesterday.',
      choices: ['hoter', 'more hot', 'hotter', 'hottest'],
      correctIndex: 2,
      choiceExplanations: [
        "'Hoter' is wrong: a short vowel-consonant word like 'hot' doubles the consonant before -er.",
        "'More hot' is wrong: 'more' is used with longer adjectives, not with 'hot'.",
        "'Hotter' is correct: 'hot' doubles the final consonant and adds -er.",
        "'Hottest' is wrong: the superlative compares three or more, not two days.",
      ],
    },
    {
      id: 'b09q05',
      levelId: 'b09',
      rule: 'superlatives',
      prompt: 'This is the ___ day of the year.',
      choices: ['hot', 'hotter', 'hottest', 'more hot'],
      correctIndex: 2,
      choiceExplanations: [
        "'Hot' is wrong: the base form does not compare within a group.",
        "'Hotter' is wrong: the comparative compares two; 'of the year' is a group of many.",
        "'Hottest' is correct: the superlative (the -est form) names the top of the group.",
        "'More hot' is wrong: 'more' is not used with a short adjective like 'hot'.",
      ],
    },
    {
      id: 'b09q06',
      levelId: 'b09',
      rule: 'superlatives',
      prompt: 'She is the ___ student in the class.',
      choices: ['most smart', 'smartest', 'smarter', 'smart'],
      correctIndex: 1,
      choiceExplanations: [
        "'Most smart' is wrong: short adjectives like 'smart' take -est, not 'most'.",
        "'Smartest' is correct: the superlative of a short adjective is the + adjective + -est.",
        "'Smarter' is wrong: the comparative compares two, not a whole class.",
        "'Smart' is wrong: the base form does not show rank in a group.",
      ],
    },
    {
      id: 'b09q07',
      levelId: 'b09',
      rule: 'superlatives',
      prompt: 'It was the ___ film I have ever seen.',
      choices: ['most boring', 'boringer', 'more boring', 'boring'],
      correctIndex: 0,
      choiceExplanations: [
        "'Most boring' is correct: long adjectives like 'boring' form the superlative with 'the most'.",
        "'Boringer' is wrong: long adjectives do not add -er.",
        "'More boring' is wrong: 'more' is the comparative; 'ever seen' signals the superlative.",
        "'Boring' is wrong: the base form does not rank within a group.",
      ],
    },
    {
      id: 'b09q08',
      levelId: 'b09',
      rule: 'superlatives',
      prompt: 'Tokyo is one of the ___ cities in the world.',
      choices: ['larger', 'largest', 'large', 'more large'],
      correctIndex: 1,
      choiceExplanations: [
        "'Larger' is wrong: the comparative compares two, but this is about all the cities in the world.",
        "'Largest' is correct: the superlative ranks Tokyo among all cities.",
        "'Large' is wrong: the base form does not show rank.",
        "'More large' is wrong: short adjectives take -est in the superlative, not 'more'.",
      ],
    },
    {
      id: 'b09q09',
      levelId: 'b09',
      rule: 'comparatives',
      prompt: 'This bag is ___ than mine.',
      choices: ['expensiveer', 'most expensive', 'more expensive', 'expensive'],
      correctIndex: 2,
      choiceExplanations: [
        "'Expensiveer' is wrong: long adjectives do not add -er.",
        "'Most expensive' is wrong: 'most' is the superlative, but this compares two bags.",
        "'More expensive' is correct: a long adjective like 'expensive' forms the comparative with 'more'.",
        "'Expensive' is wrong: the base form does not make a comparison with 'than'.",
      ],
    },
    {
      id: 'b09q10',
      levelId: 'b09',
      rule: 'superlatives',
      prompt: 'Of the three roads, this one is the ___.',
      choices: ['long', 'longer', 'longest', 'more long'],
      correctIndex: 2,
      choiceExplanations: [
        "'Long' is wrong: the base form does not rank within a group.",
        "'Longer' is wrong: the comparative compares two, but there are three roads.",
        "'Longest' is correct: with three roads, the superlative (the + -est) is right.",
        "'More long' is wrong: short adjectives take -est, not 'more'.",
      ],
    },
    // Recurring: articles_a_an (defined in b08)
    {
      id: 'b09q11',
      levelId: 'b09',
      rule: 'articles_a_an',
      prompt: 'He is ___ better player than me.',
      choices: ['a', 'an', 'the', 'nothing'],
      correctIndex: 0,
      choiceExplanations: [
        "'A' is correct: 'a better player' uses the indefinite article before a comparative noun phrase.",
        "'An' is wrong: 'better' starts with a consonant sound, so it takes 'a'.",
        "'The' is wrong: 'the' would mean a specific known player, but this is one player in general.",
        "'Nothing' is wrong: 'player' is a singular countable noun and needs an article.",
      ],
    },
    // Recurring: articles_the_zero (defined in b08)
    {
      id: 'b09q12',
      levelId: 'b09',
      rule: 'articles_the_zero',
      prompt: 'It was ___ most exciting match of the year.',
      choices: ['a', 'an', 'the', 'nothing'],
      correctIndex: 2,
      choiceExplanations: [
        "'A' is wrong: superlatives take 'the', not 'a'.",
        "'An' is wrong: 'an' is for non-specific nouns with vowel sounds, not for superlatives.",
        "'The' is correct: a superlative ('most exciting') always takes the definite article.",
        "'Nothing' is wrong: a specific superlative noun needs 'the'.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 10 — Past Perfect (the Task 4 reference level, renumbered to 10)
// ─────────────────────────────────────────────────────────────────────────────

const pastPerfectLevel: Level = {
  id: 'b10',
  trackId: 'basic',
  number: 10,
  title: 'Past Perfect',
  topic: {
    title: 'Past Perfect',
    summary: 'The past perfect describes an action completed before another past action.',
    rules: [
      {
        rule: 'past_perfect_form',
        title: 'Form: had + past participle',
        explanation: "Formed with 'had' + the past participle (worked, gone, seen).",
        example: 'They had finished dinner before we arrived.',
      },
      {
        rule: 'past_perfect_vs_past_simple',
        title: 'Past Perfect vs Past Simple',
        explanation: 'Use past simple for the later action and past perfect for the earlier one.',
        example: 'The train had left (earlier) by the time we arrived (later).',
      },
    ],
  },
  questions: [
    // ── past_perfect_form ──────────────────────────────────────────────
    {
      id: 'b10q01',
      levelId: 'b10',
      rule: 'past_perfect_form',
      prompt: 'By the time we arrived, the movie ___ .',
      choices: ['starts', 'had started', 'started', 'was started'],
      correctIndex: 1,
      choiceExplanations: [
        "'Starts' is present simple — wrong tense for a past event.",
        "'Had started' is correct: past perfect ('had' + past participle) marks the action as completed before we arrived.",
        "'Started' is past simple — it does not mark the movie as finished before the later past action.",
        "'Was started' is passive voice — wrong; the movie began, it was not begun by someone.",
      ],
    },
    {
      id: 'b10q02',
      levelId: 'b10',
      rule: 'past_perfect_form',
      prompt: 'She ___ her keys before leaving the house.',
      choices: ['locks', 'had locked', 'locked', 'has locked'],
      correctIndex: 1,
      choiceExplanations: [
        "'Locks' is present simple — wrong tense for a past event.",
        "'Had locked' is correct: the locking happened before the leaving, so past perfect fits.",
        "'Locked' is past simple — it does not mark the locking as earlier than the leaving.",
        "'Has locked' is present perfect — wrong; the leaving is a past event, so the earlier action needs past perfect.",
      ],
    },
    {
      id: 'b10q03',
      levelId: 'b10',
      rule: 'past_perfect_form',
      prompt: "The children ___ asleep by nine o'clock.",
      choices: ['fell', 'have fallen', 'had fallen', 'fall'],
      correctIndex: 2,
      choiceExplanations: [
        "'Fell' is past simple — it does not mark the falling asleep as completed by a past time.",
        "'Have fallen' is present perfect — wrong; nine o'clock is a past reference point.",
        "'Had fallen' is correct: past perfect for the action completed before a past time (nine o'clock).",
        "'Fall' is present simple — wrong tense for a past event.",
      ],
    },
    {
      id: 'b10q04',
      levelId: 'b10',
      rule: 'past_perfect_form',
      prompt: 'When I called, he ___ .',
      choices: ['already left', 'was already leaving', 'had already left', 'has already left'],
      correctIndex: 2,
      choiceExplanations: [
        "'Already left' is past simple — the leaving is not marked as earlier than the call.",
        "'Was already leaving' is past continuous — wrong; it shows the leaving in progress, not completed before the call.",
        "'Had already left' is correct: past perfect marks the leaving as completed before I called.",
        "'Has already left' is present perfect — wrong; the call is a past event, not a present one.",
      ],
    },
    {
      id: 'b10q05',
      levelId: 'b10',
      rule: 'past_perfect_form',
      prompt: 'After they ___, the meeting began.',
      choices: ['were sitting', 'sat down', 'have sat down', 'had sat down'],
      correctIndex: 3,
      choiceExplanations: [
        "'Were sitting' is past continuous — wrong; the meaning here is a completed action, not one in progress.",
        "'Sat down' is past simple — it does not mark the sitting as earlier than the meeting.",
        "'Have sat down' is present perfect — wrong; the meeting began in the past.",
        "'Had sat down' is correct: past perfect for the action completed before the meeting began.",
      ],
    },
    {
      id: 'b10q06',
      levelId: 'b10',
      rule: 'past_perfect_form',
      prompt: 'I ___ that place before, so I knew my way around.',
      choices: ['visited', 'had visited', 'was visiting', 'have visited'],
      correctIndex: 1,
      choiceExplanations: [
        "'Visited' is past simple — it does not mark the visit as earlier than the knowing.",
        "'Had visited' is correct: past perfect for the earlier visit, which explains the later knowing.",
        "'Was visiting' is past continuous — wrong; the visit is a completed earlier event.",
        "'Have visited' is present perfect — wrong; the following clause is in the past.",
      ],
    },
    // ── past_perfect_vs_past_simple ────────────────────────────────────
    {
      id: 'b10q07',
      levelId: 'b10',
      rule: 'past_perfect_vs_past_simple',
      prompt: 'By the time we got to the station, the train ___ .',
      choices: ['left', 'had left', 'has left', 'leaves'],
      correctIndex: 1,
      choiceExplanations: [
        "'Left' is past simple — fine for the later action, but the departure happened before we arrived, so the earlier action needs past perfect.",
        "'Had left' is correct: past perfect marks the earlier of two past actions.",
        "'Has left' is present perfect — wrong here; the departure is a completed past event before another past event.",
        "'Leaves' is present simple — wrong tense for any past context.",
      ],
    },
    {
      id: 'b10q08',
      levelId: 'b10',
      rule: 'past_perfect_vs_past_simple',
      prompt: 'She ___ her keys before I asked.',
      choices: ['already found', 'has already found', 'had already found', 'finds'],
      correctIndex: 2,
      choiceExplanations: [
        "'Already found' is past simple — the finding still needs to be marked as earlier than the asking.",
        "'Has already found' is present perfect — wrong; the asking is a past event, not a present one.",
        "'Had already found' is correct: past perfect for the action completed before the asking.",
        "'Finds' is present simple — wrong tense here.",
      ],
    },
    {
      id: 'b10q09',
      levelId: 'b10',
      rule: 'past_perfect_vs_past_simple',
      prompt: 'The waiter ___ our order before the kitchen closed.',
      choices: ['took', 'has taken', 'had taken', 'takes'],
      correctIndex: 2,
      choiceExplanations: [
        "'Took' is past simple — it does not mark the taking as earlier than the closing.",
        "'Has taken' is present perfect — wrong; the kitchen closed in the past.",
        "'Had taken' is correct: past perfect for the earlier action; the closing is the later past action.",
        "'Takes' is present simple — wrong tense for past events.",
      ],
    },
    {
      id: 'b10q10',
      levelId: 'b10',
      rule: 'past_perfect_vs_past_simple',
      prompt: 'We ___ the museum, so we stayed home.',
      choices: ['had visited', 'visited', 'visiting', 'have visited'],
      correctIndex: 0,
      choiceExplanations: [
        "'Had visited' is correct: past perfect shows the visit happened before the decision to stay home.",
        "'Visited' is past simple — the visit is not marked as earlier than the staying home.",
        "'Visiting' is not a finite verb — it cannot serve as the main verb of the sentence.",
        "'Have visited' is present perfect — wrong; the second clause is in the past.",
      ],
    },
    {
      id: 'b10q11',
      levelId: 'b10',
      rule: 'past_perfect_vs_past_simple',
      prompt: 'After the rain ___, we went for a walk.',
      choices: ['stops', 'has stopped', 'had stopped', 'stopped'],
      correctIndex: 2,
      choiceExplanations: [
        "'Stops' is present simple — wrong tense for past events.",
        "'Has stopped' is present perfect — wrong; the walk is a past event.",
        "'Had stopped' is correct: past perfect for the rain that stopped before we went out.",
        "'Stopped' is past simple — it does not mark the stopping as earlier than the walk.",
      ],
    },
    {
      id: 'b10q12',
      levelId: 'b10',
      rule: 'past_perfect_vs_past_simple',
      prompt: 'Before the lesson, I ___ the chapter twice.',
      choices: ['read', 'had read', 'am reading', 'have read'],
      correctIndex: 1,
      choiceExplanations: [
        "'Read' is past simple — it does not mark the reading as earlier than the lesson.",
        "'Had read' is correct: past perfect for the reading completed before the lesson.",
        "'Am reading' is present continuous — wrong tense for a completed earlier action.",
        "'Have read' is present perfect — wrong; the lesson is a past reference point.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 11 — Prepositions of time
// ─────────────────────────────────────────────────────────────────────────────

const prepositionsTimeLevel: Level = {
  id: 'b11',
  trackId: 'basic',
  number: 11,
  title: 'Prepositions of time',
  topic: {
    title: 'Prepositions of time',
    summary:
      'Prepositions of time connect an event to a time: at for clock times, on for days and dates, in for months, years, and parts of the day.',
    rules: [
      {
        rule: 'prepositions_time_in_on_at',
        title: 'in, on, at',
        explanation:
          "Use in with months, years, seasons, and parts of the day (in June, in 2020, in the morning); on with days and dates (on Monday, on 15 June); and at with clock times and 'night' (at six, at night).",
        example: 'The meeting is on Friday at three in the afternoon.',
      },
      {
        rule: 'prepositions_time_since_for_until',
        title: 'since, for, until',
        explanation:
          "Use since with a starting point (since 2018), for with a duration (for three years), and until/till for the end of a period (open until nine).",
        example: 'I have worked here since 2018, for almost seven years.',
      },
    ],
  },
  questions: [
    {
      id: 'b11q01',
      levelId: 'b11',
      rule: 'prepositions_time_in_on_at',
      prompt: 'The meeting is ___ Monday.',
      choices: ['in', 'on', 'at', 'for'],
      correctIndex: 1,
      choiceExplanations: [
        "'In' is wrong: 'in' is for months and years, not for days.",
        "'On' is correct: days of the week take 'on'.",
        "'At' is wrong: 'at' is for clock times, not days.",
        "'For' is wrong: 'for' expresses a duration, not a day.",
      ],
    },
    {
      id: 'b11q02',
      levelId: 'b11',
      rule: 'prepositions_time_in_on_at',
      prompt: 'I was born ___ 1995.',
      choices: ['at', 'on', 'in', 'since'],
      correctIndex: 2,
      choiceExplanations: [
        "'At' is wrong: 'at' is for clock times, not years.",
        "'On' is wrong: 'on' is for days and dates, not years.",
        "'In' is correct: years take 'in'.",
        "'Since' is wrong: 'since' marks a starting point for a continuing period, not a birth year.",
      ],
    },
    {
      id: 'b11q03',
      levelId: 'b11',
      rule: 'prepositions_time_in_on_at',
      prompt: 'The bus leaves ___ six o’clock.',
      choices: ['on', 'in', 'at', 'until'],
      correctIndex: 2,
      choiceExplanations: [
        "'On' is wrong: 'on' is for days and dates, not clock times.",
        "'In' is wrong: 'in' is for months, years, and parts of the day.",
        "'At' is correct: clock times take 'at'.",
        "'Until' is wrong: 'until' marks an end point, not a departure time.",
      ],
    },
    {
      id: 'b11q04',
      levelId: 'b11',
      rule: 'prepositions_time_in_on_at',
      prompt: 'We have dinner ___ the evening.',
      choices: ['in', 'on', 'at', 'for'],
      correctIndex: 0,
      choiceExplanations: [
        "'In' is correct: parts of the day take 'in' (in the evening).",
        "'On' is wrong: 'on' is for days and dates, not parts of the day.",
        "'At' is wrong: 'at' is for clock times and 'at night'.",
        "'For' is wrong: 'for' expresses a duration.",
      ],
    },
    {
      id: 'b11q05',
      levelId: 'b11',
      rule: 'prepositions_time_in_on_at',
      prompt: 'She was born ___ the 15th of June.',
      choices: ['at', 'on', 'in', 'until'],
      correctIndex: 1,
      choiceExplanations: [
        "'At' is wrong: 'at' is for clock times, not dates.",
        "'On' is correct: specific dates take 'on'.",
        "'In' is wrong: 'in' is for months and years, not a single date.",
        "'Until' is wrong: 'until' marks an end point, not a birth date.",
      ],
    },
    {
      id: 'b11q06',
      levelId: 'b11',
      rule: 'prepositions_time_in_on_at',
      prompt: 'They visit us ___ night.',
      choices: ['at', 'on', 'in', 'since'],
      correctIndex: 0,
      choiceExplanations: [
        "'At' is correct: 'at night' is a fixed expression.",
        "'On' is wrong: 'on' is for days and dates.",
        "'In' is wrong: 'in the night' is not the standard expression; the fixed form is 'at night'.",
        "'Since' is wrong: 'since' marks a starting point, not a time of day.",
      ],
    },
    {
      id: 'b11q07',
      levelId: 'b11',
      rule: 'prepositions_time_since_for_until',
      prompt: 'I have studied English ___ three years.',
      choices: ['since', 'for', 'until', 'on'],
      correctIndex: 1,
      choiceExplanations: [
        "'Since' is wrong: 'since' needs a starting point, not a length of time.",
        "'For' is correct: a duration ('three years') takes 'for'.",
        "'Until' is wrong: 'until' marks an end point, not a duration.",
        "'On' is wrong: 'on' is for days and dates.",
      ],
    },
    {
      id: 'b11q08',
      levelId: 'b11',
      rule: 'prepositions_time_since_for_until',
      prompt: 'She has lived here ___ 2018.',
      choices: ['for', 'since', 'until', 'at'],
      correctIndex: 1,
      choiceExplanations: [
        "'For' is wrong: 'for' needs a duration, but '2018' is a starting point.",
        "'Since' is correct: a starting point in time ('2018') takes 'since'.",
        "'Until' is wrong: 'until' marks an end point, but she still lives here.",
        "'At' is wrong: 'at' is for clock times, not years.",
      ],
    },
    {
      id: 'b11q09',
      levelId: 'b11',
      rule: 'prepositions_time_since_for_until',
      prompt: 'The shop is open ___ nine o’clock.',
      choices: ['since', 'for', 'until', 'in'],
      correctIndex: 2,
      choiceExplanations: [
        "'Since' is wrong: 'since' needs a starting point.",
        "'For' is wrong: 'for' needs a duration, not an end time.",
        "'Until' is correct: 'until' marks the end of the opening time.",
        "'In' is wrong: 'in' is for months, years, and parts of the day.",
      ],
    },
    {
      id: 'b11q10',
      levelId: 'b11',
      rule: 'prepositions_time_since_for_until',
      prompt: 'We waited ___ two hours.',
      choices: ['since', 'until', 'for', 'on'],
      correctIndex: 2,
      choiceExplanations: [
        "'Since' is wrong: 'since' needs a starting point, not a length of time.",
        "'Until' is wrong: 'until' marks an end point, not how long.",
        "'For' is correct: a duration ('two hours') takes 'for'.",
        "'On' is wrong: 'on' is for days and dates.",
      ],
    },
    // Recurring: present_simple_form (defined in b01)
    {
      id: 'b11q11',
      levelId: 'b11',
      rule: 'present_simple_form',
      prompt: 'The bank ___ at half past nine.',
      choices: ['opens', 'open', 'opening', 'is open'],
      correctIndex: 0,
      choiceExplanations: [
        "'Opens' is correct: a fixed daily schedule with 'the bank' (it) takes the present-simple -s form.",
        "'Open' is wrong: the base form is for I/you/we/they, not for it.",
        "'Opening' is wrong: the -ing form needs a helper verb.",
        "'Is open' is wrong: that states a state, not the bank's daily schedule.",
      ],
    },
    // Recurring: past_simple_form (defined in b03)
    {
      id: 'b11q12',
      levelId: 'b11',
      rule: 'past_simple_form',
      prompt: 'We ___ the city on a rainy day.',
      choices: ['visit', 'visited', 'visits', 'visiting'],
      correctIndex: 1,
      choiceExplanations: [
        "'Visit' is wrong: the base form does not express a finished past event.",
        "'Visited' is correct: 'visited' is the regular past-simple form of 'visit'.",
        "'Visits' is wrong: present simple for he/she/it, not a past event.",
        "'Visiting' is wrong: the -ing form needs a helper verb.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 12 — Zero and First Conditionals
// ─────────────────────────────────────────────────────────────────────────────

const conditionalsLevel: Level = {
  id: 'b12',
  trackId: 'basic',
  number: 12,
  title: 'Zero and First Conditionals',
  topic: {
    title: 'Zero and First Conditionals',
    summary:
      'Conditionals link a condition to a result. The zero conditional states general truths; the first conditional talks about a real possibility in the future.',
    rules: [
      {
        rule: 'zero_conditional',
        title: 'Zero conditional: if + present simple, present simple',
        explanation:
          'Use the zero conditional for facts and general truths: if/when + present simple, then present simple (If you heat ice, it melts). Both clauses describe something always true.',
        example: 'If you mix red and blue, you get purple.',
      },
      {
        rule: 'first_conditional',
        title: 'First conditional: if + present simple, will + base verb',
        explanation:
          "Use the first conditional for a real possibility in the future: the if-clause takes the present simple (never will), and the result clause takes will + base verb (If it rains, we'll stay home).",
        example: 'If we miss the bus, we will be late.',
      },
    ],
  },
  questions: [
    {
      id: 'b12q01',
      levelId: 'b12',
      rule: 'zero_conditional',
      prompt: 'If you heat ice, it ___ .',
      choices: ['will melt', 'melts', 'melt', 'melted'],
      correctIndex: 1,
      choiceExplanations: [
        "'Will melt' is wrong: a general truth takes the present simple in the result clause, not 'will'.",
        "'Melts' is correct: the zero conditional uses the present simple in both clauses for a general fact.",
        "'Melt' is wrong: 'it' (singular) takes the -s form.",
        "'Melted' is wrong: the past simple does not fit a timeless fact.",
      ],
    },
    {
      id: 'b12q02',
      levelId: 'b12',
      rule: 'zero_conditional',
      prompt: 'If it rains, the ground ___ wet.',
      choices: ['get', 'gets', 'will get', 'got'],
      correctIndex: 1,
      choiceExplanations: [
        "'Get' is wrong: 'the ground' (it) takes the -s form.",
        "'Gets' is correct: a general truth uses the present simple in the result clause.",
        "'Will get' is wrong: the zero conditional states a fact, so 'will' does not fit.",
        "'Got' is wrong: the past simple does not fit a timeless fact.",
      ],
    },
    {
      id: 'b12q03',
      levelId: 'b12',
      rule: 'first_conditional',
      prompt: 'If she studies, she ___ the exam.',
      choices: ['pass', 'will pass', 'passes', 'passed'],
      correctIndex: 1,
      choiceExplanations: [
        "'Pass' is wrong: the result clause needs 'will' + base verb.",
        "'Will pass' is correct: the first conditional uses will in the result clause.",
        "'Passes' is wrong: the present simple belongs in the if-clause, not the result.",
        "'Passed' is wrong: the past simple does not fit a future possibility.",
      ],
    },
    {
      id: 'b12q04',
      levelId: 'b12',
      rule: 'first_conditional',
      prompt: 'If we miss the bus, we ___ late.',
      choices: ['are', 'will be', 'were', 'be'],
      correctIndex: 1,
      choiceExplanations: [
        "'Are' is wrong: the result clause for a future possibility needs 'will'.",
        "'Will be' is correct: the first conditional uses 'will' in the result clause.",
        "'Were' is wrong: the past simple does not fit a future possibility.",
        "'Be' is wrong: 'be' needs an auxiliary to form a future result.",
      ],
    },
    {
      id: 'b12q05',
      levelId: 'b12',
      rule: 'first_conditional',
      prompt: 'You ___ get wet if you don’t take an umbrella.',
      choices: ['will', 'would', 'do', 'did'],
      correctIndex: 0,
      choiceExplanations: [
        "'Will' is correct: the first conditional uses 'will' + base verb in the result clause.",
        "'Would' is wrong: 'would' belongs to the unreal (second) conditional, not this real possibility.",
        "'Do' is wrong: 'do' is present simple and cannot form a future result.",
        "'Did' is wrong: the past does not fit a future possibility.",
      ],
    },
    {
      id: 'b12q06',
      levelId: 'b12',
      rule: 'zero_conditional',
      prompt: 'If you ___ the button, the machine starts.',
      choices: ['press', 'pressed', 'pressing', 'will press'],
      correctIndex: 0,
      choiceExplanations: [
        "'Press' is correct: the zero conditional uses the present simple in the if-clause.",
        "'Pressed' is wrong: the past simple does not fit a general fact.",
        "'Pressing' is wrong: the -ing form cannot be the verb of the if-clause here.",
        "'Will press' is wrong: 'will' never appears in a zero-conditional if-clause.",
      ],
    },
    {
      id: 'b12q07',
      levelId: 'b12',
      rule: 'first_conditional',
      prompt: 'If it ___ tomorrow, we’ll cancel the picnic.',
      choices: ['rains', 'will rain', 'rained', 'is raining'],
      correctIndex: 0,
      choiceExplanations: [
        "'Rains' is correct: the if-clause of a first conditional takes the present simple, never 'will'.",
        "'Will rain' is wrong: 'will' is used in the result clause, not the if-clause.",
        "'Rained' is wrong: the past simple does not fit a future condition.",
        "'Is raining' is wrong: the continuous form does not fit the if-clause here.",
      ],
    },
    {
      id: 'b12q08',
      levelId: 'b12',
      rule: 'first_conditional',
      prompt: '___ you call me if you need help?',
      choices: ['Will', 'Do', 'Did', 'Are'],
      correctIndex: 0,
      choiceExplanations: [
        "'Will' is correct: a first-conditional question uses 'will' in the result clause.",
        "'Do' is wrong: the present simple cannot form a future question here.",
        "'Did' is wrong: the past does not fit a future possibility.",
        "'Are' is wrong: 'are' cannot form this question with the base verb 'call'.",
      ],
    },
    {
      id: 'b12q09',
      levelId: 'b12',
      rule: 'zero_conditional',
      prompt: 'Plants die if they ___ enough water.',
      choices: ['won’t get', 'don’t get', 'didn’t get', 'doesn’t get'],
      correctIndex: 1,
      choiceExplanations: [
        "'Won't get' is wrong: the zero conditional uses the present simple in the if-clause.",
        "'Don't get' is correct: a general fact uses the present simple, and 'they' takes 'don't'.",
        "'Didn't get' is wrong: the past does not fit a timeless fact.",
        "'Doesn't get' is wrong: 'they' is plural and takes 'don't', not 'doesn't'.",
      ],
    },
    {
      id: 'b12q10',
      levelId: 'b12',
      rule: 'first_conditional',
      prompt: 'If we leave now, we ___ the film.',
      choices: ['catch', 'will catch', 'caught', 'catching'],
      correctIndex: 1,
      choiceExplanations: [
        "'Catch' is wrong: the result clause needs 'will' + base verb.",
        "'Will catch' is correct: the first conditional uses 'will' in the result clause.",
        "'Caught' is wrong: the past does not fit a future possibility.",
        "'Catching' is wrong: the -ing form cannot be the main verb here.",
      ],
    },
    // Recurring: present_simple_form (defined in b01)
    {
      id: 'b12q11',
      levelId: 'b12',
      rule: 'present_simple_form',
      prompt: 'If the baby ___ tired, she goes to sleep.',
      choices: ['is', 'was', 'will be', 'is being'],
      correctIndex: 0,
      choiceExplanations: [
        "'Is' is correct: the present simple in an if-clause describes the general condition.",
        "'Was' is wrong: the past does not fit a general truth.",
        "'Will be' is wrong: 'will' never appears in an if-clause of this type.",
        "'Is being' is wrong: the continuous form does not fit a general condition.",
      ],
    },
    // Recurring: future_will (defined in b06)
    {
      id: 'b12q12',
      levelId: 'b12',
      rule: 'future_will',
      prompt: 'If you come early, we ___ have time for coffee.',
      choices: ['will', 'would', 'do', 'are'],
      correctIndex: 0,
      choiceExplanations: [
        "'Will' is correct: the first conditional uses 'will' in the result clause.",
        "'Would' is wrong: 'would' belongs to the unreal conditional, not this real possibility.",
        "'Do' is wrong: 'do' cannot form a future result.",
        "'Are' is wrong: 'are' cannot precede 'have' in this result clause.",
      ],
    },
  ],
};

/** The Basic track — 12 levels (sequential 1..12), the v1 starting point. */
export const basicTrack: Track = {
  id: 'basic',
  order: 1,
  name: 'Basic',
  label: 'Beginner',
  eligibleStartingPoint: true,
  levels: [
    presentSimpleLevel,
    presentContinuousLevel,
    pastSimpleLevel,
    pastContinuousLevel,
    presentPerfectLevel,
    futureLevel,
    modalLevel,
    articlesLevel,
    comparativesLevel,
    pastPerfectLevel,
    prepositionsTimeLevel,
    conditionalsLevel,
  ],
};
