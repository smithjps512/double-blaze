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
