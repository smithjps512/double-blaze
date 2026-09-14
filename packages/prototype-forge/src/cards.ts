/**
 * Build cards as data, and a build card from a story.
 *
 * Until now the cards page was a blob: written by hand with the team, rendered
 * verbatim, and counted by a regex. That was fine while a teacher was the only
 * thing that ever changed it. It stops being fine the moment a story changes
 * and the card is expected to follow, or a student is expected to tick a box
 * on it and have the tick mean something.
 *
 * So this module reads the cards the way `parse.ts` reads the stories, and
 * writes one the way `story-kit.ts` writes a story. Same rules as everywhere
 * else in this package: no model, nothing invented, and a card that came from
 * a story carries that story's own words and nothing else.
 *
 * What a card is, on the page:
 *
 *   ## Card 3: Horsepower builder
 *
 *   **Your story.** As somebody who wants a faster car, I want ...
 *
 *   **Done when:**
 *   - [ ] You start with a stock engine and a starting horsepower number
 *   - [ ] Every upgrade you pick adds horsepower
 *
 *   **Build it:** Architecture, Feature 3.
 *
 * Everything else in the block (a teacher's note, a paragraph about why this
 * one goes last) is kept as prose and put back untouched when the card is
 * rewritten from its story. The story and the finish line are the story's to
 * change. The advice is the teacher's.
 */

import { slugify } from "./parse";
import type { UserStory } from "./types";
import { suggestPatterns } from "./story-kit";

export interface BuildCard {
  /** The N in `Card N:`, or the card's position when the heading has none. */
  number: number;
  /** The heading text after the number, e.g. "Horsepower builder". */
  title: string;
  /** The full heading text as written, e.g. "Card 3: Horsepower builder". */
  heading: string;
  /**
   * Stable key for this card, used by the progress board. Made from the title
   * rather than the number, because a teacher renumbering cards should not
   * untick a team's boxes.
   */
  slug: string;
  /** The sentence after **Your story.**, joined onto one line. */
  story?: string;
  /** The **Done when:** items, without the checkbox. */
  criteria: string[];
  /** Which of those items were already ticked in the file. */
  checked: boolean[];
  /** The **Build it:** line, when there is one. */
  buildIt?: string;
  /** The whole block, heading included, exactly as written. */
  raw: string;
}

const CARD_HEADING = /^(?:card\s*(\d+)\s*[:.)-]\s*)?(.+?)\s*$/i;

/** Split a cards document into its `##` blocks. Prose before the first is preamble. */
function blocks(markdown: string): Array<{ heading: string; lines: string[]; start: number; end: number }> {
  const lines = markdown.split(/\r?\n/);
  const out: Array<{ heading: string; lines: string[]; start: number; end: number }> = [];
  let current: { heading: string; lines: string[]; start: number; end: number } | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^##\s+(.*)$/);
    if (m) {
      if (current) {
        current.end = i;
        out.push(current);
      }
      current = { heading: m[1].trim(), lines: [], start: i, end: lines.length };
      continue;
    }
    if (current) current.lines.push(lines[i]);
  }
  if (current) out.push(current);
  return out;
}

