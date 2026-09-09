# Setting up the data tables

House Point Tracker. This is the page your teacher works from to create the
tables, and the page you read to understand why they look like this.

**Two tables. One of them is a list of the eight houses. The other is a diary
that never gets rubbed out.**

---

## The decision, and why

The obvious way to build this is a `points` column on each house that goes up
and down. **We are not doing that**, and the reason is worth understanding
because it comes up in every system that counts anything.

If you store a total *and* a history, you have written the same fact down twice.
The day the scoreboard says Kuma has 47 and the history adds up to 45, nobody in
the room can tell you which one is right. That day always comes.

So: **store every single change, and add them up when you need a total.**

- **All time** is the sum of everything.
- **Most recent** is the last few rows, newest first.
- **Taking points away** is not a second feature. It is a row with a minus in
  front of the number.

That last one is the good bit. Adding and removing become the same code, and the
sum works out on its own. Real accounting systems, bank statements and every
scoreboard worth trusting are built exactly this way.

**The cost:** adding up every row each time somebody opens the dashboard. At
your school's size, a few thousand rows a year, Anvil will not notice. The rule
is *do not store what you can work out, until you have proved it is too slow.*

---

## Table 1: `houses`

The eight houses. Made once, barely ever changed.

| Column name | Type | What it holds |
|---|---|---|
| `name` | Text | Kuma, Gom, Bhalu and the rest |
| `colour` | Text | The house colour, as a hex code |
| `text_on` | Text | The colour of writing that goes *on top* of the house colour |
| `sort_order` | Number | What order they show up in |

**Why `text_on` is a column and not an if-statement.** Yellow and light blue
need dark writing on them. The other six need white. That is a fact about each
house, so it lives with the house. Otherwise you end up writing
`if colour == "#F5B700"` somewhere, which nobody will understand in March.

### The eight rows

| name | colour | text_on | sort_order |
|---|---|---|---|
| Kuma | `#F5B700` | `#1C1A19` | 1 |
| Gom | `#E8590C` | `#FFFFFF` | 2 |
| Bhalu | `#4CC9F0` | `#1C1A19` | 3 |
| Oso | `#212121` | `#FFFFFF` | 4 |
| Xiong | `#2E7D32` | `#FFFFFF` | 5 |
| Bjorn | `#C62828` | `#FFFFFF` | 6 |
| Urso | `#6A2C91` | `#FFFFFF` | 7 |
| Dubb | `#14377D` | `#FFFFFF` | 8 |

**These eight rows, plus a roster and three weeks of made up events, are ready
to import on the [Table for Anvil](table-README.html) page.** Column types
first, then the CSV, and that page says why in that order.

---

## Table 2: `point_events`

Every award and every removal, forever. **Rows in here are never edited and
never deleted.**

| Column name | Type | What it holds |
|---|---|---|
| `house` | Text | The house name, spelled exactly as in `houses` |
| `amount` | Number | Positive to award. **Negative to take away.** |
| `reason` | Text | Why. Typed by the teacher, needed both ways. |
| `teacher` | Text | Who did it. Comes from the sign in, never from a box. |
| `when` | Date and Time | Set by your code, never typed |

### One more column, on the import

The CSV on the [Table for Anvil](table-README.html) page has a **`student`**
column that this spec does not, and it is deliberately allowed to be empty.

It is there because you have not settled whether points go to a house or to a
student, and neither had this page. Every event names a house; some also name a
student; "whole class lined up quietly" names nobody. If you decide on houses,
ignore the column. If you decide on students, it is already there. Either way
your house totals come out the same, because every event names its house.

**Importing it does not make the decision. Building against it does.**

### Three things about this table that are decisions, not accidents

**`amount` goes negative.** Awarding 10 points is `amount = 10`. Taking 10 away
is `amount = -10`. One table, one piece of code, and the sum comes out right
without you doing anything clever. When you show it on screen you show
`abs(amount)` and the word "removed".

**`teacher` comes from the sign in, not a text box.** Anvil already knows who is
signed in. If a student can type a name into a box, the history is worthless the
first time somebody types in a teacher who was nowhere near it. Who did a thing is a fact the system
knows, so take it from the system.

**`house` is the house's name as text, not a link to the `houses` table.** Anvil
can link tables together properly and that is the more grown up answer. It is
also a whole new idea that is not in your Pattern Book, and you have enough new
ideas this term. The trade-off, so you know it: if somebody renames a house
later, its history stops matching. **So do not rename the houses.**

---

## Test it before you build anything on it

Put in three rows by hand in the Anvil editor, then look at them:

| house | amount | reason | teacher | when |
|---|---|---|---|---|
| Kuma | 10 | Whole class lined up quietly | test@example.com | today |
| Kuma | 5 | Helped clear up after lunch | test@example.com | today |
| Kuma | -5 | Added twice by mistake | test@example.com | today |

Kuma's all time total should be **10**. If your code says 20, you are adding the
minus five instead of subtracting it. If it says 15, you are ignoring the
negative row entirely.

That third row is the important one, and it is the first test on your test plan.
**Delete these three rows before you use the app for real.**

---

## What this lets you build

| Your dashboard needs | Where it comes from |
|---|---|
| Kuma's all time total | Sum of every `amount` where `house` is Kuma |
| The most recent changes | Last few rows, sorted by `when`, newest first |
| Who gave the points | The `teacher` column |
| Why | The `reason` column |
| The house colour on screen | `colour` and `text_on` from the `houses` table |

Every one of those is a pattern you already have. Nothing here needs anything
the Pattern Book does not cover.
