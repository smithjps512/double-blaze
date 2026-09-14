/**
 * The design review: a team's Figma file read against their own documents.
 *
 * The handover page tells a designer that a story and a screen are linked by
 * a name: card title to page name, brief form to frame name, brief component
 * to layer name. This module is the other half of that promise. Given an
 * outline of the file (pages, frames, layer names, text) it says where the
 * names agree and where they do not, in the order a designer should fix them.
 *
 * Same rules as the gap guide. Every finding comes from two things
 * disagreeing, so it can be checked and it gets shorter as they work. Nothing
 * here says whether the design is any good; that is a conversation with
 * people, and the page says so.
 *
 * The outline is a plain shape so it can come from anywhere: the Figma
 * connector's metadata, a plugin export, or a test. Nothing here talks to
 * Figma.
 */

import type { BuildCard } from "./cards";
import type { DesignComponent, DesignSpec } from "./design";
import type { UserStory } from "./types";

export interface FigmaFrame {
  /** The frame's name as written in Figma, e.g. "Builder / empty". */
  name: string;
  /** Every layer name inside it, at any depth. */
  layers: string[];
  /** The text on it: text layer names and, where known, their content. */
  texts: string[];
}

export interface FigmaPage {
  name: string;
  frames: FigmaFrame[];
}

export interface FigmaOutline {
  fileName?: string;
  pages: FigmaPage[];
}

export type ReviewLevel = "blocking" | "soon" | "later";

export interface ReviewFinding {
  level: ReviewLevel;
  /** What disagrees, in one line. */
  title: string;
  /** Why it matters. */
  why: string;
  /** What to do about it. */
  fix?: string;
  /** Where in the file. */
  where?: string;
}

export interface ScreenReview {
  form: string;
  /** Frames found for it, by full name. */
  frames: string[];
  states: { empty: boolean; error: boolean; full: boolean };
  missingComponents: string[];
  strayLayers: string[];
}

export interface DesignReview {
  findings: ReviewFinding[];
  done: string[];
  screens: ScreenReview[];
  /** Card title to the page that carries it, or null. */
  cardPages: Array<{ card: BuildCard; page: string | null }>;
  counts: { pages: number; frames: number; layers: number; components: number; matched: number };
}

/* ------------------------------------------------------------ small readers */

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const tight = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** "Builder / empty" -> { base: "Builder", state: "empty" }. */
export function splitFrameName(name: string): { base: string; state?: string } {
  const m = name.match(/^(.*?)\s*[/·|:-]\s*(empty|error|full|wrong|filled|loading|default)\s*$/i);
  if (!m) return { base: name.trim() };
  const state = m[2].toLowerCase();
  return { base: m[1].trim(), state: state === "wrong" ? "error" : state === "filled" ? "full" : state };
}

const KNOWN_PREFIX = /^(lbl|btn|txt|ta|dd|chk|rb|rp|img|dp|lnk|link|fl|dg|plot|cnv|card|fp)_[a-z0-9_]+$/i;
const DEFAULT_LAYER = /^(frame|rectangle|ellipse|group|text|vector|line|image|component|instance|polygon|star|section|union)(\s+\d+)?$/i;
const PLACEHOLDER = /lorem|ipsum|placeholder|^item\s*\d*$|^label$|^button$|^text$|^heading$|^title$|^body text$/i;

function flatten(components: DesignComponent[]): string[] {
  return components.flatMap((c) => [c.name, ...flatten(c.children)]);
}

function isCover(pageName: string): boolean {
  return /^(cover|about|start|read me|readme|intro)\b/i.test(pageName.trim());
}

/** A page carries a card when its name holds the card's number or its title. */
function pageForCard(pages: FigmaPage[], card: BuildCard): FigmaPage | undefined {
  const title = norm(card.title);
  const byTitle = pages.find((p) => norm(p.name).includes(title));
  if (byTitle) return byTitle;
  const re = new RegExp(`\\bcard\\s*0*${card.number}\\b`, "i");
  return pages.find((p) => re.test(p.name));
}

