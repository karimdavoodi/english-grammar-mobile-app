# English Grammar Game — Use Cases (Gherkin)

Behavioral spec derived from `docs/ideas/english-grammar-game.md`.

**Tuning parameters** (decided values — treat as tunable from real play):
- Pass rule: **3 correct in a row** OR **8 total correct**, whichever comes first.
- Mercy cap: a level ends after **12 questions** answered without passing.
- Question bank: **~12 questions per topic** (must be at least the mercy cap so a level never runs out mid-level).
- Weakness Queue: a rule leaves the queue after **2 correct review answers**.
- Re-teach: the lesson card re-shows before a question when its rule has been missed **2 times** in the current level.

**Task 26 tuning decision (2026-08-23):** retain these defaults for now. The
local Stats implementation has no real-player export in this repository, so
the available fixtures are insufficient evidence for changing the pass rule.
The values remain injectable through `PassConfig`; revisit them after at least
20 completed level sessions across five players (or an equivalent anonymized
play export), using pass rate, median answers to pass, and mercy-ended rate by
level.

**Progression contract:** tracks and levels form one ordered sequence using `track.order`, then `level.number`. A player may start at any bundled track marked as an eligible starting point. All levels before that point are unlocked for practice; only later levels are locked. Passing or mercy-ending a level advances the frontier to the next level in this sequence. If no next level is bundled, the player sees the completion state and may replay any unlocked level.

**MVP contract:** v1 bundles Basic content only. Therefore v1 starts at Basic level 1 and does not offer unavailable Intermediate or Advanced choices. The higher-start scenarios apply once those tracks are bundled.

## Feature: Daily Practice Streak

**Scenario: Practice starts a daily streak**
- Given I have not practiced today
- When I start any level
- Then my current daily streak increases or starts at 1
- And the level map shows my current and best streak

**Scenario: Same-day practice does not double-count**
- Given I have already practiced today
- When I start another level
- Then my current daily streak stays unchanged

**Scenario: Missing a day resets the current streak**
- Given my last practice was more than one calendar day ago
- When I start any level
- Then my current daily streak is 1
- And my best streak is preserved

## Feature: Daily Reminder Notifications

**Scenario: A player enables the daily reminder**
- Given notifications are disabled
- When I enable the daily reminder at a chosen local time
- Then the app requests notification permission
- And one local reminder repeats every day at that time

**Scenario: A player disables the daily reminder**
- Given the daily reminder is enabled
- When I disable it
- Then the scheduled reminder is cancelled

---

## Feature: First Launch — Choosing a Starting Point

**As a** new player
**I want** to choose where I begin
**So that** skilled learners don't waste time marching through easy levels

**Scenario: A beginner starts at the very beginning**
- Given I am launching the app for the first time
- When I choose "Beginner"
- Then I start at Basic level 1
- And the full level map is visible
- And levels after level 1 are locked

**Scenario: An experienced learner skips earlier tracks when available**
- Given I am launching the app for the first time
- When I choose "Advanced"
- Then I start at Advanced level 1
- And all earlier levels are unlocked and accessible (I can go back to practice)
- And only levels after my starting point are locked

**Scenario: Choosing higher never locks earlier content**
- Given I chose "Some English" at first launch
- When I open the level map
- Then the Basic track levels are also accessible
- And I can return to my current Intermediate level at any time

**Scenario: Returning players are not asked again**
- Given I have already chosen a starting point
- When I relaunch the app
- Then I am taken straight to my current level
- And the start-higher screen is not shown

**Scenario: Only one track is bundled**
- Given the bundled content contains only Basic
- When I launch the app for the first time
- Then I start at Basic level 1
- And no unavailable track is offered as a starting choice

---

## Feature: Level Play

**As a** player
**I want** to answer questions that prove my mastery of a topic
**So that** I advance at my own pace

**Background:**
- Given I am playing level "Past Perfect" in the Basic track
- And the level's question bank has 12 questions across the topic's rules

**Scenario: Questions come from the level's topic bank**
- Given I start the level
- When the first question is shown
- Then it is drawn from the level's question bank
- And it shows a prompt with 4 answer choices

