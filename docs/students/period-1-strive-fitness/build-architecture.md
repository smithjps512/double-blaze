# Strive Fitness: build architecture

Team: BMS Crew. Tool: Anvil.

Your build cards send you here. This page sends you to the Pattern Book at
`docs/build/anvil-patterns.md`.

## The buildable slice

You wrote four stories and no product plan, so this architecture is built from
the stories alone. That works, but it means the feature list below is your plan
now. Copy it into a real product plan when you get a chance.

**In the slice, in this order:**

1. Sign up and sign in
2. Log an activity
3. See your activity history
4. Chatroom

**Stubbed for now, and why:**

- **Live weather.** Real weather needs an outside service and an account key.
  Instead, the weekly plan screen asks you to pick today's conditions from a
  dropdown. Everything else in your weather story, the indoor and outdoor plan
  split, works exactly the same. Swapping a dropdown for a real service later is
  a small change, which is a good thing to notice.
- **Moderation and banning in the chatroom.** Your story has a moderator who
  bans people. Build posting first. Banning needs accounts with roles, and you
  will understand it much better once posting works.

## Screens to create

| Form name | What it is |
|---|---|
| `SignIn` | Sign up or sign in |
| `Home` | Today's plan, and buttons to the other screens |
| `LogActivity` | Record a run or a workout |
| `History` | Everything you have logged, newest first |
| `Chatroom` | Post a message, see everyone's messages |

## Components to create, with the exact names to use

**SignIn:** `btn_sign_in`

**Home:** `dd_weather` (DropDown), `lbl_plan` (Label), `btn_log`, `btn_history`,
`btn_chat`

**LogActivity:** `txt_miles` (TextBox), `txt_minutes` (TextBox),
`btn_save_activity`, `lbl_error` (Label, starts invisible)

**History:** `rp_activities` (RepeatingPanel) with `lbl_activity_line` inside

**Chatroom:** `txt_message` (TextBox), `btn_post`, `rp_messages`
(RepeatingPanel) with `lbl_message_line` inside

## Data tables

Your teacher creates these and gives you the exact names.

- **activities**: `user` (text), `miles` (number), `minutes` (number), `when` (date and time)
- **messages**: `user` (text), `text` (text), `when` (date and time)

## How each feature gets built

### Feature 1: Sign up and sign in
Patterns: **12**, then **4**.

Your criteria ask for a confirmation code and a 4 digit pin. Anvil's Users
service already handles sign up, passwords and email confirmation. Turn it on
and use it rather than building your own. Building your own login is how real
apps get broken into.

### Feature 2: Log an activity
Patterns: **1**, **2**, **6**, **7**, **5**.

Click, read the two boxes, check they are actually numbers, save the row, say it
worked. Pattern 6 is doing real work here: `int("banana")` crashes your app.

### Feature 3: See your activity history
Patterns: **8**, **11**, **9**.

Newest first, so `tables.order_by("when", ascending=False)`.

Your activity story says the app told you that you could post your achievement.
That is Feature 4 arriving from Feature 3, and it is a nice touch: put a "share
this" button on a history row.

### Feature 4: Chatroom
Patterns: **1**, **2**, **7**, then **8**, **9** to show the messages.

Same shape as logging an activity. Once you have built one save-and-list
feature, the second one is the same five patterns in the same order. Noticing
that is worth more than the chatroom.

## What to do when you are stuck

1. Do not know what the app should do, go back to your build card.
2. Know what it should do but not how to write it, go to the Pattern Book.
3. Know the pattern but not what fills the blank, come back to this page.
