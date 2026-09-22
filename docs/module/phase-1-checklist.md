# Phase 1 checklist: every coupling point, and what replaces it in Melissa

No em dashes anywhere in this document or any copy it generates.

The engine and the content move as they are. This list is the app layer:
each place the current code assumes Double Blaze, GitHub, Clerk, one teacher
or one repo, and what the Melissa version does instead. Work it top to
bottom and nothing should surprise you.

Melissa facts this list relies on: Next.js 14, a single app. Supabase with
its own auth, not Clerk. Teachers, classes, periods and student rosters
already exist, and students self-register with a class code. The Anthropic
SDK is already wired under a three-zone policy. The `docx` library is
already a dependency.

## 1. Where documents live

| Now | In Melissa |
|---|---|
| A team's `product-plan.md`, `user-stories.md`, `build-cards.md`, `build-architecture.md` are files in git under `docs/students/<team>/`. | Rows. One table of documents keyed by class, team and kind, with a version per approved change and the Markdown as text. The current file is the latest approved version. |
| Approval commits to GitHub through `lib/trail-crew-publish.ts` with `GITHUB_TOKEN`. | Approval inserts a new version and marks the proposal approved, in one transaction. No token, no network. |
| `readRepoFile` and `writeRepoFile` read and write the repo. | A documents module with `get(classId, teamId, kind)` and `put(...)`. Same shape, different store. |
| `stampRevised` and `stampCardUpdated` write dates into the Markdown so pages can say a card fell behind. | Keep them; they cost nothing and the gap guide reads them. `cardDrift` compares content anyway. |

## 2. Who a person is

| Now | In Melissa |
|---|---|
| No student accounts. The team slug comes from the page URL and that is all the app knows. | Students exist and have signed in with a class code. A student belongs to one team in one class. Team pages are reachable only by that class. |
| Team folders are named after the team or product, never a student. | Teams have a name and a product name. Student display is initials or a pseudonym, chosen at team join, never the roster name. |
| The teacher is one email in `TRAIL_CREW_TEACHER_EMAIL`. | The class's teacher, from Melissa's session. Many teachers, each seeing only their classes. |
| Staff pages check Clerk. | Teacher pages check the Melissa teacher session and class ownership. |
| The queue is opened from a signed email link so the teacher can approve from a phone without signing in (`lib/trail-crew-approval-token.ts`). | Keep the idea. Melissa already sends email; a signed link to the class's queue is a small route. Or drop it and rely on the app's own sign in. Teacher's call. |

## 3. Proposals and the queue

| Now | In Melissa |
|---|---|
| `trail_crew_story_edits`: team slug, heading, original, proposed, reason, status, flagged, applied text, decided by. Kinds: edit, new, architecture. | The same table, plus class id and team id, plus the student's pseudonym as proposer. The three kinds stay. |
| `lib/trail-crew-decide.ts` orders the work: commit, record, close duplicates, rewrite the card, then draft the architecture after the response. | Same order, with "commit" meaning "insert a document version". Duplicate closing stays. |
| The studio's screening flags a proposal but never hides it. | Keep exactly. Under Melissa's zone rules this is the zone where the model assists and the teacher decides. |
| `trail_crew_questions` logs helper questions. | Keep, keyed by class and team. Useful for the teacher's view of who is stuck. |

## 4. Progress and the board

| Now | In Melissa |
|---|---|
| `trail_crew_progress`: team slug, card slug, criterion, state. Ticks stay ticked for the whole team. | Same, plus class id and team id. The card slug rule (from the title, not the number) stays so renumbering keeps ticks. |
| The teams page shows cards done per team from the manifest and the progress table. | The class page shows the same per team. Melissa's teacher dashboard is the natural home. |
| The queue page can reset a board. | A teacher action on the class page. |

## 4b. Testing and the priority board

| Now | In Melissa |
|---|---|
| `trail_crew_test_sheets`, `trail_crew_test_results`, `trail_crew_bugs`: team slug, card slug, the sheet's five parts, a bug's severity and the teacher's now/next/later. A bug's status is not stored; the engine derives it from re-test results. | The same three tables, `makers_test_sheets`, `makers_test_results`, `makers_bugs`, keyed by team id, with RLS scoped to the class's teacher like the rest. `docs/module/makers-testing.sql` is the migration, ready. The derived status stays: one source of truth. |
| The live sheet at `/trail-crew/<team>/test` is anonymous; a sheet is "Tester N". | A student on the tester's team is signed in, so the sheet can carry a pseudonym. Still never a roster name. |
| `/trail-crew/priority` is public to read; the teacher's override and the reset check the Clerk staff role. | The board is a teacher page per class and a student page per team. Override and reset are teacher actions. |
| `lib/trail-crew-testing.ts` validates every write against the team's committed cards from the build context JSON. | Same validation against the current cards document version. The engine functions (`summariseTesting`, `bugStates`, `rankBugs`) are called unchanged. |
| `scripts/import-test-sheets.ts` imports a transcribed paper sheet from `docs/students/<team>/test-sheets.json`. | Keep as a teacher tool if paper sheets continue, reading JSON from an upload rather than the repo. |

