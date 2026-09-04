/**
 * The design brief: a team's build architecture, read back for the designers.
 *
 * The designers on these teams already like Figma and do not need a tutorial in
 * it. What none of them has been told is that their own coders have already
 * decided the name of every button on every screen. That is the whole idea
 * here: this page is generated from `build-architecture.md`, so a design brief
 * and the thing being built cannot drift apart. Change the architecture and
 * this changes with it; there is no second document to keep in sync.
 *
 * Pure, like the rest of this package: markdown in, markdown out.
 */

/** Anvil's naming convention, used consistently across every team's architecture. */
const PREFIX_TYPES: Record<string, string> = {
  lbl: "Label",
  btn: "Button",
  txt: "TextBox",
  ta: "TextArea",
  dd: "DropDown",
  chk: "CheckBox",
  rb: "RadioButton",
  rp: "RepeatingPanel",
  img: "Image",
  dp: "DatePicker",
  lnk: "Link",
  link: "Link",
  fl: "FileLoader",
  dg: "DataGrid",
  plot: "Plot",
  cnv: "Canvas",
  tmr: "Timer",
};

/**
 * What each Anvil component actually is on screen, and what a designer is free
 * to change about it.
 *
 * The limits are the useful half. A designer who draws a pill-shaped button
 * with a gradient has not made a mistake in Figma; they have made something the
 * builder cannot produce without writing CSS, which is not in this project. Say
 * that before they spend a period on it, not after.
 */
export interface PaletteEntry {
  /** What it looks like on the screen. */
  draws: string;
  /** What the builder can change to match a design. */
  youCanChange: string;
  /** What the builder cannot do without leaving the tools this class uses. */
  youCannot: string;
}

export const PALETTE: Record<string, PaletteEntry> = {
  Label: {
    draws: "A piece of text. It does not respond to clicks.",
    youCanChange: "The words, size, colour, bold or italic, alignment, and an icon beside it.",
    youCannot: "Make it a box with a border and a background of its own.",
  },
  Button: {
    draws: "A rectangular button with a label, and optionally an icon.",
    youCanChange: "The text, the icon, the text colour, the background colour, and the size.",
    youCannot: "Give it a custom shape, a gradient, or a hover animation.",
  },
  TextBox: {
    draws: "A single line box someone types into. Can show placeholder grey text.",
    youCanChange: "The placeholder text, the width, and whether it hides what is typed.",
    youCannot: "Put an icon or a button inside the box itself.",
  },
  TextArea: {
    draws: "A bigger box for several lines of typing.",
    youCanChange: "Its height and its placeholder text.",
    youCannot: "Format the text inside it as bold or coloured.",
  },
  DropDown: {
    draws: "A closed box showing one choice, which opens a list when clicked.",
    youCanChange: "The list of choices and the width.",
    youCannot: "Style the open list, or put pictures in the choices.",
  },
  CheckBox: {
    draws: "A small square that ticks, with a label beside it.",
    youCanChange: "The label text and the colour.",
    youCannot: "Turn it into a toggle switch.",
  },
  RadioButton: {
    draws: "A circle that fills in. Only one in a group can be chosen.",
    youCanChange: "The label text and which group it belongs to.",
    youCannot: "Make it look like a set of tabs or segmented buttons.",
  },
  RepeatingPanel: {
    draws: "One row design, repeated once for every row of data.",
    youCanChange: "Everything inside the one row.",
    youCannot: "Make row three look different from row one.",
  },
  Image: {
    draws: "A picture.",
    youCanChange: "Its size and how it is cropped or fitted.",
    youCannot: "Round its corners or add a border without CSS.",
  },
  DatePicker: {
    draws: "A box showing a date, which opens a calendar.",
    youCanChange: "The date format and the width.",
    youCannot: "Redesign the calendar that pops up.",
  },
  Link: {
    draws: "Clickable text, or a clickable icon.",
    youCanChange: "The text, the icon, and the colour.",
    youCannot: "Much else. If you want it to look like a button, use a Button.",
  },
  FileLoader: {
    draws: "A button that opens the file chooser.",
    youCanChange: "Its text and which file types it accepts.",
    youCannot: "Build a drag-and-drop area with a dashed outline.",
  },
  DataGrid: {
    draws: "A table with column headings.",
    youCanChange: "The column headings and widths.",
    youCannot: "Merge cells or colour individual ones.",
  },
  Plot: {
    draws: "A chart.",
    youCanChange: "The chart type and the colours.",
    youCannot: "Draw a chart shape that the chart library does not already have.",
  },
  Canvas: {
    draws: "A blank rectangle that code draws into.",
    youCanChange: "Anything, but only by writing drawing code for it.",
    youCannot: "Treat it as a normal screen area. It is a last resort.",
  },
  Timer: {
    draws: "Nothing. It is invisible and runs code on a schedule.",
    youCanChange: "Nothing to design here.",
    youCannot: "See it at all. Do not draw it.",
  },
};

