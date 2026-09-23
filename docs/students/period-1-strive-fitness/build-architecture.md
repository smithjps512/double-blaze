# Strive Fitness: build architecture

Team: BMS Crew. Tool: Anvil.

Your build cards send you here. This page sends you to the Pattern Book at
`docs/build/anvil-patterns.md`.

## The buildable slice

This architecture was built from your four stories, back when there was no
product plan. **There is one now**, and it lists nine features against the seven
below. The last three, the run screen, the subscription and the AI coach,
arrived after the plan as stories your team wrote, which is how the rest should
arrive too.

That gap is not a mistake on either side. Seven is more than most teams will
finish and nine is a product; the job is to build them in this order and stop
when the bell goes. Read them side by side and settle it as a team before you
build anything else.

One of the nine is worth saying out loud: **Ads** is not a feature somebody
uses, it is how the app makes money. Every real product plan has that section
and it belongs in yours. It is just not a screen, so nothing here builds it.
Subscription tiers used to be in that sentence too, and then you wrote a story
for it, so now it has a screen. Read the stubbed list before you build it.

**In the slice, in this order:**

1. Sign up and sign in
2. Log an activity
3. See your activity history
4. Chatroom
5. Start a run
6. Subscription tiers
7. The AI coach

**Stubbed for now, and why:**

- **Real payments.** Taking money needs a payment company, a bank account and
  a grown-up's signature, and none of that belongs in a class project. Your
  story says "payments can be accepted", and in this version the `Subscribe`
  screen has a button that says exactly what it is: **Pay (pretend)**. It sets
  the user's tier and unlocks the features the tier promises. Everything a
  user sees is real; the money is the one line that is not, and the button
  says so. Swapping pretend for Stripe later is somebody else's afternoon.
- **A real AI.** Your coach story wants to ask any question and get an answer.
  A real model needs an account key and costs money per question. The `Coach`
  screen answers from a table of questions and answers your team writes, with
  a video link on each row. Writing twenty good answers about form, warm-ups
  and rest days is the feature, and it is a better one than most: it is your
  team's knowledge, not a machine's guess.

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
| `Subscribe` | Pick a tier, pay (pretend), see what it unlocked |
| `Coach` | Ask a question, get one of your team's answers and a video |

## Components to create, with the exact names to use

**SignIn:** `btn_sign_in`

**Home:** `dd_weather` (DropDown), `lbl_plan` (Label), `btn_run` (Button, says
"Run"), `btn_log`, `btn_history`, `btn_chat`, `btn_coach`, `btn_subscribe`,
`lbl_tier` (Label, says which tier you are on)

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

**Subscribe:** `dd_tier` (DropDown: Free, Bronze, Gold), `lbl_tier_price`
(Label), `lbl_tier_unlocks` (Label, what this tier gives you), `btn_pay`
(Button, says "Pay (pretend)"), `lbl_current_tier` (Label), `lbl_error` (Label,
starts invisible)

**Coach:** `txt_question` (TextBox), `btn_ask`, `lbl_answer` (Label),
`lnk_video` (Link, starts invisible), `lbl_error` (Label, starts invisible)

## Data tables

Your teacher creates these and gives you the exact names.

- **activities**: `user` (text), `miles` (number), `minutes` (number), `when` (date and time)
- **messages**: `user` (text), `text` (text), `when` (date and time)
- **subscriptions**: `user` (text), `tier` (text), `when` (date and time)
- **coach_answers**: `keywords` (text), `answer` (text), `video_link` (text)

**A subscription is a row, not a column on the user.** The newest row for a
user is their tier. That way an upgrade and a downgrade are both just another
row, and the history of who paid for what is kept for free, which is the same
idea as your activities table.

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

### Feature 6: Subscription tiers
Patterns: **4** from `btn_subscribe`, **13**, **1**, **7**, **5**, then **8**
back on `Home`.

Your plan names the tiers and the prices: Bronze, no ads, $5 a month; Gold,
Bronze plus multi user access, $10. Put exactly those words in `lbl_tier_price`
and `lbl_tier_unlocks` when `dd_tier` changes (Pattern 13). `btn_pay` saves a
row to **subscriptions** with the tier and says it worked. There is no card
number box anywhere, on purpose, and the button says pretend, on purpose.

**Unlocking is the real part.** On `Home`, read the user's newest subscription
row and put the tier in `lbl_tier`. Then decide as a team what Gold actually
unlocks in *this* app and make one thing true: the simplest is that the weekly
plan on `Home` shows the whole week for Gold and only today for Free. A tier
that unlocks nothing is a label, not a feature, and your story says "unlock
more features", so pick one and build it.

### Feature 7: The AI coach
Patterns: **4** from `btn_coach`, **1**, **2**, **6**, **8**, **3**.

Press `btn_ask`, read `txt_question`, refuse an empty box (Pattern 6), then
search **coach_answers** on the server for a row whose `keywords` appear in
the question. Show its `answer` in `lbl_answer`; if it has a `video_link`, put
it on `lnk_video` and make the link visible. No match is not an error: say
"I do not have an answer for that yet. Ask your coach in person," and write the
question down, because a question nobody could answer is the next row in the
table.

**Your story's second scenario**, deciding whether you like the answer and doing
it or not, is the runner's choice, not the app's. Nothing gets built for it, and
that is fine.

**Write the table before the code.** Twenty rows: warm up, stretching, sore
knees, how far to run the first week, what to eat after, rest days. Real
answers you would give a friend, each with one good video. That is the feature,
and the code is twenty lines around it.

## What to do when you are stuck

1. Do not know what the app should do, go back to your build card.
2. Know what it should do but not how to write it, go to the Pattern Book.
3. Know the pattern but not what fills the blank, come back to this page.
