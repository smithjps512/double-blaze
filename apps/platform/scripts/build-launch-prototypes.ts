/**
 * Builds a clickable prototype for every Launch Pad team in docs/launch.
 *
 * The same generator as Trail Crew's (`@double-blaze/prototype-forge`), with a
 * separate folder, output, and gallery, so sixth grade work never mixes into
 * the seventh and eighth grade board. Output is committed, like Trail Crew's,
 * so the gallery can be looked over before a class sees it.
 *
 *   npm run launch:prototypes                 every team
 *   npm run launch:prototypes -- p3-the-lions   one team
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { forgePrototype } from "@double-blaze/prototype-forge";

const here = dirname(fileURLToPath(import.meta.url));
const platformRoot = resolve(here, "..");
const launchDir = resolve(platformRoot, "../../docs/launch");
const outputDir = join(platformRoot, "public/launch");
const manifestPath = join(platformRoot, "src/data/launch-gallery.json");

interface LaunchEntry {
  slug: string;
  productName: string;
  teamName?: string;
  period?: number;
  purpose: string;
  href: string;
  /** A worked example from the slides (folder `example-*`), shown as a demo, not as a team. */
  example?: boolean;
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const previous: LaunchEntry[] = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : [];
  const folders = existsSync(launchDir)
    ? (await readdir(launchDir, { withFileTypes: true })).filter((d) => d.isDirectory() && !d.name.startsWith("_")).map((d) => d.name)
    : [];

  const built = new Map<string, LaunchEntry>(only.length ? previous.map((e) => [e.slug, e]) : []);
  for (const slug of folders.sort()) {
    if (only.length && !only.includes(slug)) continue;
    const dir = join(launchDir, slug);
    const planPath = join(dir, "product-plan.md");
    if (!existsSync(planPath)) {
      console.warn(`  skipped ${slug}: no product-plan.md`);
      continue;
    }
    const storiesPath = join(dir, "user-stories.md");
    const { brief, stories, app, html } = forgePrototype({
      planMarkdown: await readFile(planPath, "utf8"),
      storiesMarkdown: existsSync(storiesPath) ? await readFile(storiesPath, "utf8") : undefined,
      fallbackName: slug,
      render: { credit: "Planned in class on Launch Pad", creditHref: "/trail-crew/launch" },
    });
    await mkdir(join(outputDir, slug), { recursive: true });
    await writeFile(join(outputDir, slug, "index.html"), html, "utf8");
    const period = Number(/^p(\d)-/.exec(slug)?.[1]) || undefined;
    built.set(slug, {
      slug,
      productName: brief.productName,
      teamName: brief.teamName,
      period,
      purpose: brief.purpose,
      href: `/launch/${slug}/index.html`,
      ...(slug.startsWith("example-") ? { example: true } : {}),
    });
    console.log(`  built ${slug}: ${stories.length} stories, ${app.screens.length} screens`);
  }

  const manifest = [...built.values()].sort((a, b) => (a.period ?? 9) - (b.period ?? 9) || a.productName.localeCompare(b.productName));
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`\n${manifest.length} prototype${manifest.length === 1 ? "" : "s"} in the Launch Pad gallery (/trail-crew/launch).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
