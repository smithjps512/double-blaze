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

## Game Studio, week 1

`Game-Studio-Week-1.pptx`: twenty-six slides for the first week of the six
week Game Studio unit (period 3 sixth grade voted for it 15 to 3), with
speaker notes on every slide. One section per day, each opening with a
"Day N" arcade divider:

1. Welcome to the studio: the vote, what a studio is, the four rotating
   roles (Producer, Game Designer, Developer, QA Lead), the six-week map,
   the big idea (a game's purpose is the feeling), and play-and-dissect.
2. The core loop: verbs that repeat, three generic loops, W.C.O 27's loop
   from their own class, win and lose conditions.
3. Players and the feeling: player types (plus the parent who says yes),
   feeling words, and "purpose is the feeling" as the game version of
   "purpose is the impact".
4. The pitch: "It's a ___ game where you ___ so that you feel ___", weak
   vs strong, and scope (one hero, one core loop, three levels).
5. Pitch day: how it runs, forming studios, studio names, and next week's
   design doc at doubleblaze.solutions/studio.

No real game brands are named, on purpose. The vote quotes on Day 1 are
from `launch_votes`.

```
cd docs/presentations
npm install pptxgenjs      # once
node game-studio-week-1.js
```

## Find me v2: Pickle bombs keep building their app

`Find-Me-v2.pptx` (generator `find-me-v2.js`): nine slides with speaker
notes, for the one period 3 team that chose to keep building their app
during the Game Studio unit. Same six weeks, roles and build weekends as
the game studios, aimed at version 2 of Find me: talk to real users, plan
v2 in Launch Pad, make every story meet the Definition of Done, sketch a
screen, QA week on /play, and launch day with the class.
