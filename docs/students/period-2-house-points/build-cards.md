# House Point Tracker: build cards

Team: House Points.

This is the first document, one card per user story. Each card is your own story
tidied up, what has to be true for it to count as done, and where to go next.

Next stop: `build-architecture.md`. After that: `docs/build/anvil-patterns.md`.

---

## Three things to settle first

These are not cards, because they are not built. They are decided, by you, as a
team. The tables and the code both hang off the answers, so do these before you
open Anvil. Ten minutes, on paper.

**1. Points go to houses, or to students?** Card 3 says students. Cards 2 and 4
and the whole dashboard say houses. Both cannot be true.

**2. What does the point cap count?** Card 4 caps points per student per day. If
points go to houses, there are no students to count.

**3. What does "most recent" mean on the dashboard?** The last few changes listed
underneath the totals, or a separate total for this week? Both are buildable.
Only one is what you meant.

Write your three answers at the top of your stories page. A decision nobody wrote
down gets made again differently next week.

---

## Card 1: Teacher sign in

**Your story.** As a teacher, I want to sign in to my own account, so that only
teachers can award points.

*(This one was inside your "add points" story rather than written on its own.
Pull it out: signing in and awarding points are two different things a person
does, so they are two stories.)*

**Done when:**
- [ ] A teacher can sign in with a username and password
- [ ] A student can continue as a guest without signing in
- [ ] A signed out person cannot reach the Give Points screen

**Build it:** Architecture, Feature 1.

---

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

**Your story.** As a teacher, I want to add points to a student, so that I can
award them when the student does something good.

**Done when:**
- [ ] A teacher picks a house and types an amount
- [ ] A teacher types a reason, and cannot submit without one
- [ ] The total on the dashboard goes up by that amount
- [ ] The teacher is told it worked
- [ ] The new total is still there after the page is refreshed

**Build it:** Architecture, Feature 3.

**Note from your own criteria:** you wrote "make it add points to students, not
house". That is decision 1 at the top of this page, and it has to be answered
before this card can be finished. Houses is far smaller to build: students means
a second table and a way to pick one out of several hundred.

**The reason is new** and it did not come from your stories. It came from your
teacher describing what the app is actually for. See Card 5.

---

## Card 4: Point cap

**Your story.** As a teacher, I want a maximum number of points I can add at
once, so that somebody who gets hold of the password cannot add a pile of
points.

**Done when:**
- [ ] Adding 50 or fewer works
- [ ] Adding 51 is refused with a message that says why
- [ ] The refusal happens before anything is saved

**Build it:** Architecture, Feature 5.

**Note.** Your story caps 50 points per student per day. That is decision 2 at
the top of this page. If points go to houses there are no students to count, and
the nearest version that keeps what you meant is *no more than 50 in one go*.

---

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

**Your story.** As a student, I want to see something when my house gains
points, so that I enjoy the competition more.

**Done when:**
- [ ] Something visible happens when points are added
- [ ] It can be turned off in settings
- [ ] It does not stop you using the app

**Build it:** Stretch goal. Architecture, stubbed list. Pattern 14 gets you a
simple version. Do not start here.
