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
7. House detail: the students in a house, and points to one of them

**Stubbed for now, and why:**

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

Your teacher has described what the app needs to do, and three parts of it did
not match what your stories said. **These are yours to settle, not his.** Two
of them you have now settled, in the story studio, which is exactly where they
belonged.

**1. Points go to houses, or to students? Settled: students.** Your story "Add
points to students and houses" says a teacher adds points to a student, and the
student's house gets them too. That costs a second table, **students**, and a
dropdown to pick one, and the pages below now have both. The dashboard still
adds up houses; it just adds up the students in them.

**2. What does the point cap mean now? Settled: up to 5 in one go.** The same
story says a teacher can add up to 5 points to a student at a time. That is
Pattern 6 before the row is saved, and Card 4 now says 5 where it said 50.

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
| `GivePoints` | Award or take away, to one student, with a reason | Teachers only |
| `History` | Every change, newest first, with who and why | Everyone |
| `HouseDetail` | One house: its students and what each has earned | Everyone |

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
  `lbl_house_name`, `lbl_all_time` and `lbl_recent` (Labels) and
  `lnk_open_house` (Link, opens that house's detail)
- `btn_give_points` (Button, hidden from students)
- `btn_history` (Button)

**GivePoints**
- `dd_house` (DropDown)
- `dd_student` (DropDown, fills with that house's students when a house is picked)
- `dd_direction` (DropDown: Award, Take away)
- `txt_amount` (TextBox)
- `txt_reason` (TextArea)
- `btn_submit` (Button)
- `lbl_error` (Label, starts invisible)

**History**
- `rp_events` (RepeatingPanel) with `lbl_event_line` and `lbl_event_reason` inside

**HouseDetail**
- `lbl_house_name` (Label)
- `lbl_house_total` (Label)
- `rp_students` (RepeatingPanel) with `lbl_student_name` and `lbl_student_points` inside
- `btn_back` (Button)

## Data tables

Your teacher creates these and tells you the exact names. You write the code
that talks to them. The full setup sheet, including the eight rows and the
reasoning behind the shape, is on the
[Data tables](data-tables.html) page.

- **houses**: `name` (text), `colour` (text), `text_on` (text), `sort_order` (number)
- **students**: `name` (text), `house` (text)
- **point_events**: `house` (text), `student` (text), `amount` (number), `reason` (text), `teacher` (text), `when` (date and time)

**The `student` column is new**, and it is what decision 1 cost. Every row still
names the house, so the dashboard's sum does not change at all. A student's
total is the same sum with one more filter. When a whole house earns points, say
for an assembly, leave `student` blank; the house still gets them.

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

Button click, read the house from the dropdown and the student from the second
one, read the amount and the reason from the boxes, check them, add a row on the
server, say it worked, go back to the Dashboard.

**Filling `dd_student`** is Pattern 13 twice: when `dd_house` changes, search
**students** for that house and hand the names to `dd_student.items`. Leave a
first choice of "Whole house" so an assembly award still works with `student`
blank.

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

Your story settled it: **no more than 5 points to a student in one go.** It is
a check that happens *before* the row is saved, and it puts a message in
`lbl_error` instead.

**This is the one to test by breaking.** Type 6 and make sure it refuses.

### Feature 6: History
Patterns, in order: **8**, **11**, **9**.

Every row of `point_events`, newest first, showing the house, the student when
there is one, the amount, who did it and why. Removals should read as removals:
show `abs(amount)` and the word "removed" rather than a bare minus number.

### Feature 7: House detail
Patterns: **4** from `lnk_open_house`, then **8**, **11**, **9**.

Open `HouseDetail` with the house's name. Search **students** for that house,
and for each student add up their rows in `point_events`, the same way the
dashboard adds up a house. Hand the list to `rp_students`, highest first, and
put the house's own total in `lbl_house_total`.

Your story's second half is a student clicking their house and seeing their own
number. That is this screen: the student finds their own name in the list.
Nobody signs in as a student, so there is no way to show only theirs, and the
list is the honest version.

**Build Features 3 and 7 together.** Both need the students table, and the
first time you add points to a named student and then watch their number change
on this screen is the moment the whole app makes sense.

## What to do when you are stuck

Work out which of the three it is, because the fix is different each time:

1. **You do not know what the app should do.** Go back to your build card.
2. **You know what it should do but not how to say it in Python.** Go to the
   Pattern Book.
3. **You know the pattern but do not know what to put in the blank.** Come back
   to this page. Every blank in the Pattern Book is a name on this page.
