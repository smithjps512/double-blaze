# Third period: the plant showcase

Sixth grade. Students are growing plants with the FarmBot, and each one turned
in a two page assignment: a plant page (a picture plus information) and a care
page. This folder is the content behind the website that shows them off, at
`/greenhouse`.

No em dashes anywhere in this document or any copy it generates.

## The rule that governs everything here

**No student names on the site, and none in this folder.** Names appear in the
original Drive filenames and are written on the handwritten pages themselves.
They are deliberately not recorded anywhere in this repository. Source documents
are referenced by Drive file ID only. If the site should ever credit a grower,
that has to be a non-identifying label you choose.

The site is also excluded from search engines in `robots.ts`, and every page
carries `noindex`, the same treatment the Trail Crew gallery gets. It is
shareable by link, not findable by strangers.

## How it works

One markdown file per plant in `plants/`. The site reads them at build time.
Nothing runs at request time and nothing reads a database, so the only things
that can appear on the site are the things committed here.

**The site invents nothing.** A plant whose care section is empty renders as
visibly unfinished and says why, which is the same rule the prototype generator
follows. The fix belongs to the student, not to the software.

## Adding a growth log entry

This is the part you will do every week or two. Two steps.

1. Drop the photo into `apps/platform/public/plant-showcase/<plant>/`. Any
   filename works.
2. Add an entry under `## Growth log` in that plant's markdown file:

```markdown
## Growth log

### 2026-09-08 First sprouts
photo: 2026-09-08-sprouts.jpg
Two green shoots broke the soil this morning, eleven days after planting.
```

The heading is `###`, then the date as `YYYY-MM-DD`, then an optional title. The
`photo:` line is optional, and so is the writing under it. Entries can go in any
order in the file, because the site sorts them newest first.

If an entry names a photo that is not in the folder, the page says so instead of
showing a broken image, so a typo is easy to catch.

## Adding a plant

Copy an existing file. The front matter block at the top is:

```markdown
---
name: Black-eyed Susan
botanical: Rudbeckia hirta
source: handwritten
warning: An optional safety line, shown in a band near the top of the page.
---
```

Only `name` is required. Then `## About`, `## Care`, `## Growth log`, and
`## Notes`.

**`## Notes` is never published.** It is where source references and open
questions about a student's work live. There is a test that fails if any of it
reaches a rendered page.

## Scanning in the drawings

Every plant page has a spot for the student's drawing, and it currently says the
drawing has not been scanned in yet. Name the file `drawing.jpg` (or `.png` or
`.webp`) and drop it in that plant's folder under
`apps/platform/public/plant-showcase/`.

## Source

Google Drive folder "3rd period flower Website", owned by
melissa@melissaforeducators.ai:
<https://drive.google.com/drive/folders/1EcP06ZOlaX2V7poAK9zqsMrVKN_PeHNg>

16 files: 13 photos of handwritten pages and 3 Word documents, which became the
nine plants here. Nothing in that folder is a photograph of an actual growing
plant. Every picture is a student drawing or a page of writing.

## What is here

| Plant | About | Care | Source | Status |
| --- | --- | --- | --- | --- |
| Black-eyed Susan | yes | yes | handwritten | ready |
| Blue wild indigo | yes | yes | handwritten and a document | two submissions, see below |
| New England aster | yes | yes | document | one fact to fix |
| Rhododendron | yes | researched | handwritten | care added, see below |
| Sunchoke | yes | yes | document | ready |
| Threadleaf coreopsis | yes | yes | handwritten | ready |
| Tickseed | yes | yes | handwritten | ready |
| Virginia spiderwort | yes | yes | handwritten | ready |
| Woodland strawberry | yes | researched | handwritten | care added, see below |

Nine plants from a folder of sixteen files. If third period is larger than nine
students, work is still outstanding.

## Things that still need you

1. **Two care pages were researched, not written by a student.** Rhododendron
   and woodland strawberry did not turn one in, so care steps were added from
   university extension guidance. Both are marked `careSource: researched` and
   both pages say plainly that the steps did not come from the student. If those
   two turn their work in, replace the steps and drop the marker.
2. **One photo has no readable text.** Drive `1UYHo-995EjbWiG70FstCjXOetZ5WVqbA`
   (IMG_7349) sits right after the rhododendron plant page. It is probably that
   student's drawing or an unfinished care page and needs a human look.
3. **One file does not belong in the Drive folder.** Drive
   `1h3jffob4TRHUhQhpozA_zW_Q2T3cMLVV` (IMG_7360) is a fitness app requirements
   sheet with user stories and a workout scenario on it. That is a seventh or
   eighth grade product plan, and it looks like it belongs with the Strive
   Fitness team in `docs/students/period-1-strive-fitness`.
4. **Blue wild indigo has two submissions**, one handwritten and one typed. If
   those are two different students, this needs to become two entries.
5. **Safety lines are in place and deserve a second look.** The spiderwort page
   originally said the plant is "edible, but poisonous", which cannot both be
   true. The site drops the edible claim and shows a do-not-eat warning instead.
   Blue wild indigo and rhododendron carry toxicity warnings drawn from the
   students' own research.
6. **No pictures are committed yet.** See the next section.

## Pictures

Three kinds of picture can appear, and they are not interchangeable.

1. **Growth log photos** of the actual plants in the greenhouse. These are the
   real goal and they win over everything else on the page.
2. **The student's drawing**, `drawing.jpg` in that plant's image folder. Every
   student drew their plant, and those drawings are in the Drive folder mixed in
   with the handwritten pages. Scanning or cropping them out is a human job.
3. **A reference photo of the species**, `reference.jpg`, which stands in until
   there is something real to show. Every page that displays one says it is a
   photo of the species and not of the plant in the greenhouse.

Reference photos can be fetched automatically:

```bash
npm run plant-photos            # every plant that does not have one
npm run plant-photos -- --force # replace the ones already there
```

The script pulls one openly licensed photo per species from Wikimedia Commons,
accepts only public domain and CC licences that permit reuse, writes the file
into `apps/platform/public/plant-showcase/<plant>/reference.jpg`, and writes the
photographer and licence back into that plant's front matter so the page can
credit them.

**It needs network access to `en.wikipedia.org`, `commons.wikimedia.org` and
`upload.wikimedia.org`.** This repository's Claude Code environment blocks those
hosts, so the script currently fails with a 403 on every plant. Allow those
hosts in the environment's network egress settings and the command works, or run
it from a normal machine.

A reference photo with no credit in its front matter renders a visible warning
on the page rather than shipping quietly, because publishing a photographer's
work uncredited is the exact mistake this content set is trying to avoid. That
is also why "find a picture on Google", which one student's page suggests, is
not an option.

## Transcription notes

The handwritten pages were read by optical character recognition, which is
imperfect on sixth grade handwriting. Spelling and obvious recognition errors
have been corrected so the copy is readable, and the students' own wording,
ordering and voice are otherwise kept. Nothing was invented. Where a page was
too unclear to read confidently, the plant's `## Notes` section says so rather
than guessing.
