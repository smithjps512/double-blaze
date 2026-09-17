# Math Bros Inc. user stories

Team: Team Orangutan

Revised: 2026-09-17

These are the team's stories, tidied so that every one has a person, a want, a
reason, criteria that can be true or false, and a scenario a tester can run.
The two racing stories became one. The demo at `/demo/period-7-orangutan/`
is built from them and from the team's Figma design.

## Signing in

As a student, I want to pick a username, so that my points and my place on the
leaderboard are mine.

  - The home screen has a Get Started button
  - Sign in asks for a username and nothing else
  - An empty username is refused with a message that says so
  - I can change my username later and the leaderboard shows the new one

  Given I open Math Bros for the first time
  When I press Get Started and type a username
  Then I see the home screen with my name on it

  Given I have changed my username to GeorgeDeng
  When I open the leaderboard
  Then my row says GeorgeDeng

## Placement test

As a new student, I want to take a placement test, so that the questions I get
are not too hard or too easy.

  - The test has ten questions that get harder as they go
  - I can type an answer or pick from choices, depending on the question
  - After each answer I am told whether it was right
  - At the end I see how many I got right and how many wrong
  - I can retake the test and my level changes if my score does

  Given I am a new student on the home screen
  When I press Start placement test
  Then question 1 opens with a box to type my answer

  Given I have answered all ten questions
  When the last one is marked
  Then I see my score out of ten and Practice is unlocked

## Secret age groups

As a student, I want the math to fit my skill level without being told what
group I am in, so that nobody feels labelled.

  - The placement test sets my level and the app never shows it as a number or an age
  - Getting three practice questions right in a row moves me up a level
  - Getting two wrong in a row moves me down a level
  - The level dots on the practice screen fill up and empty as I move, and that is the only sign

  Given my placement score put me at level 2
  When I get three practice questions right in a row
  Then the next question is a level 3 question and one more dot is filled

  Given I am on any screen
  When I look for my age group
  Then it is not written anywhere

## Practice

As a student, I want to practise a subject with questions at my level, so that
I get better at it and earn points.

  - There are six subjects: Algebra, Geometry, Calculus, Statistics, Trigonometry and Number Theory
  - Each question is typed or multiple choice and I am told right away if I was right
  - A right answer is worth 10 points
  - A typed answer is not marked wrong for capital letters or spaces
  - The screen shows how many I got right and wrong this session

  Given I choose Algebra
  When I answer a question correctly
  Then I see Correct, my points go up by 10 and the next question appears

  Given I type "X + 8" and the answer is "x + 8"
  When I submit
  Then it is marked correct

## Video

As a student, I want to watch a lesson video in a course, so that I can see
the material explained before I try it.

  - Each course has a lesson with a name and a length
  - I can play and pause it
  - I can switch to 2x speed
  - I can skip to a part of the lesson by tapping the timeline
  - When the lesson ends I am offered the quiz

  Given I open the Algebra course
  When I press Play
  Then the lesson starts from the beginning and the time counts up

  Given the lesson is playing
  When I press 2x
  Then the time counts up twice as fast

## Quiz

As a student, I want to take a quiz at the end of a course, so that I can see
if I learned the material.

  - The quiz has five questions from that course
  - I can type an answer or pick from choices, depending on the question
  - At the end it shows how many were right and how many wrong
  - A quiz score of 4 or 5 earns 50 points

  Given I have finished the Algebra lesson
  When I press Take the quiz
  Then question 1 of 5 opens

  Given I got 4 of 5 right
  When the quiz ends
  Then I see 4 right, 1 wrong and 50 points added

## AI assistant

As a student who is stuck on a problem, I want to type it in and get the answer
with the steps, so that I learn how to do it and not just what the answer is.

  - I can type an equation like 2x + 3 = 11 or a sum like 48 divided by 6
  - The assistant shows the answer and the steps to get there
  - I can press Explain it simpler and get the same steps in plainer words
  - If it cannot solve what I typed, it says so and suggests what it can do

  Given I type 2x + 3 = 11
  When I press Solve
  Then I see x = 4 and the three steps that got there

  Given the steps are too hard
  When I press Explain it simpler
  Then the same answer appears with shorter, plainer steps

## Race against AI

As a student who is bored of plain practice, I want to race a bot at math
questions, so that I work harder to beat it.

  - I can choose a subject and a difficulty (easy, normal, extreme)
  - The bot moves forward on its own, faster on harder difficulties
  - I move forward one space for every right answer, and a wrong answer says so
  - First to the finish wins, and beating the bot earns 100 points

  Given I pick Algebra and easy
  When I answer five questions right before the bot finishes
  Then I win and 100 points are added

  Given I pick extreme
  When the race starts
  Then the bot moves faster than it does on easy

## Math dictionary

As a student who does not understand a word in a problem, I want to look it
up, so that I can carry on with the problem.

  - The dictionary is in alphabetical order
  - Typing in the search box narrows the list as I type
  - Each word has a plain definition and an example
  - A word that is not there says so and offers the closest match

  Given I type "prime"
  When the list narrows
  Then I see Prime number with its definition

  Given I type "zorb"
  When nothing matches
  Then the screen says no match and suggests a nearby word

## Leaderboard

As a student, I want to see who has the most points, so that I have a reason
to keep practising.

  - The leaderboard lists everyone from most points to least
  - My row is highlighted and shows my rank
  - Points on the leaderboard are the same points I earned in practice, quizzes and races
  - The board tells me how many points I need to move up one place

  Given I have just earned 10 points
  When I open the leaderboard
  Then my row has moved up if those points passed someone

  Given I am not in first place
  When I look at my row
  Then it says how many more points would move me up one

## Secret mode

As a student who likes a joke, I want a hidden mode where calculations are off
by one, so that I can prank a friend.

  - Tapping the logo five times turns secret mode on and shows a small banner
  - In secret mode the AI assistant's answers are one too big
  - Tapping the logo five more times turns it off
  - Secret mode never changes points or the leaderboard

  Given I tap the logo five times
  When I ask the assistant what 1 + 1 is
  Then it says 3 and the banner says secret mode is on

  Given secret mode is on
  When I answer practice questions
  Then my points are counted normally
