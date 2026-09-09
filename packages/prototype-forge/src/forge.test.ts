/**
 * The cases here are the ones that came out of running real classroom writing
 * through the parser, not invented edge cases. Every one of them silently
 * produced a wrong coach note before it was fixed, which is the worst possible
 * failure for this tool: it tells a team they left something out when they did
 * not.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { joinWrappedLines, parseBrief, parseStories, parseTeamDocs } from "./parse";
import { planPrototype } from "./plan";
import { renderPrototype } from "./render";
import { forgePrototype } from "./index";
import { parseArchitecture, renderDesignBrief } from "./design";
import { renderMarkdown } from "./markdown";
import { findGaps, renderGapGuide } from "./gap-guide";
import {
  checkStory,
  isComplete,
  renderStory,
  testPlanFor,
  renderTestPlan,
  planFromStory,
  suggestPatterns,
  renderCodeDirections,
  type StoryDraft,
} from "./story-kit";

// ---------------------------------------------------------------------------
// Soft wrapping
// ---------------------------------------------------------------------------

test("a story wrapped across two lines is read as one story", () => {
  const stories = parseStories(
    [
      "As a student, I want to see when my bus is coming, so",
      "that I stop waiting outside in the rain.",
    ].join("\n"),
  );
  assert.equal(stories.length, 1);
  assert.equal(stories[0].want, "See when my bus is coming");
  assert.equal(stories[0].soThat, "I stop waiting outside in the rain");
  assert.equal(stories[0].scenarios.length, 0);
});

test("wrapping does not swallow the Given/When/Then lines below a story", () => {
  const stories = parseStories(
    [
      "As a student, I want to save my work, so that I do not lose it.",
      "  Given I have typed something",
      "  When I close the app",
      "  Then my work is still there when I come back",
    ].join("\n"),
  );
  assert.equal(stories.length, 1);
  assert.equal(stories[0].scenarios.length, 1);
  assert.equal(stories[0].scenarios[0].when, "I close the app");
  assert.equal(stories[0].scenarios[0].then, "my work is still there when I come back");
});

test("joinWrappedLines leaves headings and bullets alone", () => {
  const out = joinWrappedLines(["## Features", "- One", "- Two", "", "A sentence that", "wraps."].join("\n"));
  assert.equal(out, ["## Features", "- One", "- Two", "", "A sentence that wraps."].join("\n"));
});

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

test("a role written without an article is still a story", () => {
  const stories = parseStories("As front office staff, I want to see every route on one screen.");
  assert.equal(stories.length, 1);
  assert.equal(stories[0].role, "front office staff");
});

test("a missing so-that clause is left missing rather than guessed", () => {
  const stories = parseStories("As a parent, I want to know the bus is late.");
  assert.equal(stories[0].soThat, undefined);
});

test("plain bullets under a story count as acceptance criteria", () => {
  const stories = parseStories(
    ["As a student, I want to pick my stop, so that the app knows my route.", "- I can search the stop list", "- The app remembers my choice"].join("\n"),
  );
  assert.equal(stories[0].scenarios.length, 2);
  assert.equal(stories[0].scenarios[0].raw, "I can search the stop list");
});

test("a story is filed under the heading it was written beneath", () => {
  const stories = parseStories(
    ["## Delay alerts", "", "As a driver, I want to report a delay, so that riders know."].join("\n"),
  );
  assert.equal(stories[0].featureHint, "Delay alerts");
});

test("a Scenario heading is chrome, not a feature name", () => {
  const stories = parseStories(
    ["## Bus tracker", "### Scenario", "As a student, I want a countdown, so that I know when to leave."].join("\n"),
  );
  assert.equal(stories[0].featureHint, "Bus tracker");
});

// ---------------------------------------------------------------------------
// The plan document
// ---------------------------------------------------------------------------

const PLAN = `# Bus Buddy

Team: Sample Team

## Purpose

Students wait outside for buses that are late.

## Who are the users

**Students:** They want to know when the bus arrives.

**Parents:** They want to stop calling the school.

## Product description

A phone app that shows where school buses are.

## Features

**Bus tracker:** Shows the countdown to your stop.

**Ride history:** A record of buses a student rode.
`;

test("the plan is read out of whatever headings the team used", () => {
  const brief = parseBrief(PLAN);
  assert.equal(brief.productName, "Bus Buddy");
  assert.equal(brief.teamName, "Sample Team");
  assert.match(brief.purpose, /^Students wait outside/);
  assert.equal(brief.description, "A phone app that shows where school buses are.");
  assert.deepEqual(brief.users.map((u) => u.name), ["Students", "Parents"]);
  assert.deepEqual(brief.features.map((f) => f.name), ["Bus tracker", "Ride history"]);
});

test("headings in other wordings still land in the right place", () => {
  const brief = parseBrief(
    ["# Thing", "## Why we are building this", "To help people.", "## What it does", "- Sends alerts", "## Audience", "- Teachers"].join("\n"),
  );
  assert.equal(brief.purpose, "To help people.");
  assert.deepEqual(brief.features.map((f) => f.name), ["Sends alerts"]);
  assert.deepEqual(brief.users.map((u) => u.name), ["Teachers"]);
});

test("a plan with no title falls back to the folder name", () => {
  const brief = parseBrief("## Purpose\n\nSomething.", "period-3-team-4");
  assert.equal(brief.productName, "period-3-team-4");
});

test("stories written inside the plan are found when there is no stories file", () => {
  const { stories } = parseTeamDocs({
    planMarkdown: `${PLAN}\n## User stories\n\nAs a student, I want a countdown, so that I know when to leave.\n`,
  });
  assert.equal(stories.length, 1);
});

// ---------------------------------------------------------------------------
// Planning
// ---------------------------------------------------------------------------

test("a feature with no story becomes an empty screen and a coach note", () => {
  const brief = parseBrief(PLAN);
  const stories = parseStories(
    ["## Bus tracker", "As a student, I want a countdown to my stop, so that I know when to leave."].join("\n"),
  );
  const app = planPrototype(brief, stories);

  const screen = app.screens.find((s) => s.title === "Ride history");
  assert.ok(screen, "the unwritten feature still gets a screen");
  assert.equal(screen?.subtitle, "Waiting on a user story");
  assert.ok(
    app.notes.some((n) => n.level === "gap" && n.where === "Ride history"),
    "and a note naming it",
  );
});

test("a story matching no feature gets its own screen rather than being dropped", () => {
  const brief = parseBrief(PLAN);
  const stories = parseStories("As a student, I want to trade lunch snacks, so that I eat something I like.");
  const app = planPrototype(brief, stories);

  const orphan = app.screens.find((s) => s.subtitle === "Not in your feature list");
  assert.ok(orphan);
  assert.ok(app.notes.some((n) => n.level === "tip" && /does not match any feature/.test(n.message)));
});

test("a When clause becomes a control and the Then clause is what it says back", () => {
  const brief = parseBrief(PLAN);
  const stories = parseStories(
    [
      "## Bus tracker",
      "As a student, I want a countdown, so that I know when to leave.",
      "  Given I have set my stop",
      "  When I tap refresh",
      "  Then I see the minutes until my bus arrives",
    ].join("\n"),
  );
  const app = planPrototype(brief, stories);
  const screen = app.screens.find((s) => s.title === "Bus tracker");
  const button = screen?.elements.find((e) => e.kind === "button");

  assert.ok(button && button.kind === "button");
  assert.equal(button.label, "Tap refresh");
  assert.equal(button.says, "Then: I see the minutes until my bus arrives");
});

test("a story with no acceptance criteria says so on the screen", () => {
  const brief = parseBrief(PLAN);
  const stories = parseStories("## Bus tracker\nAs a student, I want a countdown, so that I know when to leave.");
  const app = planPrototype(brief, stories);
  const screen = app.screens.find((s) => s.title === "Bus tracker");

  assert.ok(screen?.elements.some((e) => e.kind === "note" && /no acceptance criteria/.test(e.text)));
  assert.ok(app.notes.some((n) => n.level === "gap" && /acceptance criteria/.test(n.message)));
});

test("an empty plan produces a prototype that explains what is missing", () => {
  const app = planPrototype(parseBrief("", "team-one"), []);
  const gaps = app.notes.filter((n) => n.level === "gap").map((n) => n.message);

  // One note about the missing plan, not one per missing section. Four lines
  // all saying "there is no plan" is a panel nobody reads.
  const planGaps = gaps.filter((m) => /product plan|purpose|users|features/i.test(m));
  assert.equal(planGaps.length, 1);
  assert.match(planGaps[0], /no product plan here/);
  assert.ok(gaps.some((m) => /No user stories/i.test(m)));
  assert.ok(app.screens.length >= 3, "home, who this is for, and how this was made still render");
});

test("one slip repeated across stories is reported once, not once per story", () => {
  const brief = parseBrief(PLAN);
  const stories = parseStories(
    [
      "## Bus tracker",
      "As a user, I want a countdown, so that I know when to leave.",
      "As a user, I want alerts, so that I am not surprised.",
      "As a user, I want a map, so that I can see the bus.",
    ].join("\n"),
  );
  const app = planPrototype(brief, stories);
  const generic = app.notes.filter((n) => /generic "user"/.test(n.message));

  assert.equal(generic.length, 1, "one note covering all three stories");
  assert.match(generic[0].message, /Students, Parents/, "and it names who they should have written for");
});

test("the same brief always plans the same prototype", () => {
  const brief = parseBrief(PLAN);
  const stories = parseStories("## Bus tracker\nAs a student, I want a countdown, so that I know when to leave.");
  assert.deepEqual(planPrototype(brief, stories), planPrototype(brief, stories));
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

test("student writing cannot inject markup into the prototype", () => {
  const { html } = forgePrototype({
    planMarkdown: '# <img src=x onerror="alert(1)">\n\n## Purpose\n\n<script>alert(2)</script>',
    fallbackName: "team",
  });
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes("<script>alert(2)"));
  assert.ok(html.includes("&lt;script&gt;alert(2)&lt;/script&gt;"));
});

test("the rendered document is self contained", () => {
  const app = planPrototype(parseBrief(PLAN), parseStories("As a student, I want a countdown, so that I know."));
  const html = renderPrototype(app);
  assert.match(html, /^<!doctype html>/);
  assert.ok(!/<link[^>]+href="http/.test(html), "no external stylesheet");
  assert.ok(!/<script[^>]+src=/.test(html), "no external script");
});

test("every navigation target exists as a screen", () => {
  const { app, html } = forgePrototype({
    planMarkdown: PLAN,
    storiesMarkdown: [
      "## Bus tracker",
      "As a student, I want a countdown, so that I know when to leave.",
      "  When I tap refresh",
      "  Then I see the ride history for my student",
    ].join("\n"),
  });
  const ids = new Set(app.screens.map((s) => s.id));
  const targets = [...html.matchAll(/data-goto="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(targets.length > 0);
  for (const target of targets) assert.ok(ids.has(target), `dangling link to ${target}`);
});

test("a story role is matched to the plan's user type despite the plural", () => {
  const brief = parseBrief(PLAN);
  const stories = parseStories(
    ["## Bus tracker", "As a student, I want a countdown, so that I know when to leave."].join("\n"),
  );
  const app = planPrototype(brief, stories);
  const screen = app.screens.find((s) => s.title === "Bus tracker");

  // The plan says "Students", the story says "student". The switcher offers the
  // plan's wording, so that is what the screen has to carry.
  assert.deepEqual(screen?.roles, ["Students"]);
  assert.ok(app.roles.some((r) => r.name === "Students"));
  assert.ok(
    !app.notes.some((n) => /not in your users list/.test(n.message)),
    "and it is not reported as an unknown user",
  );
});

test("stories still drive a usable prototype when no plan was handed in", () => {
  // A team wrote their stories before the plan. Without features there is no
  // feature screen to navigate to, and every story screen would fall out of the
  // navigation, leaving them a prototype they cannot open.
  const stories = parseStories(
    [
      "As a runner, I want to track my miles, so that I can see progress.",
      "  When I finish a run",
      "  Then the app shows my distance",
      "",
      "As a user, I want to chat with friends, so that I can share achievements.",
      "  When I post to the chatroom",
      "  Then my friends can see it",
    ].join("\n"),
  );
  const app = planPrototype(parseBrief("", "period-1"), stories);
  const inNav = app.screens.filter((s) => s.inNav).map((s) => s.title);

  assert.ok(inNav.some((t) => /track my miles/i.test(t)), "the story screens are the navigation");
  assert.ok(inNav.some((t) => /chat with friends/i.test(t)));
  assert.ok(
    app.notes.some((n) => n.level === "gap" && /no product plan/.test(n.message)),
    "and one note explains why, instead of one per story",
  );
  assert.ok(!app.notes.some((n) => /does not match any feature/.test(n.message)));
});

test("an If line is read as a condition on the When, not as prose", () => {
  const stories = parseStories(
    [
      "As a user, I want a weekly plan, so that I can train around the weather.",
      "  Given I am on the fitness plan page",
      "  When I see the generated weekly plan",
      "  If the user clicks decline",
      "  Then the generated weekly plan will not appear",
    ].join("\n"),
  );
  assert.equal(stories[0].scenarios.length, 1, "one scenario, not three fragments");
  assert.equal(stories[0].scenarios[0].when, "I see the generated weekly plan, the user clicks decline");
  assert.equal(stories[0].scenarios[0].then, "the generated weekly plan will not appear");
});

test("a story split over the template's three blank lines is still one story", () => {
  // This is the shape the handed-in templates actually have: the narrative is
  // three separate lines because the template put three blanks on three lines.
  const stories = parseStories(
    ["Narrative:", "As an app user", "I want to check the weather", "So that I can see if it is okay to go outside"].join("\n"),
  );
  assert.equal(stories.length, 1);
  assert.equal(stories[0].role, "app user");
  assert.equal(stories[0].want, "Check the weather");
  assert.equal(stories[0].soThat, "I can see if it is okay to go outside");
});

test("a long role does not silently discard the story", () => {
  const stories = parseStories(
    "As a person who is trying to log in or sign up for a TrailRider app, I want to sign in, so that I can explore.",
  );
  assert.equal(stories.length, 1, "the story survives");
  assert.equal(stories[0].role, "person who is trying to log in or sign up for a TrailRider app");
});

test("a sentence introducing a list is not read as an item in it", () => {
  const brief = parseBrief(
    [
      "# Thing",
      "## Who are the users",
      "Mountain bikers, hikers, and sellers.",
      "",
      "**Mountain bikers:** They want trails.",
      "",
      "**Sellers:** They want to list gear.",
    ].join("\n"),
  );
  assert.deepEqual(brief.users.map((u) => u.name), ["Mountain bikers", "Sellers"]);
});

test("the generic-role note stays quiet when there is no plan to compare against", () => {
  // With no plan the roles fall back to the stories' own roles, so this note
  // would advise a team to stop writing "user" and write "user" instead.
  const stories = parseStories("As a user, I want to sign up, so that I can track my fitness.");
  const app = planPrototype(parseBrief("", "period-1"), stories);
  assert.ok(!app.notes.some((n) => /generic "user"/.test(n.message)));
});

test("the view-as switcher offers roles the stories actually used", () => {
  // The plan names "Students"; the story is written for a "parent". Offering
  // only the plan's list would give a switcher that hides every screen.
  const brief = parseBrief(PLAN);
  const stories = parseStories("## Bus tracker\nAs a parent, I want a countdown, so that I know when to walk down.");
  const app = planPrototype(brief, stories);

  assert.ok(app.viewAs.includes("Parents"), "the plan's own wording is used where it matches");
  assert.deepEqual(app.roles.map((r) => r.name), ["Students", "Parents"], "the who-this-is-for screen still shows only the plan");

  const stories2 = parseStories("## Bus tracker\nAs a bus driver, I want to report a delay, so that riders know.");
  const app2 = planPrototype(brief, stories2);
  assert.ok(app2.viewAs.includes("bus driver"), "a role the plan never named is still selectable");
  assert.ok(!app2.roles.some((r) => r.name === "bus driver"));
});

test("a truncated label keeps its ellipsis and ends on a word", () => {
  const brief = parseBrief(PLAN);
  const stories = parseStories(
    [
      "## Bus tracker",
      "As a student, I want a countdown, so that I know when to leave.",
      "  When I receive a message and coordinate with the driver about my stop",
      "  Then I see the time",
    ].join("\n"),
  );
  const screen = planPrototype(brief, stories).screens.find((s) => s.title === "Bus tracker");
  const button = screen?.elements.find((e) => e.kind === "button");

  assert.ok(button && button.kind === "button");
  assert.ok(button.label.endsWith("..."), `expected an ellipsis, got ${JSON.stringify(button.label)}`);
  assert.ok(!/\s\.\.\.$/.test(button.label), "no space before the ellipsis");
  assert.ok(!/\w\.\.\.$/.test(button.label.replace(/^.*\s/, "")) || button.label.split(" ").length > 1);
});

test("one incidental shared word does not file a story under the wrong feature", () => {
  const brief = parseBrief(
    [
      "# TrailRider",
      "## Features",
      "**Shop:** A shop where riders can sell biking related stuff like gloves.",
      "**Trail map:** A map with a bunch of trails and reviews.",
    ].join("\n"),
  );
  // "biking" is the only word this sign-in story shares with the shop.
  const stories = parseStories(
    "As a person signing up, I want to sign in, so that someone interested in mountain biking can log in.",
  );
  const app = planPrototype(brief, stories);
  const shop = app.screens.find((s) => s.title === "Shop");

  assert.equal(shop?.subtitle, "Waiting on a user story", "the shop did not absorb it");
  assert.ok(app.screens.some((s) => s.subtitle === "Not in your feature list"), "it got its own screen");
});

test("a plan that never names the product says so", () => {
  const brief = parseBrief("## Purpose\n\nTo teach people math.\n\n## Features\n\n- Quizzes", "period-7-orangutan");
  assert.equal(brief.productName, "period-7-orangutan");
  assert.equal(brief.productNameIsFallback, true);

  const app = planPrototype(brief, []);
  assert.ok(
    app.notes.some((n) => n.level === "gap" && /never names the product/.test(n.message)),
    "the fallback title is explained rather than looking like a bug in the tool",
  );
});

test("a named product is not reported as unnamed", () => {
  const brief = parseBrief("# GAMEHACK\n\n## Purpose\n\nHelp people beat games.", "period-7-gamehack");
  assert.equal(brief.productName, "GAMEHACK");
  assert.ok(!brief.productNameIsFallback);
  assert.ok(!planPrototype(brief, []).notes.some((n) => /never names the product/.test(n.message)));
});

test("an unnamed product falls back to the team name, not a folder slug", () => {
  const brief = parseBrief(
    ["# Product Plan", "", "Team: Team Orangutan", "", "## Purpose", "", "To teach people math."].join("\n"),
    "period-7-orangutan",
  );
  assert.equal(brief.productName, "Team Orangutan", "a name they wrote beats the folder name");
  assert.equal(brief.productNameIsFallback, true, "and it is still reported as unnamed");
});

test("the handout's title is not mistaken for the product's name", () => {
  // Students write on top of the template they were handed, so plans routinely
  // open "# Your Template". Taken as a name, that lands on the gallery card and
  // silences the note asking them to name what they are building.
  for (const title of ["Your Template", "App Product Plan", "Product Plan", "Untitled document"]) {
    const brief = parseBrief(`# ${title}\n\nTeam: The Lions\n\n## Purpose\n\nTo help.`, "period-7-x");
    assert.equal(brief.productName, "The Lions", `"${title}" should not become the product name`);
    assert.equal(brief.productNameIsFallback, true);
  }

  const real = parseBrief("# GAMEHACK\n\n## Purpose\n\nTo help.", "period-7-x");
  assert.equal(real.productName, "GAMEHACK");
  assert.ok(!real.productNameIsFallback);
});

test("a plan with many unwritten features gets one note, not one per feature", () => {
  const features = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"];
  const brief = parseBrief(
    ["# Thing", "## Features", ...features.map((f) => `**${f}:** Does ${f} things.`)].join("\n"),
  );
  const app = planPrototype(brief, []);
  const featureGaps = app.notes.filter((n) => /has no user story|have no user story/.test(n.message));

  assert.equal(featureGaps.length, 1, "one note, not six");
  assert.match(featureGaps[0].message, /6 of your 6 features/);
  for (const f of features) assert.ok(featureGaps[0].message.includes(f), `${f} is named`);
});

test("a handful of unwritten features are still named one by one", () => {
  const brief = parseBrief(
    ["# Thing", "## Features", "**Alpha:** a.", "**Beta:** b."].join("\n"),
  );
  const gaps = planPrototype(brief, []).notes.filter((n) => /has no user story/.test(n.message));
  assert.equal(gaps.length, 2);
});

test("a long prose user type is cut at a clause, not mid-phrase", () => {
  const brief = parseBrief(
    [
      "# Thing",
      "## Who are the users",
      "Everyone and anyone, specifically anyone who wants a combination of the apps listed above and features too.",
    ].join("\n"),
  );
  assert.deepEqual(brief.users.map((u) => u.name), ["Everyone and anyone"]);
  assert.match(brief.users[0].description ?? "", /combination of the apps/);
});

test("an unnamed product does not render as X by X", () => {
  const brief = parseBrief("# Your Template\n\nTeam: Team Orangutan\n\n## Purpose\n\nMath.", "period-7-x");
  const html = renderPrototype(planPrototype(brief, []));
  assert.match(html, /<title>Team Orangutan<\/title>/);
  assert.ok(!html.includes("Team Orangutan by Team Orangutan"));
});

test("a drafted document does not claim nothing was invented", () => {
  // The coach panel's opening line is the reason the notes are trusted. When a
  // team's documents were drafted with their teacher rather than written by
  // them, that line would be a lie, and the whole system's credibility rests on
  // it being true everywhere else.
  const own = parseBrief(PLAN);
  assert.ok(!own.isDraft);
  assert.match(renderPrototype(planPrototype(own, [])), /with nothing invented/);

  const drafted = parseBrief(PLAN.replace("Team: Sample Team", "Team: Sample Team\n\nDraft: true"));
  assert.equal(drafted.isDraft, true);
  const html = renderPrototype(planPrototype(drafted, []));
  assert.ok(!html.includes("with nothing invented"), "the promise is withdrawn");
  assert.match(html, /drafted with your teacher/);
});

// ---------------------------------------------------------------------------
// The design brief
//
// Every case here is a real shape found in the eleven architecture documents,
// not an invented one. Two of them were bugs: a plural type in brackets, and a
// dropdown whose bracket listed its choices after a colon.
// ---------------------------------------------------------------------------

const ARCH = `# Thing: build architecture

## Screens to create

| Form name | What it is | Who sees it |
|---|---|---|
| \`SignIn\` | Sign in or continue as guest | Everyone |
| \`Board\` | The totals | Everyone |

## Components to create, with the exact names to use

**SignIn**
- \`btn_sign_in\` (Button)

**Board**
- \`rp_houses\` (RepeatingPanel) with an item template containing
  \`lbl_house_name\` and \`lbl_house_points\` (Labels)
- \`btn_add\` (Button, hidden from students)

## Data tables

- **houses**: \`name\` (text)
`;

test("the screens table becomes the frame list, third column and all", () => {
  const spec = parseArchitecture(ARCH);
  assert.equal(spec.screens.length, 2);
  assert.equal(spec.screens[0].form, "SignIn");
  assert.equal(spec.screens[0].audience, "Everyone");
  assert.equal(spec.screens[1].what, "The totals");
});

test("a plural type in brackets is still a type, not a note", () => {
  // "(Labels)" covers two components at once, and read literally it made
  // lbl_house_points a component of unknown type with the note "Labels".
  const board = parseArchitecture(ARCH).screens[1];
  const points = board.components[0].children[1];
  assert.equal(points.name, "lbl_house_points");
  assert.equal(points.type, "Label");
  assert.equal(points.note, undefined);
});

test("a bracket that lists choices after a colon still yields the type", () => {
  // "(DropDown: Heated, Chilled, Neither)" split on the comma first, which left
  // the head as "DropDown: Heated" and matched nothing.
  const spec = parseArchitecture(
    "## Screens\n\n| Form name | What it is |\n|---|---|\n| `Opt` | Options |\n\n" +
      "## Components\n\n**Opt:** `dd_box` (DropDown: Heated, Chilled, Neither)\n",
  );
  const dd = spec.screens[0].components[0];
  assert.equal(dd.type, "DropDown");
  assert.equal(dd.note, "Heated, Chilled, Neither");
});

test("what follows a `with` belongs to the component just before it", () => {
  // A repeating panel is one row design, and getting this wrong tells a
  // designer to draw three separate things when they should draw one.
  const spec = parseArchitecture(
    "## Screens\n\n| Form name | What it is |\n|---|---|\n| `Chat` | Messages |\n\n" +
      "## Components\n\n**Chat:** `txt_message` (TextBox), `btn_post`, `rp_messages`\n" +
      "(RepeatingPanel) with `lbl_message_line` inside\n",
  );
  const c = spec.screens[0].components;
  assert.deepEqual(c.map((x) => x.name), ["txt_message", "btn_post", "rp_messages"]);
  assert.equal(c[0].children.length, 0, "the first component is not the parent");
  assert.deepEqual(c[2].children.map((x) => x.name), ["lbl_message_line"]);
});

test("a semicolon ends the repeating row", () => {
  const spec = parseArchitecture(
    "## Screens\n\n| Form name | What it is |\n|---|---|\n| `Q` | Quiz |\n\n" +
      "## Components\n\n**Q:** `rp_questions` with `lbl_line`; `btn_finish`\n",
  );
  const c = spec.screens[0].components;
  assert.deepEqual(c.map((x) => x.name), ["rp_questions", "btn_finish"]);
  assert.deepEqual(c[0].children.map((x) => x.name), ["lbl_line"]);
});

test("the type is read off the prefix when the document does not give one", () => {
  const spec = parseArchitecture(
    "## Screens\n\n| Form name | What it is |\n|---|---|\n| `A` | A |\n\n" +
      "## Components\n\n**A:** `btn_go`, `lbl_x`, `chk_y`, `img_z`, `weird_one`\n",
  );
  const c = spec.screens[0].components;
  assert.deepEqual(
    c.map((x) => x.type),
    ["Button", "Label", "CheckBox", "Image", "Unknown"],
  );
  assert.equal(c[0].inferredType, true);
});

test("the brief names the team's own error label rather than lecturing generally", () => {
  const brief = renderDesignBrief(parseArchitecture(ARCH), { productName: "Thing" });
  assert.match(brief, /`btn_add`/);
  assert.match(brief, /hidden from students/);
  assert.match(brief, /`rp_houses` repeats/);
  // No lbl_error in this architecture, so it must say so rather than invent one.
  assert.match(brief, /no place to show an error yet|nowhere to say no|somewhere to say no/);
});

test("the brief never emits an HTML entity the renderer will escape", () => {
  // `&nbsp;` for the nesting indent arrived on the page as literal text,
  // because the markdown renderer escapes ampersands. Caught by rendering it.
  const brief = renderDesignBrief(parseArchitecture(ARCH), { productName: "Thing" });
  assert.ok(!brief.includes("&nbsp;"));
  assert.ok(!renderMarkdown(brief).includes("&amp;nbsp;"));
});

test("a repeating panel with nothing in it is flagged, not silently drawn", () => {
  const spec = parseArchitecture(
    "## Screens\n\n| Form name | What it is |\n|---|---|\n| `T` | Detail |\n\n" +
      "## Components\n\n**T:** `lbl_name`, `rp_reviews`\n",
  );
  const brief = renderDesignBrief(spec, { productName: "Thing" });
  assert.match(brief, /does not say what goes in each row/);
});

test("components on a form with no row in the screens table are reported", () => {
  const spec = parseArchitecture(
    "## Screens\n\n| Form name | What it is |\n|---|---|\n| `A` | A |\n\n" +
      "## Components\n\n**A:** `btn_a`\n\n**Ghost:** `btn_b`\n",
  );
  assert.deepEqual(spec.orphanForms, ["Ghost"]);
  assert.match(renderDesignBrief(spec, { productName: "Thing" }), /could not work out/);
});

test("the palette table lists only the components this team actually uses", () => {
  const brief = renderDesignBrief(parseArchitecture(ARCH), { productName: "Thing" });
  assert.match(brief, /\| Button \|/);
  assert.match(brief, /\| RepeatingPanel \|/);
  assert.ok(!brief.includes("| Canvas |"), "an unused component is not explained");
});

test("an image on its own line becomes a captioned figure", () => {
  // The build guides now carry diagrams, and a diagram with no caption is a
  // picture nobody can describe, so the alt text does both jobs.
  const html = renderMarkdown("Words.\n\n![How a noodle works](/build/figma/connection.svg)\n\nMore words.");
  assert.match(html, /<figure><img src="\/build\/figma\/connection.svg" alt="How a noodle works"/);
  assert.match(html, /<figcaption>How a noodle works<\/figcaption>/);
  assert.ok(!html.includes("<p><img"), "a lone image is a figure, not a paragraph");
});

test("an image inside a sentence stays inline, and is not read as a link", () => {
  const html = renderMarkdown("Click ![the icon](/i.svg) there.");
  assert.match(html, /<p>Click <img src="\/i.svg" alt="the icon"[^>]*\/> there.<\/p>/);
  assert.ok(!html.includes("<a href"), "the bang means image, not link");
});

test("markup inside a code span is left alone", () => {
  // Anvil forms really do take `**properties`, so the bold rule eating the
  // stars turned a correct line of a student's code guide into nonsense.
  const html = renderMarkdown("Put `**properties` last, **always**.");
  assert.match(html, /<code>\*\*properties<\/code>/);
  assert.match(html, /<strong>always<\/strong>/);
});

test("a code span does not swallow a link or emphasis after it", () => {
  const html = renderMarkdown("`a_b` and *this* and [x](/y)");
  assert.match(html, /<code>a_b<\/code>/);
  assert.match(html, /<em>this<\/em>/);
  assert.match(html, /<a href="\/y">x<\/a>/);
});

test("two code spans on one line both survive", () => {
  const html = renderMarkdown("`self.item` is not `self.item_row`.");
  assert.match(html, /<code>self.item<\/code> is not <code>self.item_row<\/code>/);
});

test("a link still works next to image syntax", () => {
  const html = renderMarkdown("See [the guide](/build/prototype-steps.html).");
  assert.match(html, /<a href="\/build\/prototype-steps.html">the guide<\/a>/);
});

test("a wrapped list item stays inside its list", () => {
  // Every one of these documents wraps at eighty columns, so most long bullets
  // are two lines. The second line was escaping the list and rendering as a
  // paragraph hanging underneath it, on every architecture page in the repo.
  const html = renderMarkdown(
    ["- **Smart animate** works by matching layers that have", "  identical names in two frames."].join("\n"),
  );
  assert.match(html, /<li><strong>Smart animate<\/strong> works by matching layers that have identical names in two frames.<\/li>/);
  assert.ok(!html.includes("<p>"), "the wrapped half is not a paragraph");
});

test("a wrapped numbered item stays inside its list", () => {
  const html = renderMarkdown(["1. First line of the item", "   and its second line."].join("\n"));
  assert.match(html, /<ol>\s*<li>First line of the item and its second line.<\/li>\s*<\/ol>/);
});

test("a wrapped task item keeps its text inside the checkbox label", () => {
  const html = renderMarkdown(["- [ ] One frame per screen, named exactly as", "  your design brief names it"].join("\n"));
  assert.match(html, /named exactly as your design brief names it<\/span><\/label><\/li>/);
});

test("a wrapped blockquote is one quote, not one per line", () => {
  // A four line aside was rendering as four stacked boxes, which reads as four
  // separate remarks rather than one paragraph.
  const html = renderMarkdown(["> **A note.** They are diagrams, drawn", "> to show you where things are."].join("\n"));
  assert.equal(html.match(/<blockquote>/g)?.length, 1);
  assert.match(html, /drawn to show you where things are/);
});

test("a quote ends at whatever comes next", () => {
  const html = renderMarkdown(["> Quoted line.", "## A heading", "Plain text."].join("\n"));
  assert.match(html, /<blockquote>Quoted line.<\/blockquote>\s*<h2>A heading<\/h2>/);
  assert.equal(html.match(/<blockquote>/g)?.length, 1);
});

// ---------------------------------------------------------------------------
// Story kit
//
// The cases here run on the real stories these teams handed in, because the
// whole claim of this feature is that a test plan derived by rule tells a team
// something true about their own writing.
// ---------------------------------------------------------------------------

const DRAFT: StoryDraft = {
  title: "Add points",
  role: "a teacher",
  want: "add points to a house",
  soThat: "students can see their house going up during the week",
  criteria: ["A teacher can add up to 50 points at a time", "The scoreboard shows the new total straight away"],
  scenarios: [{ given: "I am signed in as a teacher", when: "I add 10 points to Gryffindor", then: "the scoreboard shows 10 more" }],
};

test("a complete scenario becomes a test with both halves filled in", () => {
  const plan = testPlanFor(DRAFT);
  const fromScenario = plan.cases.find((c) => c.from === "scenario");
  assert.ok(fromScenario);
  assert.ok(fromScenario.steps, "a scenario gives you the steps");
    // "I" stays capitalised: lowercasing a Given only fixes a sentence case
  // typo, and "i am signed in" would be a new one.
  assert.match(fromScenario.steps.join(" "), /Set it up so that I am signed in as a teacher\./);
  assert.match(fromScenario.passesWhen, /scoreboard shows 10 more/i);
});

test("a criterion gives the pass condition and leaves the steps blank", () => {
  // This blank is the argument for writing scenarios, made without a speech.
  const plan = testPlanFor(DRAFT);
  const fromCriterion = plan.cases.find((c) => c.from === "criterion");
  assert.ok(fromCriterion);
  assert.equal(fromCriterion.steps, null);
  assert.match(renderTestPlan(plan), /\*\*You write this\.\*\*/);
  assert.match(renderTestPlan(plan), /A criterion tells you what has to be \*\*true\*\*/);
});

