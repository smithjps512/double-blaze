/**
 * Builds a clickable prototype for every student team in `docs/students`.
 *
 * The generator itself is `@double-blaze/prototype-forge`, which is pure. This
 * script is the only part that touches disk: it reads each team folder, writes
 * a self-contained HTML file into `public/prototypes`, and writes the manifest
 * the gallery page reads.
 *
 * Output is committed rather than generated at deploy time, on purpose. The
 * gallery has to be reviewable before a class sees it, and a diff of the HTML
 * is the only honest review of what a team's documents produced.
 *
 *   npm run prototypes                    every team
 *   npm run prototypes -- sample-bus-buddy  one team
 */

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { forgePrototype } from "@double-blaze/prototype-forge";

const here = dirname(fileURLToPath(import.meta.url));
const platformRoot = resolve(here, "..");
const repoRoot = resolve(platformRoot, "../..");
const studentsDir = join(repoRoot, "docs/students");
const outputDir = join(platformRoot, "public/prototypes");
const manifestPath = join(platformRoot, "src/data/prototype-gallery.json");

export interface GalleryEntry {
  slug: string;
  productName: string;
  teamName?: string;
  purpose: string;
  features: string[];
  href: string;
  stats: { features: number; stories: number; scenarios: number; screens: number };
  /** Open coach notes, so a teacher can see at a glance who needs a nudge. */
  gaps: number;
}

async function readIfPresent(path: string): Promise<string | undefined> {
  return existsSync(path) ? readFile(path, "utf8") : undefined;
}

/** The plan may be named a few ways. Take the first one that exists. */
const PLAN_NAMES = ["product-plan.md", "product-brief.md", "plan.md", "brief.md"];
const STORY_NAMES = ["user-stories.md", "stories.md", "user-stories.markdown"];

async function firstPresent(dir: string, names: string[]): Promise<string | undefined> {
  for (const name of names) {
    const found = await readIfPresent(join(dir, name));
    if (found !== undefined) return found;
  }
  return undefined;
}

async function main(): Promise<void> {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));

  if (!existsSync(studentsDir)) {
    console.error(`No student folder at ${studentsDir}.`);
    process.exitCode = 1;
    return;
  }

  const entries = await readdir(studentsDir, { withFileTypes: true });
  const teams = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("."))
    .map((e) => e.name)
    .filter((name) => only.length === 0 || only.includes(name))
    .sort();

  if (teams.length === 0) {
    console.error(only.length > 0 ? `No team folder matched: ${only.join(", ")}` : "No team folders found.");
    process.exitCode = 1;
    return;
  }

  // A full run owns the output folder, so a deleted team stops being published.
  // A single team run touches only that team.
  if (only.length === 0 && existsSync(outputDir)) {
    await rm(outputDir, { recursive: true, force: true });
  }
  await mkdir(outputDir, { recursive: true });

  const manifest: GalleryEntry[] = [];
  const previous: GalleryEntry[] =
    only.length > 0 && existsSync(manifestPath)
      ? JSON.parse(await readFile(manifestPath, "utf8"))
      : [];

  for (const slug of teams) {
    const dir = join(studentsDir, slug);
    const planMarkdown = await firstPresent(dir, PLAN_NAMES);
    if (planMarkdown === undefined) {
      console.warn(`  skipped ${slug}: no ${PLAN_NAMES[0]}`);
      continue;
    }
    const storiesMarkdown = await firstPresent(dir, STORY_NAMES);

    const { brief, stories, app, html } = forgePrototype({
      planMarkdown,
      storiesMarkdown,
      fallbackName: slug,
    });

    await mkdir(join(outputDir, slug), { recursive: true });
    await writeFile(join(outputDir, slug, "index.html"), html, "utf8");

    const gaps = app.notes.filter((n) => n.level === "gap").length;
    manifest.push({
      slug,
      productName: brief.productName,
      teamName: brief.teamName,
      purpose: brief.purpose || brief.description,
      features: brief.features.map((f) => f.name),
      href: `/prototypes/${slug}/index.html`,
      stats: app.stats,
      gaps,
    });

    console.log(
      `  ${slug}: ${brief.features.length} features, ${stories.length} stories, ` +
        `${app.stats.screens} screens, ${gaps} open notes`,
    );
  }

  const merged = only.length > 0 ? mergeManifest(previous, manifest) : manifest;
  merged.sort((a, b) => a.productName.localeCompare(b.productName));
  await writeFile(manifestPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

  console.log(`\nWrote ${manifest.length} prototype(s) to ${outputDir}`);
  console.log(`Gallery manifest: ${manifestPath}`);
}

function mergeManifest(previous: GalleryEntry[], next: GalleryEntry[]): GalleryEntry[] {
  const bySlug = new Map(previous.map((e) => [e.slug, e]));
  for (const entry of next) bySlug.set(entry.slug, entry);
  return [...bySlug.values()];
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
