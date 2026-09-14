import "server-only";
import { callSparkDetailed } from "./anthropic";
import { HELPER_MODEL } from "./trail-crew-helper";
import buildContext from "@/data/build-context.json";

/**
 * Spark drafts the architecture change a story needs.
 *
 * This is the one place in Trail Crew where a model writes into a team's
 * documents, and it only ever writes a draft: the result goes into the same
 * queue as the students' story proposals, the teacher reads it beside the
 * current page, edits it, and approves or rejects it. Nothing reaches the
 * repository without that.
 *
 * Why a model here and nowhere else in the chain: the card is a story with a
 * finish line and can be made by rule. The architecture is a set of decisions
 * (which screens, what to call every component, which patterns in what order)
 * and a rule cannot make them. A teacher can, but a teacher has thirteen teams,
 * and a draft that is right about the boring parts and needs one decision
 * checked is a five minute read instead of a forty minute write.
 */

interface BuildContext {
  patterns?: string;
  teams: Record<
    string,
    { productName: string; teamName?: string; plan?: string; architecture?: string; cards?: string; stories?: string }
  >;
}

const context = buildContext as BuildContext;

export interface ArchitectureDraft {
  ok: boolean;
  markdown?: string;
  reason?: "not_configured" | "unknown_team" | "failed" | "truncated";
}

const EXEMPLAR = `# Classic Cars: build architecture

Team: Classic Cars. Tool: Anvil.

Your build cards send you here. This page sends you to the Pattern Book at
\`docs/build/anvil-patterns.md\`.

## The buildable slice

**Build in this order:**

1. Car gallery
2. Parts library

## Screens to create

| Form name | What it is |
|---|---|
| \`Cars\` | The list of cool cars |
| \`CarDetail\` | One car and its stats |

## Components to create, with the exact names to use

Use these names. The Pattern Book's blanks are filled with these.

**Cars:** \`rp_cars\` (RepeatingPanel) with \`lbl_car_name\` and \`img_car\` inside

**CarDetail:** \`lbl_car_name\`, \`lbl_year\`, \`lbl_top_speed\`, \`btn_back\`

## Data tables

- **cars**: \`name\`, \`year\` (number), \`top_speed\` (number), \`special\`

## How each feature gets built

### Feature 1: Car gallery
Patterns, in order: **8**, **9**, then **1** and **4** for the detail page.

Get the cars from the server, hand them to \`rp_cars\`, and inside the item
template each copy reads \`self.item['name']\`.

## What to do when you are stuck

Work out which of the three it is, because the fix is different each time:

1. **You do not know what the app should do.** Go back to your build card.
2. **You know what it should do but not how to say it in Python.** Go to the
   Pattern Book.
3. **You know the pattern but do not know what to put in the blank.** Come back
   to this page. Every blank in the Pattern Book is a name on this page.
`;

