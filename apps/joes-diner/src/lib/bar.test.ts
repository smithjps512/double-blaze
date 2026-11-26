import { test } from "node:test";
import assert from "node:assert/strict";
import { longestRun, openRuns, pickBarSeats } from "./bar";
import { DEFAULT_SEATS } from "./defaults";

const bar = (...nums: number[]) => DEFAULT_SEATS.filter((s) => s.kind === "bar" && nums.includes(s.position));

test("a party of 2 in seats 3 to 6 sits at an end, never in the middle", () => {
  assert.deepEqual(pickBarSeats(bar(3, 4, 5, 6), 2), ["bar3", "bar4"]);
});

test("a run that fits exactly is preferred", () => {
  // Runs: 1-4 and 7-8. A party of 2 takes 7-8 and leaves 1-4 together.
  assert.deepEqual(pickBarSeats(bar(1, 2, 3, 4, 7, 8), 2), ["bar7", "bar8"]);
});

test("the smallest run that fits is used, keeping big runs free", () => {
  // Runs: 1-5 and 7-9. A party of 2 starts the 3-seat run.
  assert.deepEqual(pickBarSeats(bar(1, 2, 3, 4, 5, 7, 8, 9), 2), ["bar7", "bar8"]);
});

test("no suggestion when no run is long enough", () => {
  assert.equal(pickBarSeats(bar(1, 3, 5, 7, 9), 2), null);
  assert.equal(longestRun(bar(1, 3, 5, 7, 9)), 1);
});

test("runs are found in bar order", () => {
  assert.deepEqual(
    openRuns(bar(9, 1, 2, 5)).map((r) => r.map((s) => s.position)),
    [[1, 2], [5], [9]],
  );
});