export interface DesignComponent {
  name: string;
  type: string;
  /** True when the type came from the name prefix rather than the document. */
  inferredType: boolean;
  /** Anything in brackets after the type, like "starts invisible". */
  note?: string;
  /** For a RepeatingPanel: what sits inside the one repeated row. */
  children: DesignComponent[];
}

export interface DesignScreen {
  form: string;
  what: string;
  /** Only some teams' architectures have a "Who sees it" column. */
  audience?: string;
  components: DesignComponent[];
}

export interface DesignSpec {
  screens: DesignScreen[];
  /** Forms with components listed but no row in the screens table. */
  orphanForms: string[];
  /** Component types used by this team, in the order they first appear. */
  typesUsed: string[];
}

/** `| \`SignIn\` | Teacher signs in | Everyone |` and friends. */
function tableRows(body: string): string[][] {
  const rows: string[][] = [];
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    // The `|---|---|` separator and the header row are not data.
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
    rows.push(cells);
  }
  // Drop the header row, whatever it is called.
  return rows.length > 1 ? rows.slice(1) : [];
}

/** Everything under a `##` heading whose text matches, up to the next `##`. */
function section(markdown: string, heading: RegExp): string | undefined {
  const lines = markdown.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.*)$/);
    if (!m) continue;
    if (start >= 0) return lines.slice(start, i).join("\n");
    if (heading.test(m[1])) start = i + 1;
  }
  return start >= 0 ? lines.slice(start).join("\n") : undefined;
}

