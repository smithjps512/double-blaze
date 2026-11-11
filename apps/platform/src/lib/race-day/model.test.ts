import { test } from "node:test";
import assert from "node:assert/strict";
import { hasFinals, averageSpeed, fmtSpeed, bestRun, cleanText, elapsedMs, fmtPlace, fmtTime, forStudents, namesByCar, officialTime, ordinal, standings, tooClose, type RaceRun } from "./model";
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
  stage: "prelim",
  ...over,
});

test("seed elapsed times match the recorded elapsed_s values", () => {
  const byId = Object.fromEntries(SEED.runs.map((r) => [r.id, r.elapsedMs]));
  assert.equal(byId.r01, 1090);
  assert.equal(byId.r08, 930);
  assert.equal(byId.r11, 2280);
  assert.equal(byId.r17, 1000);
  assert.equal(SEED.runs.length, 27);
  assert.equal(byId.r23, 870);
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

test("the top of the race cannot be strictly ranked", () => {
  const rows = standings(SEED);
  assert.equal(rows.length, 27);
  const top = rows.slice(0, 6).map((r) => [r.car.label, r.time.ms, fmtPlace(r)]);
  assert.deepEqual(top, [
    ["Tan/black camo", 870, "1st to 2nd"],
    ["Dark red", 900, "1st to 3rd"],
    ["Dark green", 930, "2nd to 6th"],
    ["Red", 960, "3rd to 8th"],
    ["Blue", 970, "3rd to 8th"],
    ["Dark (black or dark maroon)", 970, "3rd to 8th"],
  ]);
  const last = rows[rows.length - 1];
  assert.equal(last.car.label, "Red");
  assert.equal(last.run.quality, "slow_launch");
  assert.equal(fmtPlace(last), "27th");
});

test("teacher-confirmed cars start confirmed, everything else does not", () => {
  const confirmed = SEED.cars.filter((c) => c.confirmed).map((c) => c.id);
  assert.deepEqual(confirmed, ["c24", "c25", "c26", "c27"]);
});

test("session filter ranks within the session only", () => {
  const rows = standings(SEED, "A");
  assert.equal(rows.length, 8);
  assert.equal(rows[0].car.label, "Dark green");
  assert.equal(fmtPlace(rows[0]), "1st to 2nd");
  assert.equal(standings(SEED, "D").length, 4);
});

test("a car's other runs are listed and do not double count", () => {
  const day = {
    ...SEED,
    runs: [...SEED.runs, { ...SEED.runs[10], id: "r11b", elapsedMs: 1150, quality: "ok" as const, rerun: true }],
  };
  const rows = standings(day);
  assert.equal(rows.length, 27);
  const red = rows.find((r) => r.car.id === "c11")!;
  assert.equal(red.run.id, "r11b");
  assert.deepEqual(red.otherRuns.map((r) => r.id), ["r11"]);
});

test("ordinals and text cleaning", () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal), ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]);
  assert.equal(cleanText("  Fast \u2014 very   fast ", 40), "Fast , very fast");
});

test("students only ever see first names that have permission and a car", () => {
  const day = {
    ...SEED,
    students: [
      { id: "1", firstName: "Ana", carNote: "blue rail", carId: "c09", showName: true },
      { id: "2", firstName: "Ben", carNote: "red", carId: "c07", showName: false },
      { id: "3", firstName: "Cy", carNote: "wood", carId: null, showName: true },
    ],
  };
  const seen = forStudents(day);
  assert.deepEqual(seen.students.map((s) => s.firstName), ["Ana"]);
  assert.equal(seen.students[0].carNote, "");
  assert.ok(!JSON.stringify(seen).includes("Ben"));
  assert.ok(!JSON.stringify(seen).includes("blue rail"));
  assert.equal(namesByCar(seen).get("c09"), "Ana");
  assert.equal(namesByCar(day).get("c07"), undefined);
});

test("the repo seed holds no student names", () => {
  assert.equal(SEED.students.length, 0);
});

test("average speed over the 51 ft track", () => {
  const v = (ms: number) => officialTime(run({ elapsedMs: ms }));
  const fast = averageSpeed(v(870));
  assert.equal(fast.ftps.toFixed(1), "58.6");
  assert.equal(fast.mph.toFixed(1), "40.0");
  assert.ok(fast.mphLow < fast.mph && fast.mph < fast.mphHigh);
  assert.deepEqual(fmtSpeed(v(870)), { mph: "40 mph", ftps: "59 ft/s", range: "38 to 42 mph" });
  assert.equal(fmtSpeed(officialTime(run({ gateMs: 931 }))).mph, "37.3 mph");
  assert.equal(fmtSpeed(v(2280)).mph, "15 mph");
});

test("finals rank on their own board and never move a prelim place", () => {
  const final = (id: string, carId: string, ms: number): RaceRun => ({ ...SEED.runs[0], id, carId, sessionId: SEED.cars.find((c) => c.id === carId)!.sessionId, elapsedMs: ms, quality: "ok", stage: "final" });
  const day = { ...SEED, runs: [...SEED.runs, final("f1", "c27", 800), final("f2", "c23", 900)] };
  assert.equal(hasFinals(SEED), false);
  assert.equal(hasFinals(day), true);
  const prelims = standings(day);
  assert.equal(prelims.length, 27);
  assert.equal(prelims[0].car.id, "c23");
  assert.equal(prelims.find((r) => r.car.id === "c27")!.time.ms, 1510);
  const finals = standings(day, undefined, "final");
  assert.deepEqual(finals.map((r) => [r.car.id, r.time.ms, fmtPlace(r)]), [["c27", 800, "1st"], ["c23", 900, "2nd"]]);
});
