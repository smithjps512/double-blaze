# Student teams: product plans, user stories, and prototypes

No em dashes anywhere in this document or any copy it generates.

This folder holds what student teams write, and it is the input to the
prototype generator. One folder per team. Drop the documents in, run one
command, and every team gets a clickable prototype built from their own words.

## Why this exists

Seventh and eighth graders are learning the development process in order:
product plan, user stories, UX and UI design, then a little code. The middle of
that sequence is where interest goes to die. Defining what you are going to
build is the least glamorous part of the work and the part that decides whether
everything after it succeeds.

The prototype is the payoff that keeps a team in the room. It is generated from
the plan and the stories with no design work and no code, so a team can see
their idea standing up hours after they wrote it down, and then go do the design
and the build knowing what they are building.

## The rule that makes it a teaching tool

**The generator invents nothing.** It has no model in it. It reads what the
team wrote, maps it onto screens by rules a student can follow on paper, and
where the writing is thin the prototype is visibly thin and says why.

- A feature with no user story becomes an empty screen that names the missing
  story.
- A story with no acceptance criteria becomes a screen with nothing to click.
- A button whose story never said what happens next says exactly that when you
  press it.
- Every screen carries the sentence it came from, on the "How this was made"
  screen.

A team that wants a better prototype has exactly one lever: write better
documents. That is the lesson, and it is delivered by the artifact rather than
by a teacher.

## Folder layout

```
docs/students/
  README.md
  _templates/            starting points to hand out. Ignored by the generator.
    product-plan.md
    user-stories.md
  <team-folder>/         one per team, any name, lowercase with hyphens
    product-plan.md      required
    user-stories.md      optional, and may instead live inside the plan
```

Any folder whose name starts with `_` is skipped, so templates and working notes
can live here safely.

**Team folder names become public URLs.** Use the team name or the product name,
never a student's name. The gallery shows team names and product names only.

## Writing the documents

The parser is deliberately forgiving, because these are written by twelve and
thirteen year olds in a document, not by analysts in a form. Headings can be in
any order. Lists can be bullets or paragraphs. What it looks for:

**In the product plan:** a heading containing *purpose*, one containing *users*
or *who*, one containing *description* or *overview*, and one containing
*features*. The document title, or a `Product name:` line, names the product. A
`Team:` line names the team.

**In the user stories:** the sentence form the students are being taught.

```
As a student, I want to see when my bus is coming, so that I stop waiting outside in the rain.
  Given I have set my bus number
  When I open the app
  Then I see how many minutes until my bus reaches my stop
```

The Given, When and Then lines belong to the story above them, which is the same
rule the students are taught. Plain bullets under a story are read as acceptance
criteria too, so a team that has not learned Given/When/Then yet still gets a
working prototype.

Put user stories under a heading that names the feature they belong to, and the
generator will file them there. Otherwise it matches them to features by the
words they share, and a story matching nothing gets its own screen labelled
"Not in your feature list", which is usually a feature the team forgot to write
down.

## Generating the prototypes

From the repository root:

```bash
npm run prototypes            # every team in docs/students
npm run prototypes -- sample-bus-buddy   # one team
```

This writes a self-contained HTML file per team into
`apps/platform/public/prototypes/<team-folder>/index.html`, plus a manifest the
gallery reads. The files have no dependencies, so one can also be emailed,
attached to an assignment, or opened from a thumb drive.

The gallery lives at `/trail-crew` and lists every team with their product name,
purpose, and a link into their prototype. It is what a team shares with a parent.

## The sample team

`sample-bus-buddy/` is a complete worked example, and it is deliberately not
perfect. It has a feature with no story and a story with no "so that", so the
coach notes have something real to say. Use it to show a class what the
generator does before they hand in their own.

## What this is not

This generates a prototype to look at and click through. It is not the product,
and it does not become the product. Learning to actually design and build the
thing is the next part of the course, and it happens elsewhere.
