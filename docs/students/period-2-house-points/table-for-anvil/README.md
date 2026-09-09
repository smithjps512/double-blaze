# Table for Anvil

No em dashes anywhere in this document or any copy it generates.

Three tables, filled in, ready to import. This is the scaffolding your app
stands on: get these in and your dashboard has something to show on the first
run instead of eight zeros.

**Everything in here is invented.** Every student, every teacher, every reason.
If a name happens to match somebody real that is a coincidence, and you should
change it. Nothing on this page is about an actual person at your school.

| File | Rows | What it is |
|---|---|---|
| `houses.csv` | 8 | The eight houses and their colours |
| `students.csv` | 24 | Three made up students per house |
| `point_events.csv` | 36 | Three weeks of made up awards and removals |

---

## Before you import anything

**Make the columns first, then import.** Anvil matches a CSV to a table by
column name, and if the column is already there with the right type, the import
drops into it. If you import into an empty table Anvil has to guess, and it
usually guesses Text, which means your amounts are the *word* "10" rather than
the number 10, and adding them up gives you `1010` instead of `20`.

That bug is horrible to find because nothing goes red. Save yourself the
afternoon: build the columns, then import.

### `houses`

| Column | Type |
|---|---|
| `name` | Text |
| `colour` | Text |
| `text_on` | Text |
| `sort_order` | **Number** |

### `students`

| Column | Type |
|---|---|
| `name` | Text |
| `house` | Text |

### `point_events`

| Column | Type |
|---|---|
| `house` | Text |
| `student` | Text |
| `amount` | **Number** |
| `reason` | Text |
| `teacher` | Text |
| `when` | **Date and Time** |

---

## Importing

1. In the Anvil editor, click **Data** in the left sidebar.
2. **Add Table**, and call it exactly `houses`. Lower case, no spaces.
3. Add each column from the table above, with the right type. Column names have
   to match the CSV headings exactly.
4. Look for the import or upload option on the table and give it `houses.csv`.
5. Check the rows landed. **Click into the `sort_order` column.** If the numbers
   sit on the right of the cell they are numbers. If they sit on the left they
   are text, and the type is wrong.
6. Do the same for `students` and then `point_events`.

**Do `houses` first and `point_events` last.** The events mention houses and
students by name, so importing them in that order means you can spot a spelling
mistake straight away rather than three tables later.

### If the import will not take the dates

`when` is written as `2026-09-01 08:15:00`. If Anvil refuses that format, try
`2026-09-01T08:15:00` instead, which is the other standard way of writing it.
If it still refuses, import `point_events.csv` with the `when` column deleted,
and fill the dates in by hand on a few rows. **Your app will still work**,
because your code sets `when` itself with `datetime.datetime.now()` every time
somebody awards points. The sample dates only exist so "most recent" has
something to sort.

---

## Check it worked before you write any code

Your dashboard adds up `amount` per house. These are the answers. If your code
disagrees with this table, your code is wrong, and you have a worked example to
debug against instead of a feeling that something is off.

| House | All time |
|---|---|
| Kuma | 45 |
| Gom | 25 |
| Bhalu | 35 |
| Oso | 30 |
| Xiong | 35 |
| Bjorn | 40 |
| Urso | 40 |
| Dubb | 40 |

Everything added together comes to **290**.

**Kuma is the useful one.** Its rows are 10, 5, -5, 20, 5 and 10. If your total
says 55, you are adding the minus five instead of subtracting it. If it says 50,
you are skipping the negative row entirely. Getting 45 means your sum handles
removals, which is the single most important thing about your whole design.

**The newest three events**, so you can check "most recent" sorts the right way
round:

1. 18 September, Bjorn, +10, organised the food bank collection
2. 18 September, Xiong, +5, stayed behind to clean the whiteboards
3. 17 September, Kuma, +10, spelling bee, first place

---

## The `student` column, and the decision you have not made yet

Your architecture page asks you to settle one thing: **do points go to a house,
or to a student?** This data does not decide it for you, on purpose.

Every event names a **house**. Some also name a **student**, and 14 of the 36
leave that blank, because "whole class lined up quietly" is not one person.

- **Points go to houses.** Ignore the `student` column entirely. Every total on
  your dashboard still comes out right.
- **Points go to students.** Use it. A house's total is still the sum of its
  events, because every event names its house either way.

That is why the column is there and why it can be empty. **Importing this does
not make the decision. Building against it does**, so have the argument first.

The `students` table also unlocks the House detail screen your architecture
parked: click a house, see who is in it. That is Pattern 8 and Pattern 9 again,
searching `students` by house.

---

## About the teachers

The events are signed by three invented addresses:

- `a.harper@example.edu`
- `d.okonkwo@example.edu`
- `s.vitale@example.edu`

**There is no teachers table, on purpose.** Who awarded the points comes from
whoever is signed in, using `anvil.users.get_user()['email']`, never from a
dropdown and never from a table. A teacher somebody can pick from a list is a
teacher somebody can pick wrongly, and then your history is worthless the first
time it happens.

So to test properly: turn on the **Users** service, and add those three
addresses as users. Sign in as one, award some points, and watch your own
address land in the `teacher` column without you typing it. That is the moment
the sign-in stops being a chore and starts being the point.

---

## Changing the houses

You will want your own house names. Two rules, and the second one bites.

1. **Change them in `houses` first**, before you import the events, or the
   events will point at houses that no longer exist.
2. **If you rename a house after there are events**, go and change every event
   too. The events store the house's *name* as text, not a link to its row, so
   renaming Kuma to Bear leaves every Kuma event orphaned and its total drops to
   zero.

That trade-off is written up on your Data tables page. Linking tables properly
is the grown up answer and it is a whole new idea; this is the version you can
finish. Knowing the cost is what makes it a decision rather than a mistake.

## Adding more rows later

You do not have to import a CSV again. Once the app works, adding points **is**
your app: that is Feature 3, and every row it writes looks exactly like the rows
in here. The import is scaffolding for today, not how the app is meant to be
used.

If you do want to bulk add more, add them to the CSV, keep the headings
identical, and import again. Anvil adds the new rows rather than replacing what
is there, so **do not import the same file twice** or every event happens
again and every total doubles.
