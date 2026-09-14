# Lessons

No em dashes anywhere in this document or any copy it generates.

A lesson is one class period, fifty minutes, of which about forty are work.
It has the same shape every time, because the shape is what lets a student
walk in and know what to do:

1. **Again** (5 minutes). Do yesterday's slice again, from memory, faster.
2. **Watch** (5 to 10 minutes). The teacher shows today's slice being done,
   start to finish, on the projector. Nobody types yet.
3. **Do** (25 to 30 minutes). Every team does yesterday's slices plus today's.
4. **Done when** (the last 2 minutes). One line each team says out loud.

A **unit** is a run of lessons that adds up to one whole thing: a design
handed over and reviewed, a story written and approved, a screen built in
Anvil. Each day adds one slice; by the last day a team has done the whole
thing three or four times over, and the first slices without thinking.

This is how the first two weeks of a semester run before teams start their
own projects, and how any new feature of the system is introduced after that.

## Folder layout

```
docs/lessons/
  README.md              this file
  _template/day.md       copy to start a day. Ignored by the generator.
  <unit-folder>/
    README.md            the unit: what it adds up to, and the days in order
    day-1.md
    day-2.md
    ...
```

Every unit renders to `/lessons/<unit-folder>/index.html` with an index and one page
per day, and a nav across the top with every day in the unit. The lessons
index at `/lessons/index.html` lists every unit. Nothing in a lesson names a student.

## Writing a day

Copy `_template/day.md`. Keep the four headings in that order. The **Watch**
section is the teacher's script: what to open, what to click, what to say,
in the order it happens on the projector. Write it so a substitute could do
it. The **Do** section is the students' list, numbered, with yesterday's
slices first and marked as such. **Done when** is one checkable line.

The rule that makes a day work: **today's slice is small.** One box, one
page, one pattern. A slice that needs the whole period is two days.

## Units

- **handover-test**: hand a Figma design over, get it reviewed, break it on
  purpose, write up what you found. Four days. Also the first live test of
  the handover feature.

## Planned for the start of next semester

Ten days, two weeks, before project work begins. Each is a unit of one to
three days built from pages that already exist.

| Week | Days | Unit | Adds up to |
|---|---|---|---|
| 1 | 1 to 2 | Stories | A story with criteria and a scenario, written in the studio, sent for approval |
| 1 | 3 | Approve and follow | A story approved, its card rewritten, the prototype rebuilt |
| 1 | 4 to 5 | The board | Cards set to Building and lines ticked as they become true on the screen |
| 2 | 6 to 7 | Design | A screen from the brief drawn in Figma with named layers and an empty state |
| 2 | 8 | Hand it over | The file shared and reviewed, one finding fixed |
| 2 | 9 to 10 | Build | A button that does something in Anvil, then a list from a table, with Spark for the red text |
