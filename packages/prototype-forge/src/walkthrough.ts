/**
 * The design walkthrough: a team's Figma work, one step at a time, in their
 * own names.
 *
 * The step by step page and the AI page already say everything a designer
 * needs. What they do not do is wait. A thirteen year old reading a
 * twenty-two step guide does the first three, scrolls, and starts drawing
 * whatever looked interesting. This page shows one step, says what done looks
 * like for it, checks what it can check, and only then shows the next one.
 *
 * Every step is generated from the team's design brief and build cards, so
 * the frame the student is told to draw is `SignIn`, not "your first screen",
 * and the layers they are told to name are the ones their builders agreed.
 * Two tracks, chosen at the start: an AI drew the first screen, or the canvas
 * is blank. They meet at the prototype and end at the handover.
 *
 * The checks here are deterministic and run in the browser: a typed frame
 * name either matches the brief or it does not. The helper is on every step
 * for the questions a list cannot answer, and it is told which step the
 * question came from.
 *
 * Pure, like the rest of this package: documents in, a step list and its HTML
 * out. Nothing here talks to Figma or to a database. The progress that has to
 * survive a Chromebook being handed on is the host's job, through the API the
 * page calls.
 */

import type { BuildCard } from "./cards";
import { PALETTE, type DesignComponent, type DesignScreen, type DesignSpec } from "./design";
import { escapeHtml, renderMarkdown } from "./markdown";

export type WalkthroughTrack = "ai" | "scratch";
export const WALKTHROUGH_TRACKS: WalkthroughTrack[] = ["ai", "scratch"];

/**
 * Where the walkthrough's progress rows live, in the same table as the build
 * card ticks. The card slug is one no real card can have, since card slugs
 * come from titles and a title is never spelled with a hyphenated prefix
 * like this one.
 */
export const WALKTHROUGH_CARD_SLUG = "figma-walkthrough";

/** How a step decides it is done. */
export type WalkthroughCheck =
  /** Pick a track. Only the first step has this. */
  | { kind: "choice" }
  /** Nothing to check; the button says what done means. */
  | { kind: "confirm"; label: string }
  /**
   * Typed or pasted names, compared exactly to the brief.
   *
   * `expected` is the full list. `anyOf` passes when everything typed is in
   * the list, for a step that names one frame out of several. `groups` offers
   * a picker so one box can check one screen's layers at a time.
   */
  | { kind: "names"; label: string; expected: string[]; anyOf?: boolean; groups?: Record<string, string[]>; placeholder?: string }
  /** A short list to tick through. */
  | { kind: "ticks"; label: string; items: string[] }
  /** The chosen card's own criteria, ticked one by one. */
  | { kind: "card-ticks"; label: string }
  /** The prompt writer: pick a card and a screen, copy the prompt. */
  | { kind: "prompt" }
  /** Every button in the brief, and where a tap on it goes. */
  | { kind: "connections"; buttons: Array<{ name: string; screen: string; guess?: string }>; screens: string[] }
  /** A free text note, kept in the browser only. */
  | { kind: "note"; label: string; placeholder: string };

export interface WalkthroughStep {
  id: string;
  title: string;
  /** Which track shows it. Shared steps say "both". */
  track: WalkthroughTrack | "both";
  /** Markdown. What to do, and no more than a screen of it. */
  body: string;
  check: WalkthroughCheck;
  /** Where the long version with pictures is. */
  more?: { label: string; href: string };
}

export interface Walkthrough {
  productName: string;
  /** The screen a person sees first, by the brief's own name. */
  firstScreen: string;
  screens: string[];
  steps: WalkthroughStep[];
  cards: Array<{ number: number; title: string; story?: string; criteria: string[] }>;
}

/* ------------------------------------------------------------ small readers */

const tight = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

function flat(components: DesignComponent[]): DesignComponent[] {
  return components.flatMap((c) => [c, ...flat(c.children)]);
}

function names(screen: DesignScreen): string[] {
  return flat(screen.components).map((c) => c.name);
}

/**
 * The screen somebody sees first.
 *
 * Signing in comes before everything when there is a sign-in screen; a home
 * or start screen next; otherwise the first row of the brief, which is the
 * order the builders wrote.
 */
export function firstScreenOf(spec: DesignSpec): string | undefined {
  const forms = spec.screens.map((s) => s.form);
  const by = (re: RegExp) => forms.find((f) => re.test(tight(f)));
  return by(/^(signin|login|signup|welcome)/) ?? by(/^(home|start|main|dashboard)/) ?? forms[0];
}

/**
 * Where a tap on a button probably goes, read from its name.
 *
 * `btn_history` on a team with a `History` screen goes there. `btn_back` is
 * Figma's Back action. `btn_save` and friends stay where they are, which the
 * page explains. Anything else is a question for the designer, which is the
 * point of asking.
 */
export function guessTarget(button: string, screens: string[], here: string): string | undefined {
  const suffix = tight(button.replace(/^btn_/i, ""));
  if (!suffix) return undefined;
  if (/^(back|cancel|close)$/.test(suffix)) return "Back";
  const hit = screens.find((s) => {
    if (s === here) return false;
    const t = tight(s);
    return t === suffix || (suffix.length >= 3 && t.startsWith(suffix)) || (t.length >= 4 && suffix.startsWith(t));
  });
  if (hit) return hit;
  if (/^(save|post|submit|send|add|log|record|reset|clear|confirm|ok|done|apply|vote|buy|order|place)/.test(suffix)) {
    return "Stays on this screen";
  }
  return undefined;
}

function componentTable(screen: DesignScreen): string {
  const rows = flat(screen.components).map((c) => {
    const inside = screen.components.some((p) => p.children.includes(c)) ? " (inside the repeated row)" : "";
    const draws = PALETTE[c.type]?.draws ?? "";
    return `| \`${c.name}\` | ${c.type}${inside} | ${draws}${c.note ? ` Your architecture says: ${c.note}.` : ""} |`;
  });
  return ["| Layer name | Anvil component | What it looks like |", "|---|---|---|", ...rows].join("\n");
}

function screensTable(spec: DesignSpec): string {
  return [
    "| Frame name | What happens on it |",
    "|---|---|",
    ...spec.screens.map((s) => `| \`${s.form}\` | ${s.what} |`),
  ].join("\n");
}

function repeatNote(screen: DesignScreen): string {
  const rps = screen.components.filter((c) => c.type === "RepeatingPanel");
  if (rps.length === 0) return "";
  return rps
    .map(
      (rp) =>
        `\n> **\`${rp.name}\` repeats.** Draw **one** row${rp.children.length > 0 ? ` with ${rp.children.map((c) => `\`${c.name}\``).join(" and ")} inside it` : ""}. Anvil stamps a copy out for every row of data, so row three cannot look different from row one.`,
    )
    .join("");
}

const cardName = (c: Pick<BuildCard, "number" | "title">): string => `Card ${c.number} · ${c.title}`;

/* -------------------------------------------------------------- the steps */