test("a rule that refuses something earns a second test that breaks it", () => {
  const plan = testPlanFor(DRAFT);
  const breaking = plan.cases.filter((c) => c.from === "break");
  assert.equal(breaking.length, 1, "only the criterion with a limit in it");
  assert.match(breaking[0].passesWhen, /refuses/);
});

test("a criterion nobody could check gets no test, and says why", () => {
  // House Points really wrote this one. It is a real thing to want and it is
  // not a test, and inventing one for it would teach the opposite lesson.
  const plan = testPlanFor({
    title: "Point animations",
    criteria: ["The animation must be entertaining to as many people as possible"],
    scenarios: [],
  });
  assert.equal(plan.cases.length, 0);
  assert.equal(plan.untestable.length, 1);
  assert.match(plan.untestable[0].why, /entertaining/);
  assert.match(renderTestPlan(plan), /no test at all/);
});

test("a criterion that says a thing must exist is not a test either", () => {
  const plan = testPlanFor({
    title: "Add points",
    criteria: ["We must have teacher accounts"],
    scenarios: [],
  });
  assert.equal(plan.untestable.length, 1);
  assert.match(plan.untestable[0].why, /thing existing rather than something happening/);
});

test("the same reason twice is grouped rather than repeated", () => {
  const plan = testPlanFor({
    title: "Cloud storage",
    criteria: ["We need to make sure teachers can put in points", "We must make sure the points are kept"],
    scenarios: [],
  });
  const md = renderTestPlan(plan);
  assert.equal(md.match(/thing existing rather than something happening/g)?.length, 1);
  assert.match(md, /No tests, because/);
});

