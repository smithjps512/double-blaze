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