**Scenario: Typed questions use their response shape**
- Given the question is a fill-in-the-blank, fix-the-sentence, or word-order question
- When I submit an answer
- Then the game scores text answers case-insensitively with normalized whitespace and punctuation
- And word-order answers are scored against the canonical word sequence

**Scenario: Three correct in a row passes the level**
- Given I have answered 2 questions correctly in a row
- When I answer the next question correctly
- Then the level is passed by streak
- And the next level unlocks

**Scenario: A wrong answer resets the streak**
- Given I have answered 2 questions correctly in a row
- When I answer the next question incorrectly
- Then my streak resets to 0
- And the topic lesson card is shown (teaching happens before re-testing)

**Scenario: Eight total correct passes the level**
- Given I have answered correctly 7 times in total (streak broken at least once)
- When I answer an eighth question correctly
- Then the level is passed by volume

**Scenario: The mercy cap ends a struggling level**
- Given I have answered 11 questions without meeting either pass rule
- When I answer the 12th question
- Then the level ends
- And the next level unlocks (nobody is locked forever)

**Note:** Every answered question, including the twelfth question that triggers mercy completion, counts toward the cap. A mercy-ended level is unlocked but not passed and remains replayable.

**Scenario: The pass screen explains why I passed**
- Given I have just passed a level
- When the pass screen appears
- Then it states the reason ("Streak!" or "Mastery reached")
- And it offers to continue to the next level

---

## Feature: Teach on Failure

**As a** player
**I want** to be taught every time I get something wrong
**So that** I actually learn the grammar, not just get scored

**Scenario: A wrong answer shows the topic lesson card**
- Given I am answering a question about "past perfect vs past simple"
- When I submit a wrong answer
- Then the topic lesson card is shown (form, rule, example)
- And the per-choice explanations are shown — why the choice I made is wrong, and why the correct one is right
- And the correct answer is highlighted

**Scenario: A correct answer confirms with the rationale**
- Given I answered a question correctly
- When the answer feedback is shown
- Then the correct choice's explanation is shown (why it is right)
- And the wrong choices are not emphasized

**Scenario: The next question targets the missed rule**
- Given I answered the previous question incorrectly about rule "past perfect vs past simple"
- When the next question is served
- Then it is a different variant of the same rule, if one remains unasked
- And otherwise, if a queued rule has an unasked question, that is served marked "Review"
- And otherwise it is drawn at random from the bank

**Scenario: Repeated misses re-teach before re-testing**
- Given I have missed rule "past perfect vs past simple" twice in this level
- When the next question on that rule is about to be served
- Then the topic lesson card is shown again before the question
- And the question appears only after I dismiss the card

**Rule:** Same-level remediation questions are not Review questions and do not increment `reviewStreak`. A question is marked Review only when it is selected because its rule was already in the Weakness Queue before the question was served. Two correct Review answers clear the weakness; any wrong answer resets its review streak to 0.

---

## Feature: Weakness Queue (cross-level)

**As a** player
**I want** my missed rules to follow me across levels
**So that** I keep practicing exactly what I'm weak at

**Scenario: Every wrong answer feeds the queue**
- Given I am answering a question about any rule
- When I answer it incorrectly
- Then that rule is added to (or re-missed in) the Weakness Queue immediately
- And this happens whether the level is later passed or mercy-ended

**Scenario: A missed rule resurfaces in a later level**
- Given rule "past perfect" is in my Weakness Queue
- When I reach a level whose bank contains a "past perfect" question
- Then that question is served and marked "Review: past perfect"
- And a correct answer increments the rule's review streak
- And the review question counts toward the level's pass rules normally

**Scenario: A weakness is cleared with consistent correct answers**
- Given rule "past perfect" has been answered correctly in review once
- When I answer another review question on it correctly
- Then the rule is removed from the Weakness Queue

**Scenario: A weakness is reinforced when still missed**
- Given rule "past perfect" is in my Weakness Queue
- When I answer a review question on it incorrectly
- Then the topic lesson card is shown
- And the rule stays in the Weakness Queue

