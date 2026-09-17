# House Point Tracker: build cards

Team: House Points.

Card updated: 2026-09-17

This is the first document, one card per user story. Each card is your own story
tidied up, what has to be true for it to count as done, and where to go next.

Next stop: `build-architecture.md`. After that: `docs/build/anvil-patterns.md`.

---

## Three things to settle first

These are not cards, because they are not built. They are decided, by you, as a
team. The tables and the code both hang off the answers, so do these before you
open Anvil. Ten minutes, on paper.

**1. Points go to houses, or to students? Settled by your story "Add points to
students and houses": students,** and the student's house gets them too. Card 3
is now that story.

**2. What does the point cap count? Settled by the same story: up to 5 points
to a student in one go.** Card 4 says 5 where it used to say 50.

**3. What does "most recent" mean on the dashboard?** The last few changes listed
underneath the totals, or a separate total for this week? Both are buildable.
Only one is what you meant.

Write your three answers at the top of your stories page. A decision nobody wrote
down gets made again differently next week.

---

## Card 1: Teacher sign in

**Your story.** As a teacher, I want sign into a special teacher account, so that I can add p oints.

**Done when:**
- [ ] a teacher can find the sign in button

**Build it:** Architecture, Feature 1.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **7** (Save something to the database), **9** (Show a list on the screen), **12** (Only let some people in). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

*(This one was inside your "add points" story rather than written on its own.
Pull it out: signing in and awarding points are two different things a person
does, so they are two stories.)*

## Card 2: View house points

**Your story.** As a student, I want to see the current point tallies of every
house, so that I can check how my house is doing.

**Done when:**
- [ ] All eight houses appear with their all time total
- [ ] The house with the most points is at the top
- [ ] It works without signing in

**Build it:** Architecture, Feature 2. Build this one first. It is the screen
where you will see your app come alive.

**Note.** No house has a total stored anywhere. You add up its rows in
`point_events` every time the screen opens. That means you cannot ask the table
to sort by total for you, because the total is not in the table. Sort the list
yourself afterwards. Feature 2 shows you where.

---

## Card 3: Give points

**Your story.** As a teacher, I want to add students to a house and add points to a student, therefore also adding points to the house, so that they get the points.

**Done when:**
- [ ] A teacher is able to add up to 5 points to a student, effectively adding points to their assigned house

**Build it:** Architecture, Feature 3.

**Patterns this probably needs:** **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

**This story settles decision 1 at the top of this page:** points go to a student, and the student's house gets them too. It also answers decision 2, because it says up to 5 points at a time, which is the cap Card 4 now enforces. The reason box stays: it came from what the app is for, and Card 5 explains it.

## Card 4: Point cap

**Your story.** As a teacher, I want limit amout of points given a day, so that not too many points.

**Done when:**
- [ ] a teacher adds 4 points AT max a day

**Build it:** Architecture, Feature 5.

**Patterns this probably needs:** **6** (Check before you act), **7** (Save something to the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

**Note.** Your original story capped 50 points per student per day. Your newer
story, on Card 3, says up to 5 points to a student at a time, and that is the
cap this card now checks. If you meant both, a daily total is a second check
over the same rows; say so in the story studio.

## Card 5: Take points away, with a reason

**You have not written this story yet.** Everything on this card came from your
teacher saying what the app needs to do, and that is not the same thing as a
story you wrote. **Go and write it in the story studio before you build it**, and
bring it to a design review.

What it will need to cover:

- A teacher can take points off a house as well as give them
- Every change, both directions, records who did it
- Every change, both directions, records why, typed by the teacher
- A teacher cannot leave the reason empty

**Done when:** whatever your acceptance criteria say when you have written them.
That is the point of writing it.

**Build it:** Architecture, Feature 4. It is Feature 3 with one extra line, which
is the reward for a table shaped properly. Read the *taking points away is a
negative amount* note in the architecture first: it is the best idea in your
whole app.

---

## Card 6: Points are not lost

**Your story.** As a student, I want to know the points are stored safely, so
that I can trust the totals when teachers change them.

**Done when:**
- [ ] Points are still correct after closing and reopening the app
- [ ] Points are still correct in a different browser
- [ ] There is a log of who changed the count and when

**Build it:** Architecture, Feature 6. Read the "cloud storage is not a feature
you build" note first. The first two criteria are already true the moment you use
Pattern 7, and knowing that is the point.

The third one is the History screen, and it is already true as well, because you
never delete a row. Ask yourself why a design that stores a total instead would
have made this card hard.

---

## Card 7: Point animations

**Your story.** As a student, I want to, whenever a teacher adds points, see cool animations for each house, so that my bruin pride is boosted an see more interactions and more detail and personality in the website.

**Done when:**
- [ ] Whenever a teacher adds points to a specific, I can see a small animation for that house
- [ ] The animation is small and aesthetically pleasing
- [ ] The animation that plays is the animal for that house

**Build it:** Stretch goal. Architecture, stubbed list. Pattern 14 gets you a simple version. Do not start here.

**Patterns this probably needs:** **3** (Put something on the screen), **6** (Check before you act), **7** (Save something to the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

## Card 8: House detail

**Your story.** As a teacher, I want to be able to click on each house, see the students in that house, and add points to a specific student, so that I can award specific students who did well in class.

**Done when:**
- [ ] I can click further on the house
- [ ] I can see each student in the house
- [ ] I can add points to a specific student and the points also add to the overall house

**Build it:** Architecture, Feature 7. It needs the students table, which Feature 3 now needs too, so build them together.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 9: Change Logds

**Your story.** As a Admin or teacher, I want to be able to see the point transaction/records of point addition, so that teachers can find any mistakes or any strange occurrences.

**Done when:**
- [ ] You must be able to click a button and see point history as a teacher

**Build it:** Architecture. Ask your teacher which feature number, then put it here.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 10: Add points

**Your story.** As a Teacher or admin, I want to add points to individual people, so that people can gain points for their house.

**Done when:**
- [ ] Max 5 points per person by one teacher

**Build it:** Architecture. Ask your teacher which feature number, then put it here.

**Patterns this probably needs:** **6** (Check before you act), **7** (Save something to the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.
