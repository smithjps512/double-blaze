/**
 * Writes every Launch Pad team's plan into docs/launch, in the folder format
 * the prototype generator reads: `product-plan.md` and `user-stories.md`.
 *
 * A folder that already exists is kept, because the teacher may have touched
 * it up already. Pass --force to overwrite, or name the folders to redo.
 *
 *   npm run launch:export                       every team, new folders only
 *   npm run launch:export -- --force            every team, overwrite
 *   npm run launch:export -- p3-the-lions       one team, overwrite
 *   npm run launch:export -- --from rows.json   rows saved from Supabase instead
 *
 * Reads Supabase with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * With --from, a JSON array of rows (period, team_key, team_name, plan), which
 * is what `select * from launch_plans` gives you in the Supabase dashboard.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { cleanPlan, exportFolder, progress, toProductPlan, toUserStories } from "../src/lib/launch/plan";

const here = dirname(fileURLToPath(import.meta.url));
const launchDir = resolve(here, "../../../docs/launch");

interface Row {
  period: number;
  team_key: string;
  team_name: string;
  plan: unknown;
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
  const { data, error } = await db.from("launch_plans").select("period, team_key, team_name, plan").order("period").order("team_key");
  if (error) {
    console.error(`Could not read launch_plans: ${error.message}`);
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

  await mkdir(launchDir, { recursive: true });
  let wrote = 0;
  for (const row of await rows(from)) {
    const folder = exportFolder(row.period, row.team_key);
    if (only.length && !only.includes(folder)) continue;
    const plan = cleanPlan(row.plan);
    const p = progress(plan);
    if (!p.purpose && p.stories === 0 && !plan.productName.trim()) {
      console.log(`  skipped ${folder}: nothing written yet`);
      continue;
    }
    const dir = join(launchDir, folder);
    if (existsSync(dir) && !force && !only.includes(folder)) {
      console.log(`  kept    ${folder}: already exported (you may have edited it). Use --force or name it to redo.`);
      continue;
    }
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "product-plan.md"), toProductPlan(plan, row.team_name, row.period), "utf8");
    await writeFile(join(dir, "user-stories.md"), toUserStories(plan, row.team_name), "utf8");
    const flag = p.done ? "" : `  (unfinished: ${p.users} users, ${p.stories} stories${p.purpose ? "" : ", no purpose"})`;
    console.log(`  wrote   ${folder}${flag}`);
    wrote++;
  }
  console.log(`\n${wrote} team${wrote === 1 ? "" : "s"} written to docs/launch. Touch them up, then: npm run launch:prototypes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
