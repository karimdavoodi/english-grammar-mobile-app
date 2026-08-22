/**
 * Basic track — the v1 authored level corpus as pure data.
 *
 * Task 4 ships the reference level (Past Perfect) to prove the content pipeline
 * end-to-end; the remaining levels land in Task 5. This file is data only — no
 * game logic — per the governing principle: the app is a player, the content
 * is a database. Every level here must pass `validateContent()`.
 */

import type { Level, Track } from '../types';

/**
 * Past Perfect — the Task 4 reference level. A 12-question bank across its two
 * topic rules (`past_perfect_form`, `past_perfect_vs_past_simple`), modeled on
 * the fragment in `docs/schema/english-grammar-game.md`.
 */
const pastPerfectLevel: Level = {
  id: 'b01',
  trackId: 'basic',
  number: 1,
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
      id: 'b01q01',
      levelId: 'b01',
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
      id: 'b01q02',
      levelId: 'b01',
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
      id: 'b01q03',
      levelId: 'b01',
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
      id: 'b01q04',
      levelId: 'b01',
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
      id: 'b01q05',
      levelId: 'b01',
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
      id: 'b01q06',
      levelId: 'b01',
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
      id: 'b01q07',
      levelId: 'b01',
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
      id: 'b01q08',
      levelId: 'b01',
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
      id: 'b01q09',
      levelId: 'b01',
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
      id: 'b01q10',
      levelId: 'b01',
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
      id: 'b01q11',
      levelId: 'b01',
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
      id: 'b01q12',
      levelId: 'b01',
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

/** The Basic track (v1: the Past Perfect reference level). */
export const basicTrack: Track = {
  id: 'basic',
  order: 1,
  name: 'Basic',
  label: 'Beginner',
  eligibleStartingPoint: true,
  levels: [pastPerfectLevel],
};
