# Where this team's documents came from

Transcribed from Google Drive, folder `7th period / 7th period app / CTOS`.

- `app product plan.pdf`: the plan. `app product plan2.pdf`, and a stray copy
  saved as `CTOS.pdf` one folder up, are byte-identical re-uploads of it and
  were skipped.
- `My User Stories.pdf`: uploading and sharing a video.
- `My User Stories2.pdf`: the quizzing feature.

Changes made in transcription: the feature table was flattened into a list,
spelling corrected, and the template scaffolding removed. Nothing was added.

Two things for the team, left as they wrote them:

1. **The plan has "App Name :" and left it blank**, so the prototype is titled
   after the team. Naming the product is the fix.
2. **17 features, 2 user stories.** Fifteen screens are empty and the coach
   notes name every one. This is the most ambitious plan in the period and the
   thinnest coverage; picking three features to write stories for would turn it
   into a real prototype fast.

---

## Ten more stories arrived, 10 September

A second document, `Other User Stories.pdf`, written by one member of the team
and handed in after the first pass. It is a section per feature: a paragraph
describing the feature, a narrative, and a `Scenario:` line, and **every
Scenario line is blank**. There are no acceptance criteria either.

It covers nine features that had no story at all (messaging and calls, avatars,
topics, the map, streaks, user support, turning features off and on, stickers,
communities), adds a second story to Shorts and videos, and ends with a "Who
this is made for" section that defines two kinds of account, Users and Guests.

**Where each part went:**

- The narratives are in `user-stories.md`, one per feature, under the feature's
  name from the plan so the generator files them on the right screen.
- The paragraph describing each feature sits above its narrative. The generator
  does not read it, which is deliberate: those paragraphs are the team's
  definitions, not finish lines. "75 seconds or less" is a criterion waiting to
  be written as one.
- "Who this is made for" went into the plan's **Who are the users** section,
  with Users and Guests as two named kinds of user, because that is what they
  are.

Changes made in transcription: the `Narrative:` and blank `Scenario:` labels
removed as template scaffolding; dashes replaced with commas or colons;
"&" written as "and"; "don't" and "doesn't" written out; "blindguessing" to
"blind guessing", "english" to "English", "trad" to "traditional"; and where a
narrative split its "So that" into a second sentence, the two were joined with a
comma, which is the form the parser reads. Dropped: "With this you can finally
do it!", a tagline at the end of the Map narrative that is not part of the
story. Nothing was added.

**Changed in the generator, not in their words:** every one of these narratives
is written as "I always wanted", "I constantly wanted", "I desired" or "I
desire", and the parser only knew "I want". Read as written, none of the ten
registered and nine features stayed reported as unwritten on the day their
stories arrived. The parser now accepts the past tense and an adverb, so their
sentences stand as they wrote them. The form they were taught is still "I
want", and their cards say so.

**Three things for the team, from reading it:**

1. **Ten narratives, zero scenarios, zero criteria.** Each new story is a
   sentence with nothing under it, so each new screen in the prototype says
   there is nothing to click. That is now the single most useful thing to fix
   and the cards name which one to do first.
2. **Topics and Map have no "so that".** Topics says "so I decided to create
   this just to fit it", which is why the team built it, not why somebody would
   use it. Map stops after the want. Both worth rewriting.
3. **The Shorts definition is a real decision.** 75 seconds or less is a Short,
   anything longer is a video, both live in Media. That is the first time the
   plan has drawn that line, and the Post a video card now uses it.
