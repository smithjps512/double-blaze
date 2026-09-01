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
| Rhododendron | yes | no | handwritten | **incomplete** |
| Sunchoke | yes | yes | document | ready |
| Threadleaf coreopsis | yes | yes | handwritten | ready |
| Tickseed | yes | yes | handwritten | ready |
| Virginia spiderwort | yes | inferred | handwritten | **needs confirmation** |
| Woodland strawberry | yes | no | handwritten | **incomplete** |

Nine plants from a folder of sixteen files. If third period is larger than nine
students, work is still outstanding.

## Things that still need you

1. **Two plants have no care page.** Rhododendron and woodland strawberry. The
   rhododendron page has a "Care" heading with nothing written under it. Both
   say so on the site rather than hiding it.
2. **One care page has no name on it.** Drive `1VcdG2tsQWhalBxitm43g-ye8AmooPZeI`
   is matched to Virginia spiderwort by camera roll order and by content that
   fits spiderwort. Please confirm the pairing.
3. **One photo has no readable text.** Drive `1UYHo-995EjbWiG70FstCjXOetZ5WVqbA`
   (IMG_7349) sits right after the rhododendron plant page. It is probably that
   student's drawing or an unfinished care page and needs a human look.
4. **One file does not belong in the Drive folder.** Drive
   `1h3jffob4TRHUhQhpozA_zW_Q2T3cMLVV` (IMG_7360) is a fitness app requirements
   sheet with user stories and a workout scenario on it. That is a seventh or
   eighth grade product plan, and it looks like it belongs with the Strive
   Fitness team in `docs/students/period-1-strive-fitness`.
5. **Blue wild indigo has two submissions**, one handwritten and one typed. If
   those are two different students, this needs to become two entries.
6. **Two safety items are already handled, and both deserve a second look.** The
   spiderwort page originally said the plant is "edible, but poisonous", which
   cannot both be true. The site drops the edible claim and shows a do-not-eat
   warning instead. Blue wild indigo and rhododendron carry toxicity warnings
   drawn from the students' own research.
7. **There are no plant photographs yet.** Every picture in the source folder is
   a drawing or a page of writing, and one page says "please find a picture on
   Google", which would be a copyright problem. The drawings are the better
   answer. Photographing the real FarmBot plants is what the growth log is for.

## Transcription notes

The handwritten pages were read by optical character recognition, which is
imperfect on sixth grade handwriting. Spelling and obvious recognition errors
have been corrected so the copy is readable, and the students' own wording,
ordering and voice are otherwise kept. Nothing was invented. Where a page was
too unclear to read confidently, the plant's `## Notes` section says so rather
than guessing.
