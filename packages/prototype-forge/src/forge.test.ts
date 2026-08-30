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
  const levels = app.notes.filter((n) => n.level === "gap").map((n) => n.message);
  assert.ok(levels.some((m) => /purpose/i.test(m)));
  assert.ok(levels.some((m) => /users/i.test(m)));
  assert.ok(levels.some((m) => /features/i.test(m)));
  assert.ok(levels.some((m) => /user stories/i.test(m)));
  assert.ok(app.screens.length >= 3, "home, who this is for, and how this was made still render");
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
