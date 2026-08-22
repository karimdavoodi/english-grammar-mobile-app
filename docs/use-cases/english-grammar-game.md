# English Grammar Game — Use Cases (Gherkin)

Behavioral spec derived from `docs/ideas/english-grammar-game.md`.

**Tuning parameters** (decided values — treat as tunable from real play):
- Pass rule: **3 correct in a row** OR **8 total correct**, whichever comes first.
- Mercy cap: a level ends after **12 questions** answered without passing.
- Question bank: **~12 questions per topic** (must be at least the mercy cap so a level never runs out mid-level).
- Weakness Queue: a rule leaves the queue after **2 correct review answers**.
- Re-teach: the lesson card re-shows before a question when its rule has been missed **2 times** in the current level.

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

**Scenario: An experienced learner skips the Basic track**
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
