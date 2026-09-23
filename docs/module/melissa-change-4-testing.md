# Melissa change 4b: testing, the results on the cards, and the priority board

No em dashes anywhere in this document or any copy it generates.

The change that carries the testing loop into Melissa for Makers. It sits with
the board (change 4 in the plan) or right after it, because it needs only what
the board needs: the team, the current cards document, and a place to keep
rows that are not documents. Written so the melissa-platform session can run
it as one branch and one PR, with the migration applied first.

This is the "architected final solution" for what Trail Crew built in
September 2026 as the simple version. The simple version is in double-blaze:
migration `0038_trail_crew_testing.sql`, `lib/trail-crew-testing.ts`, the pages
under `/trail-crew/<team>/test` and `/trail-crew/priority`. Read those beside
this page; the Melissa version keeps every rule and changes only the host.

## What it is

Cards are promises. A user test sheet is somebody checking them. This change
makes the sheet live and closes the loop:

1. A tester records each card as pass or fail, with what they did and what
   happened; tries the six ways to break it; reports bugs with a severity and
   a card; gives ratings and their own words.
2. What they record lands on the card the same minute. A card with an open bug
   or a failed last test reads as **failing**, whatever the team's ticks say.
3. Every open bug in the class is on one priority board, in an order the engine
   works out by rule and prints on each row: where the teacher put it, how bad
   the tester said it was, how many times its card failed, how many re-tests
   found it still there, then oldest first. The teacher can move a bug to now,
   next or later.
4. A bug leaves the board one way: somebody runs its steps again and it passes.
   Nothing else closes it.

No model anywhere in the loop. Every rule is deterministic and a student can
apply it on paper.

## What moves unchanged

The engine file `test-results.ts`, with its tests, into
`src/lib/makers/engine/`:

| Function | In | Out |
|---|---|---|
| `summariseTesting(cards, results, bugs)` | Parsed cards, result rows, bug rows | Per card: passes, fails, latest outcome, open and fixed bugs, verdict (untested, passing, failing). Team totals. |
| `bugStates(bugs, results)` | Bug rows, result rows | Each bug open or fixed, how many failed re-tests, the passing re-test that closed it. |
| `rankBugs([{ team, cards, results, bugs }])` | One or many teams | Every open bug ranked, with `why` in one sentence. |
| `BREAK_IT_TESTS`, `VERDICT_LABEL` | | The six break tests the sheet shares, and the badge words. |

Add the exports to `engine/index.ts`. `test-sheet.ts` already imports
`BREAK_IT_TESTS` from it.

## Data model

`docs/module/makers-testing.sql`, ready to apply. Three tables keyed by
`team_id`, RLS scoped to the class's teacher through `makers_teams`.

The Melissa database lives in the **Game View** Supabase organization
(project `fwmdaepypirducucqiyx`, Melissa-Platform), not in Double Blaze. The
session that runs this change needs the Supabase connector switched to Game
View before `apply_migration`; with the connector on Double Blaze, the
project is not listed and the migration cannot land. Nothing in the SQL
depends on the organization, only on `makers_teams` and `classes` existing,
which change 1 created.

| Table | Row |
|---|---|
| `makers_test_sheets` | One sheet: tester (pseudonym or "Tester N"), device, date, the tester's keep, change, missing story, ratings. |
| `makers_bugs` | One bug: card slug or null, title, steps, severity 1 to 3 or null, `teacher_priority` now, next, later or null. |
| `makers_test_results` | One result: card slug for a card test, or `bug_id` for a re-test of a bug; pass or fail; what they did; what happened. |

No status column on a bug. Status is derived from results on every read. Row
types go in `src/types/database.ts`; reach the tables through the loosely
typed client as `documents.ts` does.

## Library module: `src/lib/makers/testing.ts`

The port of `lib/trail-crew-testing.ts`. Same functions, with `teamId` in
place of `slug` and the cards read from `currentDocument(teamId, "cards")`
rather than the build context JSON:

- `getTeamTesting(teamId)`: cards, summary, sheets.
- `getPriorityBoard(classId)`: every open bug for the class's teams, ranked.
- `startSheet`, `finishSheet`, `recordResult`, `reportBug`, `recordBreakTest`:
  every write checked against the current cards before it lands. A result
  naming a bug must name a bug of that team. A card slug must be on the team's
  current cards.
- `setBugPriority(teamId, bugId, priority | null)`: teacher only.
- `clearTesting(teamId)`: teacher only.

The shape the pages receive is `trail-crew-testing-shape.ts` in double-blaze,
copied as is; it has no host code in it.

## Routes

| Route | Who | Does |
|---|---|---|
| `/student/makers/test/[teamId]` | A student, testing another team's app | The live sheet. Same five parts as the paper one. The tester's pseudonym goes on the sheet. |
| `/student/makers/board` | The team | The board, with each card's passes, fails, verdict and open bugs, and a re-test control on each bug. |
| `/student/makers/bugs` | The team | Their own open bugs in priority order, with the reason on each row. |
| `/dashboard/makers/[classId]/bugs` | The teacher | The class priority board. Move to now, next or later. Reset a team's testing. |
| `POST /api/student/makers/test` | Student API | `start`, `result`, `bug`, `break`, `finish`, as in double-blaze `api/trail-crew/test/route.ts`. |
| `POST /api/makers/test/priority`, `POST /api/makers/test/reset` | Teacher API | The override and the reset. |

The board page in change 4 grows a testing strip per card; the shape is in
`ProjectBoard.tsx` in double-blaze (`TestingStrip`).

## Rules that do not move

- A bug closes only on a passing re-test recorded after it was reported.
- The teacher's word beats the tester's severity; everything else is the rule.
- The reason a bug is where it is prints on the row, in words.
- A tester is a pseudonym or a number. Never a roster name. Never an email.
- The engine is pure. Cards in, rows in, verdicts and an order out.

## Done when

- A student on team A tests team B's app from the sheet page and records a
  fail with a bug on card 3.
- Team B's board shows card 3 as failing with the bug on it, whatever its ticks.
- The class priority board shows the bug with its reason; the teacher moves it
  to now and it goes to the top with "Your teacher put this at the top."
- Team B fixes it, runs the steps again from the board, records "did not
  happen", and the bug leaves the priority board and lands under "fixed" on
  the card.
- Migration applied, types added, Jest tests for `test-results.ts` passing,
  lint and build clean.

## Paste this into the session

```
Change 4b for Melissa for Makers: the testing loop. Read
docs/module/melissa-change-4-testing.md and docs/module/makers-testing.sql in
smithjps512/double-blaze, then the simple version they describe:
packages/prototype-forge/src/test-results.ts (moves unchanged, with its
tests), apps/platform/src/lib/trail-crew-testing.ts and
trail-crew-testing-shape.ts (port), apps/platform/src/app/trail-crew/[team]/test
and /priority (the pages), supabase/migrations/0038_trail_crew_testing.sql.
Apply makers-testing.sql through the Supabase MCP first (the connector must
be on the Game View organization, project fwmdaepypirducucqiyx), add the types, then
build the module, routes and pages in that order. Rules that never move: a
bug closes only on a passing re-test; the teacher's word beats severity; the
reason prints on every row; pseudonyms only; no em dashes.
```
