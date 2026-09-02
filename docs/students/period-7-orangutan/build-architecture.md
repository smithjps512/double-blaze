# Team Orangutan: build architecture

Team: Team Orangutan. Tool: Anvil.

## The buildable slice

You wrote the most complete set of stories in the class: five stories, most with
real Given, When and Then lines. That earns you a bigger slice than anyone else.

**In the slice, in this order:**

1. Placement test
2. Course list, filtered by level
3. Watch a video
4. Take a quiz and get a score
5. Leaderboard
6. Secret mode

**Stubbed, and why:**

- **A real AI assistant that solves equations.** Your assistant answers from a
  table of worked examples you write. The step by step explanation your story
  asks for is exactly what goes in that table, so writing them is the feature.
- **The racing game against an AI.** No story, and it is a whole game.

**Give your app a name.** Your plan never does, so this prototype is titled
after your team, and your app deserves better.

## Screens to create

| Form name | What it is |
|---|---|
| `Placement` | The test that sets your level |
| `Courses` | Courses for your level |
| `Video` | Watch a course video |
| `Quiz` | Answer questions, get a score |
| `Leaderboard` | Most XP first |

## Components, with the exact names to use

**Placement:** `lbl_question`, `txt_answer`, `btn_submit`, `lbl_progress`

**Courses:** `rp_courses` with `lbl_course_name`, `lbl_course_topic`;
`btn_leaderboard`

**Video:** `lbl_video_title`, `lbl_video_link`, `lbl_length`, `btn_take_quiz`

**Quiz:** `lbl_question`, `txt_answer`, `btn_submit_answer`, `lbl_score`

**Leaderboard:** `rp_ranks` with `lbl_rank_name`, `lbl_rank_xp`

## Data tables

- **users_progress**: `user`, `level` (number), `xp` (number)
- **courses**: `name`, `topic`, `level` (number), `video_link`, `video_length`
- **questions**: `course` (text), `question`, `answer`

## How each feature gets built

### Feature 1: Placement test
Patterns: **8**, **3**, **1**, **2**, **6**, then **7** or **10** to save the
level.

Ask a few questions, count the right answers, save a level number. Your "secret
age groups" story says the level is never shown to the user, so save it and
simply never put it in a label. **That is the whole feature.** Some of the best
features are the ones nobody sees.

### Feature 2: Course list for your level
Patterns: **8**, **6**, **9**.

Look up this user's level, then search courses for that level:
`app_tables.courses.search(level=my_level)`.

### Feature 3: Watch a video
Patterns: **1**, **4**, **3**.

Your story asks for pause, 2x speed and skipping. Those belong to the video
player itself, not to your code. Show the link and the length. Recognising which
parts you build and which parts the player already does is real engineering.

### Feature 4: Quiz and score
Patterns: **8**, **3**, **1**, **6**, **10**.

Count right and wrong, show both, add XP for right answers.

### Feature 5: Leaderboard
Patterns: **8**, **11**, **9**.

`tables.order_by("xp", ascending=False)`. This is the single cleanest use of
Pattern 11 in the class.

### Feature 6: Secret mode
Patterns: **1**, **6**, **14**.

Your prank where 1 plus 1 shows 3. A key combination is fiddly, so start with a
hidden button in a corner. Build this last, as a reward.

## What to do when you are stuck

1. Do not know what the app should do, go to your build card.
2. Do not know how to write it, go to the Pattern Book.
3. Do not know what fills the blank, come back here.
