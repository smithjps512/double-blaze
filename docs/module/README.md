# The class module: what it is, and how it moves

No em dashes anywhere in this document or any copy it generates.

Trail Crew was built here as a convenience. It is a class module: everything a
teacher needs to take a class through the product development process end to
end, from a product plan to a tested app. It is moving to Melissa for
Educators as **Melissa for Makers**, and once it works there the way it
should, it comes out of this repo. This folder is the move, in writing.

The working name lives in one place, `packages/prototype-forge/src/module.ts`.
Everything the engine renders reads its name and credit from there.

## The three layers

The module is three layers, and they move differently.

**Content.** Markdown. Portable as it is.

| Where | What | Notes |
|---|---|---|
| `docs/build/*.md` | The textbook: writing a story, first steps, the Pattern Book, Red text, Designing for Anvil, Figma step by step, Start with AI, Look like the Figma, Handing over, the test-the-handover plan, the watch list, the substitute packet, this guide's sibling the facilitator guide. | Tagged by tool in `manifest.json`. Six pages are Anvil-specific. |
| `docs/lessons/` | Lesson units: one folder per unit, one page per day, a template. | Tool-neutral except where a day builds in Anvil. |
| `docs/students/_templates/` | The product plan and user stories templates handed to teams. | Tool-neutral. |
| `docs/students/<team>/` | Fifteen teams' real documents: plans, stories, cards, architectures, data tables, code guides, design reviews. | Worked examples. Team and product names only, no student names. Keep as examples or drop. |
| `apps/platform/public/build/user-test-sheet.docx` | The blank user test sheet, Word. | Any app. |

**Engine.** `packages/prototype-forge`. Pure functions, no I/O, 130 tests.
Portable as a folder.

| File | What it does |
|---|---|
| `parse.ts` | Reads a plan and stories the way students write them, forgivingly. |
| `plan.ts`, `render.ts` | The prototype: screens from stories, nothing invented, every screen carrying its sentence. |
| `gap-guide.ts` | What next: the documents compared with each other, one thing named. |
| `story-kit.ts` | The story checker the studio uses, the test plan, the pattern guess. |
| `cards.ts` | Build cards from stories, and the rewrite when a story changes. |
| `design.ts`, `walkthrough.ts`, `design-review.ts` | The design brief from the architecture, the step by step, and the review of a Figma file against the brief. |
| `test-sheet.ts` | The user test sheet from the cards. |
| `doc-page.ts`, `markdown.ts` | The page wrapper and the Markdown renderer. |
| `module.ts` | The name, credit, toolchain and identity policy. |

**App layer.** The part that is coupled to this host, and the part Phase 1
rebuilds on Melissa's sessions and database. See `phase-1-checklist.md` for
every coupling point and its replacement.

| Piece | Where | Coupled to |
|---|---|---|
| Story studio | `apps/platform/src/app/trail-crew/write` | Supabase table `trail_crew_story_edits`, Resend email. |
| Approval queue and decide | `.../trail-crew/decide`, `.../teacher`, `lib/trail-crew-decide.ts`, `lib/trail-crew-publish.ts` | GitHub commits as the document store, Clerk staff check, signed email links, one teacher. |
| Project board | `.../trail-crew/[team]/board`, `lib/trail-crew-progress.ts` | Supabase table `trail_crew_progress`. |
| Helper | `api/trail-crew/ask`, `lib/trail-crew-helper.ts` | Anthropic, the build context JSON the generator writes. |
| Architecture drafts | `lib/trail-crew-architect.ts` | Anthropic, the queue. |
| Design links and review | `api/trail-crew/share-design`, `.claude/skills/design-review` | Supabase table `trail_crew_design_links`, the Figma connector, run by hand. |
| Walkthrough progress | `lib/trail-crew-walkthrough.ts` | Supabase. |
| Page generation | `apps/platform/scripts/build-prototypes.ts` | Runs at build time, writes static HTML into `public/`. In Melissa this becomes render-on-request from the database, using the same engine. |
| Demos | `apps/platform/public/demo/<team>/` | Static. Examples, not module. |

## The one design change

Here, a team's documents live in git and approval means a commit. That does
not fit a product with many teachers and many classes, and it is the piece
that broke. In Melissa the documents live in the database, per class and per
team, with versions, and approval is a row update. The engine does not care
where the Markdown comes from, so the change is contained to the app layer.

## Toolchain

Figma is the design tool. Anvil is the build tool the current pages are
written for, and it is a maybe. `manifest.json` tags every Anvil-specific
page so the build pack can be swapped for another tool, or for an integrated
editor with the helper alongside it, without touching the rest. The
architecture page is the seam: it names screens and components, and a
Pattern Book maps those to code in whatever tool.

## Identity

Students are pseudonyms. Team pages show team and product names only. For
outside tools that need an email, the teacher's own address with plus
addressing (`you+ab@school.org`) registers each student without sharing
anything personal, and every account lands in one inbox.

## What is in this folder

- `README.md`, this file.
- `manifest.json`, the content inventory with tool tags.
- `phase-1-checklist.md`, every coupling point in the app layer and what replaces it in Melissa.
- `cc-session-brief.md`, prompts for the separate session designing the Melissa experience.

## Phases

0. **Here.** Name and credit in one file. The test sheet as a page on every
   team's chain, with the Word sheet linked. The facilitator guide. This
   inventory and the checklist. Done in this branch.
1. **In Melissa.** The data model and the pages on Melissa's sessions.
   Approval in the app. Render from the database with the same engine.
2. **In Melissa.** The AI pieces under Melissa's three-zone rules: the
   helper, architecture drafts, the design review through the Figma
   connector.
3. **In Melissa.** Melissa's design system on the surfaces, and the module in
   the catalogue with its own tier.
4. **Here.** Remove the Trail Crew routes, tables and content from this repo.
   Keep the demos and the Classic Cars showcase, or not.
