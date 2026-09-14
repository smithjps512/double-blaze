# Test the handover

No em dashes anywhere in this document or any copy it generates.

A new feature went live: you can hand your Figma design over from your design
brief page, and a review reads it against your own documents. Nobody has used
it yet. You are the first, which makes you the testers, and this page is the
test plan.

Real testing is not "click around and see if it feels fine". It is a list of
things that should happen, tried one at a time, with what actually happened
written down next to what was supposed to. Half of it is trying to break the
thing on purpose. A test that passes because the app refused something is as
good as one that passes because it worked.

**Forty minutes. Three jobs.** One person drives (the keyboard). One person
reads each test out loud and says what should happen before anybody clicks.
One person records: pass, fail, or weird, and one line about what you saw.
Swap after the first ten minutes.

---

## Before you start

You need a Figma file for your team that follows
[Handing over your design](/build/handover.html) at least a little: one page
named after one of your build cards, with one frame on it named after a screen
in your design brief. Five minutes to set up if you have nothing. It does not
have to be finished; the review is more interesting when it is not.

Share the file with your teacher's school email as a viewer. Not "anyone with
the link".

Open three tabs: the gallery at `/trail-crew`, your team's design brief, and
your Figma file.

## How to record a result

For every test, write one of three words and one line:

- **Pass.** What happened is what the test said should happen.
- **Fail.** Something else happened. Write exactly what, in words somebody who
  was not in the room could follow. "It broke" is not a result.
- **Weird.** It did what the test said, but something about it was off: a
  confusing message, a long wait, a page that looked wrong. Say what.

A fail is not bad news. A fail found today is a fail nobody else will hit.

---

## Part 1: The page and the box

**T1. The handover page is findable**
- Given you are on the gallery at `/trail-crew`
- When you look under the shared pages
- Then there is a link called "Handing over your design", and it opens a page
  with a checklist at the bottom

**T2. The page is in your chain**
- Given you are on your team's design brief
- When you look at the links across the top
- Then one of them says "Handing over", and it opens the same page

**T3. The share box is on the design brief and nowhere else**
- Given you are on your design brief
- When you scroll to the bottom
- Then there is a box called "Share your design" with a Figma link, an Anvil
  link, and a note
- And when you open your build cards page and scroll to the bottom, that box
  is not there (the propose-a-story box is)

**T4. It refuses an empty share**
- Given the share box with nothing typed in it
- When you press Share it
- Then it says to paste a Figma link, an Anvil link, or both, and sends nothing

**T5. It refuses a link that is not Figma**
- Given you paste `https://www.google.com` into the Figma box
- When you press Share it
- Then it refuses, and the message tells you where in Figma to find the real
  link (Share, then Copy link, starts with figma.com/design/)

**T6. It refuses a FigJam board**
- Given you paste a FigJam link (it has `/board/` in it) into the Figma box
- When you press Share it
- Then it refuses with the same message. A FigJam board is not a design file.

**T7. It refuses a link that is not a published Anvil app**
- Given you paste `https://anvil.works` into the Anvil box
- When you press Share it
- Then it refuses, and the message says to press Publish in Anvil and copy the
  link that ends in .anvil.app

**T8. A real share is accepted**
- Given your real Figma link in the Figma box, and one line in the note
- When you press Share it
- Then it says "Shared", the boxes clear, and it says a review will appear once
  the file has been read
- And nothing on your design brief page has changed

**T9. The teacher got it**
- Given T8 passed
- When your teacher checks email
- Then there is a message naming your team, quoting your line, with a link that
  opens your Figma file
- And when your teacher opens the queue page, your team is under "Shared
  designs" with the same links

**T10. It stops a flood**
- Given T8 passed, and you press Share it four more times with the same link
- When the fifth one goes
- Then it refuses and says to give it a few minutes. The first four all went
  through. Your teacher's inbox has four emails and that is the finding.

---

## Part 2: The review

Your teacher runs the review on your file, in front of you, and it takes a
minute or two. Watch what it does. Then the review lands in your pages after
the next deploy, which is another few minutes. Use that gap to run Part 3.

**T11. The review reads your file**
- Given your file is shared with your teacher's email
- When your teacher runs the review
- Then it finishes without an error and prints a list of findings, and the
  first line names one thing to do next

**T12. The review is in your chain**
- Given the deploy has finished
- When you open your design brief and look at the links across the top
- Then one of them says "Design review", and it opens a page with your team's
  name, the date, and the same findings your teacher saw

**T13. Every finding is true**
- Given the review page is open beside your Figma file
- When you check each finding against the file
- Then every one describes something that is actually so. A card the review
  says has no page really has no page. A layer it says is missing really is
  missing.
- If any finding is wrong, that is a **fail**, and it is the most valuable
  result on this page. Write exactly which finding and why it is wrong.

**T14. The "already right" list is also true**
- Given the review page
- When you read the "What is already right" section
- Then every line is something you actually did

---

## Part 3: Break it on purpose

Do these in your Figma file, then share again and have your teacher re-run the
review. Each one should produce a specific finding. If it does not, that is a
fail.

**T15. A page with the wrong name**
- Given you rename one card's page to something else, like "Screens"
- When the review runs
- Then it says that card has no page, and that a page is not named after a card

**T16. A missing screen**
- Given you rename one frame from its brief name to something else
- When the review runs
- Then it says that screen has no frame, and that a frame is not a screen in
  your brief

**T17. A missing state**
- Given one screen has no frame ending in `/ empty`
- When the review runs
- Then that screen is named under "no empty state"

**T18. A layer with the wrong name**
- Given you rename one component layer to a made-up name with the right prefix,
  like `btn_launch`
- When the review runs
- Then it names that layer as a component name not in your brief, and names
  the brief's component as missing

**T19. A number that is not yours**
- Given you put a text layer on a frame that says "Join 18,000 users"
- When the review runs
- Then it names 18,000 as a number that is not in your documents

**T20. Lorem ipsum**
- Given you put a text layer that says "Lorem ipsum dolor"
- When the review runs
- Then it names it as placeholder text

**T21. An unshared file**
- Given a Figma file that is NOT shared with your teacher's email
- When you share its link and your teacher runs the review
- Then the review says the file could not be read and that it needs to be
  shared with the teacher's account. It does not ask you to make the file
  public.

**T22. Fixing it makes the list shorter**
- Given you undo T15 to T20
- When the review runs again
- Then every one of those findings is gone, and nothing new appeared

---

## Part 4: Write it up

At the end, the recorder reads the results out. For every **fail** and every
**weird**, fill this in on the whiteboard or in the Stuck box on your design
brief page:

```
Test:            T13
What we did:     Compared finding 2 against the file
What it said:    "Builder is missing chk_tires"
What is true:    chk_tires is on the Builder frame, inside a group
What we think:   The review does not look inside groups
```

That last line is a guess and it is allowed to be wrong. A bug report with a
guess in it gets fixed faster than one without.

**What makes a bug report good:** somebody who was not in the room can do the
same thing and see the same result. If your report does not let them, it is a
complaint, not a report.

## What real testing is

You just did the four things a testing team does:

1. Wrote down what should happen before trying it.
2. Tried the happy path, then tried to break it.
3. Recorded what actually happened, not what you hoped.
4. Wrote reports somebody else could reproduce.

The people who build software for a living do this every day, and most of the
bugs that reach the public are the ones nobody wrote a test for. Your test plan
for your own app is on your Test plan page. It was made from your stories. The
same rules apply.
