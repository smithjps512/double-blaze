# House Point Tracker: build architecture

Team: House Points. Tool: Anvil.

This is the second document. Your build cards send you here. This page sends you
to the Pattern Book at `docs/build/anvil-patterns.md`.

## The buildable slice

Your plan has eight features. Not all eight are the same size, and part of doing
this properly is deciding what to build first rather than a bit of everything.

**In the slice, in this order:**

1. Teacher sign in
2. The dashboard: all eight houses, all time
3. Give points, with a reason
4. Take points away
5. The point cap
6. History: who did what and why

**Stubbed for now, and why:**

- **House detail with the students in it.** Needs a second table of students
  linked to houses. Build it once the six above work.
- **Point animations.** Anvil can show and hide things (Pattern 14), so a simple
  "+5!" label that appears and disappears is achievable. A real animation is a
  stretch goal, not a starting point.
- **Scheduled points.** Nothing in your stories describes it, so there is
  nothing to build from yet. Write the story first.

**Cloud storage is not a feature you build.** It is what Anvil's Data Tables
already do. Your story about points surviving a teacher clearing their cookies
is already satisfied by Pattern 7 running on the server. That is worth knowing:
you asked for something and the tool already does it.

## Decide these three before you build

Your teacher has described what the app needs to do, and three parts of it do
not match what your stories say. **These are yours to settle, not his**, and
none of them takes long. Settle them in the story studio, because the tables and
the code both hang off the answers.

**1. Points go to houses, or to students?** Your first story says *"Make it add
points to students, not to the house."* Everything else, including the eight
houses and the dashboard, is about houses. Both cannot be true. Houses is far
smaller to build: students means a second table and a way to pick one out of
several hundred.

**2. What does the point cap mean now?** Your second story caps *"50 points per
student per day"*. If points go to houses, there are no students to count. The
closest version that keeps what you meant is **no more than 50 in one go**,
which still stops somebody dumping five thousand points and is still Pattern 6.

**3. What does "most recent" mean on the dashboard?** Two sensible readings, and
you have to pick: either **the last few changes**, listed under the totals, or
**a second total for this week** next to the all time one. Both are buildable
from the same table. Only one of them is what you meant.

Nothing in your stories mentions **taking points away** or **typing a reason**,
and both are now required. That is a third story, and it needs writing before
those get built.

## Screens to create

| Form name | What it is | Who sees it |
|---|---|---|
| `SignIn` | Teacher signs in, or student continues as guest | Everyone, first screen |
| `Dashboard` | All eight houses, with their totals | Everyone |
| `GivePoints` | Award or take away, with a reason | Teachers only |
| `History` | Every change, newest first, with who and why | Everyone |

**One screen for giving and taking, not two.** Awarding and removing are the
same form with one dropdown changed: pick Award or Take away, and the code puts
a minus in front of the number. Two nearly identical screens would mean fixing
every bug twice and forgetting one of them.

## Components to create, with the exact names to use

Use these names. The Pattern Book's blanks are filled with these.

**SignIn**
- `btn_teacher_sign_in` (Button)
- `btn_guest` (Button)

**Dashboard**
- `rp_houses` (RepeatingPanel) with an item template containing
  `lbl_house_name`, `lbl_all_time` and `lbl_recent` (Labels)
- `btn_give_points` (Button, hidden from students)
- `btn_history` (Button)

**GivePoints**
- `dd_house` (DropDown)
- `dd_direction` (DropDown: Award, Take away)
- `txt_amount` (TextBox)
- `txt_reason` (TextArea)
- `btn_submit` (Button)
- `lbl_error` (Label, starts invisible)

**History**
- `rp_events` (RepeatingPanel) with `lbl_event_line` and `lbl_event_reason` inside

## Data tables

Your teacher creates these and tells you the exact names. You write the code
that talks to them. The full setup sheet, including the eight rows and the
reasoning behind the shape, is on the
[Data tables](data-tables.html) page.

- **houses**: `name` (text), `colour` (text), `text_on` (text), `sort_order` (number)
- **point_events**: `house` (text), `amount` (number), `reason` (text), `teacher` (text), `when` (date and time)

**There is no points column on a house, on purpose.** A total you store and a
history you keep are the same fact written down twice, and one day they will
disagree and nobody will know which is right. So every award and every removal
is a row in `point_events`, and a total is what you get when you add them up.

**Taking points away is a negative amount.** Award ten is `10`. Take ten away is
`-10`. Same table, same code, and the sum works out by itself. This is the
single best idea in your whole app and it is worth understanding before you
write a line.

## How each feature gets built

### Feature 1: Teacher sign in
Story: everything that changes points depends on this existing first.

Patterns, in order: **12**, then **4**.

Sign the teacher in, and if it worked, open the Dashboard. The guest button is
just Pattern 4 on its own with no sign in.

### Feature 2: The dashboard
Patterns, in order: **8**, then **11**, then **9**.

Get the houses from the server, and for each one, get its rows out of
`point_events` and add up the `amount` column. Hand the result to `rp_houses`.

**Then sort by that total, highest first**, because your own story says the house
with the most points is at the top. You cannot ask the Data Table to do this
sort, because the total is not in the table: you worked it out. So sort your list
in Python after you have built it, which is one line.

That is what `sort_order` is for on days when it does not help you: on the very
first morning every house has nought, and without a tie-break the eight houses
come out in whatever order the table felt like. Sort by total first, `sort_order`
second, and it is stable and sensible from day one.

**Build this first with the three test rows your teacher put in.** It is the
first time you will see a number you worked out rather than a number you stored.

*Stretch:* each row can paint itself in its own house colour, using
`self.item['colour']` for the background and `self.item['text_on']` for the
writing. That is the reason those two columns exist.

### Feature 3: Give points
Patterns, in order: **1**, **13**, **2**, **6**, **7**, **5**, **4**.

Button click, read the house from the dropdown, read the amount and the reason
from the boxes, check them, add a row on the server, say it worked, go back to
the Dashboard.

**The reason is required.** An empty reason is a Pattern 6 refusal, exactly like
a number that is too big. A history full of blank reasons is no history at all.

**Where `teacher` comes from:** the signed in user, not a box. In Anvil that is
`anvil.users.get_user()['email']`. If somebody can type it, it is worthless.

### Feature 4: Take points away
Patterns: the same ones as Feature 3.

This is Feature 3 with one extra line. Read `dd_direction`, and if it says Take
away, flip the number negative before you save it.

**Test it by adding ten and removing ten.** The total should come back to where
it started. If it goes to twenty, you flipped the sign in the wrong place.

### Feature 5: The point cap
Pattern **6**, wrapped around Feature 3.

Whatever your team decides the cap means (see the three decisions above), it is
a check that happens *before* the row is saved, and it puts a message in
`lbl_error` instead.

**This is the one to test by breaking.** Type 51 and make sure it refuses.

### Feature 6: History
Patterns, in order: **8**, **11**, **9**.

Every row of `point_events`, newest first, showing the house, the amount, who
did it and why. Removals should read as removals: show `abs(amount)` and the
word "removed" rather than a bare minus number.

## What to do when you are stuck

Work out which of the three it is, because the fix is different each time:

1. **You do not know what the app should do.** Go back to your build card.
2. **You know what it should do but not how to say it in Python.** Go to the
   Pattern Book.
3. **You know the pattern but do not know what to put in the blank.** Come back
   to this page. Every blank in the Pattern Book is a name on this page.