## 5. Pages

| Now | In Melissa |
|---|---|
| `scripts/build-prototypes.ts` runs at build time and writes static HTML into `public/prototypes/<team>/` and `public/build/`. A commit triggers a rebuild. | Render on request. A route per page kind calls the same engine functions with Markdown from the database and returns the HTML. Cache by document version if it matters; it will not at first. |
| Every page carries the chain nav built in the generator. | Build the chain from what documents the team has, same rule: a link appears when its page would exist. |
| The shared textbook pages are rendered from `docs/build/*.md` at build time. | Render from the content folder at build time, as now. They do not change per class. |
| The helper's build context is a JSON file the generator writes. | Build it on request from the team's documents. It is small. |
| `prototype-gallery.json` feeds the teams page. | A query. |
| Demos are static folders under `public/demo/`. | Static, as examples. A team's own demo is out of scope for Phase 1. |

## 6. AI

| Now | In Melissa |
|---|---|
| `lib/trail-crew-helper.ts`: two-door coder helper that sends students back to the page, a design helper that may answer directly but never invents a component name, a gap helper. Anthropic, model from `TRAIL_CREW_HELPER_MODEL`. | Same prompts, under Melissa's zone policy. Log to the questions table. Phase 2. |
| `lib/trail-crew-architect.ts` drafts the architecture change after a story is approved, into the queue, for the teacher to edit and approve. | Same. Phase 2. |
| The design review runs by hand as a Claude Code skill through the Figma connector, and a teacher runs it. | An in-app action on the design brief page, when Melissa has a Figma integration. Until then, a paste-the-outline fallback: the checker only needs page and frame names. Phase 2. |

## 7. Email

| Now | In Melissa |
|---|---|
| Resend sends the teacher a mail per proposal and per architecture draft, with approve and queue links. | Melissa's email module. One digest per class per day is probably better than one mail per proposal. |

## 8. Environment

| Now | Needed in Melissa |
|---|---|
| `GITHUB_TOKEN`, `TRAIL_CREW_REPO_*` | Not needed. |
| `TRAIL_CREW_APPROVAL_SECRET` | Only if the signed email link is kept. |
| `TRAIL_CREW_TEACHER_EMAIL` | Not needed; the class has a teacher. |
| `TRAIL_CREW_HELPER_MODEL`, `ANTHROPIC_API_KEY` | Melissa's existing Anthropic configuration. |
| `RESEND_API_KEY` | Melissa's existing email configuration. |

## 9. Branding and names

| Now | In Melissa |
|---|---|
| `MODULE` in `packages/prototype-forge/src/module.ts` carries the name and credit. | Set name to "Melissa for Makers", credit to Melissa's. One file. |
| Pages and docs say "Trail Crew" in places, and the substitute packet names one school and one bell schedule. | Search and replace the name. Rewrite the substitute packet as a template with the schedule blank. |
| The teams page is `/trail-crew`. | A module route group inside Melissa's dashboard, per class. |

## 10. Tests to bring

- `packages/prototype-forge`: 130 tests, run as they are.
- `lib/trail-crew-story-file.test.ts`: the block replace and append. Bring it; the document store changes, the Markdown editing does not.
- `lib/trail-crew-approval-token.test.ts`, `lib/trail-crew-guard.test.ts`: bring if the signed link and the guard are kept.

## Order of work

1. Documents table and module, with the story-file functions on top.
2. Team and pseudonym join, on Melissa's class and student model.
3. Render-on-request routes for the chain, using the engine.
4. The studio and the queue, writing to the proposals table, approval writing a version.
5. The board.
5b. Testing: the live sheet, the results on the board, the priority board, the re-test that closes a bug. Same change as the board or the one after it; it needs only the cards document and the board's team model.
6. Email digest.
7. Then Phase 2: helper, architecture drafts, design review.