export function buildWalkthrough(input: { spec: DesignSpec; cards: BuildCard[]; productName: string }): Walkthrough {
  const { spec, cards, productName } = input;
  const screens = spec.screens.map((s) => s.form);
  const first = firstScreenOf(spec) ?? "Home";
  const firstScreen = spec.screens.find((s) => s.form === first) ?? { form: first, what: "The first screen", components: [] };
  const rest = spec.screens.filter((s) => s.form !== first);
  const isSignIn = /^(signin|login|signup)/.test(tight(first));
  const cardList = cards.map((c) => ({ number: c.number, title: c.title, story: c.story, criteria: c.criteria }));

  const buttons = spec.screens.flatMap((s) =>
    flat(s.components)
      .filter((c) => c.type === "Button")
      .map((c) => ({ name: c.name, screen: s.form, guess: guessTarget(c.name, screens, s.form) })),
  );
  const firstButton = buttons.find((b) => b.guess && b.guess !== "Back" && b.guess !== "Stays on this screen") ?? buttons[0];

  const withList = screens.filter((f) => spec.screens.find((s) => s.form === f)?.components.some((c) => c.type === "RepeatingPanel"));
  const withError = screens.filter((f) => names(spec.screens.find((s) => s.form === f)!).some((n) => /^lbl_err/i.test(n)));

  const stateNames = screens.flatMap((f) => [`${f} / empty`, `${f} / error`]);
  const pageNames = ["Cover", ...cards.map(cardName)];

  const criteriaBlock =
    cards.length > 0
      ? cards
          .map((c) => `**${cardName(c)}**${c.criteria.length > 0 ? `\n${c.criteria.map((x) => `- ${x}`).join("\n")}` : ""}`)
          .join("\n\n")
      : "(Your team has no build cards yet, so use the words from your product plan.)";

  const steps: WalkthroughStep[] = [
    {
      id: "start",
      title: "Where are you starting from?",
      track: "both",
      body: `Two ways in, and they end at the same place: a Figma file your builders can build ${productName} from without asking you anything.

Pick the one that is true today. You can change your mind later from the list on the left.`,
      check: { kind: "choice" },
    },

    /* ---------------------------------------------------------- scratch */
    {
      id: "file",
      title: "Open a new file and name it",
      track: "scratch",
      body: `Go to figma.com, sign in, and click **New design file**. An empty canvas opens.

Click the file name at the top (it says *Untitled*) and type:

\`\`\`
${productName}
\`\`\`

Do it now, not later. Four files called *Untitled* is a real problem that happens to real teams every time.

Three areas, and you will use all of them: your **layers** on the left, the **canvas** in the middle, and the **panel** on the right with two tabs at the top, *Design* and *Prototype*. **Shift + 1** zooms out to fit everything on screen. Learn that one.`,
      check: { kind: "confirm", label: `The file is called ${productName}` },
      more: { label: "Steps 1 to 4, with pictures", href: "/build/prototype-steps.html" },
    },
    {
      id: "first-frame",
      title: `Draw your first screen: ${first}`,
      track: "scratch",
      body: `Press **F**. The right panel fills with sizes. Pick a **phone** size.

Double-click the frame's name (it says *Frame 1*, floating just above the top-left corner) and type exactly:

\`\`\`
${first}
\`\`\`

Capital letters and all. Your builders are creating a Form called \`${first}\` in Anvil, and that name is how they will find your screen in this file. *Frame 7* tells them nothing.

${isSignIn ? `It is first because nobody sees anything in ${productName} before they sign in.` : `It is first because it is the screen a person sees when they open ${productName}: ${firstScreen.what.toLowerCase()}.`}`,
      check: { kind: "names", label: "Type the frame's name exactly as it is in Figma", expected: [first], placeholder: first },
      more: { label: "Steps 5 and 6, with pictures", href: "/build/prototype-steps.html" },
    },
    {
      id: "all-frames",
      title: "One frame per screen",
      track: "scratch",
      body: `Press **F**, same phone size, name it. Again, once per screen. Your brief has ${screens.length} screen${screens.length === 1 ? "" : "s"}:

${screensTable(spec)}

Lay them out left to right in the order somebody would go through them. Your canvas becomes a map of the app before you have drawn a single button.

Do not draw all the screens inside one big frame. Figma cannot link screens that live inside one frame, and neither can your builders.`,
      check: {
        kind: "names",
        label: "Paste your frame names from the layers panel, one per line",
        expected: screens,
        placeholder: screens.slice(0, 2).join("\n"),
      },
      more: { label: "Steps 7 and 8", href: "/build/prototype-steps.html" },
    },
    {
      id: "boxes",
      title: `Put the pieces on ${first}`,
      track: "scratch",
      body: `Not art yet. Grey boxes where things will go. **R** draws a rectangle, **T** places text.

Your builders need these on \`${first}\`, top to bottom, one per row:

${componentTable(firstScreen)}
${repeatNote(firstScreen)}
One thing per row, full width, stacked down the page. That is how Anvil lays a screen out, so a design that stacks is a design that gets built exactly as you drew it.`,
      check: { kind: "confirm", label: `Every row in the table has a box on ${first}` },
      more: { label: "Step 9", href: "/build/prototype-steps.html" },
    },
    {
      id: "layer-names",
      title: "Name the layers",
      track: "scratch",
      body: `Double-click each layer's name in the left panel and give it the name from the table. Ten seconds a layer.

Three reasons, and the third surprises people:

1. Your builder can find their component in your design.
2. You can find things yourself when there are sixty layers.
3. Smart animate, later, works by matching layers with **identical names** in two frames. Named layers get smooth animation for free. *Rectangle 41* gets nothing.

The names for \`${first}\` again: ${names(firstScreen).map((n) => `\`${n}\``).join(", ")}.`,
      check: {
        kind: "names",
        label: `Paste the layer names inside ${first}, one per line`,
        expected: names(firstScreen),
        placeholder: names(firstScreen).slice(0, 2).join("\n"),
      },
      more: { label: "Step 10", href: "/build/prototype-steps.html" },
    },
    {
      id: "real-words",
      title: "Use your own words",
      track: "scratch",
      body: `Not *Lorem ipsum*. Not *Item 1*. Not *Button*. Fake content is always exactly the right length, which hides every layout problem you have.

The words on your screens come from your build cards:

${criteriaBlock}

A button says what it does: *Save*, *Post*, *Sign in*. A label shows a real example of what a user would see. A number is a real number or it is gone.`,
      check: {
        kind: "ticks",
        label: `On ${first}:`,
        items: [
          "Every piece of text is a real word from the app",
          "No number is made up",
          "Every button says what it does",
        ],
      },
      more: { label: "Step 12", href: "/build/prototype-steps.html" },
    },
    {
      id: "buttons-look",
      title: "Make the buttons look like buttons",
      track: "scratch",
      body: `A button needs to look pressable, or nobody will press it when you test.

Draw a rectangle, give it a rounded corner (the corner radius box in the Design panel), put the text on it, and give it **one** colour that appears almost nowhere else on the screen. That colour is your accent. Everything else stays black, white and grey. This one rule is most of what "professional" means.

Click the colour swatch and copy its **hex code** (six characters after a #). Write it down. Hex codes are the only form a colour can cross into Anvil in.`,
      check: {
        kind: "ticks",
        label: "Done when:",
        items: [
          `The main button on ${first} has the accent colour and a rounded corner`,
          "The accent's hex code is written down somewhere you will find it",
        ],
      },
      more: { label: "Step 11, and how to make it look like a real app", href: "/build/prototype-steps.html" },
    },
    {
      id: "other-screens",
      title: rest.length > 0 ? "Now the other screens" : "Check the screen once more",
      track: "scratch",
      body:
        rest.length > 0
          ? `Same three moves for each of the rest: boxes, names, real words. Here is every remaining screen with the exact layer names it needs.

${rest.map((s) => `### ${s.form}\n\n${s.what}\n\n${componentTable(s)}${repeatNote(s)}`).join("\n\n")}`
          : `Your brief has one screen, so this is a short step. Read the table once more and check nothing is missing.\n\n${componentTable(firstScreen)}`,
      check: {
        kind: "ticks",
        label: "Tick each screen when its boxes are drawn, its layers are named, and its words are real:",
        items: rest.length > 0 ? rest.map((s) => s.form) : [first],
      },
    },

    /* --------------------------------------------------------------- ai */
    {
      id: "ai-prompt",
      title: "Write the prompt from your card",
      track: "ai",
      body: `The prompt is your user story. You have already written the sentence that tells a design tool what to draw, so do not write a new one.

Pick the card and the screen it is for, and the prompt below fills itself in. Copy it into **Figma Make** (the Make tab on your home screen) or **First Draft** (in a design file, under Actions). If you have already generated a screen, this is still worth a read: it is what the AI should have been asked.

One screen per prompt. Ask for the whole app and you get a landing page with a pricing table.`,
      check: { kind: "prompt" },
      more: { label: "Which AI you have, and how to prompt it", href: "/build/figma-ai.html" },
    },
    {
      id: "ai-check-card",
      title: "Read it against the card",
      track: "ai",
      body: `Before you touch anything, go down the card's **Done when** list and find each line on the screen. Every criterion should be something you can point at.

Anything on the screen that is not on the card is decoration the tool added to fill space. That is the next step.`,
      check: { kind: "card-ticks", label: "I can point at this on the screen:" },
      more: { label: "Part A, step 2", href: "/build/figma-ai.html" },
    },
    {
      id: "ai-delete",
      title: "Delete what the card never asked for",
      track: "ai",
      body: `A search bar. A profile picture. Three tabs. A footer with a privacy policy. If it is not on the card, it is not in ${productName}, and your builder will either build it (and it will do nothing) or skip it (and the design will not match). Delete it.

Sometimes you look at a thing the tool added and think, *oh, we do need that*. Good. That is a finding. Propose it on your cards page so it goes on the story first, and then keep it. Adding to the story is how a thing gets into the app. Adding to the screen on its own is how a design and an app drift apart.`,
      check: { kind: "confirm", label: "Everything still on the screen is a line on the card" },
      more: { label: "Part D, number 2", href: "/build/figma-ai.html" },
    },
    {
      id: "ai-numbers",
      title: "Fix the made-up numbers and words",
      track: "ai",
      body: `*Join 18,000 students. 42 lessons. 94% pass rate.* Aisha K. and fourteen other people who do not exist. A design tool fills every gap with something plausible, and plausible is worse than blank because nobody notices it is fake until it is in the app.

Replace every number with a real one, or delete it. Replace every pretend person with a real thing from your plan. The words that belong on the screen are on your cards:

${criteriaBlock}`,
      check: {
        kind: "ticks",
        label: "Done when:",
        items: ["No number on the screen is invented", "No fake person or company is on it", "The text says what the app says, not what a demo says"],
      },
      more: { label: "Part D, number 1", href: "/build/figma-ai.html" },
    },
    {
      id: "ai-effects",
      title: "Take out what Anvil cannot draw",
      track: "ai",
      body: `Go through the screen and look for these. Every one is a thing to change now rather than a conversation with your builder later.

| In the AI design | Why Anvil cannot | Do this instead |
|---|---|---|
| A gradient | Components take one colour | Pick the colour from one end |
| A button that changes when you hover | Animation needs CSS | Nothing. It is fine. |
| Rounded corners on a photo | An image is a rectangle | A square photo, or a rounded box around it |
| A card with a soft shadow | A shadow needs CSS | A thin border. Your builder can do that with a role. |
| Things side by side in a grid | A list is one column | One column. Same things. |
| Row three looks different from row one | A list is one row, repeated | Make every row the same |
| A progress bar that fills | A rectangle with a changing width | \`3 / 10\` as text |
| Two text styles in one line | A label is one style | Two labels, or drop the italics |

Pill buttons, rounded cards and a real font your builder **can** do, with a bit of pasted CSS. Keep those if you want them, on purpose, and tell your builder.`,
      check: { kind: "confirm", label: "Nothing in the left column is left, or it is on purpose and the builder knows" },
      more: { label: "Part D, number 4, and what a builder can match", href: "/build/figma-ai.html" },
    },
    {
      id: "ai-frame-name",
      title: "Name the frame after the screen",
      track: "ai",
      body: `The AI called the frame something like *Screen 1* or *Sign Up Page*. Your builders are creating a Form with one of these exact names, and that name is how they find your screen:

${screensTable(spec)}

Double-click the frame's name, just above its top-left corner, and type the matching one. Capital letters and all, no spaces, no number in front.

If the AI gave you a stack of frames for one screen (a status bar, a body, a home indicator), they should all sit **inside** one frame with the screen's name. Check the layers panel: one top-level entry per screen.`,
      check: { kind: "names", label: "Type the frame's name as it now reads in Figma", expected: screens, anyOf: true, placeholder: first },
      more: { label: "Rule 1 on Designing for Anvil", href: "/build/figma.html" },
    },
    {
      id: "ai-layer-names",
      title: "Rename every layer to the brief's names",
      track: "ai",
      body: `Open the layers panel. Every layer that will be **built** gets its name from your brief, exactly. Everything else is paint: the glow behind the card, the faint grid, the floating shapes, the iOS status bar. Delete the paint, or leave it and know your builder will ignore it.

${spec.screens.map((s) => `### ${s.form}\n\n${names(s).map((n) => `\`${n}\``).join(", ")}${repeatNote(s)}`).join("\n\n")}

The AI's own names (*heading-group*, *input-container*, *btn-submit*) are not these names. Close is not the same. \`btn-submit\` and \`btn_save_activity\` are two different things to a builder.`,
      check: {
        kind: "names",
        label: "Pick the screen, then paste its layer names, one per line",
        expected: names(firstScreen),
        groups: Object.fromEntries(spec.screens.map((s) => [s.form, names(s)])),
        placeholder: names(firstScreen).slice(0, 2).join("\n"),
      },
      more: { label: "Part D, number 3", href: "/build/figma-ai.html" },
    },
    {
      id: "ai-other-screens",
      title: rest.length > 0 ? "The other screens" : "One more look",
      track: "ai",
      body:
        rest.length > 0
          ? `One prompt per screen, then the same four fixes: delete, numbers, effects, names. Or draw the rest plainly, which is often faster: a phone frame, one grey box per layer, **Auto layout** on the frame (Shift + A) so the boxes stack themselves.

${rest.map((s) => `### ${s.form}\n\n${s.what}\n\n${names(s).map((n) => `\`${n}\``).join(", ")}${repeatNote(s)}`).join("\n\n")}

Every screen gets the same standard: only what is on its card, real words, no effects Anvil lacks, layers named from the brief.`
          : `Your brief has one screen. Read its names once more and check every one is a layer.\n\n${names(firstScreen).map((n) => `\`${n}\``).join(", ")}`,
      check: {
        kind: "ticks",
        label: "Tick each screen when it exists, is named, and has its layers named:",
        items: rest.length > 0 ? rest.map((s) => s.form) : [first],
      },
    },

    /* --------------------------------------------------------- shared */
    {
      id: "bad-day",
      title: "Draw the bad day",
      track: "both",
      body: `Every screen has three states and designers almost always draw one of them: the good one. Your builder then invents the other two while writing code, at speed, and it shows.

Select a frame, press **Ctrl/Cmd + D** to duplicate it, and name the copy with a slash and the state:

\`\`\`
${stateNames.join("\n")}
\`\`\`

**Empty** is what the screen says when nothing has been added yet. On the first day ${productName} is real, that is the only state anybody sees.${withList.length > 0 ? ` ${withList.map((f) => `\`${f}\``).join(" and ")} ${withList.length === 1 ? "has" : "have"} a repeating list, so the empty state is a real design decision: what does the list say with nothing in it?` : ""}

**Error** is the app refusing something.${withError.length > 0 ? ` ${withError.map((f) => `\`${f}\``).join(" and ")} ${withError.length === 1 ? "has" : "have"} an \`lbl_error\` that starts invisible. Decide what it looks like when it appears: red text, a box, where on the screen. Otherwise it is default grey in the middle of nowhere.` : " Wrong password, letters where a number should be, a message with nothing typed."}`,
      check: {
        kind: "names",
        label: "Paste the names of your state frames, one per line",
        expected: stateNames,
        placeholder: stateNames.slice(0, 2).join("\n"),
      },
      more: { label: "Rule 5 on Designing for Anvil", href: "/build/figma.html" },
    },
    {
      id: "first-connection",
      title: "Make your first tap work",
      track: "both",
      body: `This is the part everybody thinks is hard. It is dragging a line.

Click any layer, then click **Prototype** at the top of the right panel. Now when you select a layer, a small **blue circle** appears on its right-hand edge. That circle is the whole feature.

${
  firstButton
    ? `1. Click \`${firstButton.name}\` on \`${firstButton.screen}\`.
2. Click the blue circle and drag. A line follows your mouse. Designers call it a noodle, genuinely.
3. Drop it on ${firstButton.guess && firstButton.guess !== "Back" && firstButton.guess !== "Stays on this screen" ? `\`${firstButton.guess}\`` : "the frame it should open"}. The whole frame lights up blue when you are over it.`
    : `1. Click a button on \`${first}\`.
2. Click the blue circle and drag. A line follows your mouse. Designers call it a noodle, genuinely.
3. Drop it on the frame that button should open. The whole frame lights up blue when you are over it.`
}