test("a real team's stories produce a plan without throwing", () => {
  const stories = parseStories(
    [
      "# Stories",
      "",
      "## Point cap",
      "",
      "As a teacher, I want a maximum number of points, so that nobody can add a bunch at once.",
      "",
      "  - Teachers are not able to add more than 50 points per student a day",
      "  Given I tried to add more than 50 points in one day",
      "  When the cap stops me",
      "  Then I wait for the next day",
    ].join("\n"),
  );
  assert.equal(stories.length, 1);
  const plan = planFromStory(stories[0]);
  assert.equal(plan.storyTitle, "Point cap");
  // One from the scenario, one from the criterion, one for breaking the cap.
  assert.deepEqual(plan.cases.map((c) => c.from), ["scenario", "criterion", "break"]);
});

test("the checks name what is missing without writing it", () => {
  const checks = checkStory({ ...DRAFT, soThat: "" });
  const missing = checks.filter((c) => c.level === "missing");
  assert.equal(missing.length, 1);
  assert.equal(missing[0].field, "soThat");
  assert.ok(!isComplete(checks));
  assert.ok(isComplete(checkStory(DRAFT)));
});

test("a feeling word in a criterion is flagged as weak, not rejected", () => {
  const checks = checkStory({ ...DRAFT, criteria: ["The animation must be fun"] });
  const weak = checks.find((c) => c.field === "criteria" && c.level === "weak" && /fun/.test(c.message));
  assert.ok(weak, "flagged");
  assert.ok(!checks.some((c) => c.level === "missing" && c.field === "criteria"), "still counts as written");
});

