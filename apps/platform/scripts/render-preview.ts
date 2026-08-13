/**
 * Render a client's site content to local HTML for a design review gate.
 *
 * Renders exactly what publishing would write to storage, so what the client
 * reviews is what would go live. Placeholder art is inlined as data URIs so a
 * single file can be opened straight from disk or emailed without a server.
 *
 *   npx tsx scripts/render-preview.ts electric-grid ../../../preview
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderSite } from "@double-blaze/site-render";
import { ELECTRIC_GRID_CONTENT } from "../src/lib/clients/electric-grid";
import type { SiteContent } from "@double-blaze/site-schema";

const CLIENTS: Record<string, SiteContent> = {
  "electric-grid": ELECTRIC_GRID_CONTENT,
};

const [client = "electric-grid", outDir = "../../../preview"] = process.argv.slice(2);
const content = CLIENTS[client];
if (!content) {
  console.error(`Unknown client "${client}". Known: ${Object.keys(CLIENTS).join(", ")}`);
  process.exit(1);
}

const placeholderDir = resolve(__dirname, "../../sites/public/placeholder");

/**
 * Inline a placeholder asset as a data URI.
 *
 * Everything is embedded so the review file is a single self-contained
 * document that opens from disk, including video. That makes the file large,
 * which is fine for a review artifact and is not how the published site
 * works: there, assets are separate files served from storage and cached.
 */
const MIME: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

function inlinePlaceholder(assetId: string): string | null {
  if (!assetId.startsWith("placeholder:")) return null;
  const name = assetId.slice("placeholder:".length);
  for (const ext of Object.keys(MIME)) {
    try {
      const bytes = readFileSync(join(placeholderDir, `${name}.${ext}`));
      return `data:${MIME[ext]};base64,${bytes.toString("base64")}`;
    } catch {
      // try the next extension
    }
  }
  console.warn(`  missing placeholder: ${name}`);
  return null;
}

const out = resolve(__dirname, outDir);
mkdirSync(out, { recursive: true });

const pages = renderSite(content, { linkStyle: "export", assetUrl: inlinePlaceholder });
for (const page of pages) {
  writeFileSync(join(out, page.filename), page.html, "utf8");
  console.log(`  ${page.filename}  ${(page.html.length / 1024).toFixed(1)} kB`);
}
console.log(`\n${pages.length} page(s) written to ${out}`);
