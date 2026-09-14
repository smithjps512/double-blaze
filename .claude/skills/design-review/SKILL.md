---
name: design-review
description: Read a Trail Crew team's shared Figma file through the Figma connector, compare it with their design brief, build cards and stories, and write the design review into their pages. Use when the teacher asks to review a team's design, after a "shared their design" email, or with /design-review <team-folder>.
---

# Design review for a Trail Crew team

You are producing `docs/students/<team>/design-review.md`, the page that tells a
student designer where their Figma file and their team's documents disagree.
The checks are deterministic and live in `packages/prototype-forge/src/design-review.ts`.
Your job is to get the file's outline out of Figma and into that checker, and
to put the result where the team will see it. You do not judge the design.

The team folder is the argument: `/design-review period-2-classic-cars`.

## Before you start

- The Figma connector must be available in this session (`mcp__Figma__*`
  tools). If it is not, stop and say so; there is no other way to read the file.
- The team's link lives in Supabase, table `trail_crew_design_links`, latest
  row for the team by `created_at`. Read it with the Supabase connector
  (`execute_sql`, project "Double Blaze"). If there is no Supabase connector,
  ask the teacher to paste the Figma link.
- Never write the Figma link, the file owner's name, or any student's name
  into any file in this repository. The link stays in the database.

## Steps

1. **Get the link.** `select figma_url, anvil_url, note from public.trail_crew_design_links where team_slug = '<team>' order by created_at desc limit 1;`
   Extract the file key from the URL (`https://www.figma.com/design/<fileKey>/...`).

2. **List the pages.** Call `mcp__Figma__get_metadata` with only `fileKey`.
   It returns the top-level pages (id and name). Expect a Cover page and one
   page per build card named like `Card 3 · Horsepower builder`; whatever is
   there, read all of it.

3. **Read each page.** For every page, call `mcp__Figma__get_metadata` with
   `fileKey` and the page's `nodeId`. Save the XML it returns to a scratch
   directory as `<page name>.xml`, one file per page, exactly the page name
   with `/` replaced by `-`. Do not paraphrase or trim the XML; the checker
   reads names and types out of it.

   Text content: metadata carries layer names, and Figma names a text layer
   after its content unless somebody renamed it, which is enough for the
   placeholder and made-up-number checks. Do not call `get_design_context` on
   every frame; it is slow and the review does not need it.

4. **Run the checker.** From the repository root:

   ```
   npm run design-review -- <team> --xml <scratch-dir>
   ```

   It writes `docs/students/<team>/design-review.md` and prints the findings.

5. **Frames as pictures, optional but worth it.** For each frame that matches
   a screen in the brief (the checker's Screens table names them), call
   `mcp__Figma__get_screenshot` with the frame's `nodeId`, download the PNG
   with the curl line it gives you, and save it as
   `docs/students/<team>/design/<Form>.png` (the form name exactly, one per
   base frame, the good-day state). Then run step 4 again so the page links
   them. Skip this if the file has more than about twenty frames; the
   findings are the review, the pictures are a courtesy.

6. **Render and check.** `npm run prototypes -- <team>`, then open
   `apps/platform/public/prototypes/<team>/design-review.html` and read it
   once as the student will. The chain nav should now carry "Design review".

7. **Commit on the working branch** with a message that names the team and
   the count of findings, and open or update the pull request the way the
   session's git instructions say. Do not push to main.

8. **Tell the teacher** the one next thing the review names, in one line,
   and whether the file could be read at all.

## When the file cannot be read

- `get_metadata` fails with a permission error: the file is not shared with
  the teacher's account. Say so; the student needs to add the school email as
  a viewer and share again. Do not ask for the file to be made public.
- The URL is a FigJam board, a Slides deck, or a Figma Make file: the
  connector cannot read those as designs. Say which it is.
- The file has pages but no frames: run the checker anyway; its first finding
  says exactly that, and that is the review.

## What the checker looks at

Cover page present. One page per build card, matched by title or card number.
One frame per brief screen, matched by name with a state suffix allowed
(`Builder / empty`). Empty and error states per screen. Brief components
present as layer names in the good-day frame; layers with a component prefix
that the brief does not have; layers still on Figma's default names.
Placeholder text. Numbers on frames that appear nowhere in the team's
documents. It says what is already right, too.