function stripTicks(s: string): string {
  return s.replace(/`/g, "").trim();
}

/** `dd_house` -> DropDown. Unknown prefixes are honest about it. */
function typeFromName(name: string): string {
  const prefix = name.split("_")[0]?.toLowerCase() ?? "";
  return PREFIX_TYPES[prefix] ?? "";
}

/** "(Label, starts invisible)" -> { type: "Label", note: "starts invisible" }. */
function readBracket(text: string): { type?: string; note?: string } {
  const inner = text.trim();
  if (!inner) return {};
  // The type comes first, then a note: "(Label, starts invisible)" and
  // "(DropDown: Heated, Chilled, Neither)" are both in use.
  const split = inner.search(/[,:]/);
  const head = (split >= 0 ? inner.slice(0, split) : inner).trim();
  const tail = split >= 0 ? inner.slice(split + 1).trim() : "";
  // "(Labels)" is one plural covering two components; normalise it.
  const singular = head.replace(/e?s$/, "");
  const known = Object.keys(PALETTE).find(
    (k) => k.toLowerCase() === head.toLowerCase() || k.toLowerCase() === singular.toLowerCase(),
  );
  if (known) return { type: known, note: tail || undefined };
  // No recognised type, so the whole bracket is a note.
  return { note: inner };
}

interface Found {
  name: string;
  type?: string;
  note?: string;
  at: number;
}

/** Every `` `name` `` in a run of text, with the bracket that follows it. */
function findComponents(text: string): Found[] {
  const out: Found[] = [];
  const re = /`([A-Za-z][A-Za-z0-9_]*)`\s*(?:\(([^)]*)\))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const { type, note } = readBracket(m[2] ?? "");
    out.push({ name: m[1], type, note, at: m.index });
  }
  return out;
}

/**
 * One run of text listing components, into a parent/child tree.
 *
 * The nesting matters more than it looks. "rp_messages (RepeatingPanel) with
 * lbl_message_line inside" is not three things on a screen, it is one row
 * design that Anvil stamps out once per row of data, and a designer who draws
 * five different-looking rows has drawn something nobody can build.
 *
 * The rule: the components after a "with" or "containing" belong to the last
 * component named before it. Everything before that is a sibling.
 */
function readRun(text: string): DesignComponent[] {
  const found = findComponents(text);
  if (found.length === 0) return [];

  const withAt = text.search(/\b(?:with|containing)\b/i);
  const build = (f: Found): DesignComponent => {
    const type = f.type ?? typeFromName(f.name);
    return {
      name: f.name,
      type: type || "Unknown",
      inferredType: !f.type && !!type,
      note: f.note,
      children: [],
    };
  };

  if (withAt < 0) return found.map(build);

  const before = found.filter((f) => f.at < withAt);
  const after = found.filter((f) => f.at > withAt);
  if (before.length === 0 || after.length === 0) return found.map(build);

  const parents = before.map(build);
  const parent = parents[parents.length - 1];
  parent.children = after.map(build);
  return parents;
}

/**
 * Read a team's `build-architecture.md`.
 *
 * Two shapes are in use across the teams, because they were written by hand
 * over several weeks: a bulleted list under a bold form name, and an inline
 * `**Form:** \`a\`, \`b\`` line. Both are parsed, because rewriting eleven
 * documents to please a parser is the wrong way round.
 */
export function parseArchitecture(markdown: string): DesignSpec {
  const screensBody = section(markdown, /^Screens?\b/i) ?? "";
  const componentsBody = section(markdown, /^Components\b/i) ?? "";

  const screens: DesignScreen[] = tableRows(screensBody).map((cells) => ({
    form: stripTicks(cells[0] ?? ""),
    what: cells[1] ?? "",
    audience: cells[2] || undefined,
    components: [],
  }));
  const byForm = new Map(screens.map((s) => [s.form.toLowerCase(), s]));

  const orphanForms: string[] = [];

  // Blocks are separated by blank lines in both shapes. Within a block, lines
  // are soft-wrapped, so a block is read as one run of text per bullet.
  for (const block of componentsBody.split(/\n\s*\n/)) {
    const text = block.trim();
    if (!text.startsWith("**")) continue;

    const head = text.match(/^\*\*([^*:]+?):?\*\*:?/);
    if (!head) continue;
    const form = head[1].trim();
    const rest = text.slice(head[0].length);

    // Bulleted shape: one run per bullet. Inline shape: one run per `;` group.
    const runs = /^\s*[-*]\s/m.test(rest)
      ? rest.split(/\n\s*[-*]\s+/).slice(1)
      : rest.split(";");

    const components: DesignComponent[] = [];
    for (const run of runs) components.push(...readRun(run.replace(/\s*\n\s*/g, " ")));

    const screen = byForm.get(form.toLowerCase());
    if (screen) {
      screen.components.push(...components);
    } else {
      orphanForms.push(form);
      screens.push({ form, what: "", components });
    }
  }

  const typesUsed: string[] = [];
  const walk = (list: DesignComponent[]) => {
    for (const c of list) {
      if (c.type !== "Unknown" && !typesUsed.includes(c.type)) typesUsed.push(c.type);
      walk(c.children);
    }
  };
  for (const s of screens) walk(s.components);

  return { screens, orphanForms, typesUsed };
}

export interface DesignBriefMeta {
  productName: string;
  teamName?: string;
  /** Where the shared Figma page lives, for the one link out. */
  figmaHref?: string;
}

function humanList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * The notes column.
 *
 * Deliberately not a description of the component type: what a Label is gets
 * said once at the bottom of the page, and repeating it on all nine of a
 * team's labels turns the table into wallpaper that nobody reads. This column
 * carries only what is true of *this* component.
 */
function note(c: DesignComponent): string {
  if (!PALETTE[c.type]) {
    return "Not a name this page recognises. Check the spelling against your architecture.";
  }
  return c.note ? `Your architecture says: ${c.note}.` : "";
}

function componentRows(list: DesignComponent[], indent = false): string[] {
  const rows: string[] = [];
  for (const c of list) {
    // Real spaces rather than an HTML entity: the markdown renderer escapes
    // ampersands, so `&nbsp;` would arrive on the page as the literal text.
    const label = indent ? `\u2002\u2002↳ \`${c.name}\`` : `\`${c.name}\``;
    rows.push(`| ${label} | ${c.type} | ${note(c)} |`);
    rows.push(...componentRows(c.children, true));
  }
  return rows;
}

/**
 * A team's design brief, generated from their architecture.
 *
 * Deliberately not a Figma tutorial. They already like Figma. What they do not
 * have is the list of names their own team has committed to, and the knowledge
 * that a design which ignores that list costs their builder a rename on every
 * screen.
 */
export function renderDesignBrief(spec: DesignSpec, meta: DesignBriefMeta): string {
  const out: string[] = [];
  const named = meta.teamName ? `${meta.productName}, by ${meta.teamName}` : meta.productName;

  out.push(`# ${meta.productName}: design brief`);
  out.push("");
  out.push(`Everything on this page came out of your own build architecture. Nobody typed it for you, and nobody will keep it up to date by hand: change the architecture and this page changes with it.`);
  out.push("");
  out.push(`That is the point. Your builders have already agreed on the name of every button and every label in ${named}. If your Figma layers use those names, the person writing the code can look at your design and find their own component in it. If they do not, they are guessing.`);
  out.push("");
  if (meta.figmaHref) {
    out.push(`The rules for how to set the file up are on **[Designing for Anvil](${meta.figmaHref})**. This page is only your team's part.`);
    out.push("");
  }

  out.push("## Your frames");
  out.push("");
  out.push("One frame per screen, named exactly like this. Not \"Home v2\", not \"final home\". This name.");
  out.push("");
  const hasAudience = spec.screens.some((s) => s.audience);
  out.push(hasAudience ? "| Frame name | What happens on it | Who sees it |" : "| Frame name | What happens on it |");
  out.push(hasAudience ? "|---|---|---|" : "|---|---|");
  for (const s of spec.screens) {
    out.push(hasAudience ? `| \`${s.form}\` | ${s.what} | ${s.audience ?? ""} |` : `| \`${s.form}\` | ${s.what} |`);
  }
  out.push("");

  out.push("## What goes on each frame");
  out.push("");
  out.push("The left column is the **layer name to use in Figma**. Copy it exactly, underscores and all.");
  out.push("");

  for (const s of spec.screens) {
    out.push(`### ${s.form}`);
    out.push("");
    if (s.components.length === 0) {
      out.push(
        "Your architecture does not list any components for this screen yet. That is a real gap, not a mistake in this page: go and ask your team what belongs here before you design it.",
      );
      out.push("");
      continue;
    }
    out.push("| Layer name | Anvil component | Anything special |");
    out.push("|---|---|---|");
    out.push(...componentRows(s.components));
    out.push("");

    const repeaters = s.components.filter((c) => c.children.length > 0);
    for (const r of repeaters) {
      out.push(
        `> **\`${r.name}\` repeats.** Design **one** row containing ${humanList(r.children.map((c) => `\`${c.name}\``))}, and Anvil stamps out a copy of it for every row of data. If you draw four rows that look different from each other, only the first one is real. Draw the one row, then say how many you expect to see.`,
      );
      out.push("");
    }

    for (const r of s.components.filter((c) => c.type === "RepeatingPanel" && c.children.length === 0)) {
      out.push(
        `> **\`${r.name}\` repeats, but your architecture does not say what goes in each row.** That is a question for your builders before you draw it, not a guess for you to make.`,
      );
      out.push("");
    }
  }

  const errorLabels = spec.screens.flatMap((s) =>
    s.components.filter((c) => /error/i.test(c.name)).map((c) => ({ form: s.form, name: c.name })),
  );
  const lists = spec.screens.filter((s) => s.components.some((c) => c.children.length > 0));

  out.push("## Draw the bad day too");
  out.push("");
  out.push(
    "Every screen has three states and designers almost always draw one of them. The happy one. Your builder then has to invent the other two while writing code, at speed, and it shows.",
  );
  out.push("");
  out.push("**Empty.** Nothing has been added yet.");
  out.push("");
  if (lists.length > 0) {
    out.push(
      `You have a repeating list on ${humanList(lists.map((s) => s.form))}. On the first day of using this app, that list has nothing in it. What does the screen say? "Nothing here yet" is a design decision, and it is yours.`,
    );
  } else {
    out.push("Ask what each screen shows before anyone has typed anything into it.");
  }
  out.push("");
  out.push("**Wrong.** Somebody typed something the app will not accept.");
  out.push("");
  if (errorLabels.length > 0) {
    out.push(
      `Your architecture already has ${errorLabels.length === 1 ? "an error label" : "error labels"}: ${humanList(errorLabels.map((e) => `\`${e.name}\` on ${e.form}`))}. ${errorLabels.length === 1 ? "It starts invisible and appears when something is refused." : "They start invisible and appear when something is refused."} Right now nobody has designed what ${errorLabels.length === 1 ? "it" : "they"} look${errorLabels.length === 1 ? "s" : ""} like. Red text? A box? Where on the screen? Decide it, because otherwise it will be default grey in the middle of nowhere.`,
    );
  } else {
    out.push(
      "No screen in your architecture has a place to show an error yet. That is worth raising with your team: every screen where someone types something needs somewhere to say no.",
    );
  }
  out.push("");
  out.push("**Full.** Somebody has used this for a month.");
  out.push("");
  out.push(
    "Long names, a hundred rows, a review that is a paragraph rather than four words. Designs break at the edges, and the edges are where real people live.",
  );
  out.push("");

  if (spec.typesUsed.length > 0) {
    out.push("## The pieces you are working with");
    out.push("");
    out.push(
      "These are the components your team is actually using. Anvil gives you a fixed set of them, which is a real constraint on the design and not a small one. Figma will happily let you draw something nobody on your team can build.",
    );
    out.push("");
    out.push("| Component | You can change | You cannot |");
    out.push("|---|---|---|");
    for (const type of spec.typesUsed) {
      const e = PALETTE[type];
      if (!e) continue;
      out.push(`| ${type} | ${e.youCanChange} | ${e.youCannot} |`);
    }
    out.push("");
  }

  const unknown = spec.screens.flatMap((s) =>
    s.components.filter((c) => c.type === "Unknown").map((c) => c.name),
  );
  if (spec.orphanForms.length > 0 || unknown.length > 0) {
    out.push("## Things this page could not work out");
    out.push("");
    if (spec.orphanForms.length > 0) {
      out.push(
        `- ${humanList(spec.orphanForms)} ${spec.orphanForms.length === 1 ? "has" : "have"} components listed but no row in the screens table. Either it is a screen nobody wrote down, or the name is spelled two different ways.`,
      );
    }
    if (unknown.length > 0) {
      out.push(
        `- ${humanList(unknown.map((n) => `\`${n}\``))} ${unknown.length === 1 ? "does" : "do"} not start with one of the usual prefixes (\`btn_\`, \`lbl_\`, \`txt_\`, \`dd_\`, \`chk_\`, \`rp_\`, \`img_\`), so this page cannot tell what ${unknown.length === 1 ? "it is" : "they are"}. Ask your builders.`,
      );
    }
    out.push("");
  }

  out.push("## Before you hand it over");
  out.push("");
  out.push("- [ ] One frame per screen, named exactly as in the table above");
  out.push("- [ ] Every layer name matches a name in this page, spelled the same way");
  out.push("- [ ] Repeating lists are designed as one row, not several");
  out.push("- [ ] The empty state and the error state are drawn, not just the good one");
  out.push("- [ ] Real words from your own app, not lorem ipsum and not \"Button 1\"");
  out.push("- [ ] Your colours written down as hex codes, because that is what gets typed into Anvil");
  out.push("");
  out.push(
    "Then show it to whoever is writing the code and ask them one question: **can you find every one of your components in this?** If the answer is no, you have found the gap before it cost anybody a period of work, which is the entire job.",
  );
  out.push("");

  return out.join("\n");
}
