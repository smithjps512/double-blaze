# Writing a user story

And everything that falls out of one.

A user story is four or five sentences. It is also the single most powerful
document in this whole project, because **everything downstream is built from
it**: your prototype, your test plan, your build cards, your design brief, and
in the end your code.

That is not a figure of speech. Change a story and your prototype changes. Write
a criterion nobody could check and your test plan has a hole in it with your own
sentence sitting in the hole.

**[Open the story studio](/trail-crew/write)** when you are ready to write one.

---

## The shape

Three parts, and each one does a different job.

### 1. The narrative

One sentence, in three pieces:

> **As a** teacher, **I want** to add points to a house, **so that** students
> can see their house going up during the week.

**As a** names *a kind of person*, not a person. "As a teacher", not "As my
teacher". A story written about one particular person stops making sense the day
that person leaves, and half the point of a story is that somebody who has never
met you can build from it.

**I want** is what they do. Start it with a verb: see, add, choose, send, check.

**So that** is the reason, and it is the half everybody skips. It is also the
most valuable one, because it is the only part that tells you whether the
feature is worth building. If you cannot finish the sentence, that is a real
finding: you may have written down a thing you could build rather than a thing
somebody needs.

A test for a good **so that**: does it say what goes *wrong* without this
feature? "So that I can add points" is the want again in different words. "So
that students can see their house going up during the week" is a reason.

### 2. Acceptance criteria

Your finish line. Each one is something that has to be true before anybody can
say this is done.

Good ones sound like this:

- A teacher can add up to 50 points at a time
- The scoreboard shows the new total straight away
- Students can see the scoreboard without signing in

The rule that catches most people: **a criterion has to be something you can
check by looking**. Two kinds of sentence fail that, and both are extremely
common, and both come from real stories these teams handed in.

**"The animation must be entertaining to as many people as possible."** That is
a genuinely good thing to want, and there is no way to look at a screen and tell
whether it is true. Ask yourself what you would *see* if it were true, and that
sentence is the criterion.

**"We must have teacher accounts."** That says a thing has to exist. A criterion
says what *happens*. Rewrite it as "a teacher can sign in with an email and a
password" and now somebody can go and check it.

### 3. Scenarios

One story of one time somebody uses it, in three lines:

> **Given** I am signed in as a teacher
> **When** I add 10 points to Gryffindor
> **Then** the scoreboard shows 10 more

**Given** is what is already true before anything happens. **When** is the thing
somebody does. **Then** is what should happen because of it.

Scenarios feel like extra typing. They are not, and the test plan is about to
show you exactly why.

---

## What your story turns into

### A test plan, for free

Open any team's **test plan** page. Nobody wrote those pages. They were worked
out from the stories by three rules you could follow on paper:

1. **Every scenario is already a test.** Given is the setup, When is the step,
   Then is what you expect.
2. **Every criterion becomes a test** that checks it.
3. **Every rule that refuses something gets a second test** that tries to do the
   refused thing. A rule you have never broken on purpose is a rule you do not
   know works.

Now here is the thing worth noticing, and it is the best argument for writing
scenarios that anybody has ever come up with:

| # | What somebody does | It passes when | Came from |
|---|---|---|---|
| T1 | Set it up so that I am signed in as a teacher. I add 10 points to Gryffindor. | The scoreboard shows 10 more | Your scenario |
| T2 | **You write this.** | A teacher can add up to 50 points at a time | A criterion |

**The scenario filled in both columns. The criterion only filled in one.**

That is not a quirk of the tool. A criterion tells you what has to be *true*. It
never tells you what somebody *does*. Writing three lines of Given/When/Then
saves you working that out later, when you have forgotten what you meant.

### Code directions

Once a story has criteria, the words in them point at what building it would
take. A criterion with "save" in it needs the pattern about saving. One with "no
more than" needs the pattern about checking before you act.

Your test plan page lists these as **a first draft, not a verdict**. Deciding
which patterns you need and what order they go in is judgment, and it is yours.
A team that disagrees with the suggestion and can say why has learned more than
a team handed the right answer.

### A screen, and then a design

Your prototype rebuilds from your stories, so a new story becomes something you
can click. Your design brief lists the screens and component names your builders
agreed on. And the [step by step Figma guide](/build/prototype-steps.html) turns
that into something somebody can tap through.

The chain, end to end:

```
story  ->  test plan  ->  build card  ->  architecture  ->  code
  |                                          |
  |                                          v
  +--------->  prototype              design brief  ->  Figma
```

---

## Using the story studio

Go to **[the story studio](/trail-crew/write)** and there are boxes for every
part of the shape above.

As you type, two things happen on the right:

- **The checks.** Rules, not opinions. They say what is missing and what is
  thin, and you can argue with any of them. The ones marked *Needed* have to be
  filled in. The ones marked *Think about* are advice, and if you disagree, send
  it anyway and say why.
- **The test plan.** It builds itself as you write. When it goes thin, your
  story went thin first. That is the fastest feedback you will get all year.

### Spark is there, and it will not write it for you

There is an Ask box at the bottom. It is good at "what counts as a criterion",
"is my so that any good", "why can my criterion not be tested".

It will not write your story, and it is not going to change its mind however you
ask. That is not the tool being difficult. **A story Spark wrote is not yours.**
You cannot defend it in a design review, you will not notice when it turns out
to be wrong, and the whole reason we write stories before building anything is
that arguing about the story is where the thinking happens.

What it *will* do is ask you the question that gets you unstuck. Usually one
question. Usually the one you were avoiding.

### Then your teacher decides

Sending a story does not change anything. It goes to your teacher, he reads it,
and only if he approves does it land in your team's file. When it does, your
prototype rebuilds, your test plan page picks it up, and the code directions
appear with it.

---

## Before you send one

- [ ] The name is two or three words
- [ ] "As a" is a kind of person, not somebody's name
- [ ] "So that" says what goes wrong without this feature
- [ ] At least two acceptance criteria
- [ ] Every criterion is something you could check by looking
- [ ] At least one complete Given/When/Then
- [ ] You read the test plan it produced, and it is not embarrassing
- [ ] Somebody else on your team read the story and agreed with it

That last one matters more than it looks. A story is a promise your team makes
to itself about what you are building. If two of you read it differently, you
have just found the argument you would otherwise have had in three weeks, with
half the app built the wrong way.
