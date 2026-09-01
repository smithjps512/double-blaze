/**
 * Reads third period's plant showcase content from `docs/plant-showcase`.
 *
 * The content is markdown on disk, edited by the teacher, and read at build
 * time. Nothing here runs at request time and nothing reads a database, which
 * is deliberate: a page showing minors' class work should have no moving parts
 * and no way to publish anything that was not committed on purpose.
 *
 * The parser invents nothing. A plant whose care section is empty renders as
 * visibly unfinished and says so, the same rule the prototype generator
 * follows, because the fix belongs to the student rather than to the software.
 *
 * File format, one file per plant in `docs/plant-showcase/plants`:
 *
 *     ---
 *     name: Black-eyed Susan
 *     botanical: Rudbeckia hirta
 *     warning: optional safety line, shown prominently
 *     ---
 *
 *     ## About
 *     ...
 *
 *     ## Care
 *     ...
 *
 *     ## Growth log
 *
 *     ### 2026-09-08 First sprouts
 *     photo: 2026-09-08-sprouts.jpg
 *     Two green shoots broke the soil this morning.
 *
 *     ## Notes
 *     Teacher notes. Never rendered.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

/** Repo root, from `apps/platform`. */
const repoRoot = resolve(process.cwd(), "../..");
const contentDir = join(repoRoot, "docs/plant-showcase/plants");

/** Where a plant's images live, relative to `public`. */
const IMAGE_DIR = "plant-showcase";
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "steps"; items: string[] };

export interface GrowthEntry {
  /** ISO date, as written in the heading. */
  date: string;
  /** Everything after the date on the heading line. May be empty. */
  title: string;
  /** Public path to the photo, when the file is actually present. */
  photo?: string;
  /** The photo filename as written, whether or not the file exists. */
  photoName?: string;
  blocks: Block[];
}

export interface Plant {
  slug: string;
  name: string;
  botanical?: string;
  /** Where the student's work came from: handwritten, document, or both. */
  source?: string;
  /** A safety line worth showing above the fold. */
  warning?: string;
  about: Block[];
  care: Block[];
  growth: GrowthEntry[];
  /** The student's drawing or a photo of their page, when one has been added. */
  drawing?: string;
  /** Sections the student has not turned in yet. */
  missing: Array<"about" | "care" | "drawing">;
}

/** Splits `key: value` on the first colon only, so values may contain colons. */
function parseFrontMatter(lines: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of lines) {
    const at = line.indexOf(":");
    if (at <= 0) continue;
    const key = line.slice(0, at).trim();
    const value = line.slice(at + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

/**
 * Groups lines into blocks. A wrapped line continues the block above it, which
 * is what markdown does and what someone typing in an editor expects.
 */
function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let list: { kind: "bullets" | "steps"; items: string[] } | undefined;
  let paragraph: string[] = [];

  const flush = (): void => {
    if (list) {
      blocks.push(list);
      list = undefined;
    }
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (trimmed === "") {
      flush();
      continue;
    }

    const heading = /^###\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      blocks.push({ kind: "heading", text: heading[1].trim() });
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    const step = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    const kind = bullet ? "bullets" : step ? "steps" : undefined;

    if (kind) {
      const text = (bullet ?? step)![1].trim();
      if (paragraph.length > 0) flush();
      // A list of a different kind starts a new block.
      if (list && list.kind !== kind) {
        blocks.push(list);
        list = undefined;
      }
      if (!list) list = { kind, items: [] };
      list.items.push(text);
      continue;
    }

    // An indented line under a list item is that item continuing.
    if (list && /^\s/.test(line)) {
      list.items[list.items.length - 1] += ` ${trimmed}`;
      continue;
    }

    if (list) flush();
    paragraph.push(trimmed);
  }

  flush();
  return blocks;
}

/** Splits a document body into `## Section` buckets, keyed lowercase. */
function splitSections(lines: string[]): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let current: string | undefined;

  for (const line of lines) {
    const heading = /^##\s+(.*)$/.exec(line.trim());
    if (heading) {
      current = heading[1].trim().toLowerCase();
      sections.set(current, []);
      continue;
    }
    if (current !== undefined) sections.get(current)!.push(line);
  }

  return sections;
}

