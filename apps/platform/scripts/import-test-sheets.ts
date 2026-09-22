/**
 * Import paper user test sheets into the live testing tables.
 *
 * A class that tested on paper (or in the Word sheet) has results the board
 * cannot see. Transcribe the sheets into `docs/students/<team>/test-sheets.json`
 * (testers numbered, never named; the shape is below) and run:
 *
 *   npm run import-test-sheets -- period-1-strive-fitness
 *
 * with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set. Every
 * card slug is checked against the team's committed cards before anything is
 * written, the same check the live sheet makes, so a typo in the JSON stops
 * the import rather than landing on no card.
 *
 * Rows are stamped with the sheet's `testedOn` date, not today, so "oldest
 * first" on the priority board stays true to when the bug was found.
 *
 * The JSON:
 *
 *   {
 *     "team": "period-1-strive-fitness",
 *     "testedOn": "2026-09-18",
 *     "sheets": [
 *       {
 *         "device": "Chromebook",
 *         "results": [{ "card": "<card slug>", "outcome": "pass" | "fail", "whatIDid": "...", "whatHappened": "..." }],
 *         "bugs": [{ "title": "...", "steps": "...", "severity": 1 | 2 | 3 | null, "card": "<card slug>" | null }],
 *         "keep": ["..."], "change": ["..."], "missingStory": "...", "ratings": [1, 2, 3, 4, 5]
 *       }
 *     ]
 *   }
 *
 * Run twice and it imports twice. There is no natural key on a paper sheet,
 * so reset the team's testing from the queue page first if you need to redo one.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { parseCards } from "@double-blaze/prototype-forge";

interface SheetInput {
  device?: string;
  results?: Array<{ card: string; outcome: "pass" | "fail"; whatIDid?: string; whatHappened?: string }>;
  bugs?: Array<{ title: string; steps?: string; severity?: 1 | 2 | 3 | null; card?: string | null }>;
  keep?: string[];
  change?: string[];
  missingStory?: string;
  ratings?: number[];
}

interface FileInput {
  team: string;
  testedOn: string;
  sheets: SheetInput[];
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const teamArg = process.argv[2];
if (!teamArg) {
  console.error("Usage: npm run import-test-sheets -- <team-folder>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const jsonPath = join(root, "docs/students", teamArg, "test-sheets.json");
const cardsPath = join(root, "docs/students", teamArg, "build-cards.md");
if (!existsSync(jsonPath)) {
  console.error(`No ${jsonPath}.`);
  process.exit(1);
}
if (!existsSync(cardsPath)) {
  console.error(`${teamArg} has no build-cards.md, so there is nothing to test against.`);
  process.exit(1);
}

const input = JSON.parse(readFileSync(jsonPath, "utf8")) as FileInput;
if (input.team !== teamArg) {
  console.error(`The file says team "${input.team}" but you asked for "${teamArg}".`);
  process.exit(1);
}
const cards = parseCards(readFileSync(cardsPath, "utf8"));
const slugs = new Set(cards.map((c) => c.slug));

// Check everything before writing anything.
const problems: string[] = [];
input.sheets.forEach((sheet, i) => {
  for (const r of sheet.results ?? []) {
    if (!slugs.has(r.card)) problems.push(`Sheet ${i + 1}: no card "${r.card}". Cards are: ${[...slugs].join(", ")}`);
    if (r.outcome !== "pass" && r.outcome !== "fail") problems.push(`Sheet ${i + 1}: outcome must be pass or fail.`);
  }
  for (const b of sheet.bugs ?? []) {
    if (b.card && !slugs.has(b.card)) problems.push(`Sheet ${i + 1}: bug "${b.title}" names no card "${b.card}".`);
    if (!b.title?.trim()) problems.push(`Sheet ${i + 1}: a bug has no title.`);
  }
});
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const stamp = `${input.testedOn}T12:00:00Z`;

async function main() {
  const { count } = await supabase
    .from("trail_crew_test_sheets")
    .select("id", { count: "exact", head: true })
    .eq("team_slug", input.team);
  let n = count ?? 0;

  for (const sheet of input.sheets) {
    n += 1;
    const { data: created, error } = await supabase
      .from("trail_crew_test_sheets")
      .insert({
        team_slug: input.team,
        tester: `Tester ${n}`,
        device: sheet.device ?? null,
        tested_on: input.testedOn,
        keep: sheet.keep ?? [],
        change: sheet.change ?? [],
        missing_story: sheet.missingStory ?? null,
        ratings: sheet.ratings && sheet.ratings.length === 5 ? sheet.ratings : null,
        created_at: stamp,
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(`Could not create a sheet: ${error?.message}`);
    const sheetId = (created as { id: string }).id;

    for (const r of sheet.results ?? []) {
      const { error: e } = await supabase.from("trail_crew_test_results").insert({
        team_slug: input.team,
        sheet_id: sheetId,
        card_slug: r.card,
        outcome: r.outcome,
        what_i_did: r.whatIDid ?? null,
        what_happened: r.whatHappened ?? null,
        created_at: stamp,
      });
      if (e) throw new Error(`Could not record a result: ${e.message}`);
    }
    for (const b of sheet.bugs ?? []) {
      const { error: e } = await supabase.from("trail_crew_bugs").insert({
        team_slug: input.team,
        sheet_id: sheetId,
        card_slug: b.card ?? null,
        title: b.title,
        steps: b.steps ?? null,
        severity: b.severity ?? null,
        created_at: stamp,
      });
      if (e) throw new Error(`Could not report a bug: ${e.message}`);
    }
    console.log(`Tester ${n}: ${(sheet.results ?? []).length} results, ${(sheet.bugs ?? []).length} bugs.`);
  }
  console.log(`Imported ${input.sheets.length} sheets for ${input.team}. See /trail-crew/${input.team}/board.`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