test("a rendered story parses back into the story it came from", () => {
  // The round trip is the contract: an approved new story has to be
  // indistinguishable from the ones the teams typed by hand, or the parser
  // needs a special case and the two will drift.
  const markdown = `## ${DRAFT.title}\n\n${renderStory(DRAFT)}\n`;
  const [story] = parseStories(markdown);
  assert.equal(story.role, "teacher");
  assert.match(story.want, /add points to a house/i);
  assert.match(story.soThat ?? "", /students can see their house going up/i);
  const criteria = story.scenarios.filter((s) => !s.when && !s.then);
  assert.equal(criteria.length, 2);
  assert.equal(story.scenarios.filter((s) => s.when && s.then).length, 1);
});

test("suggested patterns come off the words the team actually wrote", () => {
  const hints = suggestPatterns(DRAFT);
  const numbers = hints.map((h) => h.pattern);
  assert.ok(numbers.includes(6), "up to 50 is a rule that refuses");
  assert.ok(numbers.includes(7), "add is a save");
  assert.ok(hints.every((h) => DRAFT.criteria.concat(["signed", "add", "shows"]).join(" ").toLowerCase().includes(h.because) || h.because.length > 0));
});

test("code directions ask for the architecture before any code", () => {
  const card = renderCodeDirections(DRAFT);
  assert.match(card, /## Add points/);
  assert.match(card, /- \[ \] A teacher can add up to 50 points at a time/);
  assert.match(card, /Break it on purpose/);
  assert.match(card, /Pattern 6/);
  assert.match(card, /architecture page/);
});

// ---------------------------------------------------------------------------
// The gap guide
// ---------------------------------------------------------------------------

const BRIEF = {
  productName: "House Points",
  teamName: "Bears",
  purpose: "Track house points.",
  description: "A scoreboard.",
  users: [{ name: "Teachers" }],
  features: [{ name: "Scoreboard" }, { name: "Give points" }],
};

function story(id: string, want: string, scenarios: Array<{ raw: string; when?: string; then?: string }> = []) {
  return { id, role: "teacher", want, soThat: "it works", scenarios, raw: want };
}

test("a team with a plan and no stories is told to write a story, not to name their app", () => {
  // The real failure this rule fixes: seven features, no stories, and the page
  // sent them off to think of a product name.
  const report = findGaps({
    brief: BRIEF,
    stories: [],
    notes: [
      { level: "gap", message: "Your plan never names the product.", where: "Product plan" },
      { level: "gap", message: "No user stories were found.", where: "User stories" },
    ],
  });
  assert.equal(report.stage, "stories");
  assert.match(report.next?.title ?? "", /No user stories/);
  // The plan gap is still on the page, just not in front.
  assert.ok(report.gaps.some((g) => /never names the product/.test(g.title)));
});

test("a note about a feature having no story is a story gap, not a plan gap", () => {
  const report = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to see the scoreboard", [{ raw: "it shows" }])],
    // The real note the planner emits for this, where and all.
    notes: [{ level: "gap", message: "15 features have no user story.", where: "Features" }],
    cards: "## Card 1: Scoreboard",
    architecture: "## Screens\n\n| a | b |\n\n## Components\n\n**Home**\n- `lbl_x` (Label)\n\nPatterns, in order: **8**, **9**.\n\n## Data tables\n\n- houses: name",
  });
  const gap = report.gaps.find((g) => /15 features/.test(g.title));
  assert.equal(gap?.stage, "stories");
});

