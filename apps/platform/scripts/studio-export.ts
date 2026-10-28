/**
 * Writes every Game Studio team's design into docs/games, for the Double
 * Blaze build: `game-design.md` (pitch, feeling, players, loop, world,
 * mechanics) and `levels.md` (each level as a story with its checks and
 * scenarios, in the same format as Launch Pad's user stories).
 *
 * A folder that already exists is kept, because the teacher may have touched
 * it up. Pass --force to overwrite, or name the folders to redo.
 *
 *   npm run studio:export                          every team, new folders only
 *   npm run studio:export -- p3-pixel-pickles      one team, overwrite
 *   npm run studio:export -- --from rows.json      rows saved from Supabase instead
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { cleanDesign, studioProgress, toGameDesignDoc, toLevelStories } from "../src/lib/studio/design";

const here = dirname(fileURLToPath(import.meta.url));
const gamesDir = resolve(here, "../../../docs/games");

interface Row {
  period: number;
  team_key: string;
  team_name: string;
  design: unknown;
}

async function rows(from: string | undefined): Promise<Row[]> {
  if (from) return JSON.parse(await readFile(resolve(process.cwd(), from), "utf8")) as Row[];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or pass --from rows.json.");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("studio_designs").select("period, team_key, team_name, design").order("period").order("team_key");
  if (error) {
    console.error(`Could not read studio_designs: ${error.message}`);
    process.exit(1);
  }
  return data as Row[];
}

async function main() {
  const args = process.argv.slice(2);
  const fromAt = args.indexOf("--from");
  const from = fromAt >= 0 ? args[fromAt + 1] : undefined;
  const force = args.includes("--force");
  const only = args.filter((a, i) => !a.startsWith("--") && !(fromAt >= 0 && i === fromAt + 1));

  await mkdir(gamesDir, { recursive: true });
  let wrote = 0;
  for (const row of await rows(from)) {
    const folder = `p${row.period}-${row.team_key}`;
    if (only.length && !only.includes(folder)) continue;
    const design = cleanDesign(row.design);
    const p = studioProgress(design);
    if (!design.gameName.trim() && !p.pitch && p.levels === 0) {
      console.log(`  skipped ${folder}: nothing written yet`);
      continue;
    }
    const dir = join(gamesDir, folder);
    if (existsSync(dir) && !force && !only.includes(folder)) {
      console.log(`  kept    ${folder}: already exported (you may have edited it). Use --force or name it to redo.`);
      continue;
    }
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "game-design.md"), toGameDesignDoc(design, row.team_name, row.period), "utf8");
    await writeFile(join(dir, "levels.md"), toLevelStories(design, row.team_name), "utf8");
    console.log(`  wrote   ${folder}  (${p.mechanics} mechanics, ${p.levels} levels, ${p.doneLevels} done)`);
    wrote++;
  }
  console.log(`\n${wrote} game${wrote === 1 ? "" : "s"} written to docs/games.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