A small box appears saying *On click*, *Navigate to*, *Instant*. Figma guessed all three and it is right. Leave them alone.`,
      check: { kind: "confirm", label: "One connection exists, and Preview follows it" },
      more: { label: "Steps 13 to 15, with pictures", href: "/build/prototype-steps.html" },
    },
    {
      id: "connect-all",
      title: "Connect every button",
      track: "both",
      body: `For every button in your brief: **if somebody taps this, what happens?** Answer below, then draw the noodle for each one.

- A **back** button gets Figma's *Back* action: drag the noodle on to empty canvas, then change *Navigate to* to *Back*. One Back button works from wherever the screen was reached.
- A button that **saves or posts** stays on its screen. In the prototype, point it at the frame that shows the result, which is usually the same screen with the new thing in it.
- If the honest answer is **nowhere yet**, that is a real finding. A button that leads nowhere is a hole in your plan, not in your design. Write it on the card.`,
      check: { kind: "connections", buttons, screens },
      more: { label: "Steps 16 and 17", href: "/build/prototype-steps.html" },
    },
    {
      id: "flow-start",
      title: "Tell Figma where to start",
      track: "both",
      body: `Click on empty canvas so nothing is selected, then click \`${first}\`.

In the Prototype panel on the right, find **Flow starting point** and click the **+** beside it. A blue flag appears above the frame saying *Flow 1*. Double-click that and call it \`${productName}\`.

Do not skip this. Without a starting point Figma guesses where to begin, and it guesses wrong.`,
      check: { kind: "confirm", label: `The flag is on ${first} and it has a real name` },
      more: { label: "Step 18, with a picture", href: "/build/prototype-steps.html" },
    },
    {
      id: "play",
      title: "Play it and click everything",
      track: "both",
      body: `**Preview** plays the prototype in a small window without leaving the editor. **Present**, top right, opens it full screen in a new tab. That is the version you show people.

Click every single thing that looks tappable. When something is wrong, it is one of these:

| What is happening | What is actually wrong |
|---|---|
| I click and nothing happens | You are in the editor, not playing it. Press Present. |
| It still does nothing when playing | That thing has no noodle. Go back and check every button. |
| Half my screens are missing | Nothing links to them. A screen with no arrow pointing at it can never be reached. |
| It starts on the wrong screen | The flow starting point is missing or on the wrong frame. |
| My picture does not show up | It is outside the frame in the layers list. Drag it inside. |
| I cannot click my picture | An image cannot be a button. Put a rectangle over it, name that \`btn_...\`, and connect the rectangle. |`,
      check: {
        kind: "ticks",
        label: "In Present:",
        items: [`It opens on ${first}`, "Every screen can be reached", "Every button does something, or is written down as nowhere yet"],
      },
      more: { label: "Steps 19 and 20, and when it goes wrong", href: "/build/prototype-steps.html" },
    },
    {
      id: "test-person",
      title: "Test it on somebody who is not you",
      track: "both",
      body: `This is the actual point of the whole exercise, and most teams skip it.

Find somebody who has not seen your design. Do not explain it. Say **one** sentence${cards[0]?.story ? `, something like the job in your first card: *${cards[0].story.replace(/^as an? [^,]+,\s*/i, "").replace(/,?\s*so that.*$/i, "")}*` : ""}. Then say nothing at all and watch what they do.

Where they hesitate is where your design is wrong. Not where they are stupid. Where your design is wrong. It is uncomfortable the first time and it is the most useful ten minutes of the project.`,
      check: { kind: "note", label: "Where did they hesitate? One line.", placeholder: "They looked for a back button on the second screen and there was none." },
      more: { label: "Step 21", href: "/build/prototype-steps.html" },
    },
    {
      id: "pages-cover",
      title: "Pages: one per card, plus a Cover",
      track: "both",
      body: `Right now everything is probably on *Page 1*. Your teacher's review reads the file page by page, and a page is the link between a story and a design.

At the top of the layers panel is the **Pages** list. Add a page per build card, named exactly like the card, and drag that card's frames on to it:

\`\`\`
${pageNames.join("\n")}
\`\`\`

The **Cover** page goes first: product name, team name, one sentence about what the app is for, your accent colour as a hex code, and your one or two fonts by name. **No student names anywhere in the file**, on any page. The file already shows who owns it and that is as far as it goes.`,
      check: { kind: "names", label: "Paste your page names, one per line", expected: pageNames, placeholder: pageNames.slice(0, 2).join("\n") },
      more: { label: "How the file is organised", href: "/build/handover.html" },
    },
    {
      id: "share",
      title: "Share it",
      track: "both",
      body: `1. In Figma, press **Share**. Add your teacher's school email as a **viewer**. Do not switch the file to *anyone with the link*: that makes it public, and it does not need to be.
2. Press **Copy link**.
3. Open your team's **design brief** page and find **Share your design** at the bottom. Paste the link, and if your builders have published the Anvil app, that link too. Write one line about what is finished and what is not.
4. Press Send.

Your teacher gets an email. Your file then gets read against your own documents, and a **Design review** appears in your chain of pages saying exactly what disagrees. Every line on it is something you can fix and share again.`,
      check: { kind: "confirm", label: "The link is sent" },
      more: { label: "Sharing it, and what happens next", href: "/build/handover.html" },
    },
  ];

  return { productName, firstScreen: first, screens, steps, cards: cardList };
}

