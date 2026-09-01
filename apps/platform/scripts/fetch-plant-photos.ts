/**
 * Fetches one openly licensed reference photograph per plant from Wikimedia
 * Commons, writes it into `public/plant-showcase/<slug>/reference.jpg`, and
 * writes the credit fields back into the plant's markdown front matter.
 *
 * These are photos of the species, not of the plants in the greenhouse. They
 * stand in on the site until the FarmBot plants are far enough along to
 * photograph, and every page that shows one says so.
 *
 * Only public domain and CC licences that permit reuse are accepted. Anything
 * else is skipped and reported, because the point of doing this in a script is
 * that the licence check happens every time rather than when someone remembers.
 *
 *   npm run plant-photos              every plant missing a reference photo
 *   npm run plant-photos -- --force   re-fetch even where one exists
 *
 * Network note: this needs outbound access to en.wikipedia.org,
 * commons.wikimedia.org and upload.wikimedia.org. In a restricted environment
 * the run fails with a clear message rather than writing half a set.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const platformRoot = resolve(here, "..");
const repoRoot = resolve(platformRoot, "../..");
const contentDir = join(repoRoot, "docs/plant-showcase/plants");
const imageRoot = join(platformRoot, "public/plant-showcase");

const USER_AGENT =
  "DoubleBlazeClassSite/1.0 (https://doubleblaze.solutions; middle school class project)";

/**
 * The species to photograph for each plant file. Kept here rather than in the
 * markdown because it is a lookup key for one script, not something a teacher
 * editing content should have to maintain.
 */
const SPECIES: Record<string, string> = {
  "black-eyed-susan": "Rudbeckia hirta",
  "blue-wild-indigo": "Baptisia australis",
  "new-england-aster": "Symphyotrichum novae-angliae",
  rhododendron: "Rhododendron maximum",
  sunchoke: "Helianthus tuberosus",
  "threadleaf-coreopsis": "Coreopsis verticillata",
  "tickseed-coreopsis": "Coreopsis lanceolata",
  "virginia-spiderwort": "Tradescantia virginiana",
  "woodland-strawberry": "Fragaria vesca",
};

/** Licences that allow reuse with attribution. Everything else is skipped. */
const ALLOWED_LICENCE = /^(cc0|cc[ -]by([ -]sa)?([ -][0-9.]+)?|public domain|pd(-|$))/i;

interface Credit {
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
}

function stripHtml(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return (await response.json()) as Record<string, unknown>;
}

/** The lead image of the species' Wikipedia article, at a usable width. */
async function findPhoto(
  species: string,
): Promise<{ thumbnail: string; file: string } | undefined> {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*" +
    "&prop=pageimages&piprop=thumbnail|name&pithumbsize=1600&titles=" +
    encodeURIComponent(species);

  const data = await getJson(url);
  const query = data.query as { pages?: Record<string, Record<string, unknown>> } | undefined;
  const page = Object.values(query?.pages ?? {})[0];
  const thumbnail = page?.thumbnail as { source?: string } | undefined;
  const file = page?.pageimage as string | undefined;

  if (!thumbnail?.source || !file) return undefined;
  return { thumbnail: thumbnail.source, file };
}

/** Author and licence, straight from the file's Commons metadata. */
async function findCredit(file: string): Promise<Credit | undefined> {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
    "&prop=imageinfo&iiprop=extmetadata|url&titles=" +
    encodeURIComponent(`File:${file}`);

  const data = await getJson(url);
  const query = data.query as { pages?: Record<string, Record<string, unknown>> } | undefined;
  const page = Object.values(query?.pages ?? {})[0];
  const info = (page?.imageinfo as Array<Record<string, unknown>> | undefined)?.[0];
  if (!info) return undefined;

  const meta = (info.extmetadata ?? {}) as Record<string, { value?: string }>;
  const license = stripHtml(meta.LicenseShortName?.value);
  const author = stripHtml(meta.Artist?.value) || "Unknown photographer";

  if (!license || !ALLOWED_LICENCE.test(license)) return undefined;

  return {
    author,
    license,
    licenseUrl: meta.LicenseUrl?.value ?? "",
    sourceUrl: (info.descriptionurl as string | undefined) ?? "",
  };
}

async function download(url: string, destination: string): Promise<void> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} downloading ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
}

/** Replaces the photo credit lines in a file's front matter, in place. */
async function writeCredit(slug: string, credit: Credit): Promise<void> {
  const path = join(contentDir, `${slug}.md`);
  const original = await readFile(path, "utf8");
  const lines = original.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") throw new Error(`${slug}.md has no front matter`);
  const end = lines.indexOf("---", 1);
  if (end < 0) throw new Error(`${slug}.md front matter is not closed`);

  const kept = lines.slice(1, end).filter((line) => !/^photo(Author|License|LicenseUrl|Source):/.test(line.trim()));
  const added = [
    `photoAuthor: ${credit.author}`,
    `photoLicense: ${credit.license}`,
    ...(credit.licenseUrl ? [`photoLicenseUrl: ${credit.licenseUrl}`] : []),
    ...(credit.sourceUrl ? [`photoSource: ${credit.sourceUrl}`] : []),
  ];

  await writeFile(path, ["---", ...kept, ...added, ...lines.slice(end)].join("\n"), "utf8");
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  const only = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const slugs = Object.keys(SPECIES).filter((s) => only.length === 0 || only.includes(s));

  let written = 0;
  const skipped: string[] = [];

  for (const slug of slugs) {
    const destination = join(imageRoot, slug, "reference.jpg");
    if (!force && existsSync(destination)) {
      console.log(`  ${slug}: already has a photo`);
      continue;
    }

    const species = SPECIES[slug];
    try {
      const photo = await findPhoto(species);
      if (!photo) {
        skipped.push(`${slug}: no lead image on the ${species} article`);
        continue;
      }

      const credit = await findCredit(photo.file);
      if (!credit) {
        skipped.push(`${slug}: ${photo.file} is not under a licence we can reuse`);
        continue;
      }

      await download(photo.thumbnail, destination);
      await writeCredit(slug, credit);
      written += 1;
      console.log(`  ${slug}: ${photo.file} (${credit.license}, ${credit.author})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      skipped.push(`${slug}: ${message}`);
    }
  }

  console.log(`\nWrote ${written} photo(s) into ${imageRoot}`);
  if (skipped.length > 0) {
    console.log("\nSkipped:");
    for (const line of skipped) console.log(`  ${line}`);
    console.log(
      "\nIf every plant was skipped on a network error, this environment blocks " +
        "wikimedia.org. Allow it in the environment's egress settings and run again.",
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