function numbersIn(text: string): string[] {
  return text.match(/\b\d{1,3}(?:,\d{3})+\b|\b\d{4,}\b|\b\d+(?:\.\d+)?%/g) ?? [];
}

/* -------------------------------------------------------------- the review */

export function reviewDesign(input: {
  spec: DesignSpec;
  cards: BuildCard[];
  stories: UserStory[];
  /** Plan and stories text, for checking whether a number on a frame is real. */
  documentsText?: string;
  outline: FigmaOutline;
}): DesignReview {
  const { spec, cards, outline } = input;
  const findings: ReviewFinding[] = [];
  const done: string[] = [];
  const add = (f: ReviewFinding) => findings.push(f);

  const pages = outline.pages;
  const allFrames = pages.flatMap((p) => p.frames.map((f) => ({ ...f, page: p.name })));
  const totalLayers = allFrames.reduce((n, f) => n + f.layers.length, 0);

  // --- Nothing to read ------------------------------------------------------
  if (pages.length === 0 || allFrames.length === 0) {
    add({
      level: "blocking",
      title: "The file has no frames on any page.",
      why: "A review reads frames against your brief. With none there is nothing to compare, and nothing for a builder to build from.",
      fix: "Draw one frame per screen in your design brief, named exactly as the brief names it, then share the file again.",
    });
  }

  // --- Cover ----------------------------------------------------------------
  const cover = pages.find((p) => isCover(p.name));
  if (cover) done.push("There is a Cover page.");
  else if (pages.length > 0) {
    add({
      level: "later",
      title: "There is no Cover page.",
      why: "The cover is where your colours and fonts live as hex codes and names, which is the only form they can cross into Anvil in.",
      fix: "Add a first page called Cover: product name, team name, one sentence, hex codes, fonts. No student names.",
    });
  }

  // --- Cards and pages ------------------------------------------------------
  const cardPages = cards.map((card) => ({ card, page: pageForCard(pages, card)?.name ?? null }));
  const uncarded = cardPages.filter((c) => !c.page);
  if (cards.length > 0) {
    if (uncarded.length === 0) {
      done.push(`Every one of your ${cards.length} build cards has a page.`);
    } else {
      add({
        level: "blocking",
        title:
          uncarded.length === cards.length
            ? "No page is named after a build card."
            : `${uncarded.length} of your ${cards.length} build cards ${uncarded.length === 1 ? "has" : "have"} no page: ${uncarded.map((c) => `Card ${c.card.number}`).join(", ")}.`,
        why: "The page is the link between a story and a design. A card with no page is a feature nobody has drawn, or a drawing nobody can trace back to a story.",
        fix: "One page per card, named exactly like the card: \"Card 3 · Horsepower builder\". Move the frames for that story on to it.",
        where: uncarded.map((c) => c.card.title).join(", "),
      });
    }
  }
  const strayPages = pages.filter((p) => !isCover(p.name) && !cardPages.some((c) => c.page === p.name));
  if (strayPages.length > 0 && cards.length > 0) {
    add({
      level: "later",
      title: `${strayPages.length} ${strayPages.length === 1 ? "page is" : "pages are"} not named after a card: ${strayPages.map((p) => p.name).join(", ")}.`,
      why: "Anything on a page with no card is either scratch work, which is fine, or a feature that is not on a story, which will not get built.",
      fix: "Rename it after its card, or call it Scratch so everybody knows.",
    });
  }

  // --- Screens and frames ---------------------------------------------------
  const screens: ScreenReview[] = spec.screens.map((screen) => {
    const mine = allFrames.filter((f) => tight(splitFrameName(f.name).base) === tight(screen.form));
    const states = {
      empty: mine.some((f) => splitFrameName(f.name).state === "empty"),
      error: mine.some((f) => splitFrameName(f.name).state === "error"),
      full: mine.some((f) => splitFrameName(f.name).state === "full"),
    };
    const wanted = flatten(screen.components);
    const layerSet = new Set(mine.flatMap((f) => f.layers.map((l) => l.trim().toLowerCase())));
    const missingComponents = wanted.filter((w) => !layerSet.has(w.toLowerCase()));
    // Only the good-day frame is held to the brief's names. An empty or error
    // state adds a label the brief may not list, and that is the point of it.
    const known = new Set(wanted.map((w) => w.toLowerCase()));
    const strayLayers = [...new Set(mine.filter((f) => !splitFrameName(f.name).state).flatMap((f) => f.layers))].filter(
      (l) => KNOWN_PREFIX.test(l.trim()) && !known.has(l.trim().toLowerCase()),
    );
    return { form: screen.form, frames: mine.map((f) => f.name), states, missingComponents, strayLayers };
  });

  const drawn = screens.filter((s) => s.frames.length > 0);
  const undrawn = screens.filter((s) => s.frames.length === 0);
  if (spec.screens.length > 0) {
    if (undrawn.length === 0) done.push(`Every screen in your brief has a frame: ${drawn.map((s) => s.form).join(", ")}.`);
    else {
      add({
        level: "blocking",
        title:
          undrawn.length === spec.screens.length
            ? "No frame is named after a screen in your brief."
            : `${undrawn.length} ${undrawn.length === 1 ? "screen has" : "screens have"} no frame: ${undrawn.map((s) => s.form).join(", ")}.`,
        why: "Your builders create one Form per screen with exactly these names. A frame with a different name is a screen they cannot find, and a screen with no frame is one they will invent.",
        fix: "Name each frame exactly as the brief does, capital letters and all. States go after a slash: Builder / empty.",
        where: undrawn.map((s) => s.form).join(", "),
      });
    }
  }
  // Frames on the Cover page are the cover, not screens.
  const unknownFrames = [
    ...new Set(allFrames.filter((f) => !isCover(f.page)).map((f) => splitFrameName(f.name).base)),
  ].filter((base) => !spec.screens.some((s) => tight(s.form) === tight(base)));
  if (unknownFrames.length > 0 && spec.screens.length > 0) {
    add({
      level: "soon",
      title: `${unknownFrames.length} ${unknownFrames.length === 1 ? "frame is" : "frames are"} not a screen in your brief: ${unknownFrames.slice(0, 6).join(", ")}${unknownFrames.length > 6 ? ", and more" : ""}.`,
      why: "A frame nobody can match to a form is either a screen with the wrong name, or a screen your architecture does not have yet.",
      fix: "If it is one of your screens, rename it to match the brief. If it is new, it belongs on the architecture page first, through your builders.",
    });
  }

  // --- States ---------------------------------------------------------------
  const noEmpty = drawn.filter((s) => !s.states.empty);
  const noError = drawn.filter((s) => !s.states.error);
  if (drawn.length > 0) {
    if (noEmpty.length === 0 && noError.length === 0) done.push("Every drawn screen has an empty state and an error state.");
    if (noEmpty.length > 0) {
      add({
        level: "soon",
        title: `${noEmpty.length} ${noEmpty.length === 1 ? "screen has" : "screens have"} no empty state: ${noEmpty.map((s) => s.form).join(", ")}.`,
        why: "On the first day your app is real, the empty state is the only state anybody sees.",
        fix: "Duplicate the frame, name it \"Form / empty\", and draw what the screen says when nothing has been added yet.",
      });
    }
    if (noError.length > 0) {
      add({
        level: "soon",
        title: `${noError.length} ${noError.length === 1 ? "screen has" : "screens have"} no error state: ${noError.map((s) => s.form).join(", ")}.`,
        why: "Most briefs have an lbl_error. It exists. Nobody has decided what it looks like, so the builder decides at speed, and it shows.",
        fix: "Duplicate the frame, name it \"Form / error\", and draw the app refusing something.",
      });
    }
  }

  // --- Names ----------------------------------------------------------------
  const componentsWanted = spec.screens.reduce((n, s) => n + flatten(s.components).length, 0);
  const missingTotal = drawn.reduce((n, s) => n + s.missingComponents.length, 0);
  const matched = drawn.reduce((n, s) => n + (flatten(spec.screens.find((x) => x.form === s.form)?.components ?? []).length - s.missingComponents.length), 0);
  if (drawn.length > 0) {
    if (missingTotal === 0) done.push(`Every component in your brief is a named layer in its frame (${matched} of them).`);
    else {
      const worst = [...drawn].filter((s) => s.missingComponents.length > 0).sort((a, b) => b.missingComponents.length - a.missingComponents.length);
      add({
        level: "soon",
        title: `${missingTotal} ${missingTotal === 1 ? "component from your brief is" : "components from your brief are"} not layers in their frames. ${worst[0].form} is missing ${worst[0].missingComponents.slice(0, 4).join(", ")}${worst[0].missingComponents.length > 4 ? ", and more" : ""}.`,
        why: "The layer name is how a builder finds their component in your design. A layer called Rectangle 47 tells them nothing; one called lbl_total_hp tells them which line draws it.",
        fix: "Select the layer, rename it to the brief's name, exactly. Ten minutes a screen.",
        where: worst.map((s) => `${s.form}: ${s.missingComponents.join(", ")}`).join("; "),
      });
    }
    const strays = drawn.flatMap((s) => s.strayLayers.map((l) => `${l} on ${s.form}`));
    if (strays.length > 0) {
      add({
        level: "soon",
        title: `${strays.length} ${strays.length === 1 ? "layer has" : "layers have"} a component name that is not in your brief: ${strays.slice(0, 5).join(", ")}${strays.length > 5 ? ", and more" : ""}.`,
        why: "Two names for one thing is how a team ends up with two of it. Either the design or the architecture is wrong, and only your builders can say which.",
        fix: "Check the brief. If the brief is right, rename the layer. If the design is right, the architecture page needs the new name first.",
      });
    }
  }
  const defaults = allFrames.flatMap((f) => f.layers.filter((l) => DEFAULT_LAYER.test(l.trim())));
  if (defaults.length > 0) {
    add({
      level: "later",
      title: `${defaults.length} ${defaults.length === 1 ? "layer still has" : "layers still have"} Figma's default name: ${[...new Set(defaults)].slice(0, 3).join(", ")}${new Set(defaults).size > 3 ? ", and more" : ""}.`,
      why: "Decoration can keep its default name. Anything that will be built cannot.",
      fix: "Rename the ones that are components. Leave the rest, or delete them if they are paint.",
    });
  }

  // --- Words and numbers ----------------------------------------------------
  const texts = allFrames.flatMap((f) => f.texts.map((t) => ({ text: t.trim(), frame: f.name })));
  const placeholders = texts.filter((t) => PLACEHOLDER.test(t.text));
  if (placeholders.length > 0) {
    add({
      level: "soon",
      title: `${placeholders.length} ${placeholders.length === 1 ? "piece of text is" : "pieces of text are"} placeholder: ${[...new Set(placeholders.map((p) => `"${p.text.slice(0, 24)}"`))].slice(0, 4).join(", ")}.`,
      why: "Fake content hides every problem a design has, because fake content is always the perfect length.",
      fix: "Replace it with the real words from your stories and your plan.",
      where: [...new Set(placeholders.map((p) => p.frame))].join(", "),
    });
  }
  const documents = (input.documentsText ?? "").toLowerCase();
  const madeUp = [...new Set(texts.flatMap((t) => numbersIn(t.text)))].filter((n) => !documents.includes(n.toLowerCase()));
  if (madeUp.length > 0) {
    add({
      level: "soon",
      title: `${madeUp.length} ${madeUp.length === 1 ? "number on the frames is" : "numbers on the frames are"} not in your documents: ${madeUp.slice(0, 5).join(", ")}${madeUp.length > 5 ? ", and more" : ""}.`,
      why: "A design tool fills space with plausible numbers, and plausible is worse than blank because nobody notices it is fake until it is in the app.",
      fix: "Replace each one with a real number, or delete it. If it is real, put it in your plan so the next review knows.",
    });
  }
  if (texts.length > 0 && placeholders.length === 0 && madeUp.length === 0) done.push("The words and numbers on the frames are real, or come from your documents.");

  // --- Order ------------------------------------------------------------------
  const WEIGHT: Record<ReviewLevel, number> = { blocking: 0, soon: 1, later: 2 };
  findings.sort((a, b) => WEIGHT[a.level] - WEIGHT[b.level]);

  return {
    findings,
    done,
    screens,
    cardPages,
    counts: { pages: pages.length, frames: allFrames.length, layers: totalLayers, components: componentsWanted, matched },
  };
}