/** The steps a track shows, in order. */
export function walkthroughSteps(w: Walkthrough, track: WalkthroughTrack): WalkthroughStep[] {
  return w.steps.filter((s) => s.track === "both" || s.track === track);
}

export function walkthroughStep(w: Walkthrough, id: string): WalkthroughStep | undefined {
  return w.steps.find((s) => s.id === id);
}

/** Markdown stripped down to sentences, for a prompt. */
function plain(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, "").trim().split("\n").join(", "))
    .replace(/^\|.*\|$/gm, (row) => row.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()).filter((c) => !/^-+$/.test(c)).join(": "))
    .replace(/[*_>#`]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * One step, as text the helper can hold.
 *
 * Says what the step asks and what counts as done, so a question like "it
 * will not let me" can be answered about this step rather than about Figma in
 * general, and so the helper can check pasted names against the same list the
 * page checks them against.
 */
export function walkthroughStepText(w: Walkthrough, id: string): string | undefined {
  const step = walkthroughStep(w, id);
  if (!step) return undefined;
  if (step.id === "start") return `Before you start: ${step.title}\n${plain(step.body)}`;
  // The track choice is index 0 and is not a numbered step, on the page or here.
  const track = walkthroughSteps(w, step.track === "both" ? "scratch" : step.track);
  const n = track.findIndex((s) => s.id === step.id);
  const done =
    step.check.kind === "names"
      ? `Done when the names they typed match these exactly: ${(step.check.groups ? Object.values(step.check.groups).flat() : step.check.expected).join(", ")}.`
      : step.check.kind === "ticks"
        ? `Done when: ${step.check.items.join("; ")}.`
        : step.check.kind === "confirm"
          ? `Done when: ${step.check.label}.`
          : step.check.kind === "connections"
            ? `Done when every button has an answer: ${step.check.buttons.map((b) => `${b.name} on ${b.screen}${b.guess ? ` (probably ${b.guess})` : ""}`).join("; ")}.`
            : "";
  return `Step ${n} of ${track.length - 1}: ${step.title}\n${plain(step.body)}\n${done}`.trim();
}

/* ----------------------------------------------------------------- the page */

const attr = (value: unknown): string => escapeHtml(JSON.stringify(value));

function checkHtml(step: WalkthroughStep): string {
  const c = step.check;
  switch (c.kind) {
    case "choice":
      return `<div class="wt-choice">
        <button type="button" class="wt-track" data-track="ai"><strong>An AI drew my first screen</strong><span>Figma Make or First Draft did the first version. Now it has to be made buildable.</span></button>
        <button type="button" class="wt-track" data-track="scratch"><strong>A blank canvas</strong><span>Plain Figma, one frame at a time. Grey boxes are fine.</span></button>
      </div>`;
    case "confirm":
      return `<p class="wt-done-label"><strong>Done means:</strong> ${escapeHtml(c.label)}.</p>`;
    case "names":
      return `<div class="wt-names" data-expected="${attr(c.expected)}"${c.anyOf ? ' data-any-of="1"' : ""}${c.groups ? ` data-groups="${attr(c.groups)}"` : ""}>
        <label class="wt-label">${escapeHtml(c.label)}</label>
        ${
          c.groups
            ? `<select class="wt-group" aria-label="Which screen">${Object.keys(c.groups)
                .map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`)
                .join("")}</select>`
            : ""
        }
        <textarea rows="4" placeholder="${escapeHtml(c.placeholder ?? "")}" aria-label="Names"></textarea>
        <div class="wt-row"><button type="button" class="wt-check-btn">Check</button></div>
        <div class="wt-result" aria-live="polite"></div>
      </div>`;
    case "ticks":
      return `<div class="wt-ticks"><p class="wt-label">${escapeHtml(c.label)}</p>${c.items
        .map((item, i) => `<label class="wt-tick"><input type="checkbox" data-i="${i}" /> <span>${escapeHtml(item)}</span></label>`)
        .join("")}</div>`;
    case "card-ticks":
      return `<div class="wt-card-ticks"><p class="wt-label">${escapeHtml(c.label)}</p><div class="wt-card-pick"></div><div class="wt-card-list"></div></div>`;
    case "prompt":
      return `<div class="wt-prompt">
        <div class="wt-row">
          <label>Card <select class="wt-prompt-card" aria-label="Which card"></select></label>
          <label>Screen <select class="wt-prompt-screen" aria-label="Which screen"></select></label>
        </div>
        <pre class="wt-prompt-text"></pre>
        <div class="wt-row"><button type="button" class="wt-copy">Copy the prompt</button><span class="wt-copied" hidden>Copied.</span></div>
      </div>`;
    case "connections":
      return `<div class="wt-connections" data-buttons="${attr(c.buttons)}" data-screens="${attr(c.screens)}">
        ${
          c.buttons.length === 0
            ? `<p class="wt-label">Your brief has no buttons, which is unusual. Ask your builders whether that is right before you go on.</p>`
            : `<table><thead><tr><th>Button</th><th>On</th><th>A tap goes to</th></tr></thead><tbody>${c.buttons
                .map(
                  (b, i) =>
                    `<tr><td><code>${escapeHtml(b.name)}</code></td><td><code>${escapeHtml(b.screen)}</code></td><td><select data-i="${i}" aria-label="Where ${escapeHtml(b.name)} goes"><option value="">Choose</option>${c.screens
                      .filter((s) => s !== b.screen)
                      .map((s) => `<option value="${escapeHtml(s)}"${b.guess === s ? " selected" : ""}>${escapeHtml(s)}</option>`)
                      .join("")}<option value="Back"${b.guess === "Back" ? " selected" : ""}>Back (Figma's Back action)</option><option value="Stays on this screen"${b.guess === "Stays on this screen" ? " selected" : ""}>Stays on this screen</option><option value="Nowhere yet">Nowhere yet</option></select></td></tr>`,
                )
                .join("")}</tbody></table>
        <div class="wt-result" aria-live="polite"></div>`
        }
      </div>`;
    case "note":
      return `<div class="wt-note"><label class="wt-label">${escapeHtml(c.label)}</label><textarea rows="2" placeholder="${escapeHtml(c.placeholder)}"></textarea></div>`;
  }
}

function stepHtml(step: WalkthroughStep, slug: string): string {
  return `<section class="wt-step" data-id="${escapeHtml(step.id)}" data-track="${step.track}" hidden>
    <p class="wt-count"></p>
    <h2>${escapeHtml(step.title)}</h2>
    <div class="wt-body">${renderMarkdown(step.body)}</div>
    <div class="wt-check" data-kind="${step.check.kind}">${checkHtml(step)}</div>
    ${step.more ? `<p class="wt-more">The long version: <a href="${escapeHtml(step.more.href)}" target="_blank" rel="noopener">${escapeHtml(step.more.label)}</a>.</p>` : ""}
    <div class="wt-nav">
      <button type="button" class="wt-back">Back</button>
      ${step.check.kind === "choice" ? "" : `<button type="button" class="wt-next">${step.id === "share" ? "Done" : "Done, next"}</button>`}
      <span class="wt-saved" aria-live="polite"></span>
    </div>
    <details class="wt-stuck">
      <summary>Stuck on this step? Ask.</summary>
      <p class="wt-stuck-intro">I know which step you are on and I have your brief. Tell me what you see, or paste the names you have, and I will say what is off.</p>
      <form class="wt-ask" data-step="${escapeHtml(step.id)}" data-team="${escapeHtml(slug)}">
        <textarea rows="2" maxlength="600" placeholder="It will not let me..." aria-label="Your question"></textarea>
        <button type="submit">Ask</button>
      </form>
      <div class="wt-thread" aria-live="polite"></div>
    </details>
  </section>`;
}

const CSS = `
.wt { display: grid; grid-template-columns: 210px 1fr; gap: 22px; align-items: start; }
.wt > * { min-width: 0; }
.wt-main main { overflow-wrap: anywhere; }
@media (max-width: 720px) {
  .wt { grid-template-columns: 1fr; }
  .wt-rail { position: sticky; top: 0; z-index: 2; padding: 10px 10px 8px; border-radius: 12px; }
  .wt-rail h2 { display: none; }
  .wt-rail ol { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .wt-rail ol::-webkit-scrollbar { display: none; }
  .wt-rail li { flex: none; }
  .wt-rail button { padding: 5px 7px; white-space: nowrap; }
  .wt-rail button:not([aria-current="step"]) > span:last-child { display: none; }
  .wt-rail .wt-track-switch { margin: 6px 4px 0; }
}
.wt-rail { position: sticky; top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 12px; font-size: .85rem; }
.wt-rail h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin: 0 0 8px; border: 0; padding: 0 4px; }
.wt-rail ol { list-style: none; margin: 0; padding: 0; }
.wt-rail li { margin: 0; }
.wt-rail button { display: flex; gap: 8px; align-items: baseline; width: 100%; text-align: left; font: inherit; font-size: .85rem; padding: 6px 6px; border: 0; border-radius: 8px; background: transparent; color: var(--text); cursor: pointer; line-height: 1.35; }
.wt-rail button:hover { background: rgba(0,0,0,.04); }
.wt-rail button[aria-current="step"] { background: var(--primary); color: #fff; }
.wt-rail button .n { flex: none; width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid currentColor; font-size: .7rem; display: inline-flex; align-items: center; justify-content: center; opacity: .8; }
.wt-rail button.done .n { background: var(--accent); border-color: var(--accent); color: #fff; opacity: 1; }
.wt-rail button.done .n::before { content: "\\2713"; }
.wt-rail button:not(.done) .n::before { content: attr(data-n); }
.wt-rail .wt-track-switch { margin: 12px 4px 0; font-size: .78rem; color: var(--muted); }
.wt-rail .wt-track-switch button { display: inline; width: auto; padding: 0; font-size: inherit; color: var(--accent); text-decoration: underline; background: none; }
.wt-main main { min-height: 320px; }
.wt-count { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin: 0 0 2px; }
.wt-step h2 { margin-top: 0; border: 0; padding: 0; font-size: 1.45rem; }
.wt-check { margin: 18px 0 6px; padding: 16px 18px; border-radius: 12px; background: rgba(0,0,0,.035); border-left: 4px solid var(--primary); }
.wt-label { display: block; font-size: .88rem; font-weight: 600; margin: 0 0 8px; }
.wt-done-label { margin: 0; font-size: .95rem; }
.wt-check textarea, .wt-check select { width: 100%; font: inherit; font-size: .93rem; padding: 9px 11px; border: 1px solid var(--line); border-radius: 9px; background: #fff; }
.wt-check textarea { resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.wt-check select { width: auto; margin-bottom: 8px; }
.wt-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
.wt-row label { font-size: .88rem; }
.wt-check-btn, .wt-copy { font: inherit; font-size: .9rem; padding: 8px 15px; border-radius: 9px; border: 1px solid var(--primary); background: #fff; color: var(--primary); cursor: pointer; }
.wt-result { margin-top: 10px; font-size: .92rem; }
.wt-result ul { margin: 6px 0 0; padding-left: 20px; }
.wt-result .ok { color: #1f6b3a; }
.wt-result .miss { color: #9a2b1b; }
.wt-result .extra { color: var(--muted); }
.wt-tick { display: flex; gap: 9px; align-items: flex-start; margin: 6px 0; cursor: pointer; font-size: .95rem; }
.wt-tick input { margin-top: 5px; flex: none; width: 16px; height: 16px; accent-color: var(--primary); }
.wt-tick input:checked + span { color: var(--muted); text-decoration: line-through; }
.wt-card-pick select { margin-bottom: 4px; }
.wt-prompt-text { white-space: pre-wrap; font-size: .85rem; padding: 14px 16px; margin: 10px 0 0; }
.wt-copied { font-size: .85rem; color: var(--muted); }
.wt-connections table { font-size: .9rem; margin: 0; }
.wt-connections th:last-child, .wt-connections td:last-child { min-width: 200px; }
.wt-connections select { width: 100%; margin: 0; padding: 6px 8px; font-size: .88rem; }
.wt-choice { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
@media (max-width: 560px) { .wt-choice { grid-template-columns: 1fr; } }
.wt-track { font: inherit; text-align: left; padding: 16px 18px; border-radius: 12px; border: 1.5px solid var(--line); background: #fff; cursor: pointer; display: grid; gap: 6px; }
.wt-track:hover { border-color: var(--primary); }
.wt-track strong { font-family: var(--heading-font); color: var(--primary); font-size: 1.05rem; }
.wt-track span { font-size: .88rem; color: var(--muted); }
.wt-more { font-size: .88rem; color: var(--muted); margin: 8px 0 0; }
.wt-nav { display: flex; gap: 10px; align-items: center; margin: 20px 0 6px; flex-wrap: wrap; }
.wt-back, .wt-next { font: inherit; font-size: .95rem; padding: 10px 18px; border-radius: 9px; cursor: pointer; }
.wt-back { border: 1px solid var(--line); background: #fff; color: var(--muted); }
.wt-next { border: 0; background: var(--primary); color: #fff; }
.wt-next.ready { background: #1f6b3a; }
.wt-saved { font-size: .82rem; color: var(--muted); }
.wt-stuck { margin-top: 18px; border-top: 1px solid var(--line); padding-top: 12px; }
.wt-stuck summary { cursor: pointer; font-weight: 600; color: var(--primary); font-size: .95rem; }
.wt-stuck-intro { font-size: .88rem; color: var(--muted); margin: 8px 0 10px; }
.wt-ask { display: flex; gap: 8px; align-items: flex-start; }
.wt-ask textarea { flex: 1; font: inherit; font-size: .95rem; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; resize: vertical; }
.wt-ask button { font: inherit; font-size: .95rem; padding: 10px 18px; border-radius: 9px; border: 0; background: var(--primary); color: #fff; cursor: pointer; }
.wt-ask button:disabled { opacity: .5; cursor: default; }
.wt-thread .ask-bubble { margin-top: 12px; padding: 11px 14px; border-radius: 10px; font-size: .93rem; white-space: pre-wrap; }
.wt-thread .ask-you { background: rgba(0,0,0,.05); }
.wt-thread .ask-helper { background: rgba(0,0,0,.03); border-left: 3px solid var(--accent); }
.wt-finish { padding: 18px 20px; border-radius: 12px; background: #eef6ef; border-left: 4px solid #1f6b3a; margin-top: 18px; }
.wt-finish h2 { border: 0; padding: 0; margin: 0 0 8px; font-size: 1.2rem; }
`;

/**
 * The page's behaviour, in the same plain JavaScript as every other box on
 * these pages: no build step, no framework, works on a school Chromebook.
 *
 * Progress goes to the team's row in the database through the host's API
 * and is mirrored in this browser, so the page works with no database (the
 * ticks last for this Chromebook) and works better with one (they last for
 * the team).
 */
const SCRIPT = `
(function () {
  var root = document.querySelector('.wt');
  if (!root) return;
  var team = root.getAttribute('data-team');
  var designHref = root.getAttribute('data-design-href') || 'design.html';
  var cards = JSON.parse(root.getAttribute('data-cards') || '[]');
  var screens = JSON.parse(root.getAttribute('data-screens') || '[]');
  var product = root.getAttribute('data-product') || 'the app';
  var steps = Array.prototype.slice.call(root.querySelectorAll('.wt-step'));
  var rail = root.querySelector('#wt-rail');
  var key = 'wt:' + team;

  var state = { track: null, done: {}, current: null, local: {} };
  try { var saved = JSON.parse(localStorage.getItem(key) || 'null'); if (saved) state = saved; } catch (e) {}
  if (!state.local) state.local = {};
  if (!state.done) state.done = {};

  function persistLocal() { try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {} }

  function post(body) {
    body.team = team;
    return fetch('/api/trail-crew/walkthrough', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).catch(function () { return null; });
  }

  function visible() {
    if (!state.track) return steps.filter(function (s) { return s.getAttribute('data-id') === 'start'; });
    return steps.filter(function (s) {
      var t = s.getAttribute('data-track');
      return t === 'both' || t === state.track;
    });
  }

  function firstOpen() {
    var list = visible();
    for (var i = 0; i < list.length; i++) {
      var id = list[i].getAttribute('data-id');
      if (id !== 'start' && !state.done[id]) return id;
    }
    return list[list.length - 1].getAttribute('data-id');
  }

  function show(id) {
    var list = visible();
    var idx = -1;
    steps.forEach(function (s) { s.hidden = true; });
    list.forEach(function (s, i) { if (s.getAttribute('data-id') === id) { s.hidden = false; idx = i; } });
    if (idx < 0) { show(list[0].getAttribute('data-id')); return; }
    state.current = id;
    persistLocal();
    var el = list[idx];
    var count = el.querySelector('.wt-count');
    if (count) count.textContent = state.track && id !== 'start' ? 'Step ' + idx + ' of ' + (list.length - 1) : 'Before you start';
    var back = el.querySelector('.wt-back');
    if (back) back.hidden = idx === 0;
    var fin = root.querySelector('.wt-finish');
    if (fin) fin.hidden = !(id === 'share' && state.done.share);
    renderRail();
    restore(el);
    if (window.scrollY > el.getBoundingClientRect().top + window.scrollY - 20) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderRail() {
    if (!rail) return;
    rail.innerHTML = '';
    var list = visible();
    list.forEach(function (s, i) {
      var id = s.getAttribute('data-id');
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = state.done[id] ? 'done' : '';
      if (id === state.current) b.setAttribute('aria-current', 'step');
      b.innerHTML = '<span class="n" data-n="' + (i === 0 ? '\\u2022' : i) + '"></span><span>' + s.querySelector('h2').textContent + '</span>';
      b.addEventListener('click', function () { show(id); });
      li.appendChild(b);
      rail.appendChild(li);
    });
    var sw = root.querySelector('.wt-track-switch');
    if (sw) {
      sw.hidden = !state.track;
      sw.querySelector('span').textContent = state.track === 'ai' ? 'AI drew the first screen.' : 'Starting from a blank canvas.';
    }
  }

  function markDone(id) {
    state.done[id] = true;
    persistLocal();
    return post({ step: id, done: true });
  }

  /* ---- checks ---- */

  function normalise(text) {
    return text.split(/[\\n,]+/).map(function (l) { return l.replace(/^[\\s\\-*\\u2022\\d.)]+/, '').trim(); }).filter(Boolean);
  }

  function checkNames(box) {
    var expected = JSON.parse(box.getAttribute('data-expected') || '[]');
    var groups = box.getAttribute('data-groups');
    var sel = box.querySelector('.wt-group');
    if (groups && sel) expected = JSON.parse(groups)[sel.value] || expected;
    var anyOf = box.getAttribute('data-any-of') === '1';
    var typed = normalise(box.querySelector('textarea').value);
    var out = box.querySelector('.wt-result');
    if (typed.length === 0) { out.innerHTML = '<p>Type or paste the names first.</p>'; return false; }
    var lower = {};
    expected.forEach(function (e) { lower[e.toLowerCase().replace(/\\s+/g, '')] = e; });
    var matched = [], nearly = [], extra = [];
    typed.forEach(function (t) {
      if (expected.indexOf(t) >= 0) matched.push(t);
      else if (lower[t.toLowerCase().replace(/\\s+/g, '')]) nearly.push(t + ' should be ' + lower[t.toLowerCase().replace(/\\s+/g, '')]);
      else extra.push(t);
    });
    var missing = expected.filter(function (e) { return matched.indexOf(e) < 0; });
    var pass = anyOf ? (matched.length > 0 && nearly.length === 0 && extra.length === 0) : (missing.length === 0 && nearly.length === 0);
    var html = '';
    if (matched.length) html += '<p class="ok">Matches the brief: ' + matched.map(code).join(', ') + '.</p>';
    if (nearly.length) html += '<p class="miss">Nearly, and nearly is not the same to a builder: ' + nearly.map(code).join('; ') + '. Capital letters, underscores and spaces all count.</p>';
    if (!anyOf && missing.length) html += '<p class="miss">Still missing: ' + missing.map(code).join(', ') + '.</p>';
    if (extra.length) html += '<p class="extra">Not in your brief: ' + extra.map(code).join(', ') + '. ' + (anyOf ? 'Pick one of the names above.' : 'Either it is a screen with the wrong name, or it is decoration, or it is a feature nobody has a story for yet. The last one is a conversation with your builders.') + '</p>';
    if (pass) html += '<p class="ok"><strong>That matches. Press Done, next.</strong></p>';
    out.innerHTML = html;
    var step = box.closest('.wt-step');
    setReady(step, pass);
    state.local[step.getAttribute('data-id')] = { text: box.querySelector('textarea').value, pass: pass, group: sel ? sel.value : undefined };
    persistLocal();
    return pass;
  }

  function code(s) { var d = document.createElement('code'); d.textContent = s; return d.outerHTML; }

  function setReady(step, ready) {
    var next = step.querySelector('.wt-next');
    if (next) next.className = 'wt-next' + (ready ? ' ready' : '');
  }

  function checkTicks(step) {
    var boxes = step.querySelectorAll('.wt-ticks input, .wt-card-ticks input');
    var all = boxes.length > 0;
    var ticked = [];
    Array.prototype.forEach.call(boxes, function (b, i) { if (!b.checked) all = false; else ticked.push(i); });
    setReady(step, all);
    state.local[step.getAttribute('data-id')] = { ticked: ticked };
    persistLocal();
  }

  function checkConnections(step) {
    var box = step.querySelector('.wt-connections');
    if (!box) return;
    var buttons = JSON.parse(box.getAttribute('data-buttons') || '[]');
    var sels = box.querySelectorAll('select');
    var answers = {}, nowhere = [], blank = 0;
    Array.prototype.forEach.call(sels, function (s) {
      var b = buttons[Number(s.getAttribute('data-i'))];
      answers[b.name] = s.value;
      if (!s.value) blank++;
      else if (s.value === 'Nowhere yet') nowhere.push(b.name);
    });
    var out = box.querySelector('.wt-result');
    var html = '';
    if (blank) html += '<p>' + blank + ' button' + (blank === 1 ? ' has' : 's have') + ' no answer yet.</p>';
    if (nowhere.length) html += '<p class="miss">Nowhere yet: ' + nowhere.map(code).join(', ') + '. Write each one on its card as a finding. It is a hole in the plan, not in your design.</p>';
    if (!blank && buttons.length) html += '<p class="ok"><strong>Every button has an answer. Now draw the noodles, one per row.</strong></p>';
    if (out) out.innerHTML = html;
    setReady(step, !blank);
    state.local[step.getAttribute('data-id')] = { answers: answers };
    persistLocal();
  }

  function promptFor(card, screen) {
    var story = (card && card.story) || 'As a user, I want to use ' + product + '.';
    var who = (story.match(/^as (an? [^,]+),/i) || [])[1] || 'a user';
    var want = (story.match(/i want (?:to )?([^,]+?)(?:,\\s*so that|$)/i) || [])[1] || story;
    var why = (story.match(/so that (.+?)\\.?$/i) || [])[1] || '';
    var lines = (card && card.criteria && card.criteria.length ? card.criteria : ['the thing this screen is for']).map(function (c) { return '- ' + c; }).join('\\n');
    return 'Design the ' + screen + ' screen of an app called ' + product + '.\\n\\n' +
      'The user is ' + who + '.\\nThey want to ' + want.replace(/^to /, '') + (why ? ', so that ' + why : '') + '.\\n\\n' +
      'On this screen you can see:\\n' + lines + '\\n\\n' +
      'Keep it simple: one column, things stacked down the page, real words not placeholder text. Mobile width. No decoration, no animation, no illustrations.';
  }

  function setupPrompt(step) {
    var box = step.querySelector('.wt-prompt');
    if (!box) return;
    var cardSel = box.querySelector('.wt-prompt-card');
    var screenSel = box.querySelector('.wt-prompt-screen');
    var pre = box.querySelector('.wt-prompt-text');
    cardSel.innerHTML = cards.length ? cards.map(function (c, i) { return '<option value="' + i + '">Card ' + c.number + ': ' + esc(c.title) + '</option>'; }).join('') : '<option value="">No cards yet</option>';
    screenSel.innerHTML = screens.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('');
    function update() {
      var c = cards[Number(cardSel.value)];
      pre.textContent = promptFor(c, screenSel.value);
      state.local.card = cardSel.value;
      state.local.screen = screenSel.value;
      persistLocal();
      setReady(step, true);
    }
    if (state.local.card !== undefined) cardSel.value = state.local.card;
    if (state.local.screen !== undefined) screenSel.value = state.local.screen;
    cardSel.addEventListener('change', update);
    screenSel.addEventListener('change', update);
    box.querySelector('.wt-copy').addEventListener('click', function () {
      var t = pre.textContent;
      var done = function () { box.querySelector('.wt-copied').hidden = false; };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, done); else done();
    });
    update();
  }

  function setupCardTicks(step) {
    var box = step.querySelector('.wt-card-ticks');
    if (!box) return;
    var pick = box.querySelector('.wt-card-pick');
    var list = box.querySelector('.wt-card-list');
    if (!cards.length) { list.innerHTML = '<p>Your team has no build cards yet. Check the screen against your product plan instead, then press Done, next.</p>'; setReady(step, true); return; }
    var sel = document.createElement('select');
    sel.innerHTML = cards.map(function (c, i) { return '<option value="' + i + '">Card ' + c.number + ': ' + esc(c.title) + '</option>'; }).join('');
    if (state.local.card !== undefined) sel.value = state.local.card;
    pick.appendChild(sel);
    function render() {
      var c = cards[Number(sel.value)] || cards[0];
      list.innerHTML = c.criteria.length ? c.criteria.map(function (x, i) { return '<label class="wt-tick"><input type="checkbox" data-i="' + i + '" /> <span>' + esc(x) + '</span></label>'; }).join('') : '<p>This card has no Done when lines. Pick another, or ask your builders to finish it.</p>';
      Array.prototype.forEach.call(list.querySelectorAll('input'), function (b) { b.addEventListener('change', function () { checkTicks(step); }); });
      checkTicks(step);
    }
    sel.addEventListener('change', function () { state.local.card = sel.value; persistLocal(); render(); });
    render();
  }

  function restore(step) {
    var id = step.getAttribute('data-id');
    var mine = state.local[id];
    if (!mine) return;
    var ta = step.querySelector('.wt-names textarea');
    if (ta && mine.text !== undefined) {
      ta.value = mine.text;
      var g = step.querySelector('.wt-group');
      if (g && mine.group) g.value = mine.group;
      if (mine.pass) checkNames(step.querySelector('.wt-names'));
    }
    if (mine.ticked) {
      var boxes = step.querySelectorAll('.wt-ticks input');
      Array.prototype.forEach.call(boxes, function (b, i) { b.checked = mine.ticked.indexOf(i) >= 0; });
      if (boxes.length) checkTicks(step);
    }
    if (mine.answers) {
      Array.prototype.forEach.call(step.querySelectorAll('.wt-connections select'), function (s) {
        var buttons = JSON.parse(step.querySelector('.wt-connections').getAttribute('data-buttons') || '[]');
        var b = buttons[Number(s.getAttribute('data-i'))];
        if (b && mine.answers[b.name] !== undefined) s.value = mine.answers[b.name];
      });
      checkConnections(step);
    }
    var note = step.querySelector('.wt-note textarea');
    if (note && mine.note !== undefined) note.value = mine.note;
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ---- wire every step ---- */

  steps.forEach(function (step) {
    var id = step.getAttribute('data-id');
    var kind = step.querySelector('.wt-check').getAttribute('data-kind');

    Array.prototype.forEach.call(step.querySelectorAll('.wt-track'), function (b) {
      b.addEventListener('click', function () {
        state.track = b.getAttribute('data-track');
        state.done.start = true;
        persistLocal();
        post({ track: state.track });
        show(firstOpen());
      });
    });

    var namesBox = step.querySelector('.wt-names');
    if (namesBox) {
      namesBox.querySelector('.wt-check-btn').addEventListener('click', function () { checkNames(namesBox); });
      namesBox.querySelector('textarea').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) checkNames(namesBox); });
      var g = namesBox.querySelector('.wt-group');
      if (g) g.addEventListener('change', function () { namesBox.querySelector('.wt-result').innerHTML = ''; setReady(step, false); });
    }
    Array.prototype.forEach.call(step.querySelectorAll('.wt-ticks input'), function (b) { b.addEventListener('change', function () { checkTicks(step); }); });
    Array.prototype.forEach.call(step.querySelectorAll('.wt-connections select'), function (s) { s.addEventListener('change', function () { checkConnections(step); }); });
    if (kind === 'prompt') setupPrompt(step);
    if (kind === 'card-ticks') setupCardTicks(step);
    if (kind === 'confirm') setReady(step, true);
    var note = step.querySelector('.wt-note textarea');
    if (note) note.addEventListener('input', function () { state.local[id] = { note: note.value }; persistLocal(); setReady(step, note.value.trim().length > 0); });

    var back = step.querySelector('.wt-back');
    if (back) back.addEventListener('click', function () {
      var list = visible();
      var i = list.indexOf(step);
      if (i > 0) show(list[i - 1].getAttribute('data-id'));
    });
    var next = step.querySelector('.wt-next');
    if (next) next.addEventListener('click', function () {
      var saved = step.querySelector('.wt-saved');
      if (namesBox && !checkNames(namesBox)) {
        saved.textContent = 'The names above do not match yet. You can go on anyway, and this step stays open in the list.';
      } else {
        saved.textContent = '';
      }
      var ready = next.className.indexOf('ready') >= 0;
      if (ready) {
        markDone(id).then(function (r) {
          saved.textContent = r && r.ok === false ? 'Saved on this Chromebook only.' : '';
        });
      }
      var list = visible();
      var i = list.indexOf(step);
      if (i < list.length - 1) show(list[i + 1].getAttribute('data-id'));
      else show(id);
    });

    var form = step.querySelector('.wt-ask');
    if (form) {
      var thread = step.querySelector('.wt-thread');
      var history = [];
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('textarea');
        var button = form.querySelector('button');
        var q = input.value.trim();
        if (!q) return;
        input.value = '';
        button.disabled = true;
        bubble(thread, 'you', q);
        var pending = bubble(thread, 'helper', 'Thinking...');
        fetch('/api/trail-crew/ask', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ team: team, mode: 'design', question: q, history: history, step: id })
        }).then(function (r) { return r.json(); }).then(function (data) {
          var text = data.answer || data.error || 'Something went wrong. Ask your teacher.';
          pending.textContent = text;
          if (data.answer) { history.push({ role: 'user', content: q }); history.push({ role: 'assistant', content: data.answer }); history = history.slice(-6); }
        }).catch(function () { pending.textContent = 'I could not reach the helper. Check you are online, then ask your teacher.'; })
          .then(function () { button.disabled = false; });
      });
    }
  });

  function bubble(thread, who, text) {
    var el = document.createElement('div');
    el.className = 'ask-bubble ask-' + who;
    el.textContent = text;
    thread.appendChild(el);
    return el;
  }

  var sw = root.querySelector('.wt-track-switch button');
  if (sw) sw.addEventListener('click', function () { show('start'); });

  /* ---- load the team's progress, then show the right step ---- */

  fetch('/api/trail-crew/walkthrough?team=' + encodeURIComponent(team))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data && (data.track || (data.done && data.done.length))) {
        if (data.track) state.track = data.track;
        (data.done || []).forEach(function (id) { state.done[id] = true; });
        if (state.track) state.done.start = true;
        persistLocal();
      }
    })
    .catch(function () {})
    .then(function () { show(state.current && visible().some(function (s) { return s.getAttribute('data-id') === state.current; }) ? state.current : firstOpen()); });
})();
`;

export interface WalkthroughPageOptions {
  slug: string;
  /** The team's design brief page, for the last step's link. */
  designHref?: string;
}

/**
 * The page body: the rail, the steps, the finish panel, the styles and the
 * script. The host wraps it in the shared page shell with the chain across
 * the top.
 */
export function renderWalkthroughBody(w: Walkthrough, options: WalkthroughPageOptions): string {
  const designHref = options.designHref ?? "design.html";
  return `<style>${CSS}</style>
<div class="wt" data-team="${escapeHtml(options.slug)}" data-design-href="${escapeHtml(designHref)}" data-product="${escapeHtml(w.productName)}" data-cards="${attr(w.cards)}" data-screens="${attr(w.screens)}">
  <aside class="wt-rail" aria-label="Steps">
    <h2>Steps</h2>
    <ol id="wt-rail"></ol>
    <p class="wt-track-switch" hidden><span></span> <button type="button">Change</button></p>
  </aside>
  <div class="wt-main">
    <main>
      ${w.steps.map((s) => stepHtml(s, options.slug)).join("\n")}
      <div class="wt-finish" hidden>
        <h2>That is the handover.</h2>
        <p>When your teacher runs the review, a <strong>Design review</strong> page appears in your chain and says exactly what your file and your documents still disagree on. Fix what it names, share again from your <a href="${escapeHtml(designHref)}">design brief</a>, and the list gets shorter. When it is empty, your design is the one that gets built.</p>
      </div>
    </main>
  </div>
</div>
<script>${SCRIPT}</script>`;
}