test("a plan gap stops blocking once the team has moved past the plan", () => {
  const onPlan = findGaps({
    brief: { ...BRIEF, purpose: "", description: "", users: [], features: [] },
    stories: [],
    notes: [{ level: "gap", message: "There is no product plan.", where: "Product plan" }],
  });
  assert.equal(onPlan.gaps[0].weight, "blocking");

  const movedOn = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to see it", [{ raw: "it shows" }])],
    notes: [{ level: "gap", message: "Your plan never names the product.", where: "Product plan" }],
  });
  assert.equal(movedOn.gaps.find((g) => /never names/.test(g.title))?.weight, "soon");
});

test("a tip becomes a gap, because the unserved user is the finding that matters", () => {
  // Cuisinely named two kinds of user and wrote every story for neither. The
  // planner files that as a tip, and it was being dropped on the floor.
  const report = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to see it", [{ raw: "it shows" }])],
    notes: [
      { level: "tip", message: 'Every story is written for a generic "user".', where: "User stories" },
    ],
  });
  const gap = report.gaps.find((g) => /generic/.test(g.title));
  assert.equal(gap?.weight, "soon");
});

test("stories with criteria nobody could check are called out separately", () => {
  const report = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to have a nice app", [{ raw: "Good user interface" }, { raw: "Good coding" }])],
    notes: [],
  });
  assert.ok(report.gaps.some((g) => /nobody could check/.test(g.title)));
});