/* ------------------------------------------------------------------ the page */

export interface DesignReviewMeta {
  productName: string;
  teamName?: string;
  /** YYYY-MM-DD. */
  reviewedOn: string;
  /** Form name to a picture path relative to the team folder, when frames were exported. */
  pictures?: Record<string, string>;
}

const LEVEL_LABEL: Record<ReviewLevel, string> = {
  blocking: "Do this first",
  soon: "Then this",
  later: "When you have a minute",
};

export function renderDesignReview(review: DesignReview, meta: DesignReviewMeta): string {
  const out: string[] = [];
  out.push(`# ${meta.productName}: design review`);
  out.push("");
  if (meta.teamName) {
    out.push(`Team: ${meta.teamName}.`);
    out.push("");
  }
  out.push(`Reviewed: ${meta.reviewedOn}`);
  out.push("");
  out.push(
    `Your Figma file, read against your own design brief, build cards and stories. ${review.counts.pages} ${review.counts.pages === 1 ? "page" : "pages"}, ${review.counts.frames} ${review.counts.frames === 1 ? "frame" : "frames"}, ${review.counts.layers} layers. Every line below is two of your documents disagreeing, so it can be checked, and it gets shorter as you fix things. It does not say whether the design is any good. That is a conversation with people.`,
  );
  out.push("");
  out.push("The rules it checks are on [Handing over your design](/build/handover.html).");
  out.push("");

  const first = review.findings[0];
  if (first) {
    out.push("## The one next thing");
    out.push("");
    out.push(`**${first.title}**`);
    out.push("");
    out.push(first.why);
    if (first.fix) {
      out.push("");
      out.push(`**Do this:** ${first.fix}`);
    }
    out.push("");
  } else {
    out.push("## Nothing disagrees");
    out.push("");
    out.push("Every check this page knows how to make passes. That is the design that gets built for demo day, in the colours and the shape you drew.");
    out.push("");
  }

  for (const level of ["blocking", "soon", "later"] as ReviewLevel[]) {
    const mine = review.findings.filter((f) => f.level === level);
    if (mine.length === 0) continue;
    out.push(`## ${LEVEL_LABEL[level]}`);
    out.push("");
    for (const f of mine) {
      out.push(`**${f.title}**`);
      out.push("");
      out.push(f.why);
      if (f.fix) {
        out.push("");
        out.push(`**Fix:** ${f.fix}`);
      }
      if (f.where) {
        out.push("");
        out.push(`*Where:* ${f.where}`);
      }
      out.push("");
    }
  }

  if (review.cardPages.length > 0) {
    out.push("## Cards and pages");
    out.push("");
    out.push("| Card | Page |");
    out.push("|---|---|");
    for (const c of review.cardPages) {
      out.push(`| Card ${c.card.number}: ${c.card.title} | ${c.page ?? "none"} |`);
    }
    out.push("");
  }

  if (review.screens.length > 0) {
    out.push("## Screens");
    out.push("");
    out.push("| Screen | Frames | Empty | Error | Components found |");
    out.push("|---|---|---|---|---|");
    for (const s of review.screens) {
      out.push(
        `| \`${s.form}\` | ${s.frames.length === 0 ? "none" : s.frames.join(", ")} | ${s.frames.length === 0 ? "" : s.states.empty ? "yes" : "no"} | ${s.frames.length === 0 ? "" : s.states.error ? "yes" : "no"} | ${s.frames.length === 0 ? "" : s.missingComponents.length === 0 ? "all" : `missing ${s.missingComponents.length}`} |`,
      );
    }
    out.push("");
  }

  if (meta.pictures && Object.keys(meta.pictures).length > 0) {
    out.push("## What was read");
    out.push("");
    out.push("The frames as they were on the day of the review. If the file has moved on, share it again and this page catches up.");
    out.push("");
    for (const [form, path] of Object.entries(meta.pictures)) {
      out.push(`![${form}](${path})`);
      out.push("");
    }
  }

  if (review.done.length > 0) {
    out.push("## What is already right");
    out.push("");
    for (const d of review.done) out.push(`- ${d}`);
    out.push("");
  }

  out.push("## When the review is clean");
  out.push("");
  out.push("Share the file again from your design brief page and the next review reads the new version. When nothing disagrees, your design is the one that gets built for demo day.");
  out.push("");
  return out.join("\n");
}

