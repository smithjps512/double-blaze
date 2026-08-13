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

function inlinePlaceholder(assetId: string): string | null {
  if (!assetId.startsWith("placeholder:")) return null;
  const name = assetId.slice("placeholder:".length);
  try {
    const svg = readFileSync(join(placeholderDir, `${name}.svg`), "utf8");
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  } catch {
    console.warn(`  missing placeholder: ${name}.svg`);
    return null;
  }
}

const out = resolve(__dirname, outDir);
mkdirSync(out, { recursive: true });

const pages = renderSite(content, { linkStyle: "export", assetUrl: inlinePlaceholder });
for (const page of pages) {
  writeFileSync(join(out, page.filename), page.html, "utf8");
  console.log(`  ${page.filename}  ${(page.html.length / 1024).toFixed(1)} kB`);
}
console.log(`\n${pages.length} page(s) written to ${out}`);
