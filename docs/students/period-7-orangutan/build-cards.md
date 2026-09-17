# Team Orangutan: build cards

Team: Team Orangutan.

Card updated: 2026-09-17

Next stop: `build-architecture.md`. Then `docs/build/anvil-patterns.md`.

---

## Card 1: Find my level

**Your story.** As a student, I want questions that are not too hard or too
easy, so that I can learn at the right pace.

**Done when:**
- [ ] A new student is offered the placement test
- [ ] The test scores the answers
- [ ] A level is saved for that student
- [ ] The student is never shown their level

**Build it:** Architecture, Feature 1. Build this first, because everything else
depends on knowing the level.

---

## Card 2: See my courses

**Your story.** As a student, I want courses that match my level, so that I am
not bored or lost.

**Done when:**
- [ ] Only courses for your level appear
- [ ] Each course shows its topic
- [ ] A student at a different level sees a different list

**Build it:** Architecture, Feature 2.

---

## Card 3: Watch the video

**Your story.** As a student, I want to watch the course video, so that I can
learn the material.

**Done when:**
- [ ] The video title and length appear
- [ ] The link opens the video
- [ ] You can go from the video to the quiz

**Build it:** Architecture, Feature 3. Read the note about pause and 2x speed
first. Some of what you wrote is already done for you.

---

## Card 4: Take the quiz

**Your story.** As a student, I want to take the quiz, so that I can see if I am
learning the material.

**Done when:**
- [ ] You can type an answer
- [ ] It tells you how many you got right
- [ ] It tells you how many you got wrong
- [ ] Right answers earn XP

**Build it:** Architecture, Feature 4.

---

## Card 5: The leaderboard

**Your story.** As a student, I want to see the leaderboard, so that students get motivation for learning more math.

**Done when:**
- [ ] Has to be able to show points from greatest to least
- [ ] Has to be able to reflect student performance
- [ ] Has to be able to display names

**Build it:** Architecture, Feature 5.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **10** (Change something already saved), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

## Card 6: Secret mode

**Your story.** As a student who found the secret, I want the calculations to be
funny, so that I can show my friends.

**Done when:**
- [ ] There is a way in that a normal user will not find by accident
- [ ] While it is on, answers are off by one
- [ ] You can turn it off again

**Build it:** Architecture, Feature 6. Last, as a reward. Do not start here, no
matter how much you want to.