**Scenario: A queued rule has no question in the current level**
- Given a rule is in my Weakness Queue
- And the current level's bank contains no question for that rule
- When I play the level
- Then the rule is not forced into this level
- And it remains available for Review in a later level whose bank contains it

---

## Feature: Review Screen

**As a** player
**I want** to see every question I got wrong and why
**So that** I can study my mistakes outside of level play

**Scenario: The review screen lists every missed question**
- Given I have answered questions incorrectly during play
- When I open the Review screen from Settings
- Then every question I have missed is listed, grouped by rule
- And each entry shows the question, my last wrong choice, and the correct answer
- And each entry shows how many times I missed it
- And each entry explains why my choice was wrong and why the correct one is right

The Review screen uses the most recent wrong choice for each question and retains the cumulative miss count. It is study history, not the active Weakness Queue; clearing a weakness does not delete wrong-answer history.

**Scenario: Review screen with no mistakes**
- Given I have never answered a question incorrectly
- When I open the Review screen
- Then it shows an empty state encouraging me to keep going

---

## Feature: Settings — Reset Progress

**As a** player
**I want** to start over from the beginning
**So that** I can replay the game fresh

**Scenario: Resetting the game erases all progress**
- Given I have completed levels, a Weakness Queue, and wrong-answer records
- When I choose "Reset game" in Settings
- And confirm the reset
- Then all progress is erased
- And I am returned to the starting-point choice

**Scenario: Reset requires confirmation**
- Given I am on the Settings screen
- When I tap "Reset game"
- Then a confirmation dialog appears before anything is erased

---

## Feature: Settings — Theme

**As a** player
**I want** to choose the app's appearance
**So that** it matches my device or preference

**Scenario: Following the device theme**
- Given the theme setting is "Device"
- When the device theme changes
- Then the app follows the device theme

**Scenario: Pinning to light theme**
- Given the theme setting is "Light"
- When I view the app
- Then all screens use the light palette regardless of the device theme

**Scenario: Pinning to dark theme**
- Given the theme setting is "Dark"
- When I view the app
- Then all screens use the dark palette regardless of the device theme

---

## Feature: Level Map

**As a** player
**I want** to see my progress across the tracks
**So that** I know where I am and what comes next

**Scenario: Progress is shown on the map**
- Given I am on the level map
- Then my current level is highlighted
- And passed levels show a pass indicator
- And future levels are shown as locked

**Scenario: Replaying a passed level**
- Given I have passed level "Past Perfect"
- When I tap it on the map
- Then I can replay it for review
- And replaying does not re-lock the level

## Feature: Mixed Review

**As a** player
**I want** a short session assembled from my known weaknesses and passed levels
**So that** I can practice across topics without changing my current level

**Scenario: Mixed Review prioritizes useful practice**
- Given I have queued rules and recently missed questions
- When I start Mixed Review
- Then queued-rule questions are placed first
- And recently missed questions follow in freshest-first order
- And remaining slots sample questions across passed levels
- And each question id appears at most once in the session bank

**Scenario: Mixed Review resumes its original bank**
- Given I have started Mixed Review and relaunched the app
- When I resume the session
- Then it uses the persisted bank snapshot
- And already-served questions are not repeated
- And my current level remains unchanged

**Scenario: Mixed Review ends without changing progression**
- Given I am answering a Mixed Review question
- When the volume target is reached or the bank is exhausted
- Then the mixed session ends
- And Weakness Queue and wrong-answer history retain the answer
- And my current level is unchanged

**Scenario: Mixed Review is available from the app hubs**
- Given I am on the level map or Settings
- When I tap "Review / Practice"
- Then a Mixed Review session opens
- And leaving the session clears only its active session

**Scenario: Leaving a level before it ends**
- Given I am partway through a level
- When I leave the level or relaunch the app
- Then the current level session is resumed from its saved counters (streak, correct count, answered count, per-rule misses)
- And already-asked questions are not repeated
- And the next question is still chosen adaptively (remediation, then review, then random)
