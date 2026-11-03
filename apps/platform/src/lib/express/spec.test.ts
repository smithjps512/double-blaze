import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanDesign, cleanSpec, designGaps, specFromDesign } from "./spec.js";

const D = cleanDesign({
  period: 3, initials: "jd", studio: "Pixel Pickles", gameName: "Pickle Panic", genre: "platformer", feeling: "Brave",
  heroName: "Dill", heroEmoji: "🥒", setting: "The school at night", goal: "save the pickle jar", collectName: "pickle", collectEmoji: "🥒",
  enemyName: "lunch tray", enemyEmoji: "🤖", verbs: ["run", "jump", "collect"], powerup: "double-jump", speed: 7, jump: 6, lives: 3,
  iWant: "jump over lunch trays", soThat: "save every pickle", check: "I can clear a tray in one jump",
  badGiven: "I fall off a table", badWhen: "I land on the floor", badThen: "I lose a life and restart the level", special: "",
});

describe("studio express design", () => {
  it("cleans to uppercase initials and lists nothing missing for a full design", () => {
    assert.equal(D.initials, "JD");
    assert.deepEqual(designGaps(D), []);
  });

  it("names every missing box", () => {
    const gaps = designGaps(cleanDesign({}));
    assert.ok(gaps.some((g) => /initials/.test(g)));
    assert.ok(gaps.some((g) => /player story/.test(g)));
  });

  it("keeps rude words out", () => {
    assert.equal(cleanDesign({ heroName: "kill bot" }).heroName, "");
  });
});

describe("studio express spec", () => {
  it("builds a playable spec from rules alone", () => {
    const s = specFromDesign(D);
    assert.equal(s.levels.length, 3);
    assert.equal(s.hero.name, "Dill");
    assert.equal(s.collectible.plural, "pickles");
    assert.equal(s.builtBy, "rules");
    assert.ok(s.xray.some((x) => /Bad day/.test(x.theyWrote)));
  });

  it("clamps a wild answer and keeps the student's own numbers", () => {
    const s = cleanSpec(
      {
        title: "Pickle Panic Deluxe", palette: { sky: "red", sky2: "#112233" }, hero: { emoji: "<script>" },
        levels: [{ goal: 999, enemies: -4, enemySpeed: 50, twist: "lava-floor" }], stats: { speed: 10, jump: 10, lives: 99 },
        enemies: [{ name: "Tray", emoji: "🤖", behavior: "teleport" }], builtBy: "spark",
      },
      D,
    );
    assert.equal(s.title, "Pickle Panic Deluxe");
    assert.equal(s.palette.sky2, "#112233");
    assert.notEqual(s.palette.sky, "red");
    assert.equal(s.hero.emoji, "🥒", "a non-emoji sprite falls back");
    assert.deepEqual([s.levels[0].goal, s.levels[0].enemies, s.levels[0].enemySpeed, s.levels[0].twist], [25, 1, 10, "none"]);
    assert.equal(s.levels.length, 3);
    assert.deepEqual(s.stats, { speed: 7, jump: 6, lives: 3 });
    assert.equal(s.enemies[0].behavior, "patrol");
    assert.equal(s.builtBy, "spark");
  });

  it("turns garbage into the rule build", () => {
    const s = cleanSpec("nonsense", D);
    assert.equal(s.title, "Pickle Panic");
    assert.equal(s.levels.length, 3);
  });
});
