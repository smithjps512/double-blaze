# From a story to a design

No em dashes anywhere in this document or any copy it generates.

Five days. By the end, every team has taken one story the whole way: written
or rewritten in the story studio, approved, followed through to its build
card and its place in the architecture, designed as a screen in Figma with AI
doing the first draft, finished by hand with the names from the design brief,
handed over, and reviewed.

That is the loop the rest of the project runs on. A team that has done it
once, start to finish, with one story, can do it without the teacher for the
next one. The point of five days is to do it slowly once.

Written for teams in the middle of their project, with stories and cards
already in their pages. A team with only a product plan can run it too: on
Day 1 they write their first story instead of rewriting one.

| Day | Adds | The page it uses |
|---|---|---|
| [Day 1](day-1.html) | One story, written in the studio and sent | [Writing a story](/build/writing-a-story.html) |
| [Day 2](day-2.html) | The approval, and following the story through to its card, its board row, and the architecture | [How to build your app](/build/instructions.html) |
| [Day 3](day-3.html) | The screen, started with AI from the card's own words | [Start with AI](/build/figma-ai.html) |
| [Day 4](day-4.html) | Making it yours: the brief's names on every layer, the bad day drawn, one colour | [Designing for Anvil](/build/figma.html) |
| [Day 5](day-5.html) | Handing it over, the review, and one finding fixed | [Handing over your design](/build/handover.html) |

## What the teacher needs before Day 1

- A demo team to do it to on the projector. **Bus Buddy** (`sample-bus-buddy`)
  is built for this: it has a plan and four stories and no cards, so your Day 1
  story creates its first card, and the architecture Spark drafts from it is
  the one you approve on Day 2. By Day 3 it has a design brief for you to
  design from. Nothing you do to it touches a real team.
- Your email open on the projector on Days 1 and 2. The approval links are in
  the email, and they need no sign-in. `TRAIL_CREW_APPROVAL_SECRET`,
  `GITHUB_TOKEN` and `TRAIL_CREW_TEACHER_EMAIL` set, or the links do nothing.
- Figma open with whichever AI the school plan shows: Figma Make, First Draft
  inside the editor, or neither. [Start with AI](/build/figma-ai.html) has a
  part for each. Check which you have the day before, not on Day 3.
- Claude Code with the Figma connector on, for Day 5, to run
  `/design-review sample-bus-buddy` in front of the class.
- About three minutes of patience after every approval. The change is
  committed and the site rebuilds. Every day's script says what to do in the
  gap.

## One rule for the week

Every team takes **one** story through all five days. Not the whole app.
The team that finishes early takes a second story from Day 1, not the
first story further.
