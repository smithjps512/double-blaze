# Brief for the Melissa design session

No em dashes anywhere in this document or any copy it generates.

For the separate Claude Code session working in `melissa-platform` on the
experience of Melissa for Makers. Paste the context block into the first
message, then use the prompts in order or pick the ones you need. Each
prompt is written to produce something you can look at, not a plan.

---

## Context block, paste first

```
I am designing the experience for a new module in Melissa for Educators
called Melissa for Makers. It is a class module: a teacher takes a class
through the product development process end to end, from a product plan to
a tested app, in teams. It exists today as "Trail Crew" in the double-blaze
repo (smithjps512/double-blaze). The move is planned in that repo under
docs/module/: README.md (what it is, three layers), manifest.json (content
inventory), phase-1-checklist.md (every coupling point and its Melissa
replacement), and docs/build/facilitator-guide.md (how a teacher runs it).
Read those four first.

The engine is packages/prototype-forge in double-blaze: pure functions that
turn a plan and stories into a prototype, gap guide, test plan, cards,
design brief, walkthrough, design review and test sheet. It moves as is.
The app layer is rebuilt on Melissa: documents in the database per class
and team, approval in the app, pages rendered on request.

Melissa facts: Next.js 14, Supabase auth, teachers with classes and rosters,
students join by class code. Students are pseudonyms in this module.

Melissa's core loop is Prepare a Class. The module should feel like part of
that loop, not a separate app bolted on: a lesson plan Melissa generates
should be able to point at the module's tools and activities for that day.
```

## Prompts

**1. Where it lives.** "Show me, as a clickable prototype or annotated
screens, where Melissa for Makers appears for a teacher: in the class
dashboard, in Prepare a Class, and in the catalogue. Assume the teacher has
turned it on for one class. Three screens, no more."

**2. The lesson plan to tool link.** "A teacher prepares a class and Melissa
generates a lesson plan. For a Makers class, the plan's activities should
link to the module's pages: Write a story, What next, the Design brief, the
Test sheet. Design how a lesson plan step references a module activity, what
the student sees when they follow it, and what the teacher sees afterwards.
Use the facilitator guide's week table as the source of which activities
exist."

**3. The student's day.** "Design the student home for a Makers class: what
a student sees when they sign in with the class code, how they find their
team, and how they get to today's activity in two taps. Pseudonyms only, no
roster names."

**4. The queue, inside Melissa.** "The teacher's approval queue is the
feedback loop of the whole module. Design it as part of the Melissa teacher
dashboard: proposals per class, approve or edit or reject, and an end-of-day
digest instead of an email per proposal. Show the empty state."

**5. The chain.** "Every team has a chain of pages that grows as they write
more. Design the chain nav inside Melissa's layout so a team on week one
sees two links and a team on week nine sees ten, without it looking broken
either way."

**6. The board and the test sheet.** "Design the project board (cards with
boxes that stay ticked for the team) and the test sheet (the cards as a user
test another student fills in) as Melissa screens. The test sheet must print
well and also work on a phone."

**7. Portfolio.** "A finished app is a portfolio piece. Design how a Makers
project appears on a student's Melissa portfolio: the app, the story it came
from, the test sheet results. Pseudonym only."

**8. The build tool question.** "The current build pack is written for
Anvil, which teachers and students have found heavy. Propose what an
integrated editor inside Melissa would need to be for a 7th grader to build
one screen from an architecture page, with the helper alongside. One page of
requirements and one sketch. Do not build it."

**9. Entitlement.** "Melissa has three tiers. Propose which tier includes
Makers, what a teacher on a lower tier sees, and what the upgrade prompt
says. Use the tier contract doc in the repo."

**10. The move, honestly.** "Read phase-1-checklist.md and tell me which
three items you would do first, which one you would push to Phase 2, and
which one you think is wrong."

## Things to hold onto while designing

- The documents are the product until the app exists. Every screen should
  make the team's own words visible and traceable.
- Nothing the model writes reaches a team's documents without a teacher
  approving it. That is a rule, not a preference.
- A vague story produces a visibly vague result. Do not smooth that over
  with good UI; the roughness is the lesson.
- Team and product names only. No student names anywhere a page is shared.
- Fifty minute periods. Anything that takes a student more than two taps to
  reach today's work is too far.
