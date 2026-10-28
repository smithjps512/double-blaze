# Presentations

## Trail Crew: first day back

`Trail-Crew-First-Day-Back.pptx` — twenty-one slides for the first session of
term two, with speaker notes on every slide.

It covers what the class is learning, how each tool supports that, a walkthrough
of every page in the system, and a list of videos students can go and watch.

**Every number in it was counted from this repository**, not estimated. If the
teams write more stories, the numbers on slide 2 and slide 9 go out of date.
Re-count them with the same query the deck was built from and edit
`first-day-back.js`, then:

```
cd docs/presentations
npm install pptxgenjs      # once
node first-day-back.js
```

The generator is committed alongside the file so the deck can be corrected
rather than rebuilt from memory. The videos it lists are the same ones on
`docs/build/watch-list.md`, which is the page students actually use; if a link
rots, fix it there first.

## Launch Pad: start a plan for anything

`Launch-Pad.pptx`: sixteen slides for a one day sixth grade lesson, with
speaker notes on every slide. Three ideas only: purpose is the impact, not
what it does; there is always more than one user; and a user story says who,
what and why. About fifteen minutes of slides, then teams work at
`/trail-crew/launch`. The running example, Finders Keepers, is also built as
a prototype (`docs/launch/example-finders-keepers`), so the last slide can
show what their own will look like.

```
cd docs/presentations
npm install pptxgenjs      # once
node launch-pad.js
```

How the day runs and how their plans become prototypes: `docs/launch/README.md`.

## Launch Pad: what next? You decide

`Launch-Pad-What-Next.pptx`: fifteen slides for period 3 sixth grade, 50
minutes, with speaker notes on every slide. The garden is paused (the budget
is frozen), so the class votes on what comes next, then learns the skill all
three choices need.

- Slides 1 to 3: what they built (6 apps, 21 QA reports, counted from
  `launch_qa` the day the deck was made) and the honest budget news, framed
  as a constraint product teams work within.
- Slides 4 to 8: three choices, one slide each, laid out identically so none
  is favoured: Level up our apps (v2), Smart City 2.0, Game studio. Then how
  to vote at `doubleblaze.solutions/vote` (rank all 3, one sentence why).
- Slides 9 to 14: scenarios. The ladder (story, acceptance criteria,
  scenarios), Given / When / Then with a Find your way example, the happy
  path and the bad day (tied to their QA bugs), the class Definition of Done,
  and the work time on Launch Pad.
- Slide 15: reveal the results at `doubleblaze.solutions/vote/results`.

```
cd docs/presentations
npm install pptxgenjs      # once
node what-next.js
```
