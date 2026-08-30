/**
 * Reads what a student team actually wrote.
 *
 * These are seventh and eighth graders writing in a document, not analysts
 * filling a form, so the parser is deliberately forgiving: headings in any
 * order, bullets or prose, "As a ... I want ... so that ..." on one line or
 * spread across three, Given/When/Then or a plain sentence. Anything it cannot
 * classify is kept rather than dropped, because a gap the team can see is worth
 * more than a parse the team cannot explain.
 *
 * What it will not do is guess. A missing "so that" stays missing, and the
 * planner turns it into a coach note. Inventing the answer would hide the one
 * thing the exercise is trying to teach.
 */

import type { Feature, ProductBrief, Scenario, UserStory, UserType } from "./types";

// ---------------------------------------------------------------------------
// Small text helpers
// ---------------------------------------------------------------------------

/** Strip markdown emphasis, list markers and trailing colons from a line. */
export function plainText(line: string): string {
  return line
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "")
    .replace(/^\s*>\s?/, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)[*_](\S(?:.*?\S)?)[*_](?=\s|$)/g, "$1$2")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Rejoin soft-wrapped lines into the logical lines they were written as.
 *
 * Students write in a document and paste into markdown, so a single sentence
 * routinely arrives split across two lines. Line-by-line parsing then reads
 * "As a student, I want ..., so" as a story with no reason and "that I stop
 * waiting in the rain." as an acceptance criterion, and the team gets told off
 * for a gap they do not have.
 *
 * A line continues the one above it when that line did not finish a sentence
 * and this line is not itself structural: not a heading, not a list item, and
 * not the start of a story or a Given/When/Then clause. That is close enough to
 * how markdown treats a paragraph, and it leaves indented criteria alone.
 */
export function joinWrappedLines(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const previous = out.length > 0 ? out[out.length - 1] : "";
    const structural =
      trimmed === "" ||
      /^(#{1,6})\s/.test(trimmed) ||
      /^(?:[-*+]|\d+[.)])\s/.test(trimmed) ||
      /^>/.test(trimmed) ||
      /^\|/.test(trimmed) ||
      /^```/.test(trimmed) ||
      /^\*\*/.test(trimmed) ||
      GWT_RE.test(trimmed) ||
      STORY_RE.test(trimmed);
    const previousIsOpen =
      previous.trim() !== "" &&
      !/^(#{1,6})\s/.test(previous.trim()) &&
      !/[.!?:;]$/.test(previous.trim()) &&
      !/^```/.test(previous.trim());

    if (!structural && previousIsOpen) {
      out[out.length - 1] = `${previous.replace(/\s+$/, "")} ${trimmed}`;
      continue;
    }
    out.push(line);
  }

  return out.join("\n");
}

function stripTrailingColon(s: string): string {
  return s.replace(/\s*:\s*$/, "").trim();
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "item"
  );
}

