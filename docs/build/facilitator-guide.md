# Facilitator guide

No em dashes anywhere in this document or any copy it generates.

This is the module in one read, written for a teacher who was not in the room
when it was built. It says what the module is for, what a class does each
week, what you do each day, what the pages are, and what to grade. The
substitute packet is the short version of the day; this is the long version
of the term.

The module is being moved to Melissa for Educators as **Melissa for Makers**.
Where this guide says "the site", it means wherever the module is hosted. The
pages and their names stay the same.

---

## What the module is for

Students learn the product development process by doing it end to end, in
order: a product plan, user stories, a design, a build, a test. They learn it
on an app they chose, in a team, and they finish with something they can put
on a phone and show somebody.

The idea underneath every page is the same: **the documents are the product
until the app exists.** A team that writes a clear story gets a clear
prototype, a clear design brief, a clear test plan and a clear build card,
all generated from that story with nothing invented. A team that writes a
vague story gets a visibly vague prototype that says which sentence it came
from. The lever a team has is to write better, and the site delivers that
lesson every day so you do not have to.

Three things you are teaching, whatever the tools:

1. **Defining.** A product plan that names the users and the features, and
   user stories with a person, a want, a reason, criteria that can be true or
   false, and a scenario a tester can run.
2. **Designing.** Screens drawn from the stories, named so a builder can find
   every component, with empty and error states.
3. **Building and testing.** A working slice built from the architecture,
   tested against the cards by somebody who is not on the team.

Coding is the smallest of the three and the one most students will not do
for a living. Defining and designing are the ones everybody in the room will
use, whatever they become.

## Who is in the room

- **Teams of three or four.** Two is too few to argue, five is too many to
  agree. One team name, one product name, and the team folder is named after
  one of them, never after a student.
- **Roles that rotate.** Designer, builder, writer. Every student writes a
  story. Every student tests somebody else's app.
- **Pseudonyms.** The module never needs a student's name. Team pages show
  team and product names only. Where a student needs an account on an
  outside tool, use initials or a pseudonym, and if an email is required use
  your own with plus addressing (`you+ab@school.org`) so nothing personally
  identifying leaves the building and every account lands in your inbox.

## The term, week by week

Fifty minute periods, five a week. Every lesson has the same shape, from the
lessons page: five minutes of doing yesterday's slice again from memory, five
to ten of watching you do today's slice on the projector, twenty five to
thirty of every team doing it, and two minutes at the end where each team
says one line out loud.

| Week | What the class does | What exists at the end |
|---|---|---|
| 1 | Pick a problem worth solving. Write the product plan from the template. | `product-plan.md` with a purpose, users, description and features. |
| 2 | Write user stories in the story studio. One per feature. | `user-stories.md`. The first prototype, generated. |
| 3 | Read the prototype and the What next page. Rewrite stories until the prototype stops saying "no story" and "nothing to click". | Stories with scenarios. A prototype worth showing. |
| 4 | Build cards: one per story, the finish line written down. The architecture: which screens, what to call the components. | `build-cards.md`, `build-architecture.md`, the design brief. |
| 5 and 6 | Design: one Figma page per card, one frame per screen, layers named as the brief says. Hand it over and get it reviewed. | A reviewed Figma file. |
| 7 to 10 | Build the slice, one feature a week, from the architecture and the Pattern Book. | A working app, feature by feature. |
| 11 | User testing. Every student tests another team's app with the test sheet. Teams respond. | Test sheets and team responses, turned in together. |
| 12 | Demo day. Each team shows the app and the story it started from. | The portfolio piece. |

A class that moves faster does the loop twice. A class that moves slower
stops after week 6 with a reviewed design and a prototype, and that is a
complete product design course on its own.

## Your day

1. **Before the bell.** Open the teams page. Every team's card shows the
   stage it is on and the one thing its What next page says to do. That is
   your plan for who to visit first.
2. **Watch.** Do today's slice yourself, on the projector, start to finish,
   in silence except for saying what you are doing. Nobody types. Five to
   ten minutes. The lessons pages have the Watch script for each day.
3. **Do.** Walk the room. Five questions worth asking at any table:
   - Which story is this screen from?
   - What does the What next page say to do next?
   - Show me the Done when line you are working on.
   - What happens if this box is empty?
   - Who on the team has not written a story yet?
