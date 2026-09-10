# CTOS: build architecture

Team: CTOS. Tool: Anvil.

## The buildable slice

You listed 17 features and, when this page was first written, had 2 user
stories. On 10 September that became 12. It is still worth being direct about
the plan: it describes Wikipedia, YouTube, TikTok, Snapchat and Discord
combined, and those five companies employ tens of thousands of engineers
between them.

That is not a reason to feel bad. Ambition is where good products start. But
building starts with choosing, so here is the choice.

**In the slice, in this order:**

1. Sign in
2. Post a video (title, link, and whether it is a Short or a Video)
3. The feed
4. Build a quiz
5. Take a quiz

**Stubbed, and why:**

- **In app messaging and calls.** A narrative and no scenario, so there is no
  finish line to build to yet. This is the one your cards suggest writing first.
- **Avatar.** A narrative and no scenario. A 3D model is also outside what Anvil
  can draw; the first version would be a picture chosen from a list.
- **Topics.** A narrative with no "so that" and no scenario.
- **Map.** A narrative with no "so that" and no scenario, and it needs an
  outside service. The first version of a map is a list of places.
- **Streaks.** A narrative and no scenario. It also needs messaging to exist
  first, because a streak counts messages.
- **User support.** A narrative and no scenario.
- **Turn features off and on.** A narrative and no scenario.
- **Stickers and reaction images.** A narrative and no scenario, and it needs
  messaging to exist first.
- **Public and private communities.** A narrative and no scenario, and it needs
  messaging to exist first.
- **What you should get, LIVEs, Data protection and encryption, Bots, Advanced
  reports and moderation, Algorithm sorting.** No story at all.

**The way anything on that list gets off it** is one story with acceptance
criteria and a Given, When, Then. Write it, and it gets a card and a place on
this page. Sorting by newest, which you called algorithm sorting, is already in
the feed.

**Pick your app's name while you are at it.** Your plan says "App Name :" and
leaves it blank, so this prototype is titled after your team.

## Screens to create

| Form name | What it is |
|---|---|
| `SignIn` | Sign in or sign up |
| `Feed` | Every posted video, newest first |
| `PostVideo` | Add a video |
| `QuizBuilder` | Make a quiz |
| `TakeQuiz` | Answer a quiz and get a score |

## Components, with the exact names to use

**SignIn:** `btn_sign_in`

**Feed:** `rp_videos` with `lbl_video_title`, `lbl_kind`, `lbl_posted_by`;
`btn_post`, `btn_quizzes`

**PostVideo:** `txt_title`, `txt_link`, `dd_kind` (DropDown: Short, Video),
`btn_upload`, `lbl_error`

**QuizBuilder:** `txt_question`, `txt_answer`, `btn_add_question`,
`rp_questions` with `lbl_question_line`; `btn_finish`

**TakeQuiz:** `lbl_question`, `txt_answer`, `btn_submit`, `lbl_score`

## Data tables

- **videos**: `title`, `link`, `kind` (Short or Video), `posted_by`, `posted`
  (date and time)
- **quizzes**: `name`, `made_by`, `is_public` (true or false)
- **questions**: `quiz` (text), `question`, `answer`

## How each feature gets built

### Feature 1: Sign in
Patterns: **12**, **4**.

### Feature 2: Post a video
Patterns: **1**, **2**, **13**, **6**, **7**, **5**, **4**.

Your story says "I see a box that says upload video here". Uploading a video
file is heavy. Start with a title and a link to a video that already exists,
which is what most of the internet actually does.

Your newer stories draw a line at 75 seconds: at or under is a Short, over is a
Video. The app cannot measure a link, so the person posting picks one from
`dd_kind` (Pattern 13) and it is saved in the `kind` column with the rest.

### Feature 3: The feed
Patterns: **8**, **11**, **9**.

Newest first: `tables.order_by("posted", ascending=False)`. Your plan calls this
"algorithm sorting". Sorting by newest is an algorithm. You have built it.

Each row shows `kind` in `lbl_kind`, so the feed says Short or Video beside the
title. Showing only Shorts is one filter away, and a story away.

### Feature 4: Build a quiz
Patterns: **1**, **2**, **6**, **7**, then **8**, **9** to show the questions
added so far.

Your quiz story is unusually well specified: you wrote out the grade bands, the
plus and minus buttons, and public versus private. Build the adding of questions
first, then the rest.

### Feature 5: Take a quiz and get a score
Patterns: **8**, **3**, **1**, **6**, **10**.

Show a question, compare the typed answer to the stored one, count the right
ones, show the score against your grade bands at the end.

**Your grade bands are your acceptance criteria.** 96 to 100 is Awesome. Test it
by getting them all right and all wrong.

## What to do when you are stuck

1. Do not know what the app should do, go to your build card.
2. Do not know how to write it, go to the Pattern Book.
3. Do not know what fills the blank, come back here.