export async function draftArchitecture(input: {
  slug: string;
  storyHeading: string;
  storyText: string;
  /** The architecture as committed right now, or undefined when there is none. */
  currentArchitecture?: string;
  /** The cards as committed after the card rewrite. */
  cardsMarkdown?: string;
  storiesMarkdown?: string;
}): Promise<ArchitectureDraft> {
  const team = context.teams?.[input.slug];
  if (!team) return { ok: false, reason: "unknown_team" };

  const fresh = !input.currentArchitecture;
  const system = `You are drafting a change to a student team's build architecture page. The team are twelve and thirteen year olds building their first app in Anvil (a Python web app builder). Their teacher will read your draft next to the current page, edit it, and approve or reject it. You are saving the teacher forty minutes of typing, not making the decisions for the team: where a decision is genuinely open, make the plainest choice and flag it in one sentence so the teacher can change it.

# What the page is

The architecture is the bridge between the build cards (what each feature is and when it is done) and the Pattern Book (the shared code, with blanks). Every blank in the Pattern Book is a name on this page. It has these sections, in this order, and the headings matter because other tools read them:

1. \`# <Product>: build architecture\`, then \`Team: <team>. Tool: Anvil.\`
2. \`## The buildable slice\`: what is built and in what order, and anything parked (stubbed) with the reason.
3. \`## Screens to create\`: a markdown table, \`| Form name | What it is |\`, one row per Form, Form names in backticks, CamelCase.
4. \`## Components to create, with the exact names to use\`: one bold line per Form, e.g. \`**Cars:** \\\`rp_cars\\\` (RepeatingPanel) with \\\`lbl_car_name\\\` inside\`. Prefixes: lbl_ Label, btn_ Button, txt_ TextBox, ta_ TextArea, dd_ DropDown, chk_ CheckBox, rp_ RepeatingPanel, img_ Image, dp_ DatePicker, card_ a ColumnPanel used as a box, fp_ FlowPanel. Every name in backticks, snake_case.
5. \`## Data tables\`: a bullet per table, \`- **name**: \\\`col\\\`, \\\`col\\\` (number)\`. Only tables the stories actually need.
6. \`## How each feature gets built\`: a \`### Feature N: <name>\` per build card, in build order, opening with \`Patterns, in order: **8**, **9**, then **1**.\` using the Pattern Book's numbers, then two or three sentences saying what those patterns do with these names. Name the one new idea in the feature if there is one.
7. \`## What to do when you are stuck\`: the three kinds of stuck. Keep it exactly as it is on the current page, or as in the example.

# The rules

- Output the COMPLETE page, ready to save, as markdown. Nothing before the first line and nothing after the last. No preamble, no fences around the whole thing, no notes to the teacher outside the page. A flag for the teacher is one sentence inside the page, in italics, starting *Teacher:*.
- Keep everything on the current page that the change does not touch, word for word. Teachers write things on these pages for their team and those paragraphs are the part worth having. You are editing, not rewriting.
- Use the names already on the page. Add new ones only for what the changed story needs, in the same style. Never rename an existing component or table: their designer's Figma layers and their code use those names.
- Component names come from the story's own criteria: a criterion that shows something is a Label, one that the user does is a Button or a box, a list is a RepeatingPanel with the row's labels inside.
- Patterns come from the Pattern Book below, by number, and only ones that exist in it.
- Plain words. Short sentences. Second person, warm, no exclamation marks, no talking down. British spelling as on the current page. No em dashes anywhere: use a comma, a colon, or a full stop.
- If the story asks for something Anvil cannot do in this class (a real map, a payment, a login with Google, a live chat with another app), put it under the buildable slice as stubbed, with the reason in one sentence, and build the part of the story that is possible.

## The Pattern Book, whose numbers you must use
${context.patterns ?? "(unavailable: do not name pattern numbers)"}

## An example of the page's shape, from another team
${EXEMPLAR}`;

  const user = `Team: ${team.teamName ?? "unknown"}. Product: ${team.productName}.

## The story that was just approved: "${input.storyHeading}"
${input.storyText}

## Their build cards as they are now
${input.cardsMarkdown ?? team.cards ?? "(No cards.)"}

## All their user stories
${input.storiesMarkdown ?? team.stories ?? "(none)"}

## Their product plan
${team.plan ?? "(none)"}

${
  fresh
    ? `## The current architecture page
This team has no architecture page yet. Write the whole thing from their cards and stories, in the shape of the example, with a feature section per card. Where the team has to decide something (which feature first, what to park), make the plain choice and flag it.`
    : `## The current architecture page, which you are editing
${input.currentArchitecture}`
}

Write the complete updated page now.`;

  const result = await callSparkDetailed({
    system,
    messages: [{ role: "user", content: user }],
    model: HELPER_MODEL,
    maxTokens: 8000,
  });

  if (!result.text) {
    return { ok: false, reason: result.stopReason === "no_key" ? "not_configured" : "failed" };
  }
  if (result.truncated) return { ok: false, reason: "truncated" };

  // Belt and braces: a page that arrives fenced is unfenced, and the first
  // line has to be the title or something went wrong upstream.
  let markdown = result.text.trim();
  const fenced = markdown.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/);
  if (fenced) markdown = fenced[1].trim();
  if (!markdown.startsWith("# ")) return { ok: false, reason: "failed" };
  return { ok: true, markdown: `${markdown.replace(/—/g, ", ")}\n` };
}
