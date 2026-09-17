# Math Bros Inc.: build cards

Team: Team Orangutan.

Card updated: 2026-09-17

One card per story, made from your stories file. Change a story and its card changes with it. Next stop: `build-architecture.md`. After that: `docs/build/anvil-patterns.md`.

**There is a working demo of every card on this page**, built from your stories and your Figma design, at [/demo/period-7-orangutan/](/demo/period-7-orangutan/). Open it on a phone. The questions, lessons and dictionary are real math the team can add to, and the "About this demo" screen says what is a placeholder.

**Your two racing stories became one, and every feature has a story now.** The team's own rule won on the level: the app never shows it. The cards marked *New* below need a feature on the architecture page before they are built in Anvil.

---

## Card 1: Signing in

**Your story.** As a student, I want to pick a username, so that my points and my place on the leaderboard are mine.

**Done when:**
- [ ] The home screen has a Get Started button
- [ ] Sign in asks for a username and nothing else
- [ ] An empty username is refused with a message that says so
- [ ] I can change my username later and the leaderboard shows the new one

**Build it:** Demo screen Sign in. Pattern 12, or a username box.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **6** (Check before you act), **8** (Get things back out of the database), **10** (Change something already saved), **11** (Put a list in order), **12** (Only let some people in). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 2: Placement test

**Your story.** As a new student, I want to take a placement test, so that the questions I get are not too hard or too easy.

**Done when:**
- [ ] The test has ten questions that get harder as they go
- [ ] I can type an answer or pick from choices, depending on the question
- [ ] After each answer I am told whether it was right
- [ ] At the end I see how many I got right and how many wrong
- [ ] I can retake the test and my level changes if my score does

**Build it:** Demo screen Placement test. Architecture, Feature 1.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **8** (Get things back out of the database), **9** (Show a list on the screen), **10** (Change something already saved), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 3: Secret age groups

**Your story.** As a student, I want the math to fit my skill level without being told what group I am in, so that nobody feels labelled.

**Done when:**
- [ ] The placement test sets my level and the app never shows it as a number or an age
- [ ] Getting three practice questions right in a row moves me up a level
- [ ] Getting two wrong in a row moves me down a level
- [ ] The level dots on the practice screen fill up and empty as I move, and that is the only sign

**Build it:** Built into the demo's practice screen. Architecture, Feature 2.

**Patterns this probably needs:** **3** (Put something on the screen), **4** (Go to another screen), **6** (Check before you act), **8** (Get things back out of the database). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 4: Practice

**Your story.** As a student, I want to practise a subject with questions at my level, so that I get better at it and earn points.

**Done when:**
- [ ] There are six subjects: Algebra, Geometry, Calculus, Statistics, Trigonometry and Number Theory
- [ ] Each question is typed or multiple choice and I am told right away if I was right
- [ ] A right answer is worth 10 points
- [ ] A typed answer is not marked wrong for capital letters or spaces
- [ ] The screen shows how many I got right and wrong this session

**Build it:** Demo screen Practice. Architecture, Feature 2, the course list, plus the adaptive quiz.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **9** (Show a list on the screen), **13** (Let somebody choose from a list), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 5: Video

**Your story.** As a student, I want to watch a lesson video in a course, so that I can see the material explained before I try it.

**Done when:**
- [ ] Each course has a lesson with a name and a length
- [ ] I can play and pause it
- [ ] I can switch to 2x speed
- [ ] I can skip to a part of the lesson by tapping the timeline

**Build it:** Demo screen Course. Architecture, Feature 3.

**Patterns this probably needs:** **1** (Make a button do something), **4** (Go to another screen), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 6: Quiz

**Your story.** As a student, I want to take a quiz at the end of a course, so that I can see if I learned the material.

**Done when:**
- [ ] The quiz has five questions from that course
- [ ] I can type an answer or pick from choices, depending on the question
- [ ] At the end it shows how many were right and how many wrong
- [ ] A quiz score of 4 or 5 earns 50 points

**Build it:** Demo screen Course quiz. Architecture, Feature 4.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **7** (Save something to the database), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 7: AI assistant

**Your story.** As a student who is stuck on a problem, I want to type it in and get the answer with the steps, so that I learn how to do it and not just what the answer is.

**Done when:**
- [ ] I can type an equation like 2x + 3 = 11 or a sum like 48 divided by 6
- [ ] The assistant shows the answer and the steps to get there
- [ ] I can press Explain it simpler and get the same steps in plainer words
- [ ] If it cannot solve what I typed, it says so and suggests what it can do

**Build it:** Demo screen AI assistant. Stubbed on the architecture page; the demo shows the table of worked examples as a small solver.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **6** (Check before you act), **8** (Get things back out of the database), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 8: Race against AI

**Your story.** As a student who is bored of plain practice, I want to race a bot at math questions, so that I work harder to beat it.

**Done when:**
- [ ] I can choose a subject and a difficulty (easy, normal, extreme)
- [ ] The bot moves forward on its own, faster on harder difficulties
- [ ] I move forward one space for every right answer, and a wrong answer says so
- [ ] First to the finish wins, and beating the bot earns 100 points

**Build it:** Demo screen Race. New: needs a feature on the architecture page.

**Patterns this probably needs:** **3** (Put something on the screen), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen), **11** (Put a list in order), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 9: Math dictionary

**Your story.** As a student who does not understand a word in a problem, I want to look it up, so that I can carry on with the problem.

**Done when:**
- [ ] The dictionary is in alphabetical order
- [ ] Typing in the search box narrows the list as I type
- [ ] Each word has a plain definition and an example
- [ ] A word that is not there says so and offers the closest match

**Build it:** Demo screen Dictionary. New: needs a feature on the architecture page.

**Patterns this probably needs:** **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **9** (Show a list on the screen), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 10: Leaderboard

**Your story.** As a student, I want to see who has the most points, so that I have a reason to keep practising.

**Done when:**
- [ ] The leaderboard lists everyone from most points to least
- [ ] My row is highlighted and shows my rank
- [ ] Points on the leaderboard are the same points I earned in practice, quizzes and races
- [ ] The board tells me how many points I need to move up one place

**Build it:** Demo screen Leaderboard. Architecture, Feature 5.

**Patterns this probably needs:** **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **9** (Show a list on the screen), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 11: Secret mode

**Your story.** As a student who likes a joke, I want a hidden mode where calculations are off by one, so that I can prank a friend.

**Done when:**
- [ ] Tapping the logo five times turns secret mode on and shows a small banner
- [ ] In secret mode the AI assistant's answers are one too big
- [ ] Tapping the logo five more times turns it off
- [ ] Secret mode never changes points or the leaderboard

**Build it:** Demo: tap the logo five times. Architecture, Feature 6.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **6** (Check before you act), **7** (Save something to the database), **10** (Change something already saved). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.
