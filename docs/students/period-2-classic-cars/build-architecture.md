# Classic Cars: build architecture

Team: Classic Cars. Tool: Anvil.

Your build cards send you here. This page sends you to the Pattern Book at
`docs/build/anvil-patterns.md`.

## The buildable slice

Your whole app is in the slice. Nothing is stubbed and nothing is cut.

That is not because we went easy on you. It is because you picked a product made
of the two things Anvil is best at: showing lists of things, and doing arithmetic
when somebody clicks. Choosing a buildable idea is a real skill and you did it.

**Build in this order:**

1. Car gallery
2. Parts library
3. Horsepower builder
4. Quiz

**Why the quiz is last** even though it is the story you wrote first: it is the
hardest of the four, because it has to keep score. Build the three easier ones
first and you will already know every pattern the quiz needs.

**There is no sign in.** Nothing in this app needs to know who you are. That is a
decision, not something forgotten, and it saves you a whole screen.

## Screens to create

| Form name | What it is |
|---|---|
| `Cars` | The list of cool cars |
| `CarDetail` | One car and its stats |
| `Parts` | The list of car parts |
| `PartDetail` | One part and what it does |
| `Builder` | Pick upgrades, watch horsepower change |
| `Quiz` | Answer questions, get a score |

## Components to create, with the exact names to use

Use these names. The Pattern Book's blanks are filled with these.

**Cars:** `rp_cars` (RepeatingPanel) with `lbl_car_name` and `img_car` inside

**CarDetail:** `lbl_car_name`, `lbl_year`, `lbl_top_speed`, `lbl_horsepower`,
`lbl_special`, `btn_back`

**Parts:** `rp_parts` (RepeatingPanel) with `lbl_part_name` inside

**PartDetail:** `lbl_part_name`, `lbl_what_it_does`, `lbl_if_upgraded`,
`btn_back`

**Builder:** `lbl_total_hp`, `chk_turbo`, `chk_exhaust`, `chk_intake`,
`chk_tires` (CheckBoxes), `btn_reset`

**Quiz:** `lbl_question`, `dd_answer` (DropDown), `btn_next`, `lbl_score`

## Data tables

Your teacher creates these and tells you the exact names. You fill them with
your own cars and parts, which is the fun bit.

- **cars**: `name`, `year` (number), `top_speed` (number), `horsepower` (number), `special`
- **parts**: `name`, `what_it_does`, `if_upgraded`
- **quiz_questions**: `question`, `answer`

## How each feature gets built

### Feature 1: Car gallery
Patterns, in order: **8**, **9**, then **1** and **4** for the detail page.

Get the cars from the server, hand them to `rp_cars`, and inside the item
template each copy reads `self.item['name']`.

**Build this first.** It is the fastest screen in your app and the first time you
will see your own cars appear on a page you made.

### Feature 2: Parts library
Patterns, in order: **8**, **9**, **1**, **4**.

Exactly the same four patterns as Feature 1, with a different table. If Feature 1
took you an hour, this one should take you fifteen minutes. When you notice that,
you have learned the thing this unit is actually about.

### Feature 3: Horsepower builder
Patterns, in order: **3**, **6**, and a bit of arithmetic.

Start with a number, say 300. Each checkbox is worth some horsepower: turbo 100,
exhaust 25, intake 20, tires 0 (tires do not add horsepower, they add grip, and
that is a good thing to put on the screen).

Add up whichever boxes are ticked and put the total in `lbl_total_hp`. Use the
checkbox `change` event rather than a button, so the number moves the moment they
tick something. That is Pattern 1 with a different event name.

**Test it by ticking everything and then unticking everything.** You should end
up back at 300.

### Feature 4: Quiz
Patterns, in order: **8**, **3**, **13**, **1**, **6**, then **3** again for the
score.

Show one question, let them pick an answer from the dropdown, check it against
the stored answer, count the right ones, and show the score at the end.

Keeping the score is the new idea here: a number that survives between clicks.
Make it a variable on the form (`self.score = 0` in `__init__`) and add one to it
each time they are right.

## What to do when you are stuck

Work out which of the three it is, because the fix is different each time:

1. **You do not know what the app should do.** Go back to your build card.
2. **You know what it should do but not how to say it in Python.** Go to the
   Pattern Book.
3. **You know the pattern but do not know what to put in the blank.** Come back
   to this page. Every blank in the Pattern Book is a name on this page.
