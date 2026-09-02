# Daily: build architecture

Team: The Lions. Tool: Anvil.

## The buildable slice

**In the slice, in this order:**

1. Sign in
2. Add a habit
3. Tick off today
4. Streaks
5. The helper

**Stubbed, and why:**

- **Live weather.** Needs an outside service. Pick today's conditions from a
  dropdown instead, which changes nothing else about your app.
- **A real AI helper.** Answers come from a table of question and answer pairs
  you write. Your fitness story asks about heavy weight with few reps versus
  light weight with many. Write that answer yourselves. It is a better answer
  than a generic AI would give, because you know what your users are asking.
- **Sharing routines, nutrition planning, rewards.** No stories, so nothing to
  build from. Rewards are close to streaks, so they may come almost free.

**One story to fix.** Your nutrition story starts "I want to lose weight" with
no "As a" clause, so it never says who it is for. It reads as being about one of
you rather than about a user. Give it a person.

## Screens to create

| Form name | What it is |
|---|---|
| `SignIn` | Sign in or sign up |
| `Today` | Your habits for today, with tick boxes |
| `AddHabit` | Create a new habit |
| `Helper` | Ask a question, get an answer |

## Components, with the exact names to use

**SignIn:** `btn_sign_in`

**Today:** `dd_weather` (DropDown), `rp_habits` with `lbl_habit_name`,
`chk_done`, `lbl_streak`; `btn_add_habit`, `btn_helper`

**AddHabit:** `txt_habit_name`, `dd_how_often`, `btn_save_habit`, `lbl_error`

**Helper:** `txt_question`, `btn_ask`, `lbl_answer`

## Data tables

- **habits**: `user`, `name`, `how_often`, `streak` (number)
- **completions**: `user`, `habit` (text), `done_on` (date)
- **helper_answers**: `keyword`, `answer`

## How each feature gets built

### Feature 1: Sign in
Patterns: **12**, **4**.

### Feature 2: Add a habit
Patterns: **1**, **2**, **13**, **6**, **7**, **5**.

Refuse an empty habit name.

### Feature 3: Tick off today
Patterns: **8**, **9**, then **1**, **7** when a box is ticked.

The tick box lives inside the repeating panel's item template, so its handler
reads `self.item` to know which habit it belongs to. This is the trickiest part
of your app and it is worth taking slowly.

### Feature 4: Streaks
Patterns: **8**, **6**, **10**, **3**.

If today's completion follows yesterday's, add one to the streak. If a day was
missed, set it back to 1. This is the most interesting logic in your app and it
is where your product actually helps somebody.

### Feature 5: The helper
Patterns: **1**, **2**, **8**, **6**, **3**.

## What to do when you are stuck

1. Do not know what the app should do, go to your build card.
2. Do not know how to write it, go to the Pattern Book.
3. Do not know what fills the blank, come back here.
