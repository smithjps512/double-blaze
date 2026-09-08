import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { replaceStoryBlock, stampRevised, appendStoryBlock } from "./trail-crew-story-file.js";

/**
 * These two functions rewrite a team's own document. Getting either wrong
 * corrupts work that thirteen year olds did by hand, so they are pure and
 * tested rather than trusted.
 */
const FILE = `# Daily user stories

Team: The Lions

## Add a habit

As a user, I want to add a habit, so that I can track it.

  - Refuse an empty name

## Tick off today

As a user, I want to tick a habit off, so that I keep my streak.

  - It stays ticked
`;

describe("replaceStoryBlock", () => {
  it("swaps one story and leaves its neighbours alone", () => {
    const out = replaceStoryBlock(FILE, "Add a habit", "As a user, I want X, so that Y.");
    assert.equal(out.ok, true);
    assert.match(out.markdown!, /## Add a habit\n\nAs a user, I want X, so that Y\./);
    assert.match(out.markdown!, /## Tick off today/);
    assert.match(out.markdown!, /It stays ticked/);
    assert.ok(!out.markdown!.includes("Refuse an empty name"), "the old body is gone");
  });

  it("replaces the last story without eating the end of the file", () => {
    const out = replaceStoryBlock(FILE, "Tick off today", "As a user, I want Z, so that W.");
    assert.equal(out.ok, true);
    assert.match(out.markdown!, /## Add a habit/);
    assert.match(out.markdown!, /Refuse an empty name/);
    assert.match(out.markdown!, /I want Z/);
  });

  it("matches the heading regardless of case and spacing", () => {
    assert.equal(replaceStoryBlock(FILE, "  add A habit ", "x").ok, true);
  });

  it("refuses rather than guessing when the heading is not there", () => {
    const out = replaceStoryBlock(FILE, "Some other story", "x");
    assert.equal(out.ok, false);
    assert.match(out.error!, /No story headed/);
  });
});

describe("stampRevised", () => {
  const when = new Date("2026-09-02T10:00:00Z");

  it("adds the date under the team line", () => {
    const out = stampRevised(FILE, when);
    assert.match(out, /Team: The Lions\n\nRevised: 2026-09-02/);
  });

  it("updates an existing stamp instead of adding a second", () => {
    const once = stampRevised(FILE, new Date("2026-08-01T00:00:00Z"));
    const twice = stampRevised(once, when);
    assert.equal((twice.match(/^Revised:/gm) ?? []).length, 1);
    assert.match(twice, /Revised: 2026-09-02/);
  });

  it("falls back to the title when there is no team line", () => {
    assert.match(stampRevised("# Stories\n\n## A\n\ntext\n", when), /# Stories\n\nRevised: 2026-09-02/);
  });
});

describe("appendStoryBlock", () => {
it("a new story is appended with its heading", () => {
  const before = "# Stories\n\nTeam: X\n\n## First\n\nAs a rider, I want a track.\n";
  const result = appendStoryBlock(before, "Second", "As a builder, I want a photo.");
  assert.ok(result.ok);
  assert.match(result.markdown ?? "", /## First[\s\S]*## Second\n\nAs a builder, I want a photo.\n$/);
});

it("a duplicate heading is refused rather than quietly doubled", () => {
  // Two stories under one heading would break replaceStoryBlock, which finds a
  // story by its heading and would then edit whichever came first.
  const before = "# Stories\n\n## Add points\n\nAs a teacher, I want to add points.\n";
  const result = appendStoryBlock(before, "add POINTS", "As a teacher, I want something else.");
  assert.equal(result.ok, false);
  assert.match(result.error ?? "", /already has a story called/);
});

it("an appended story is separated from the one before it", () => {
  const result = appendStoryBlock("## One\n\nBody.\n\n\n", "Two", "Other body.");
  assert.ok(result.ok);
  assert.ok(!/\n{4,}/.test(result.markdown ?? ""), "no run of blank lines");
});
});
