import assert from "node:assert/strict";
import { test } from "node:test";
import { __test__, loadPlants } from "./plant-showcase";

const { parseBlocks, parseGrowthLog, splitSections, parseFrontMatter } = __test__;

test("front matter keeps colons inside the value", () => {
  const meta = parseFrontMatter(["name: Sunchoke", "warning: Do not eat: really"]);
  assert.equal(meta.name, "Sunchoke");
  assert.equal(meta.warning, "Do not eat: really");
});

test("wrapped bullet lines rejoin into one item", () => {
  const blocks = parseBlocks([
    "- Blooms blue in late",
    "  spring and into June.",
    "- Has a shrubby appearance.",
  ]);
  assert.deepEqual(blocks, [
    {
      kind: "bullets",
      items: ["Blooms blue in late spring and into June.", "Has a shrubby appearance."],
    },
  ]);
});

test("numbered steps and bullets stay separate blocks", () => {
  const blocks = parseBlocks(["- a bullet", "1. a step"]);
  assert.deepEqual(blocks.map((b) => b.kind), ["bullets", "steps"]);
});

test("a blank line ends a paragraph", () => {
  const blocks = parseBlocks(["One sentence", "still the same one.", "", "A new one."]);
  assert.deepEqual(blocks, [
    { kind: "paragraph", text: "One sentence still the same one." },
    { kind: "paragraph", text: "A new one." },
  ]);
});

test("subheadings are their own block", () => {
  const blocks = parseBlocks(["### Fast facts", "- Zones 3 to 9"]);
  assert.deepEqual(blocks[0], { kind: "heading", text: "Fast facts" });
});

test("sections split on level two headings and lowercase their keys", () => {
  const sections = splitSections(["## About", "text", "## Growth log", "more"]);
  assert.deepEqual([...sections.keys()], ["about", "growth log"]);
  assert.deepEqual(sections.get("about"), ["text"]);
});

test("growth entries parse a date, a title and a photo, newest first", () => {
  const entries = parseGrowthLog(
    [
      "### 2026-09-08 First sprouts",
      "photo: sprouts.jpg",
      "Two shoots broke the soil.",
      "",
      "### 2026-09-15 True leaves",
      "It doubled in a week.",
    ],
    "black-eyed-susan",
  );

  assert.equal(entries.length, 2);
  assert.equal(entries[0].date, "2026-09-15", "newest entry comes first");
  assert.equal(entries[1].title, "First sprouts");
  assert.equal(entries[1].photoName, "sprouts.jpg");
  // The file is not on disk in the test run, so no public path is produced.
  assert.equal(entries[1].photo, undefined);
  assert.deepEqual(entries[1].blocks, [
    { kind: "paragraph", text: "Two shoots broke the soil." },
  ]);
});

test("an entry with no photo line is still an entry", () => {
  const entries = parseGrowthLog(["### 2026-10-01 Budding", "First flower bud."], "x");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].photoName, undefined);
});

test("undated headings in the growth log are ignored", () => {
  assert.deepEqual(parseGrowthLog(["### Someday", "text"], "x"), []);
});

test("the real content parses, and unfinished plants are flagged", () => {
  const plants = loadPlants();
  assert.ok(plants.length >= 9, "every plant file loads");

  for (const plant of plants) {
    assert.ok(plant.name.length > 0, `${plant.slug} has a name`);
    assert.ok(plant.about.length > 0, `${plant.slug} has an about section`);
  }

  const rhododendron = plants.find((p) => p.slug === "rhododendron");
  assert.ok(rhododendron, "rhododendron is present");
  assert.ok(
    rhododendron.missing.includes("care"),
    "the rhododendron care page is reported missing rather than faked",
  );

  const strawberry = plants.find((p) => p.slug === "woodland-strawberry");
  assert.ok(strawberry?.missing.includes("care"));
});

test("teacher notes never reach the rendered content", () => {
  // The Notes section holds source Drive file IDs and open questions about
  // students' work. It is for the teacher and must not be published.
  const rendered = JSON.stringify(loadPlants());
  assert.ok(!rendered.includes("Drive `"), "no Drive file IDs in rendered content");
  assert.ok(
    !rendered.includes("Source photo"),
    "no source-document references in rendered content",
  );
});