test("stories that save something need a table, and the architecture is checked for one", () => {
  const withoutTables = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to save my points", [{ raw: "it is still there tomorrow" }])],
    notes: [],
    cards: "## Card 1: Save",
    architecture: "## Screens\n\n| a |\n\n## Components\n\n**Home**\n- `btn_save` (Button)\n\nPattern 7.",
  });
  assert.ok(withoutTables.gaps.some((g) => /does not say where/.test(g.title)));

  const withTables = findGaps({
    ...{ brief: BRIEF, stories: [story("S1", "to save my points", [{ raw: "still there" }])], notes: [] },
    cards: "## Card 1: Save",
    architecture:
      "## Screens\n\n| a |\n\n## Components\n\n**Home**\n- `btn_save` (Button)\n\nPattern 7.\n\n## Data tables\n\n- **points**: `amount` (number)",
  });
  assert.ok(!withTables.gaps.some((g) => /does not say where/.test(g.title)));
});

test("an architecture that never names a pattern is flagged", () => {
  const report = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to see it", [{ raw: "it shows" }])],
    notes: [],
    cards: "## Card 1: See",
    architecture: "## Screens\n\n| Home |\n\n## Components\n\n**Home**\n- `lbl_x` (Label)",
  });
  assert.ok(report.gaps.some((g) => /which patterns/.test(g.title)));
});

