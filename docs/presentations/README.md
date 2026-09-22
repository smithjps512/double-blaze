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

## Team status presentation

Two decks from one generator, `status-presentation.js`:

- `Team-Status-Presentation-Template.pptx`: fifteen slides, every blank in
  square brackets, with speaker notes written to the student presenting. The
  first slide is a set of rules for using it and is meant to be deleted.
- `Bus-Buddy-Status-Presentation.pptx`: the same fourteen slides filled in
  for the sample team, so a class can see what a finished one looks like
  before they write their own.

The shape is the one a development team uses to report to management: the
problem, the users, the features and their stage, where the team is on the
chain (plan, stories, cards, architecture, design, build), the numbers, a
demo with a four step script, what went well and what was learned, what is
in the way, the next three steps, the ask, and questions. Eight minutes, with
the demo in the middle.

Every Bus Buddy fact comes from `docs/students/sample-bus-buddy` and the
prototype generated from it (five features, six stories, eight screens, no
build cards, two gaps). If the sample team's documents change, edit the
`BUS_BUDDY` object at the top of the script and rerun:

```
cd docs/presentations
npm install pptxgenjs      # once
node status-presentation.js
```

Teams fill in the template from their own gap guide, prototype and board. The
notes on each slide say which page has the answer.
