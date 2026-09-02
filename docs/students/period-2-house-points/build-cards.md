# House Point Tracker: build cards

Team: House Points.

This is the first document, one card per user story. Each card is your own story
tidied up, what has to be true for it to count as done, and where to go next.

Next stop: `build-architecture.md`. After that: `docs/build/anvil-patterns.md`.

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
- [ ] A signed out person cannot reach the Add Points screen

**Build it:** Architecture, Feature 1.

---

## Card 2: View house points

**Your story.** As a student, I want to see the current point tallies of every
house, so that I can check how my house is doing.

**Done when:**
- [ ] Every house appears with its current total
- [ ] The house with the most points is at the top
- [ ] It works without signing in

**Build it:** Architecture, Feature 2. Build this one first. It is the screen
where you will see your app come alive.

---

## Card 3: Add points

**Your story.** As a teacher, I want to add points to a student, so that I can
award them when the student does something good.

**Done when:**
- [ ] A teacher picks a house and types an amount
- [ ] The total on the Scoreboard goes up by that amount
- [ ] The teacher is told it worked
- [ ] The new total is still there after the page is refreshed

**Build it:** Architecture, Feature 3.

**Note from your own criteria:** you wrote "make it add points to students, not
house". Your other story tracks totals per house. Those are two different
designs and you have to pick one. Points to a student, with the house total
added up from students, is the more useful one and more work. Decide as a team
and write it down.

---

## Card 4: Point cap

**Your story.** As a teacher, I want a maximum number of points I can add at
once, so that somebody who gets hold of the password cannot add a pile of
points.

**Done when:**
- [ ] Adding 50 or fewer works
- [ ] Adding 51 is refused with a message that says why
- [ ] The refusal happens before anything is saved

**Build it:** Architecture, Feature 4.

---

## Card 5: Points are not lost

**Your story.** As a student, I want to know the points are stored safely, so
that I can trust the totals when teachers change them.

**Done when:**
- [ ] Points are still correct after closing and reopening the app
- [ ] Points are still correct in a different browser
- [ ] There is a log of who changed the count and when

**Build it:** Architecture, Feature 5. Read the "cloud storage is not a feature
you build" note first. Part of this story is already true the moment you use
Pattern 7, and knowing that is the point.

---

## Card 6: Point animations

**Your story.** As a student, I want to see something when my house gains
points, so that I enjoy the competition more.

**Done when:**
- [ ] Something visible happens when points are added
- [ ] It can be turned off in settings
- [ ] It does not stop you using the app

**Build it:** Stretch goal. Architecture, stubbed list. Pattern 14 gets you a
simple version. Do not start here.
