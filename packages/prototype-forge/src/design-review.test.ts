/**
 * The review reads a designer's file against their team's documents and
 * tells them what disagrees. The cases are the disagreements a real file has:
 * a card with no page, a frame with the wrong name, a state nobody drew, a
 * layer still called Rectangle 12, and a number a design tool invented.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { parseArchitecture } from "./design";
import { parseCards } from "./cards";
import { parseStories } from "./parse";
import { outlineFromMetadata, renderDesignReview, reviewDesign, splitFrameName, type FigmaOutline } from "./design-review";

const ARCH = `# Classic Cars: build architecture

## Screens to create

| Form name | What it is |
|---|---|
| \`Cars\` | The list |
| \`Builder\` | Pick upgrades |

## Components to create

**Cars:** \`rp_cars\` (RepeatingPanel) with \`lbl_car_name\` and \`img_car\` inside

**Builder:** \`lbl_total_hp\`, \`chk_turbo\`, \`btn_reset\`
`;

const CARDS = `# Cards

## Card 1: Car gallery

**Your story.** As a fan, I want to see cars, so that I can compare them.

**Done when:**
- [ ] Every car shows its name

## Card 2: Horsepower builder

**Your story.** As a fan, I want to pick upgrades, so that I see horsepower change.

**Done when:**
- [ ] The total updates
`;

const STORIES = `# Stories

## Car gallery

As a fan, I want to see cars, so that I can compare them.

  - Every car shows its name and its 300 horsepower
`;

const GOOD: FigmaOutline = {
  pages: [
    { name: "Cover", frames: [{ name: "Cover", layers: ["title"], texts: ["Classic Cars"] }] },
    {
      name: "Card 1 · Car gallery",
      frames: [
        { name: "Cars", layers: ["rp_cars", "lbl_car_name", "img_car"], texts: ["Mustang"] },
        { name: "Cars / empty", layers: ["lbl_empty"], texts: ["No cars yet"] },
        { name: "Cars / error", layers: ["lbl_error"], texts: ["Could not load"] },
      ],
    },
    {
      name: "Card 2 · Horsepower builder",
      frames: [
        { name: "Builder", layers: ["lbl_total_hp", "chk_turbo", "btn_reset"], texts: ["300"] },
        { name: "Builder / empty", layers: [], texts: [] },
        { name: "Builder / error", layers: [], texts: [] },
      ],
    },
  ],
};

function review(outline: FigmaOutline) {
  return reviewDesign({
    spec: parseArchitecture(ARCH),
    cards: parseCards(CARDS),
    stories: parseStories(STORIES),
    documentsText: STORIES,
    outline,
  });
}

test("splitFrameName reads a state suffix and leaves a plain name alone", () => {
  assert.deepEqual(splitFrameName("Builder / empty"), { base: "Builder", state: "empty" });
  assert.deepEqual(splitFrameName("Builder/wrong"), { base: "Builder", state: "error" });
  assert.deepEqual(splitFrameName("Builder"), { base: "Builder" });
});

test("a file that follows the handover page has nothing to fix", () => {
  const r = review(GOOD);
  assert.deepEqual(r.findings, []);
  assert.ok(r.done.some((d) => /Every one of your 2 build cards has a page/.test(d)));
  assert.ok(r.done.some((d) => /Every screen in your brief has a frame/.test(d)));
  assert.ok(r.done.some((d) => /Every component in your brief/.test(d)));
  assert.equal(r.counts.matched, 6);
});

test("a card with no page and a screen with no frame are blocking, in that order", () => {
  const r = review({
    pages: [{ name: "Screens", frames: [{ name: "Cars", layers: ["rp_cars", "lbl_car_name", "img_car"], texts: [] }] }],
  });
  assert.equal(r.findings[0].level, "blocking");
  assert.match(r.findings[0].title, /No page is named after a build card/);
  assert.ok(r.findings.some((f) => f.level === "blocking" && /1 screen has no frame: Builder/.test(f.title)));
  assert.ok(r.findings.some((f) => f.level === "later" && /not named after a card: Screens/.test(f.title)));
});

test("missing states, missing components, stray names and default names are found", () => {
  const r = review({
    pages: [
      {
        name: "Card 2 · Horsepower builder",
        frames: [{ name: "Builder", layers: ["lbl_total_hp", "chk_nitro", "Rectangle 12", "Frame 214"], texts: [] }],
      },
      { name: "Card 1 · Car gallery", frames: [{ name: "Cars", layers: ["rp_cars", "lbl_car_name", "img_car"], texts: [] }] },
    ],
  });
  const titles = r.findings.map((f) => f.title);
  assert.ok(titles.some((t) => /2 screens have no empty state/.test(t)));
  assert.ok(titles.some((t) => /2 screens have no error state/.test(t)));
  assert.ok(titles.some((t) => /Builder is missing chk_turbo, btn_reset/.test(t)));
  assert.ok(titles.some((t) => /chk_nitro on Builder/.test(t)));
  assert.ok(titles.some((t) => /2 layers still have Figma's default name: Rectangle 12, Frame 214/.test(t)));
});

test("placeholder text and made-up numbers are named, real numbers are not", () => {
  const r = review({
    pages: [
      {
        name: "Card 1 · Car gallery",
        frames: [{ name: "Cars", layers: ["rp_cars", "lbl_car_name", "img_car"], texts: ["Lorem ipsum", "Join 18,000 fans", "300 hp"] }],
      },
      { name: "Card 2 · Horsepower builder", frames: [{ name: "Builder", layers: ["lbl_total_hp", "chk_turbo", "btn_reset"], texts: [] }] },
    ],
  });
  const titles = r.findings.map((f) => f.title);
  assert.ok(titles.some((t) => /placeholder: "Lorem ipsum"/.test(t)));
  const numbers = r.findings.find((f) => /numbers? on the frames/.test(f.title));
  assert.ok(numbers);
  assert.match(numbers.title, /18,000/);
  assert.doesNotMatch(numbers.title, /300/);
});

test("the page names the one next thing and tables every card and screen", () => {
  const r = review({ pages: [{ name: "Card 1 · Car gallery", frames: [{ name: "Cars", layers: [], texts: [] }] }] });
  const md = renderDesignReview(r, { productName: "Classic Cars", teamName: "Classic Cars", reviewedOn: "2026-09-14" });
  assert.match(md, /^# Classic Cars: design review/);
  assert.match(md, /## The one next thing\n\n\*\*1 of your 2 build cards has no page: Card 2\./);
  assert.match(md, /\| Card 2: Horsepower builder \| none \|/);
  assert.match(md, /\| `Builder` \| none \|/);
  assert.match(md, /handover\.html/);
});

test("an outline is read out of the connector's metadata XML", () => {
  const xml = `<page name="Card 2 · Horsepower builder" type="CANVAS">
  <frame id="1:2" name="Builder" type="FRAME" width="360" height="640">
    <text id="1:3" name="lbl_total_hp" type="TEXT" characters="300"/>
    <instance id="1:4" name="chk_turbo" type="INSTANCE">
      <vector id="1:5" name="Vector" type="VECTOR"/>
    </instance>
    <rectangle id="1:6" name="Rectangle 12" type="RECTANGLE"/>
  </frame>
  <frame id="1:7" name="Builder / empty" type="FRAME"><text name="Nothing picked yet" type="TEXT"/></frame>
</page>`;
  const outline = outlineFromMetadata([{ pageName: "Card 2 · Horsepower builder", xml }]);
  assert.equal(outline.pages.length, 1);
  assert.deepEqual(
    outline.pages[0].frames.map((f) => f.name),
    ["Builder", "Builder / empty"],
  );
  assert.deepEqual(outline.pages[0].frames[0].layers, ["lbl_total_hp", "chk_turbo", "Vector", "Rectangle 12"]);
  assert.deepEqual(outline.pages[0].frames[0].texts, ["300"]);
  assert.deepEqual(outline.pages[0].frames[1].texts, ["Nothing picked yet"]);
});
