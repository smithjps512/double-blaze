import { test } from "node:test";
import assert from "node:assert/strict";
import { bestRun, cleanText, elapsedMs, fmtPlace, fmtTime, officialTime, ordinal, standings, tooClose, type RaceRun } from "./model";
import { SEED } from "./seed";

const run = (over: Partial<RaceRun>): RaceRun => ({
  id: "x",
  carId: "c",
  sessionId: "A",
  clip: "IMG_0000",
  startS: 0,
  finishS: 1,
  elapsedMs: 1000,
  gateMs: null,
  quality: "ok",
  note: "",
  rerun: false,
  excluded: false,
  ...over,
});

test("seed elapsed times match the recorded elapsed_s values", () => {
  const byId = Object.fromEntries(SEED.runs.map((r) => [r.id, r.elapsedMs]));
  assert.equal(byId.r01, 1090);
  assert.equal(byId.r08, 930);
  assert.equal(byId.r11, 2280);
  assert.equal(byId.r17, 1000);
  assert.equal(SEED.runs.length, 18);
  assert.equal(elapsedMs(16.3, 17.57), 1270);
});

test("seed holds no teacher-only clothing notes", () => {
  const text = JSON.stringify(SEED).toLowerCase();
  for (const word of ["hoodie", "tee", "jersey", "polo", "sweatpants", "student in"]) {
    assert.ok(!text.includes(word), `found "${word}"`);
  }
});

test("exactly 0.05 s apart is too close to call, 0.06 s is not", () => {
  const v = (ms: number) => officialTime(run({ elapsedMs: ms }));
  assert.equal(tooClose(v(1280), v(1330)), true);
  assert.equal(tooClose(v(1270), v(1330)), false);
});

test("gate times rank to the thousandth", () => {
  const g = (ms: number) => officialTime(run({ gateMs: ms }));
  assert.equal(tooClose(g(931), g(933)), false);
  assert.equal(tooClose(g(931), g(932)), true);
  assert.equal(fmtTime(g(931)), "0.931 s");
  assert.equal(fmtTime(officialTime(run({ elapsedMs: 930 }))), "0.93 s");
});

test("best run skips slow launches and excluded runs", () => {
  const slow = run({ id: "slow", elapsedMs: 900, quality: "slow_launch" });
  const clean = run({ id: "clean", elapsedMs: 1100 });
  const gone = run({ id: "gone", elapsedMs: 800, excluded: true });
  assert.equal(bestRun([slow, clean, gone])?.id, "clean");
  assert.equal(bestRun([slow, gone])?.id, "slow");
  assert.equal(bestRun([gone]), null);
});

test("today's top five cannot be strictly ranked", () => {
  const rows = standings(SEED);
  assert.equal(rows.length, 18);
  const top = rows.slice(0, 5).map((r) => [r.car.label, r.time.ms, fmtPlace(r)]);
  assert.deepEqual(top, [
    ["Dark green", 930, "1st to 3rd"],
    ["Red", 960, "1st to 5th"],
    ["Dark (black or dark maroon)", 970, "1st to 5th"],
    ["Pink", 1000, "2nd to 5th"],
    ["Blue/white", 1010, "2nd to 5th"],
  ]);
  const last = rows[rows.length - 1];
  assert.equal(last.car.label, "Red");
  assert.equal(last.run.quality, "slow_launch");
  assert.equal(fmtPlace(last), "18th");
});

test("session filter ranks within the session only", () => {
  const rows = standings(SEED, "A");
  assert.equal(rows.length, 8);
  assert.equal(rows[0].car.label, "Dark green");
  assert.equal(fmtPlace(rows[0]), "1st to 2nd");
});

test("a car's other runs are listed and do not double count", () => {
  const day = {
    ...SEED,
    runs: [...SEED.runs, { ...SEED.runs[10], id: "r11b", elapsedMs: 1150, quality: "ok" as const, rerun: true }],
  };
  const rows = standings(day);
  assert.equal(rows.length, 18);
  const red = rows.find((r) => r.car.id === "c11")!;
  assert.equal(red.run.id, "r11b");
  assert.deepEqual(red.otherRuns.map((r) => r.id), ["r11"]);
});

test("ordinals and text cleaning", () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal), ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]);
  assert.equal(cleanText("  Fast \u2014 very   fast ", 40), "Fast , very fast");
});
