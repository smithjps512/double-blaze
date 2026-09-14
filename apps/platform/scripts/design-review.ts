/**
 * Writes a team's design review from an outline of their Figma file.
 *
 *   npm run design-review -- <team-folder> <outline.json>
 *   npm run design-review -- <team-folder> --xml <dir-of-page-xml-files>
 *
 * The outline is `{ pages: [{ name, frames: [{ name, layers, texts }] }] }`.
 * With `--xml`, every `*.xml` in the directory is one page's metadata from
 * the Figma connector, and the file name (minus .xml) is the page name.
 *
 * The review itself is pure and lives in prototype-forge. This script reads
 * the team's documents, runs it, writes `design-review.md` into the team
 * folder, and says what it found. Frames exported as PNG into the team's
 * `design/` folder, named after the form (`Builder.png`), are linked from the
 * page. Then `npm run prototypes -- <team>` renders it into the chain.
 *
 * Nothing here talks to Figma. The `/design-review` skill in the repository
 * is what drives the connector and produces the outline.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  outlineFromMetadata,
  parseArchitecture,
  parseBrief,
  parseCards,
  parseStories,
  renderDesignReview,
  reviewDesign,
  type FigmaOutline,
} from "@double-blaze/prototype-forge";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const studentsDir = join(repoRoot, "docs/students");

async function readIfPresent(path: string): Promise<string | undefined> {
  return existsSync(path) ? readFile(path, "utf8") : undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const slug = args[0];
  if (!slug) {
    console.error("Usage: npm run design-review -- <team-folder> <outline.json | --xml <dir>>");
    process.exitCode = 1;
    return;
  }
  const dir = join(studentsDir, slug);
  if (!existsSync(dir)) {
    console.error(`No team folder at ${dir}.`);
    process.exitCode = 1;
    return;
  }

  let outline: FigmaOutline;
  if (args[1] === "--xml") {
    const xmlDir = resolve(args[2] ?? "");
    const files = (await readdir(xmlDir)).filter((f) => f.endsWith(".xml")).sort();
    outline = outlineFromMetadata(
      await Promise.all(files.map(async (f) => ({ pageName: basename(f, ".xml"), xml: await readFile(join(xmlDir, f), "utf8") }))),
    );
  } else if (args[1]) {
    outline = JSON.parse(await readFile(resolve(args[1]), "utf8")) as FigmaOutline;
  } else {
    console.error("Give an outline JSON file, or --xml and a directory of page metadata.");
    process.exitCode = 1;
    return;
  }

  const plan = (await readIfPresent(join(dir, "product-plan.md"))) ?? "";
  const storiesMd = (await readIfPresent(join(dir, "user-stories.md"))) ?? "";
  const cardsMd = (await readIfPresent(join(dir, "build-cards.md"))) ?? "";
  const archMd = (await readIfPresent(join(dir, "build-architecture.md"))) ?? "";

  const brief = parseBrief(plan, slug);
  const review = reviewDesign({
    spec: parseArchitecture(archMd),
    cards: parseCards(cardsMd),
    stories: parseStories(storiesMd),
    documentsText: `${plan}\n${storiesMd}\n${cardsMd}\n${archMd}`,
    outline,
  });

  const pictures: Record<string, string> = {};
  const picDir = join(dir, "design");
  if (existsSync(picDir)) {
    for (const f of (await readdir(picDir)).sort()) {
      if (!/\.(png|jpe?g|webp)$/i.test(f)) continue;
      pictures[basename(f).replace(/\.[^.]+$/, "")] = `design/${f}`;
    }
  }

  const markdown = renderDesignReview(review, {
    productName: brief.productName,
    teamName: brief.teamName,
    reviewedOn: new Date().toISOString().slice(0, 10),
    pictures,
  });
  await writeFile(join(dir, "design-review.md"), markdown, "utf8");

  console.log(`Wrote ${join(dir, "design-review.md")}`);
  console.log(
    `  ${review.counts.pages} pages, ${review.counts.frames} frames, ${review.counts.layers} layers; ${review.counts.matched} of ${review.counts.components} components found.`,
  );
  for (const f of review.findings) console.log(`  [${f.level}] ${f.title}`);
  if (review.findings.length === 0) console.log("  Nothing disagrees.");
  console.log(`Now: npm run prototypes -- ${slug}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