/* -------------------------------------------------- outline from metadata */

/**
 * An outline from the connector's metadata XML, one document per page.
 *
 * The XML is a tree of nodes with a name and a type. The reader is tolerant:
 * any element counts as a node, its type is the `type` attribute or the tag,
 * its name is the `name` attribute. Frames are the page's direct children of a
 * frame-like type; layers are everything inside them; text is any node whose
 * type says so, by its name (Figma names a text layer after its content) and
 * its `characters` attribute when the export carries one.
 */
export function outlineFromMetadata(pages: Array<{ pageName: string; xml: string }>): FigmaOutline {
  interface Node {
    tag: string;
    attrs: Record<string, string>;
    children: Node[];
  }

  const parse = (xml: string): Node => {
    const root: Node = { tag: "root", attrs: {}, children: [] };
    const stack: Node[] = [root];
    const re = /<\/([A-Za-z_][\w:.-]*)\s*>|<([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      if (m[1]) {
        if (stack.length > 1) stack.pop();
        continue;
      }
      const attrs: Record<string, string> = {};
      const attrRe = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let a: RegExpExecArray | null;
      while ((a = attrRe.exec(m[3] ?? "")) !== null) attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? "");
      const node: Node = { tag: m[2], attrs, children: [] };
      stack[stack.length - 1].children.push(node);
      if (!m[4]) stack.push(node);
    }
    return root;
  };

  const decode = (s: string): string =>
    s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

  const typeOf = (n: Node): string => (n.attrs.type ?? n.tag).toLowerCase();
  const nameOf = (n: Node): string => n.attrs.name ?? "";
  const isFrameLike = (n: Node): boolean => /frame|section|component|instance|group/.test(typeOf(n));
  const isText = (n: Node): boolean => /text/.test(typeOf(n));

  const descend = (n: Node, layers: string[], texts: string[]) => {
    for (const c of n.children) {
      if (nameOf(c)) layers.push(nameOf(c));
      if (isText(c)) {
        const content = c.attrs.characters ?? c.attrs.text ?? c.attrs.content;
        if (content) texts.push(content);
        else if (nameOf(c)) texts.push(nameOf(c));
      }
      descend(c, layers, texts);
    }
  };

  return {
    pages: pages.map(({ pageName, xml }) => {
      const root = parse(xml);
      // The page node may be the root's only child, or the root may hold the
      // frames directly. Take whichever level first holds frame-like nodes.
      let level: Node[] = root.children;
      while (level.length === 1 && !isFrameLike(level[0]) && level[0].children.length > 0) level = level[0].children;
      if (level.length === 1 && /page|canvas|document/.test(typeOf(level[0]))) level = level[0].children;
      const frames: FigmaFrame[] = level
        .filter((n) => isFrameLike(n) && nameOf(n))
        .map((n) => {
          const layers: string[] = [];
          const texts: string[] = [];
          descend(n, layers, texts);
          return { name: nameOf(n), layers, texts };
        });
      return { name: pageName, frames };
    }),
  };
}