/** Rejoin a paragraph that wraps across lines, the way the story parser does. */
function paragraphAfter(lines: string[], marker: RegExp): string | undefined {
  const start = lines.findIndex((l) => marker.test(l));
  if (start === -1) return undefined;
  const first = lines[start].replace(marker, "").trim();
  const rest: string[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const l = lines[i];
    if (!l.trim() || /^\s*[-*]\s/.test(l) || /^\*\*/.test(l.trim()) || /^#/.test(l)) break;
    rest.push(l.trim());
  }
  const joined = [first, ...rest].join(" ").replace(/\s+/g, " ").trim();
  return joined || undefined;
}

/**
 * Read every card on the page.
 *
 * Only `## Card N:` headings count, plus any `##` heading whose block contains a
 * **Done when:** list, so a team that dropped the word "Card" still gets their
 * cards read. A heading with neither is a note, and notes are not cards.
 */
export function parseCards(markdown: string): BuildCard[] {
  const cards: BuildCard[] = [];
  let position = 0;
  for (const b of blocks(markdown)) {
    const m = b.heading.match(CARD_HEADING);
    if (!m) continue;
    const numbered = m[1] !== undefined;
    const hasDoneWhen = b.lines.some((l) => /^\*\*done when/i.test(l.trim()));
    if (!numbered && !hasDoneWhen) continue;
    position += 1;

    const criteria: string[] = [];
    const checked: boolean[] = [];
    let inDone = false;
    for (const line of b.lines) {
      if (/^\*\*done when/i.test(line.trim())) {
        inDone = true;
        continue;
      }
      if (!inDone) continue;
      const item = line.match(/^\s*[-*]\s+(?:\[([ xX])\]\s+)?(.*)$/);
      if (item) {
        criteria.push(item[2].trim().replace(/\.$/, ""));
        checked.push((item[1] ?? " ").toLowerCase() === "x");
        continue;
      }
      if (line.trim()) inDone = false;
    }

    const title = m[2].trim();
    cards.push({
      number: numbered ? Number(m[1]) : position,
      title,
      heading: b.heading,
      slug: slugify(title),
      story: paragraphAfter(b.lines, /^\*\*your story\.?\*\*\s*/i),
      criteria,
      checked,
      buildIt: paragraphAfter(b.lines, /^\*\*build it:?\*\*\s*/i),
      raw: markdown
        .split(/\r?\n/)
        .slice(b.start, b.end)
        .join("\n")
        .replace(/\s+$/, ""),
    });
  }
  return cards;
}

/** The story's own sentence, the way a card quotes it. Their words, one line. */
export function storySentence(story: Pick<UserStory, "raw">): string {
  return `${story.raw.trim().replace(/\s+/g, " ").replace(/\.+$/, "")}.`;
}

/** The plain-bullet criteria on a story, which is what a card's finish line is. */
export function criteriaOf(story: Pick<UserStory, "scenarios">): string[] {
  return story.scenarios
    .filter((s) => !s.when && !s.then)
    .map((s) => s.raw.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

/** A story's Then lines, which become criteria when it has no bullets of its own. */
function thenLines(story: Pick<UserStory, "scenarios">): string[] {
  return story.scenarios
    .filter((s) => s.then)
    .map((s) => (s.then as string).trim().replace(/\.$/, ""))
    .map((t) => (/^[A-Z]/.test(t) ? t : t[0].toUpperCase() + t.slice(1)));
}

/**
 * Two sentences that say the same thing, allowing for the things a human
 * changes without meaning to: case, spacing, a trailing full stop, a straight
 * quote turned curly.
 */
export function sameSentence(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return normalise(a) === normalise(b);
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set([
  "a", "an", "the", "and", "or", "to", "of", "in", "on", "at", "is", "are", "be", "it", "its",
  "i", "you", "your", "my", "we", "our", "they", "their", "so", "that", "as", "can", "will",
  "for", "with", "by", "when", "then", "given", "this", "these", "there", "up", "into", "from",
]);

function words(s: string): Set<string> {
  return new Set(normalise(s).split(" ").filter((w) => w && !STOP.has(w)));
}

/**
 * Two sentences that mean the same thing, allowing for a teacher's tidy.
 *
 * The hand-written cards say "your parts pages" where the story says "the
 * parts pages", and "the number goes back down" where the story stops at
 * "back off". Those are the same finish line. A story a team rewrote in the
 * studio shares almost no words with the card it left behind, and that is the
 * drift worth naming. Word overlap tells the two apart; exact matching did not.
 */
export function similarSentence(a: string | undefined, b: string | undefined, threshold = 0.5): boolean {
  if (!a || !b) return false;
  if (sameSentence(a, b)) return true;
  const wa = words(a);
  const wb = words(b);
  if (wa.size === 0 || wb.size === 0) return false;
  let both = 0;
  for (const w of wa) if (wb.has(w)) both += 1;
  const union = wa.size + wb.size - both;
  return both / union >= threshold;
}

/** Which card belongs to a story: same title as the story's heading, or the same sentence. */
export function cardForStory(cards: BuildCard[], story: UserStory): BuildCard | undefined {
  const heading = story.featureHint?.trim().toLowerCase();
  if (heading) {
    const byTitle = cards.find((c) => c.title.trim().toLowerCase() === heading);
    if (byTitle) return byTitle;
  }
  return cards.find((c) => similarSentence(c.story, storySentence(story), 0.6));
}

export interface CardDrift {
  story: UserStory;
  card?: BuildCard;
  /**
   * How far apart they are. `story`: the sentence on the card is not the
   * story any more, which is the drift that matters. `criteria`: the card's
   * finish line does not list something the story does, which is often a
   * teacher leaving an untestable criterion off on purpose. `missing`: no card.
   */
  severity: "story" | "criteria" | "missing";
  /** What no longer matches, in a sentence a student can check. */
  reason: string;
}

/**
 * Where the cards and the stories disagree.
 *
 * This replaces the old date stamp. A date said "something changed since";
 * this says which card, and what about it, and it goes away by itself when the
 * card is fixed, which a date never could.
 */
export function cardDrift(stories: UserStory[], cards: BuildCard[]): CardDrift[] {
  const out: CardDrift[] = [];
  for (const story of stories) {
    const card = cardForStory(cards, story);
    if (!card) {
      out.push({ story, severity: "missing", reason: "has no build card" });
      continue;
    }
    // Loose on purpose. A card found by its heading is the right card, and a
    // teacher's tidy of the sentence can change half the words ("somebody who
    // gets hold of the password" for "students who get hold of the password").
    // A story rewritten in the studio shares almost none.
    if (card.story && !similarSentence(card.story, storySentence(story), 0.35)) {
      out.push({ story, card, severity: "story", reason: `the story on Card ${card.number} is not the story in your stories file any more` });
      continue;
    }
    const wanted = criteriaOf(story);
    if (wanted.length > 0) {
      const missing = wanted.filter((w) => !card.criteria.some((c) => similarSentence(c, w)));
      if (missing.length > 0) {
        out.push({
          story,
          card,
          severity: "criteria",
          reason: `Card ${card.number} does not list ${missing.length === 1 ? "a criterion" : `${missing.length} criteria`} the story has: "${missing[0]}"`,
        });
      }
    }
  }
  return out;
}

/**
 * The card a story earns.
 *
 * Same shape as the cards written by hand, so a team cannot tell which of
 * their cards a teacher wrote and which arrived by themselves. The story
 * sentence and the finish line are the story's own. The pattern guess is the
 * same one the test plan makes, labelled as a guess in the same words.
 */
export function cardFromStory(
  story: UserStory,
  options: { number: number; title?: string; buildIt?: string; keepProse?: string[] } = { number: 1 },
): string {
  const title = (options.title ?? story.featureHint ?? story.want).trim();
  const criteria = criteriaOf(story);
  const finish = criteria.length > 0 ? criteria : thenLines(story);
  const patterns = suggestPatterns({
    criteria,
    scenarios: story.scenarios.filter((s) => s.when || s.then),
  });

  const out: string[] = [];
  out.push(`## Card ${options.number}: ${title}`);
  out.push("");
  out.push(`**Your story.** ${storySentence(story)}`);
  out.push("");
  out.push("**Done when:**");
  if (finish.length > 0) {
    for (const c of finish) out.push(`- [ ] ${c}`);
  } else {
    out.push("- [ ] Your story has no acceptance criteria yet, so this card has no finish line. Add them to the story and this list fills itself in.");
  }
  out.push("");
  out.push(`**Build it:** ${options.buildIt ?? "Architecture. Ask your teacher which feature number, then put it here."}`);
  out.push("");
  if (patterns.length > 0) {
    out.push(
      `**Patterns this probably needs:** ${patterns.map((p) => `**${p.pattern}** (${p.name})`).join(", ")}. A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.`,
    );
    out.push("");
  }
  for (const p of options.keepProse ?? []) {
    out.push(p.trim());
    out.push("");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/**
 * The prose in a card that is not the story, the finish line, or the build
 * line: a teacher's note, a paragraph about why this one is last. Kept when
 * the card is rewritten, because it is the one part of the card that was not
 * derived from the story and cannot be got back.
 */
export function proseOf(card: BuildCard): string[] {
  const lines = card.raw.split(/\r?\n/).slice(1);
  const paras: string[] = [];
  let buf: string[] = [];
  let skipping = false;
  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) paras.push(text);
    buf = [];
  };
  for (const line of lines) {
    const t = line.trim();
    if (/^\*\*(your story|done when|build it|patterns this probably needs)/i.test(t)) {
      flush();
      skipping = true;
      continue;
    }
    if (skipping) {
      // A derived section runs until a blank line, and a Done when list runs
      // through its bullets.
      if (!t || /^\s*[-*]\s/.test(line)) {
        if (!t) skipping = false;
        continue;
      }
      // A wrapped continuation of the derived paragraph.
      continue;
    }
    if (!t) {
      flush();
      continue;
    }
    buf.push(line);
  }
  flush();
  return paras.filter((p) => p !== "---");
}

/**
 * Swap one card's block for a new one, found by the story it belongs to.
 *
 * The card keeps its number and its prose; the story sentence, the finish line
 * and the pattern guess are rewritten from the story. A card that cannot be
 * found is appended, numbered after the last one, because a new story with no
 * card is exactly the case that used to fall through the cracks.
 */
export function upsertCardForStory(
  markdown: string,
  story: UserStory,
): { markdown: string; action: "replaced" | "appended"; card: string } {
  const cards = parseCards(markdown);
  const existing = cardForStory(cards, story);

  if (existing) {
    const block = cardFromStory(story, {
      number: existing.number,
      title: existing.title,
      buildIt: existing.buildIt,
      keepProse: proseOf(existing),
    });
    const next = markdown.replace(existing.raw, block.trimEnd());
    return { markdown: next, action: "replaced", card: block };
  }

  const number = cards.reduce((max, c) => Math.max(max, c.number), 0) + 1;
  const block = cardFromStory(story, { number });
  const trimmed = markdown.replace(/\s+$/, "");
  const sep = trimmed ? "\n\n---\n\n" : "";
  return { markdown: `${trimmed}${sep}${block}`, action: "appended", card: block };
}

/**
 * A whole cards page for a team that has none, from every story they have.
 *
 * Deliberately plain. The hand-written pages open with a paragraph from the
 * teacher about the team, and that paragraph is the part worth having; this
 * one says only where the cards came from and what to do with them.
 */
export function cardsFromStories(
  stories: UserStory[],
  meta: { productName: string; teamName?: string },
): string {
  const out: string[] = [];
  out.push(`# ${meta.productName}: build cards`);
  out.push("");
  if (meta.teamName) {
    out.push(`Team: ${meta.teamName}.`);
    out.push("");
  }
  out.push(
    "One card per story, made from your stories file. Change a story and its card changes with it. Next stop: `build-architecture.md`. After that: `docs/build/anvil-patterns.md`.",
  );
  out.push("");
  stories.forEach((story, i) => {
    out.push("---");
    out.push("");
    out.push(cardFromStory(story, { number: i + 1 }).trimEnd());
    out.push("");
  });
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** Stamp the page with when a card last changed, for humans reading the file. */
export function stampCardUpdated(markdown: string, when = new Date()): string {
  const date = when.toISOString().slice(0, 10);
  if (/^Card updated:\s*\S+/m.test(markdown)) {
    return markdown.replace(/^Card updated:\s*\S+.*$/m, `Card updated: ${date}`);
  }
  if (/^Team:\s*.+$/m.test(markdown)) {
    return markdown.replace(/^(Team:\s*.+)$/m, `$1\n\nCard updated: ${date}`);
  }
  return markdown.replace(/^(#\s+.*)$/m, `$1\n\nCard updated: ${date}`);
}