/** `### 2026-09-08 First sprouts` starts an entry. Undated headings are skipped. */
function parseGrowthLog(lines: string[], slug: string): GrowthEntry[] {
  const entries: GrowthEntry[] = [];
  let open: { date: string; title: string; body: string[] } | undefined;

  const close = (): void => {
    if (!open) return;
    const body: string[] = [];
    let photoName: string | undefined;
    for (const line of open.body) {
      const photo = /^photo:\s*(.+)$/i.exec(line.trim());
      if (photo && !photoName) {
        photoName = photo[1].trim();
        continue;
      }
      body.push(line);
    }
    entries.push({
      date: open.date,
      title: open.title,
      photoName,
      photo: photoName ? resolveImage(slug, photoName) : undefined,
      blocks: parseBlocks(body),
    });
    open = undefined;
  };

  for (const line of lines) {
    const heading = /^###\s+(\d{4}-\d{2}-\d{2})\s*[-:]?\s*(.*)$/.exec(line.trim());
    if (heading) {
      close();
      open = { date: heading[1], title: heading[2].trim(), body: [] };
      continue;
    }
    if (open) open.body.push(line);
  }
  close();

  // Newest first. A teacher appends to the bottom of the file; a visitor wants
  // the latest picture at the top.
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

/** Returns the public path only when the file is really there. */
function resolveImage(slug: string, filename: string): string | undefined {
  const safe = filename.replace(/[/\\]/g, "");
  const onDisk = join(process.cwd(), "public", IMAGE_DIR, slug, safe);
  return existsSync(onDisk) ? `/${IMAGE_DIR}/${slug}/${safe}` : undefined;
}

/** The student's drawing, if a file named `drawing.*` has been dropped in. */
function findDrawing(slug: string): string | undefined {
  for (const extension of IMAGE_EXTENSIONS) {
    const found = resolveImage(slug, `drawing${extension}`);
    if (found) return found;
  }
  return undefined;
}

function parsePlant(slug: string, markdown: string): Plant {
  const lines = markdown.split(/\r?\n/);

  let body = lines;
  let meta: Record<string, string> = {};
  if (lines[0]?.trim() === "---") {
    const end = lines.indexOf("---", 1);
    if (end > 0) {
      meta = parseFrontMatter(lines.slice(1, end));
      body = lines.slice(end + 1);
    }
  }

  const sections = splitSections(body);
  const about = parseBlocks(sections.get("about") ?? []);
  const care = parseBlocks(sections.get("care") ?? []);
  const growth = parseGrowthLog(sections.get("growth log") ?? [], slug);
  const drawing = findDrawing(slug);

  const missing: Plant["missing"] = [];
  if (about.length === 0) missing.push("about");
  if (care.length === 0) missing.push("care");
  if (!drawing) missing.push("drawing");

  return {
    slug,
    name: meta.name || slug,
    botanical: meta.botanical || undefined,
    source: meta.source || undefined,
    warning: meta.warning || undefined,
    about,
    care,
    growth,
    drawing,
    missing,
  };
}

/** Every plant, alphabetical by name. Reads disk, so server side only. */
export function loadPlants(): Plant[] {
  if (!existsSync(contentDir)) return [];

  return readdirSync(contentDir)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => parsePlant(file.replace(/\.md$/, ""), readFileSync(join(contentDir, file), "utf8")))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function loadPlant(slug: string): Plant | undefined {
  const file = join(contentDir, `${slug}.md`);
  if (!existsSync(file)) return undefined;
  return parsePlant(slug, readFileSync(file, "utf8"));
}

/** Exported for the tests, which parse fixtures rather than touching disk. */
export const __test__ = { parseBlocks, parseGrowthLog, splitSections, parseFrontMatter };
