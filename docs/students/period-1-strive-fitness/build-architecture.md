# Strive Fitness: build architecture

Team: BMS Crew. Tool: Anvil.

Your build cards send you here. This page sends you to the Pattern Book at
`docs/build/anvil-patterns.md`.

## The buildable slice

This architecture was built from your four stories, back when there was no
product plan. **There is one now**, and it lists nine features against the five
below. The fifth, the run screen, arrived after the plan, as a story your team
wrote, which is how the other four should arrive too.

That gap is not a mistake on either side. Five is a slice you can finish and
nine is a product; the job is to decide which five, and it may not be these
five now that the plan exists. Read them side by side and settle it as a team
before you build anything else.

Two of the nine are worth saying out loud: **Ads** and **Subscription tiers**
are not features somebody uses, they are how the app makes money. Every real
product plan has that section and it belongs in yours. It is just not a screen,
so nothing here builds it.

**In the slice, in this order:**

1. Sign up and sign in
2. Log an activity
3. See your activity history
4. Chatroom
5. Start a run

**Stubbed for now, and why:**

- **Live distance and pace.** Your run story wants the distance and the pace
  to tick up while you run. The clock can: Anvil has a Timer component that
  fires every second, so the time on the screen is real. The distance cannot,
  yet. Knowing how far a phone has moved means asking the browser for GPS,
  every few seconds, in JavaScript, and nothing in this class writes
  JavaScript. So for now the `Run` screen runs the clock live, and when you
  press stop it asks you how far you went. Pace and calories are worked out
  from that. Swapping the box for GPS later is the same kind of swap as the
  weather dropdown below, and noticing that it is a swap is the point.
- **Calories.** A real number needs your weight and your heart rate. Use
  sixty calories per kilometre, say so on the screen, and write it down as an
  estimate. An honest rough number beats a precise made-up one.

- **Live weather.** Real weather needs an outside service and an account key.
  Instead, the weekly plan screen asks you to pick today's conditions from a
  dropdown. Everything else in your weather story, the indoor and outdoor plan
  split, works exactly the same. Swapping a dropdown for a real service later is
  a small change, which is a good thing to notice.
- **Moderation and banning in the chatroom.** Your story has a moderator who
  bans people. Build posting first. Banning needs accounts with roles, and you
  will understand it much better once posting works.

- **Signing in with Google or Apple.** Your plan offers three ways to sign up:
  Google, Apple, or email. **Build the email one. The other two are out of
  reach, and that is not your fault.**

  Signing in with somebody else's account system means registering your app
  with that company first: a developer account, a consent screen, a set of
  keys. Apple's costs money. Google's is free but has to be set up in a Google
  Cloud project, and your school account almost certainly cannot create one,
  because school accounts are managed and third party app access is switched
  off by an administrator you have never met.

  **This is a real finding and it is worth more than the feature was.** "We
  cannot build this because we do not have access to it" is one of the most
  common reasons a feature dies in real work, and noticing it in week two
  instead of week six is the whole skill. Write it down, say it in your design
  review, and move on. Email and password does everything your user story
  actually asks for.

## Screens to create

| Form name | What it is |
|---|---|
| `SignIn` | Sign up or sign in |
| `Home` | Today's plan, and buttons to the other screens |
| `LogActivity` | Record a run or a workout |
| `Run` | Start a run, watch the clock, stop, and it is saved |
| `History` | Everything you have logged, newest first |
| `Chatroom` | Post a message, see everyone's messages |

## Components to create, with the exact names to use

**SignIn:** `btn_sign_in`

**Home:** `dd_weather` (DropDown), `lbl_plan` (Label), `btn_run` (Button, says
"Run"), `btn_log`, `btn_history`, `btn_chat`

**LogActivity:** `txt_miles` (TextBox), `txt_minutes` (TextBox),
`btn_save_activity`, `lbl_error` (Label, starts invisible)

**Run:** `btn_start_run` (Button, says "Start run"), `tmr_run` (Timer, interval
1 second, starts disabled), `lbl_time` (Label), `lbl_distance` (Label, km and
mi on one line), `lbl_pace` (Label), `lbl_calories` (Label), `btn_stop_run`
(Button, starts invisible), `txt_km` (TextBox, starts invisible, how far you
went), `btn_save_run` (Button, starts invisible), `lbl_error` (Label, starts
invisible)

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

Anvil's Users service already handles sign up, passwords and email
confirmation. Turn it on and use it rather than building your own. Building
your own login is how real apps get broken into.

**Turn Google off in the Users service.** In the Users service settings there is
a list of ways people can sign in. Leave **Email** ticked and untick the rest.
This matters more than it sounds: the login form shows a button for every method
that is ticked, so leaving Google on gives you a Google button that appears,
gets clicked, and fails, and it will look like your code is broken when it is
not. See the stubbed list above for why Google is out of reach.

**Your criteria ask for a confirmation code and a 4 digit pin.** Anvil can email
a confirmation link when somebody signs up, which is the same idea. Whether you
turn it on is a decision for your team, and there is a real trade-off: it is one
tick in the Users service, and it means nobody can use your app until they go and
find an email, which in a forty minute lesson with twenty testers is painful.
**Decide it on purpose and write down which way you went.** A pin is a third
thing again, and nothing in your stories says what the pin is for. Work that out
before you build it.

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

### Feature 5: Start a run
Patterns: **4** to get here from `btn_run` on `Home`, then **1**, **3**, and the
Timer, then **2**, **6**, **7** to save it. Build Feature 2 first: this is
Feature 2 with a stopwatch in front of it, and it saves the same row.

**Start.** `btn_start_run` remembers the time it was pressed, sets
`tmr_run.interval = 1`, hides itself, and shows `btn_stop_run`.

**Every second.** The Timer's `tick` event runs. Work out how many seconds
have passed since start and put it in `lbl_time` as minutes and seconds.
`lbl_distance` and `lbl_pace` show `0.0 km / 0.0 mi` and `--` until the run
is stopped, because the app does not know the distance yet. Say so on the
screen rather than showing a number that is not true.

**Stop.** `btn_stop_run` sets `tmr_run.interval = 0`, then shows `txt_km` and
`btn_save_run`. When the runner types the distance and presses save, check it
is a number (Pattern 6), then fill in the labels: miles is kilometres times
0.621, pace is minutes divided by kilometres, calories is kilometres times 60.
Then save one row to **activities** with `miles` and `minutes`, exactly as
Feature 2 does, so the run appears in `History` with everything else.

**Your story asks for the distance to tick up live.** It does not, yet, and
the stubbed list at the top says why. That is a real finding to say out loud
in your design review: the clock is live, the distance is typed, and the
screen is honest about which is which.

## What to do when you are stuck

1. Do not know what the app should do, go back to your build card.
2. Know what it should do but not how to write it, go to the Pattern Book.
3. Know the pattern but not what fills the blank, come back to this page.