test("a team with nothing missing is told so, and told what the page cannot see", () => {
  const report = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to see it", [{ raw: "it shows a total" }])],
    notes: [{ level: "win", message: "Every story has acceptance criteria." }],
    cards: "## Card 1: See\n## Card 2: Give",
    architecture:
      "## Screens\n\n| Home |\n\n## Components\n\n**Home**\n- `lbl_x` (Label)\n\nPatterns, in order: **8**, **9**.",
  });
  assert.equal(report.gaps.length, 0);
  assert.equal(report.next, null);
  const page = renderGapGuide(report);
  assert.match(page, /Nothing is missing that this page can see/);
  assert.match(page, /not the same as finished/);
  assert.ok(report.done.some((d) => /acceptance criteria/.test(d)));
});

test("the page never says there is 1 other things", () => {
  const report = findGaps({
    brief: BRIEF,
    stories: [],
    notes: [
      { level: "gap", message: "No user stories were found.", where: "User stories" },
      { level: "gap", message: "Your plan never names the product.", where: "Product plan" },
    ],
  });
  const page = renderGapGuide(report);
  assert.match(page, /There is one other thing/);
  assert.ok(!/There are 1 /.test(page));
});

test("the done list counts cards without claiming they came from stories", () => {
  // CTOS has four cards and two stories, which read as "4 of them" where them
  // was the stories.
  const report = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to see it", [{ raw: "shows" }])],
    notes: [],
    cards: "## Card 1: A\n## Card 2: B\n## Card 3: C\n## Card 4: D",
    architecture: "## Screens\n\n| Home |\n\n## Components\n\n**Home**\n- `lbl_x` (Label)\n\nPattern 8.",
  });
  assert.ok(report.done.some((d) => d === "You have 4 build cards, each with a finish line on it."));
});

