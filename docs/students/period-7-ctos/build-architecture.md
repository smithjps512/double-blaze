# CTOS: build architecture

Team: CTOS. Tool: Anvil.

## The buildable slice

You listed 17 features and wrote 2 user stories. That is the widest gap in the
whole class, and it is worth being direct about: your plan describes Wikipedia,
YouTube, TikTok, Snapchat and Discord combined. Those five companies employ tens
of thousands of engineers between them.

That is not a reason to feel bad. Ambition is where good products start. But
building starts with choosing, so here is the choice.

**In the slice, in this order:**

1. Sign in
2. Post a video (title and link)
3. The feed
4. Build a quiz
5. Take a quiz

**Everything else is stubbed**, because 15 of your 17 features have no user
story and there is nothing to build from. That includes messaging, calls,
avatars, the map, streaks, LIVEs, bots, moderation, communities and the sorting
algorithm. If one of them matters more than the five above, write its story and
swap it in.

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

**Feed:** `rp_videos` with `lbl_video_title`, `lbl_posted_by`;
`btn_post`, `btn_quizzes`

**PostVideo:** `txt_title`, `txt_link`, `btn_upload`, `lbl_error`

**QuizBuilder:** `txt_question`, `txt_answer`, `btn_add_question`,
`rp_questions` with `lbl_question_line`; `btn_finish`

**TakeQuiz:** `lbl_question`, `txt_answer`, `btn_submit`, `lbl_score`

## Data tables

- **videos**: `title`, `link`, `posted_by`, `posted` (date and time)
- **quizzes**: `name`, `made_by`, `is_public` (true or false)
- **questions**: `quiz` (text), `question`, `answer`

## How each feature gets built

### Feature 1: Sign in
Patterns: **12**, **4**.

### Feature 2: Post a video
Patterns: **1**, **2**, **6**, **7**, **5**, **4**.

Your story says "I see a box that says upload video here". Uploading a video
file is heavy. Start with a title and a link to a video that already exists,
which is what most of the internet actually does.

### Feature 3: The feed
Patterns: **8**, **11**, **9**.

Newest first: `tables.order_by("posted", ascending=False)`. Your plan calls this
"algorithm sorting". Sorting by newest is an algorithm. You have built it.

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
