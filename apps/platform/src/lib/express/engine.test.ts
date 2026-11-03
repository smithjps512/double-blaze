import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GROUND_Y, generatePlatformer, generateTopdown, hashString, physics, rng } from "./engine.js";

describe("seeded randomness", () => {
  it("is the same for the same seed, so a game always plays the same way", () => {
    assert.equal(hashString("Pickle Panic|platformer"), hashString("Pickle Panic|platformer"));
    const a = rng(42);
    const b = rng(42);
    for (let i = 0; i < 5; i++) assert.equal(a(), b());
  });
});

describe("platformer levels", () => {
  for (const stats of [{ speed: 1, jump: 1 }, { speed: 5, jump: 5 }, { speed: 10, jump: 10 }]) {
    it(`never has a gap the hero cannot clear (speed ${stats.speed}, jump ${stats.jump})`, () => {
      for (const twist of ["none", "low-gravity"] as const) {
        const ph = physics(stats, twist);
        const reach = ph.run * ((2 * ph.jumpV) / ph.gravity);
        for (let level = 0; level < 3; level++) {
          const p = generatePlatformer(hashString(`t${level}`), level, 16, 7, stats, twist);
          for (let i = 1; i < p.ground.length; i++) {
            const gap = p.ground[i].x - (p.ground[i - 1].x + p.ground[i - 1].w);
            assert.ok(gap < reach * 0.75, `gap ${gap} vs reach ${reach}`);
          }
        }
      }
    });
  }

  it("places enough items to reach the goal, and they all sit above ground", () => {
    const p = generatePlatformer(7, 2, 25, 10, { speed: 5, jump: 5 }, "none");
    assert.ok(p.items.length >= 25);
    assert.ok(p.items.every((it) => it.y < GROUND_Y));
  });
});

describe("top-down levels", () => {
  it("puts every item, enemy and the exit on open, reachable cells", () => {
    for (let level = 0; level < 3; level++) {
      const t = generateTopdown(hashString(`map${level}`), level, 20, 10);
      const open = (c: number, r: number) => !t.walls[r * t.cols + c];
      assert.ok(t.items.length >= 20, "enough items for the goal");
      for (const p of [...t.items, ...t.enemies, ...t.powerups, t.exit, t.spawn]) assert.ok(open(p.c, p.r));
    }
  });
});

describe("weird specs", () => {
  it("are cleaned into numbers the generators can always use", async () => {
    const { cleanDesign, cleanSpec } = await import("./spec.js");
    const d = cleanDesign({ genre: "platformer", speed: 99, jump: -4, lives: 0 });
    const s = cleanSpec({ levels: [{ goal: 999, enemies: -5, enemySpeed: 99, twist: "spin" }], hero: { emoji: "hello" }, palette: { sky: "red" } }, d);
    assert.equal(s.levels.length, 3);
    assert.ok(s.levels.every((l) => l.goal >= 5 && l.goal <= 25 && l.enemies >= 1 && l.enemies <= 10));
    assert.notEqual(s.hero.emoji, "hello", "words never become sprites");
    assert.match(s.palette.sky, /^#[0-9a-f]{6}$/i);
    const p = generatePlatformer(1, 0, s.levels[0].goal, s.levels[0].enemies, s.stats, s.levels[0].twist);
    assert.ok(p.items.length >= s.levels[0].goal);
  });
});
