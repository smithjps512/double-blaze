import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { STARTER, checkRules, isLegal, parseSpec, run, thrust, type CarSpec } from "./sim.js";
import { RULES } from "./rules.js";

describe("the run", () => {
  it("lands the starter car in a real CO2 race time", () => {
    const r = run(STARTER);
    assert.ok(r.time > 1.0 && r.time < 1.6, `starter ran ${r.time}`);
    assert.equal(r.timeMs, Math.round(r.time * 1000));
  });

  it("is the same every time for the same car", () => {
    assert.equal(run(STARTER).timeMs, run({ ...STARTER }).timeMs);
  });

  it("rewards less mass, less drag and less rubbing", () => {
    const base = run(STARTER).time;
    assert.ok(run({ ...STARTER, massG: 42 }).time < base, "lighter is faster");
    assert.ok(run({ ...STARTER, profile: "block", noseMm: STARTER.heightMm }).time > base, "a block is slower");
    assert.ok(run({ ...STARTER, mods: ["graphite"] }).time < base, "graphite helps");
  });

  it("punishes a short wheelbase with a wobble", () => {
    const r = run({ ...STARTER, frontAxleMm: 70, rearAxleMm: 60 });
    assert.equal(r.wobble, true);
    assert.ok(r.time > run(STARTER).time);
  });

  it("varies with the cartridge on Race Night", () => {
    assert.ok(run(STARTER, { cartridge: 1.03 }).time < run(STARTER, { cartridge: 0.97 }).time);
  });

  it("pushes only while the cartridge is firing", () => {
    assert.equal(thrust(0), 0);
    assert.ok(thrust(0.05) > 0);
    assert.equal(thrust(1), 0);
  });
});

describe("the rules", () => {
  it("passes the starter car", () => {
    assert.equal(isLegal(STARTER), true);
  });

  it("catches a car that drills itself under the minimum mass", () => {
    const car: CarSpec = { ...STARTER, massG: RULES.mass.min + 2, mods: ["weight_holes"] };
    const mass = checkRules(car).find((r) => r.id === "mass");
    assert.equal(mass?.ok, false);
  });

  it("flags thin CO2 walls as a safety rule", () => {
    const wall = checkRules({ ...STARTER, co2WallMm: 2 }).find((r) => r.id === "co2Wall");
    assert.equal(wall?.ok, false);
    assert.equal(wall?.safety, true);
  });

  it("counts a tail fin toward height", () => {
    const tall = { ...STARTER, heightMm: RULES.height.max - 2, mods: ["tail_fin" as const] };
    assert.equal(checkRules(tall).find((r) => r.id === "height")?.ok, false);
  });
});

describe("parseSpec", () => {
  it("accepts a real car and drops duplicate mods", () => {
    const r = parseSpec({ ...STARTER, mods: ["graphite", "graphite"] });
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.car.mods, ["graphite"]);
  });

  it("refuses nonsense", () => {
    assert.equal(parseSpec(null).ok, false);
    assert.equal(parseSpec({ ...STARTER, massG: 0.1 }).ok, false);
    assert.equal(parseSpec({ ...STARTER, profile: "rocket" }).ok, false);
    assert.equal(parseSpec({ ...STARTER, mods: ["jet_engine"] }).ok, false);
    assert.equal(parseSpec({ ...STARTER, frontAxleMm: 140, rearAxleMm: 140 }).ok, false);
  });
});
