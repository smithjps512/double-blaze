import { test } from "node:test";
import assert from "node:assert/strict";
import { harness } from "./test-helpers";
import { defaultTurns, describeWait, learnedTurns, quote, waitFor } from "./wait";
import { DEFAULT_SETTINGS } from "./defaults";

function busy() {
  const h = harness();
  h.run({ type: "open_shift" });
  h.run({ type: "server_join", staffId: "s1", name: "Ann" });
  for (const code of ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110"]) {
    const r = h.run({ type: "check_in", name: code, size: 2, choice: "table", source: "staff", allHere: true });
    h.run({ type: "seat", visitId: r.visitId!, seatCodes: [code] });
  }
  return h;
}

test("an empty diner quotes no wait", () => {
  const h = harness();
  h.run({ type: "open_shift" });
  const q = quote(h.state, 2, defaultTurns(DEFAULT_SETTINGS), h.clock.now);
  assert.deepEqual(q, { table: 0, bar: 0 });
});

test("a full dining room quotes the next expected table, and the bar stays open", () => {
  const h = busy();
  h.minutes(10);
  const q = quote(h.state, 2, defaultTurns(DEFAULT_SETTINGS), h.clock.now);
  // Small parties turn in 35 minutes plus 5 to reset; seated 10 minutes ago.
  assert.equal(q.table, 30);
  assert.equal(q.bar, 0);
});

test("parties ahead in line push the quote out", () => {
  const h = busy();
  const turns = defaultTurns(DEFAULT_SETTINGS);
  const before = quote(h.state, 2, turns, h.clock.now).table!;
  for (let i = 0; i < 10; i++) h.run({ type: "check_in", name: `w${i}`, size: 2, choice: "table", source: "counter", allHere: true });
  const after = quote(h.state, 2, turns, h.clock.now).table!;
  assert.ok(after > before, `${after} should be more than ${before}`);
});

test("a party's own wait only counts parties ahead of it", () => {
  const h = busy();
  const turns = defaultTurns(DEFAULT_SETTINGS);
  const first = h.run({ type: "check_in", name: "first", size: 2, choice: "table", source: "counter", allHere: true }).visitId!;
  h.run({ type: "check_in", name: "second", size: 2, choice: "table", source: "counter", allHere: true });
  const v = h.state.visits.find((x) => x.id === first)!;
  assert.equal(waitFor(h.state, v, turns, h.clock.now), 40);
});

test("learned turns replace the defaults once there are enough visits", () => {
  const seatedAt = 0;
  const history = Array.from({ length: 30 }, () => ({ size: 2, seatedAt, tableReadyAt: 25 * 60_000 }));
  const t = learnedTurns(DEFAULT_SETTINGS, history);
  assert.equal(t.forSize(2), 20); // 25 minutes seated to ready, minus the 5 minute reset
  assert.equal(t.forSize(4), DEFAULT_SETTINGS.turnMinutes.medium);
  assert.equal(learnedTurns(DEFAULT_SETTINGS, history.slice(0, 5)).forSize(2), DEFAULT_SETTINGS.turnMinutes.small);
});

test("waits read as friendly ranges", () => {
  assert.equal(describeWait(0), "Seating now");
  assert.equal(describeWait(4), "About 5 minutes");
  assert.equal(describeWait(17), "About 15 to 20 minutes");
  assert.equal(describeWait(null), "Ask our staff");
});
