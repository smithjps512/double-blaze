# CTOS: build cards

Team: CTOS.

Card updated: 2026-09-10

Next stop: `build-architecture.md`. Then `docs/build/anvil-patterns.md`.

---

## Card 1: Sign in

**Your story.** As a user, I want an account, so that what I post is mine.

*(Not written yet. Your other two stories both need to know who is posting, so
this one has to exist.)*

**Done when:**
- [ ] Somebody can make an account and sign back in
- [ ] Posts show who made them

**From your new stories.** Your plan now says a registered person is a User
with a permanent account, and an unregistered person is a Guest on a 7 day
trial. For this card, a Guest is simply somebody who has not signed in yet. The
7 days is a rule with no story behind it, so nothing about it gets built until
somebody writes what a Guest can do, and what happens on day 8.

**Build it:** Architecture, Feature 1.

---

## Card 2: Post a video

**Your story.** As a user, I want to add a video, so that I can share it with
the world.

**Done when:**
- [ ] You can give a video a title
- [ ] You can add the link to it
- [ ] You can say whether it is a Short or a Video
- [ ] Posting with no title is refused
- [ ] It appears in the feed straight away, and the feed says which it is

**From your new stories.** You drew a line: a Short is 75 seconds or less, a
Video is anything longer, and both live in Media. That line is now the third
box on this card. Your card posts a link, so the app cannot measure the length
itself; the person posting picks Short or Video from a list. If you want the
app to check the 75 seconds, that is a story to write.

**Build it:** Architecture, Features 2 and 3. Read the note about links rather
than file uploads before you start.

---

## Card 3: Make a quiz

**Your story.** As a user, I want to build a quiz, so that I can test other
people on what they know.

**Done when:**
- [ ] You can add a question and its answer
- [ ] Added questions appear in a list as you go
- [ ] You can delete a question you got wrong
- [ ] You can finish and save the quiz

**Build it:** Architecture, Feature 4.

---

## Card 4: Take a quiz

**Your story.** As a user, I want a fun or traditional quiz, so that I can show
what I know.

**Done when:**
- [ ] Questions appear one at a time
- [ ] Your answer is marked right or wrong
- [ ] At the end you get a score and a grade band
- [ ] All right gives Awesome, all wrong gives Terrible

**Build it:** Architecture, Feature 5.

---

## A note for the whole team

Your plan has 17 features. This slice has 5. **That is not us cutting your app
down, it is you choosing what to build first**, which is what every software
team on earth does at the start of a project.

When these cards were written you had 2 stories. **On 10 September you had 12.**
One of you wrote a narrative for nine more features, plus a second one for
Shorts, and that is the single biggest step this team has taken. Read them.
They are on your prototype now, each on its own screen.

Here is the catch, and it is the reason there is no Card 5 yet. **A card needs
a finish line**, the Done when list, and a finish line comes from a story's
acceptance criteria and its Given, When, Then. Every one of the ten new stories
has a `Scenario:` line and it is blank. So each new screen in the prototype
says, in so many words, there is nothing to click here yet.

**Your next step is one story, not ten.** Pick the feature that matters most,
write two or three things that have to be true for it to be done, and one
Given, When, Then. Then it gets Card 5 and a place in the architecture.

Our suggestion for which one: **In app messaging and calls.** Your plan leads
with it, and three of your other stories (streaks, communities, stickers) only
make sense once it exists. Argue with that if you disagree, and say why.

Two smaller things while you are in there:

- The narratives are written "I always wanted", "I constantly wanted", "I
  desired". The form is **"As a user, I want ..."**, present tense, no adverb.
  The generator has been taught to read yours, but the person who has to build
  from a story wants to know what the user wants now, not what they used to
  want.
- **Topics and Map have no "so that".** Topics says "so I decided to create
  this", which is why you built it. Map stops after the want. The "so that" is
  why somebody would use it, and it is the half that says whether the feature
  is worth building.

Six features still have nothing written: What you should get, LIVEs, Data
protection and encryption, Bots, Advanced reports and moderation, and Algorithm
sorting. They are not deleted. They are waiting for stories, same as before.