test("features the architecture parked on purpose are listed, and not as failures", () => {
  const architecture = [
    "## The buildable slice",
    "",
    "**Stubbed, and why:**",
    "",
    "- **A real map.** It needs an outside service.",
    "  A second line of the same reason.",
    "- **Ratings and reviews.** Your plan marks this optional.",
    "",
    "## Screens to create",
    "",
    "| Home |",
    "",
    "## Components",
    "",
    "**Home**",
    "- `lbl_x` (Label)",
    "",
    "Patterns, in order: **8**, **9**.",
  ].join("\n");

  const report = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to see it", [{ raw: "it shows" }])],
    notes: [],
    cards: "## Card 1: See",
    architecture,
  });
  const parked = report.gaps.find((g) => /parked on purpose/.test(g.title));
  assert.equal(parked?.weight, "later");
  assert.match(parked?.title ?? "", /A real map, Ratings and reviews/);
  assert.ok(!/second line/.test(parked?.title ?? ""), "only the bold lead, not the reason");
  assert.match(renderGapGuide(report), /Real, and it can wait/);
});

test("the page never links to a document the team has not got", () => {
  // "It happens in your build cards" pointing at a cards.html that was never
  // rendered is a broken link on the one page a stuck team is reading.
  const report = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to see it", [{ raw: "it shows" }])],
    notes: [],
  });
  const page = renderGapGuide(report);
  assert.equal(report.pages.cards, false);
  assert.ok(!page.includes("cards.html"), "must not link to a page that does not exist");
  assert.match(page, /a session with your teacher/);
});

test("it does link to the build cards once they exist", () => {
  const report = findGaps({
    brief: BRIEF,
    stories: [story("S1", "to see it", [{ raw: "it shows" }])],
    notes: [],
    cards: "## Card 1: See",
  });
  assert.equal(report.pages.cards, true);
  assert.match(renderGapGuide(report), /\(architecture\.html\)|a session with your teacher/);
});

test("a user type named but never described survives parsing", () => {
  // Strive Fitness named three kinds of user and described one. The other two
  // were bold lines with nothing after them, which the section splitter read as
  // headings, so the users section ended at the first blank one and took every
  // item after it. The plan looked like it named one user.
  const { brief } = parseTeamDocs({
    planMarkdown: [
      "# Strive Fitness",
      "",
      "## Who are the users",
      "",
      "**Consumer:** People who want to become more active.",
      "",
      "**Content curator:**",
      "",
      "**Content creator:**",
      "",
      "## Features",
      "",
      "**Weather:** tells you if it is good outside.",
    ].join("\n"),
  });
  assert.deepEqual(
    brief.users.map((u) => u.name),
    ["Consumer", "Content curator", "Content creator"],
  );
  assert.equal(brief.features.length, 1, "the features section still parses");
});

test("a blank user type is reported rather than silently dropped", () => {
  const { brief, stories } = parseTeamDocs({
    planMarkdown: "# X\n\n## Who are the users\n\n**Consumer:** People.\n\n**Curator:**\n",
  });
  const app = planPrototype(brief, stories);
  assert.ok(
    app.notes.some((n) => n.level === "gap" && /never said who they are/.test(n.message)),
    "the blank one gets a note",
  );
});

test("a real bold subheading still divides a document", () => {
  // The fix must not turn every bold line into an item. A heading that names a
  // section of its own keeps working.
  const { brief } = parseTeamDocs({
    planMarkdown: [
      "# X",
      "",
      "**Who are the users**",
      "",
      "**Consumer:** People.",
      "",
      "**Features**",
      "",
      "**Weather:** tells you if it is good outside.",
    ].join("\n"),
  });
  assert.deepEqual(brief.users.map((u) => u.name), ["Consumer"]);
  assert.deepEqual(brief.features.map((f) => f.name), ["Weather"]);
});

test("a prose answer to 'who are the users' is not called an undescribed user", () => {
  // Bruins answered with one sentence. The parser makes that the name and
  // leaves the description empty, which looks exactly like a blank heading and
  // is not the same problem. Quoting their sentence back at them as a user they
  // failed to describe is worse than saying nothing.
  const { brief, stories } = parseTeamDocs({
    planMarkdown: "# X\n\n## Who are the users\n\nAnyone that enjoys this type of game.\n",
  });
  const app = planPrototype(brief, stories);
  assert.ok(
    !app.notes.some((n) => /never said who they are|described none of them/.test(n.message)),
    "no blank-user note for a prose answer",
  );
});

test("a sentence beginning with If is a sentence, not a When", () => {
  // Cuisinely wrote six numbered scenarios, two of which open with "If". Read
  // as Given/When/Then clauses they swallowed the scenarios either side of
  // them, and the one thing this team had ever written from the restaurant
  // owner's side disappeared into a When.
  const [story] = parseStories(
    [
      "## Delivery",
      "",
      "As a user, I want to view local restaurants, so that I can make a delivery.",
      "",
      "  1) The user wants to make a delivery order.",
      "  2) If the user wants to check the reviews, they would click reviews and ratings.",
      "  3) If a restaurant owner wants to add their business, they would use Add My Place.",
      "  4) Once you select the restaurant, below the name will be the star review.",
    ].join("\n"),
  );
  assert.equal(story.scenarios.length, 4, "all four survive");
  assert.ok(
    story.scenarios.every((s) => !s.when && !s.then),
    "none of them became a Given/When/Then",
  );
  assert.match(story.scenarios[2].raw, /restaurant owner/);
});

test("If still continues a Given/When/Then that is already open", () => {
  // Strive Fitness wrote "If the user clicks accept" underneath a When, where
  // it is a real condition on the action. That has to keep working.
  const [story] = parseStories(
    [
      "## Weather",
      "",
      "As a user, I want to check the weather, so that I know whether to go outside.",
      "",
      "  Given I am on the fitness plan page",
      "  When I see the generated weekly plan",
      "  If the user clicks accept",
      "  Then the plan appears",
    ].join("\n"),
  );
  const [scenario] = story.scenarios;
  assert.match(scenario.when ?? "", /clicks accept/);
  assert.match(scenario.then ?? "", /plan appears/);
});

test("And and But do not start a scenario either", () => {
  const [story] = parseStories(
    [
      "## A story",
      "",
      "As a user, I want a thing, so that I get a benefit.",
      "",
      "  And the app should be fast",
      "  But it should not cost anything",
    ].join("\n"),
  );
  assert.equal(story.scenarios.length, 2);
  assert.ok(story.scenarios.every((s) => !s.when && !s.then));
});