4. **Done when.** Two minutes before the bell, each team says one line: what
   is true now that was not true at the start of the period.
5. **After.** The queue. Students propose stories and story changes; nothing
   changes until you approve it. Approve from the queue page or from the
   email. Ten minutes a day keeps it empty.

## The pages, and what each is for

Every team has a chain of pages, and the chain grows as they write more, so
a team on week 1 sees two links and a team on week 9 sees ten. From the
team's page:

| Page | What it is | Who uses it |
|---|---|---|
| **What next** | The gap guide: the team's documents compared with each other, with one thing named as next. | Everyone, first. |
| **Write a story** | The story studio. Checks each part as they type. Sends to your queue. | Students. |
| **Prototype** | The clickable prototype generated from the plan and stories. Every screen carries the sentence it came from. | Everyone. |
| **Test plan** | Derived from the stories. A vague criterion produces a visibly useless test. | Students, in week 3. |
| **Build cards** | One card per story: the story, the Done when list, where to build it. Rewrites itself from the story when you approve a change. | Teams, weeks 4 on. |
| **Project board** | The cards with boxes that stay ticked for the whole team. Progress shows on the teams page. | Teams, you. |
| **Test sheet** | The cards as a user test, each Done when line a box, printable. | Testers, week 11. |
| **Architecture** | Which screens, the exact component names, the data tables, the patterns in order. Drafted after a story is approved; you edit and approve it. | Builders. |
| **Pattern Book** | The fourteen things an app does, each as code with blanks the architecture fills. | Builders. |
| **Design brief** | Generated from the architecture: the screens and components a designer must draw and name. | Designers. |
| **Design, step by step** | A guided walkthrough in the team's own names, in two tracks. | Designers. |
| **Design review** | The Figma file read against the brief, cards and stories. Every finding is two documents disagreeing. | Designers, you. |
| **Red text** | The errors students actually hit, and what each means. | Builders, when stuck. |
| **Code guide** | Rare. The whole app written out for a team that has written the code and is stuck on errors. Compare, do not paste. | A team you choose. |
| **Demo** | A working version built from the stories, for the class to test and the team to share. | Everyone, week 11 on. |

The shared pages (Writing a story, First steps, the Pattern Book, Designing
for Anvil, Figma step by step, Handing over) are the textbook. They do not
change per team.

## The queue, and why approval matters

Students cannot change their documents directly. They propose, you approve,
and only then does the document change and every page regenerate. This is
not bureaucracy. It is the one moment in the week when you read what every
team wrote, and it is where most of the teaching happens: a story that says
"needs a map" comes back with a note that "needs a map" cannot be true or
false. The queue is the feedback loop, and an empty queue at the end of the
day means every team got feedback that day.

## What to grade

Grade the documents and the test, not the code. A rubric that works:

| What | Evidence | Weight |
|---|---|---|
| Product plan | Names real users and real features. A purpose a stranger understands. | 15 |
| User stories | Every feature has one. Every story has a person, want, reason, criteria that can be true or false, and a scenario. | 25 |
| Design | One frame per screen, named as the brief says, with empty and error states. The review is short. | 20 |
| Build | The cards ticked on the board match what the app does. | 15 |
| Testing | A test sheet completed for another team, exact enough that the team could act on it, and a response to the sheets received. | 15 |
| Demo | Shows the app and says which story each screen came from. | 10 |

Effort shows in the documents before it shows in the app. A team whose app
is thin but whose stories are sharp has learnt the thing that transfers.

## When the tools fight you

- **The design tool.** Figma is the design tool the module is written for.
  The Education plan is free for schools and lifts the limits that block the
  design review. Students share their file from the design brief page.
- **The build tool.** The Pattern Book and the build pages are written for
  Anvil. Teachers and students have found it heavy. The module is built so
  the build pack can be swapped: the architecture names screens and
  components, the Pattern Book maps them to code, and a different tool means
  a different Pattern Book, not a different module. Until then, a team that
  cannot get on with Anvil can stop at a reviewed design and a working demo
  and has still done the course.
- **Accounts.** Nothing in the module needs a student account. Outside tools
  that do: initials, pseudonyms, and your email with plus addressing.

## The one rule for you

Do not fix a team's document for them. Send it back with one sentence about
what is missing. The page will say the same thing tomorrow, and the day
after, until they fix it. That repetition is the course.
