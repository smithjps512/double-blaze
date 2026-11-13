import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, buildCarePlan, completeTask, isFinished, nextDue, schedulePlan } from "./care-plan";

test("every plan starts with the microchip and a first vet visit", () => {
  for (const species of ["dog", "cat"] as const) {
    for (const ageGroup of ["baby", "young", "adult", "senior"] as const) {
      const keys = buildCarePlan({ species, ageGroup }).map((t) => t.key);
      assert.ok(keys.includes("microchip"), `${species} ${ageGroup}`);
      assert.ok(keys.includes("first-vet"), `${species} ${ageGroup}`);
      assert.equal(new Set(keys).size, keys.length, "keys are unique");
    }
  }
});

test("heartworm is for dogs only", () => {
  assert.ok(buildCarePlan({ species: "dog", ageGroup: "adult" }).some((t) => t.key === "heartworm"));
  assert.ok(!buildCarePlan({ species: "cat", ageGroup: "adult" }).some((t) => t.key === "heartworm"));
});

test("puppies and kittens get boosters, adults get a yearly exam, seniors twice a year", () => {
  assert.ok(buildCarePlan({ species: "cat", ageGroup: "baby" }).some((t) => t.key === "booster"));
  assert.equal(buildCarePlan({ species: "dog", ageGroup: "adult" }).find((t) => t.key === "wellness")?.repeatDays, 365);
  assert.equal(buildCarePlan({ species: "dog", ageGroup: "senior" }).find((t) => t.key === "wellness")?.repeatDays, 180);
});

test("daily feeding reminders are opt-in", () => {
  const feeding = buildCarePlan({ species: "dog", ageGroup: "adult" }).find((t) => t.key === "feeding");
  assert.equal(feeding?.defaultOn, false);
});

test("tasks are sorted by first due date", () => {
  const plan = buildCarePlan({ species: "dog", ageGroup: "baby" });
  for (let i = 1; i < plan.length; i++) assert.ok(plan[i - 1].dueInDays <= plan[i].dueInDays);
});

test("nextDue rolls repeating tasks forward and leaves one-time tasks alone", () => {
  assert.equal(addDays("2026-01-30", 2), "2026-02-01");
  assert.equal(nextDue({ dueInDays: 30, repeatDays: 30 }, "2026-01-01", "2026-03-15"), "2026-04-01");
  assert.equal(nextDue({ dueInDays: 30, repeatDays: 30 }, "2026-01-01", "2026-01-15"), "2026-01-31");
  assert.equal(nextDue({ dueInDays: 30, repeatDays: 30 }, "2026-01-01", "2026-02-01"), "2026-03-02");
  assert.equal(nextDue({ dueInDays: 7, repeatDays: null }, "2026-01-01", "2026-06-01"), "2026-01-08");
});

test("schedulePlan dates every task from the adoption day and keeps opt-in tasks off", () => {
  const s = schedulePlan(buildCarePlan({ species: "dog", ageGroup: "adult" }), "2026-11-01");
  assert.equal(s.find((t) => t.key === "first-vet")?.dueOn, "2026-11-08");
  assert.equal(s.find((t) => t.key === "feeding")?.enabled, false);
  assert.equal(s.find((t) => t.key === "heartworm")?.enabled, true);
});

test("completing a repeating task moves it one interval past today; one-time tasks finish", () => {
  assert.deepEqual(completeTask({ dueOn: "2026-11-01", repeatDays: 30 }, "2026-11-05"), { dueOn: "2026-12-05", lastDoneOn: "2026-11-05" });
  const once = completeTask({ dueOn: "2026-11-08", repeatDays: null }, "2026-11-07");
  assert.equal(once.dueOn, "2026-11-08");
  assert.ok(isFinished({ repeatDays: null, lastDoneOn: once.lastDoneOn }));
  assert.ok(!isFinished({ repeatDays: 30, lastDoneOn: "2026-11-05" }));
});
