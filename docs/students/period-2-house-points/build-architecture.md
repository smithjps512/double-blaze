# House Point Tracker: build architecture

Team: House Points. Tool: Anvil.

This is the second document. Your build cards send you here. This page sends you
to the Pattern Book at `docs/build/anvil-patterns.md`.

## The buildable slice

Your plan has eight features. Not all eight are the same size, and part of doing
this properly is deciding what to build first rather than a bit of everything.

**In the slice, in this order:**

1. Teacher sign in
2. View house points
3. Add points
4. Point cap
5. Change logs

**Stubbed for now, and why:**

- **House detail with the students in it.** Needs a second table of students
  linked to houses. Build it once the five above work.
- **Point animations.** Anvil can show and hide things (Pattern 14), so a simple
  "+5!" label that appears and disappears is achievable. A real animation is a
  stretch goal, not a starting point.
- **Scheduled points.** Nothing in your stories describes it, so there is
  nothing to build from yet. Write the story first.

**Cloud storage is not a feature you build.** It is what Anvil's Data Tables
already do. Your story about points surviving a teacher clearing their cookies
is already satisfied by Pattern 7 running on the server. That is worth knowing:
you asked for something and the tool already does it.

## Screens to create

| Form name | What it is | Who sees it |
|---|---|---|
| `SignIn` | Teacher signs in, or student continues as guest | Everyone, first screen |
| `Scoreboard` | The four house totals | Everyone |
| `AddPoints` | Pick a house, type an amount, submit | Teachers only |
| `Logs` | Who changed what, most recent first | Teachers only |

## Components to create, with the exact names to use

Use these names. The Pattern Book's blanks are filled with these.

**SignIn**
- `btn_teacher_sign_in` (Button)
- `btn_guest` (Button)

**Scoreboard**
- `rp_houses` (RepeatingPanel) with an item template containing
  `lbl_house_name` and `lbl_house_points` (Labels)
- `btn_go_add_points` (Button, hidden from students)

**AddPoints**
- `dd_house` (DropDown)
- `txt_points` (TextBox)
- `btn_submit_points` (Button)
- `lbl_error` (Label, starts invisible)

**Logs**
- `rp_logs` (RepeatingPanel) with `lbl_log_line` in its template

## Data tables

Your teacher creates these and tells you the exact names. You write the code
that talks to them.

- **houses**: `name` (text), `points` (number)
- **point_log**: `house` (text), `amount` (number), `teacher` (text), `when` (date and time)

## How each feature gets built

### Feature 1: Teacher sign in
Story: *Add points* depends on this existing first.

Patterns, in order: **12**, then **4**.

Sign the teacher in, and if it worked, open the Scoreboard. The guest button is
just Pattern 4 on its own with no sign in.

### Feature 2: View house points
Patterns, in order: **8**, then **11**, then **9**.

Get the rows from the server, sorted with the biggest first, and hand them to
`rp_houses`. In the item template, each copy reads `self.item['name']` and
`self.item['points']`.

This is the screen to build first, because you can see it working.

### Feature 3: Add points
Patterns, in order: **1**, **2**, **13**, **10**, **5**, **4**.

Button click, read the amount typed, read the house picked, add the amount to
that house's row on the server, tell the teacher it worked, go back to the
Scoreboard.

### Feature 4: Point cap
Pattern **6**, wrapped around Feature 3.

The rule is 50 per student per day. Build the simple half first: refuse more
than 50 in one go. The per day part needs the log table and a date check, so do
it after Feature 5.

**This is the one to test by breaking.** Type 51 and make sure it refuses.

### Feature 5: Change logs
Patterns, in order: **7** (inside Feature 3, add a log row every time points
change), then **8**, **11**, **9** to show them newest first.

## What to do when you are stuck

Work out which of the three it is, because the fix is different each time:

1. **You do not know what the app should do.** Go back to your build card.
2. **You know what it should do but not how to say it in Python.** Go to the
   Pattern Book.
3. **You know the pattern but do not know what to put in the blank.** Come back
   to this page. Every blank in the Pattern Book is a name on this page.