/** Sentence case a fragment for use as a screen or card title. */
export function titleCase(s: string): string {
  const t = s.trim().replace(/[.?!]+$/, "");
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

type SectionKey =
  | "name"
  | "team"
  | "purpose"
  | "users"
  | "description"
  | "features"
  | "stories"
  | "other";

interface Section {
  key: SectionKey;
  heading: string;
  depth: number;
  lines: string[];
}

/** Classify a heading by what it is asking for, not by exact wording. */
function classify(heading: string): SectionKey {
  const h = plainText(heading).toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  if (/\b(product name|app name|name of)\b/.test(h)) return "name";
  if (/\bteam\b|\bgroup\b|\bclass\b/.test(h)) return "team";
  if (/\bpurpose\b|\bwhy\b|\bproblem\b|\bmission\b|\bgoal\b/.test(h)) return "purpose";
  if (/\buser|\baudience\b|\bwho\b|\bcustomer|\baudiences\b/.test(h)) return "users";
  if (/\bfeature|\bwhat it does\b|\bcapabilit|\bfunction/.test(h)) return "features";
  if (/\bstor(y|ies)\b|\bscenario/.test(h)) return "stories";
  if (/\bdescription\b|\boverview\b|\bsummary\b|\bwhat (it|the product) is\b|\babout\b/.test(h)) {
    return "description";
  }
  return "other";
}

/** A line that is entirely bold, e.g. `**Who are the users**`, reads as a heading. */
function boldHeading(line: string): string | null {
  const m = line.trim().match(/^\*\*(.+?)\*\*:?$/);
  return m ? m[1] : null;
}

/** An inline labelled field, e.g. `**Purpose:** to help people ...`. */
function inlineField(line: string): { label: string; value: string } | null {
  const m = line.trim().match(/^(?:[-*+]\s+)?(?:\*\*)?([A-Za-z][A-Za-z '/]{1,38}?)(?:\*\*)?\s*:\s*(.+)$/);
  if (!m) return null;
  return { label: m[1].trim(), value: plainText(m[2]) };
}

function splitSections(markdown: string): { title: string; sections: Section[] } {
  const lines = markdown.split(/\r?\n/);
  const sections: Section[] = [];
  let title = "";
  let current: Section = { key: "other", heading: "", depth: 0, lines: [] };
  sections.push(current);

  for (const line of lines) {
    const hashed = line.match(/^(#{1,6})\s+(.*)$/);
    const bold = hashed ? null : boldHeading(line);
    if (hashed || bold) {
      const heading = plainText(hashed ? hashed[2] : (bold as string));
      const depth = hashed ? hashed[1].length : 3;
      if (!title && hashed && hashed[1].length === 1) {
        title = heading;
        continue;
      }
      current = { key: classify(heading), heading, depth, lines: [] };
      sections.push(current);
      continue;
    }
    current.lines.push(line);
  }

  return { title, sections };
}

// ---------------------------------------------------------------------------
// Items (users, features)
// ---------------------------------------------------------------------------

interface NamedItem {
  name: string;
  description?: string;
}

/**
 * Pull named items out of a section body.
 *
 * Handles the three shapes students actually produce: a bullet list, a run of
 * bolded mini headings with a paragraph under each (which is how the adult
 * client briefs in this repo are written, and how students copy them), and
 * plain prose lines.
 */
function readItems(lines: string[]): NamedItem[] {
  const items: NamedItem[] = [];
  let currentBold: NamedItem | null = null;

  const pushBold = () => {
    if (currentBold) {
      currentBold.description = currentBold.description?.trim() || undefined;
      items.push(currentBold);
      currentBold = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const bulletMatch = line.match(/^(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (bulletMatch) {
      pushBold();
      const body = plainText(bulletMatch[1]);
      const split = body.match(/^(.{2,60}?)\s*[:–-]\s+(.+)$/);
      if (split) items.push({ name: stripTrailingColon(split[1]), description: split[2] });
      else items.push({ name: stripTrailingColon(body) });
      continue;
    }

    // `**Name:** body` starts a new item and takes the rest of the paragraph.
    const boldLead = line.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
    if (boldLead) {
      pushBold();
      currentBold = {
        name: stripTrailingColon(plainText(boldLead[1])),
        description: plainText(boldLead[2]),
      };
      continue;
    }

    if (currentBold) {
      currentBold.description = `${currentBold.description ?? ""} ${plainText(line)}`.trim();
      continue;
    }

    // Plain prose. A short line is a name, a long one is a name plus detail.
    const text = plainText(line);
    if (!text) continue;
    const split = text.match(/^(.{2,60}?)\s*[:–-]\s+(.+)$/);
    if (split) items.push({ name: stripTrailingColon(split[1]), description: split[2] });
    else if (text.length <= 80) items.push({ name: stripTrailingColon(text) });
    else items.push({ name: stripTrailingColon(text.split(/\s+/).slice(0, 7).join(" ")), description: text });
  }
  pushBold();

  return items.filter((i) => i.name.length > 0);
}

function readProse(lines: string[]): string {
  return lines
    .map((l) => plainText(l))
    .filter(Boolean)
    .join(" ")
    .trim();
}

// ---------------------------------------------------------------------------
// The product plan
// ---------------------------------------------------------------------------

/**
 * Parse a product plan or brief.
 *
 * `fallbackName` is the folder name, used when the team never wrote a title.
 * The prototype still has to be called something.
 */
export function parseBrief(markdown: string, fallbackName = "Untitled product"): ProductBrief {
  const { title, sections } = splitSections(joinWrappedLines(markdown));

  const brief: ProductBrief = {
    productName: "",
    purpose: "",
    description: "",
    users: [],
    features: [],
  };

  // Inline fields anywhere in the document, e.g. `Product name: Dog Walker`.
  for (const section of sections) {
    for (const line of section.lines) {
      const field = inlineField(line);
      if (!field) continue;
      const key = classify(field.label);
      if (key === "name" && !brief.productName) brief.productName = field.value;
      if (key === "team" && !brief.teamName) brief.teamName = field.value;
      if (key === "purpose" && !brief.purpose) brief.purpose = field.value;
      if (key === "description" && !brief.description) brief.description = field.value;
    }
  }

  // A section whose heading classifies wins over an inline field of the same
  // name, because the section is where the team did the real writing.
  for (const section of sections) {
    switch (section.key) {
      case "purpose": {
        const prose = readProse(section.lines);
        if (prose) brief.purpose = prose;
        break;
      }
      case "description": {
        const prose = readProse(section.lines);
        if (prose) brief.description = prose;
        break;
      }
      case "users":
        brief.users.push(...readItems(section.lines));
        break;
      case "features":
        brief.features.push(...readItems(section.lines));
        break;
      case "name": {
        const prose = readProse(section.lines);
        if (prose && !brief.productName) brief.productName = prose;
        break;
      }
      case "team": {
        const prose = readProse(section.lines);
        if (prose && !brief.teamName) brief.teamName = prose;
        break;
      }
      default:
        break;
    }
  }

  if (!brief.productName) {
    brief.productName = title
      ? title.replace(/\s*[:–-]\s*(product )?(plan|brief|overview).*$/i, "").trim()
      : "";
  }
  if (!brief.productName) brief.productName = fallbackName;

  brief.users = dedupeByName(brief.users) as UserType[];
  brief.features = dedupeByName(brief.features) as Feature[];

  return brief;
}

function dedupeByName(items: NamedItem[]): NamedItem[] {
  const seen = new Map<string, NamedItem>();
  for (const item of items) {
    const key = item.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing) seen.set(key, item);
    else if (!existing.description && item.description) existing.description = item.description;
  }
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// User stories
// ---------------------------------------------------------------------------

/**
 * The story sentence.
 *
 * The article after "as" is optional, because students write "As front office
 * staff" as readily as "As a student" and rejecting the first form would drop
 * a real story on the floor and then report the feature as unwritten.
 */
const STORY_RE =
  /\bas\s+(?:an?\s+|the\s+)?(.{2,60}?)\s*,?\s+i\s+(?:want|would like|need|wish|should be able)\s*(?:to\s+)?(.+?)(?:\s*,?\s+so\s+that\s+(.+))?$/i;

const GWT_RE = /^(given|when|then|and|but)\b[\s:,-]*(.*)$/i;

/** Given/When/Then accumulates across lines before it becomes a Scenario. */
interface PendingScenario {
  given?: string;
  when?: string;
  then?: string;
  lines: string[];
}

/**
 * Parse user stories, with their scenarios attached to the story above them.
 *
 * A story owns every scenario line until the next story or the next heading.
 * That is the rule students are taught, and matching it means the document they
 * wrote is the document the generator reads.
 */
export function parseStories(markdown: string): UserStory[] {
  const lines = joinWrappedLines(markdown).split(/\r?\n/);
  const stories: UserStory[] = [];
  let current: UserStory | null = null;
  let heading = "";
  let pending: PendingScenario = { lines: [] };

  const flushGwt = () => {
    if (!current || pending.lines.length === 0) {
      pending = { lines: [] };
      return;
    }
    current.scenarios.push({
      given: pending.given,
      when: pending.when,
      then: pending.then,
      raw: pending.lines.join(" "),
    });
    pending = { lines: [] };
  };

  for (const raw of lines) {
    const line = raw.trim();
    const hashed = line.match(/^(#{1,6})\s+(.*)$/);
    const bold = hashed ? null : boldHeading(line);
    if (hashed || bold) {
      flushGwt();
      const text = plainText(hashed ? hashed[2] : (bold as string));
      // A heading naming a story or a scenario is chrome, not a feature name.
      if (!/^(user )?stor(y|ies)|^scenario|^acceptance/i.test(text)) heading = text;
      current = null;
      continue;
    }

    if (!line) continue;

    const text = plainText(line);
    if (!text) continue;

    const story = text.match(STORY_RE);
    if (story) {
      flushGwt();
      current = {
        id: `S${stories.length + 1}`,
        role: story[1].trim().replace(/^(a|an|the)\s+/i, ""),
        want: titleCase(story[2].trim()),
        soThat: story[3] ? story[3].trim().replace(/[.]+$/, "") : undefined,
        scenarios: [],
        featureHint: heading || undefined,
        raw: text,
      };
      stories.push(current);
      continue;
    }

    if (!current) continue;

    const gwt = text.match(GWT_RE);
    if (gwt) {
      const keyword = gwt[1].toLowerCase();
      const body = gwt[2].trim();
      if (keyword === "given") {
        flushGwt();
        pending.given = body;
      } else if (keyword === "when") {
        if (pending.when) flushGwt();
        pending.when = body;
      } else if (keyword === "then") {
        pending.then = pending.then ? `${pending.then}, ${body}` : body;
      } else {
        // "And" or "But" extends whichever clause was last written.
        if (pending.then) pending.then = `${pending.then}, ${body}`;
        else if (pending.when) pending.when = `${pending.when}, ${body}`;
        else if (pending.given) pending.given = `${pending.given}, ${body}`;
      }
      pending.lines.push(text);
      continue;
    }

    // A plain bullet under a story is acceptance criteria written informally.
    flushGwt();
    current.scenarios.push({ raw: text });
  }
  flushGwt();

  return stories;
}

/**
 * Parse a team's whole folder.
 *
 * Stories may live in their own file or at the bottom of the plan, so stories
 * found in the plan are kept when the stories file is absent or empty.
 */
export function parseTeamDocs(input: {
  planMarkdown: string;
  storiesMarkdown?: string;
  fallbackName?: string;
}): { brief: ProductBrief; stories: UserStory[] } {
  const brief = parseBrief(input.planMarkdown, input.fallbackName);
  const fromStoriesFile = input.storiesMarkdown ? parseStories(input.storiesMarkdown) : [];
  const stories = fromStoriesFile.length > 0 ? fromStoriesFile : parseStories(input.planMarkdown);
  return { brief, stories };
}
