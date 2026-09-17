/**
 * The walkthrough is generated from a team's own brief and cards, so the
 * tests check that the team's names are the ones on the page: the first frame
 * it tells them to draw, the layers it tells them to name, the buttons it
 * asks them to connect. And that the two tracks meet.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { parseArchitecture } from "./design";
import { parseCards } from "./cards";
import {
  buildWalkthrough,
  firstScreenOf,
  guessTarget,
  renderWalkthroughBody,
  walkthroughStepText,
  walkthroughSteps,
} from "./walkthrough";

const ARCH = `# Strive Fitness: build architecture

## Screens to create

| Form name | What it is |
|---|---|
| \`SignIn\` | Sign up or sign in |
| \`Home\` | Today's plan, and buttons to the other screens |
| \`LogActivity\` | Record a run or a workout |
| \`History\` | Everything you have logged, newest first |
| \`Chatroom\` | Post a message, see everyone's messages |

## Components to create, with the exact names to use

**SignIn:** \`btn_sign_in\`

**Home:** \`dd_weather\` (DropDown), \`lbl_plan\` (Label), \`btn_log\`, \`btn_history\`, \`btn_chat\`

**LogActivity:** \`txt_miles\` (TextBox), \`txt_minutes\` (TextBox), \`btn_save_activity\`, \`lbl_error\` (Label, starts invisible)

**History:** \`rp_activities\` (RepeatingPanel) with \`lbl_activity_line\` inside

**Chatroom:** \`txt_message\` (TextBox), \`btn_post\`, \`rp_messages\` (RepeatingPanel) with \`lbl_message_line\` inside
`;

const CARDS = `# Strive Fitness: build cards

## Card 1: Sign up

**Your story.** As a user, I want to sign up, so that I can use Strive Fitness to track my steps and health.

**Done when:**
- [ ] A new person can create an account
- [ ] They can sign back in later and see their own data

## Card 2: Log an activity

**Your story.** As a runner, I want to record a run, so that I can see myself getting fitter.

**Done when:**
- [ ] You can enter miles and minutes and save them
- [ ] Typing letters instead of numbers shows a message instead of crashing
`;

const spec = parseArchitecture(ARCH);
const cards = parseCards(CARDS);
const w = buildWalkthrough({ spec, cards, productName: "Strive Fitness" });

test("the first screen is the sign-in screen when there is one", () => {
  assert.equal(firstScreenOf(spec), "SignIn");
  assert.equal(w.firstScreen, "SignIn");
  const noSignIn = parseArchitecture(ARCH.replace("| `SignIn` | Sign up or sign in |\n", "").replace("**SignIn:** `btn_sign_in`\n\n", ""));
  assert.equal(firstScreenOf(noSignIn), "Home");
});

test("a button's target is read from its name", () => {
  const screens = w.screens;
  assert.equal(guessTarget("btn_history", screens, "Home"), "History");
  assert.equal(guessTarget("btn_chat", screens, "Home"), "Chatroom");
  assert.equal(guessTarget("btn_log", screens, "Home"), "LogActivity");
  assert.equal(guessTarget("btn_back", screens, "History"), "Back");
  assert.equal(guessTarget("btn_save_activity", screens, "LogActivity"), "Stays on this screen");
  assert.equal(guessTarget("btn_post", screens, "Chatroom"), "Stays on this screen");
  assert.equal(guessTarget("btn_mystery", screens, "Home"), undefined);
});

test("both tracks start together, split, and meet at the prototype", () => {
  const ai = walkthroughSteps(w, "ai").map((s) => s.id);
  const scratch = walkthroughSteps(w, "scratch").map((s) => s.id);
  assert.equal(ai[0], "start");
  assert.equal(scratch[0], "start");
  assert.ok(ai.includes("ai-prompt") && !scratch.includes("ai-prompt"));
  assert.ok(scratch.includes("first-frame") && !ai.includes("first-frame"));
  for (const shared of ["bad-day", "first-connection", "connect-all", "flow-start", "play", "pages-cover", "share"]) {
    assert.ok(ai.includes(shared), `${shared} on the ai track`);
    assert.ok(scratch.includes(shared), `${shared} on the scratch track`);
  }
  assert.equal(ai[ai.length - 1], "share");
  assert.equal(scratch[scratch.length - 1], "share");
  const ids = w.steps.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "step ids are unique");
});

test("the steps use the team's own names", () => {
  const first = w.steps.find((s) => s.id === "first-frame")!;
  assert.match(first.title, /SignIn/);
  assert.deepEqual((first.check as { expected: string[] }).expected, ["SignIn"]);

  const frames = w.steps.find((s) => s.id === "all-frames")!;
  assert.deepEqual((frames.check as { expected: string[] }).expected, ["SignIn", "Home", "LogActivity", "History", "Chatroom"]);

  const layers = w.steps.find((s) => s.id === "layer-names")!;
  assert.deepEqual((layers.check as { expected: string[] }).expected, ["btn_sign_in"]);

  const aiLayers = w.steps.find((s) => s.id === "ai-layer-names")!;
  const groups = (aiLayers.check as { groups: Record<string, string[]> }).groups;
  assert.deepEqual(groups.History, ["rp_activities", "lbl_activity_line"]);
  assert.match(aiLayers.body, /rp_messages/);

  const badDay = w.steps.find((s) => s.id === "bad-day")!;
  const states = (badDay.check as { expected: string[] }).expected;
  assert.ok(states.includes("LogActivity / error"));
  assert.ok(states.includes("History / empty"));
  assert.equal(states.length, 10);
  assert.match(badDay.body, /lbl_error/);

  const connect = w.steps.find((s) => s.id === "connect-all")!;
  const buttons = (connect.check as { buttons: Array<{ name: string; screen: string; guess?: string }> }).buttons;
  assert.deepEqual(
    buttons.map((b) => b.name),
    ["btn_sign_in", "btn_log", "btn_history", "btn_chat", "btn_save_activity", "btn_post"],
  );
  assert.equal(buttons.find((b) => b.name === "btn_history")!.guess, "History");

  const pages = w.steps.find((s) => s.id === "pages-cover")!;
  assert.deepEqual((pages.check as { expected: string[] }).expected, ["Cover", "Card 1 · Sign up", "Card 2 · Log an activity"]);

  const words = w.steps.find((s) => s.id === "real-words")!;
  assert.match(words.body, /Typing letters instead of numbers/);
});

test("a step reads as text for the helper, with its finish line", () => {
  const text = walkthroughStepText(w, "all-frames")!;
  assert.match(text, /^Step 3 of 16: One frame per screen/);
  assert.match(walkthroughStepText(w, "start")!, /^Before you start/);
  assert.match(text, /SignIn, Home, LogActivity, History, Chatroom/);
  assert.doesNotMatch(text, /\|---/);
  assert.equal(walkthroughStepText(w, "nope"), undefined);
});

test("the page carries every step, the team's data, and no markup from names", () => {
  const nasty = parseArchitecture(ARCH.replace("`Home`", "`Ho<b>me`"));
  const html = renderWalkthroughBody(buildWalkthrough({ spec: nasty, cards, productName: "Strive <Fitness>" }), { slug: "period-1-strive-fitness" });
  assert.ok(html.includes('data-team="period-1-strive-fitness"'));
  assert.ok(html.includes('data-id="start"') && html.includes('data-id="share"'));
  assert.ok(!html.includes("<b>me"), "a screen name cannot become markup");
  assert.ok(html.includes("Strive &lt;Fitness&gt;"));
  assert.ok(html.includes("/api/trail-crew/walkthrough"));
  assert.ok(html.includes("/api/trail-crew/ask"));
  const count = (html.match(/class="wt-step"/g) ?? []).length;
  assert.equal(count, w.steps.length);
});

test("a team with one screen still gets a whole walkthrough", () => {
  const one = parseArchitecture(`# X\n\n## Screens to create\n\n| Form name | What it is |\n|---|---|\n| \`Main\` | Everything |\n\n## Components\n\n**Main:** \`btn_go\`\n`);
  const small = buildWalkthrough({ spec: one, cards: [], productName: "Tiny" });
  assert.equal(small.firstScreen, "Main");
  const other = small.steps.find((s) => s.id === "other-screens")!;
  assert.deepEqual((other.check as { items: string[] }).items, ["Main"]);
  assert.ok(renderWalkthroughBody(small, { slug: "t" }).includes('data-cards="[]"'));
  const badDay = small.steps.find((s) => s.id === "bad-day")!;
  assert.deepEqual((badDay.check as { expected: string[] }).expected, ["Main / empty", "Main / error"]);
});
