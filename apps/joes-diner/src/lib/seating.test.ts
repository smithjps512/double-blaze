import { test } from "node:test";
import assert from "node:assert/strict";
import { harness } from "./test-helpers";
import { suggest } from "./seating";
import type { SeatingChoice } from "./types";

function floor() {
  const h = harness();
  h.run({ type: "open_shift" });
  h.run({ type: "server_join", staffId: "s1", name: "Ann" });
  return h;
}

function fillTables(h: ReturnType<typeof floor>, except: string[] = []) {
  for (const code of ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110"]) {
    if (except.includes(code)) continue;
    const r = h.run({ type: "check_in", name: `T${code}`, size: 2, choice: "table", source: "staff", allHere: true });
    h.run({ type: "seat", visitId: r.visitId!, seatCodes: [code] });
  }
}

function add(h: ReturnType<typeof floor>, name: string, size: number, choice: SeatingChoice, allHere = true) {
  return h.run({ type: "check_in", name, size, choice, source: "counter", allHere }).visitId!;
}

test("table-only parties are skipped for bar seats and keep their place", () => {
  const h = floor();
  fillTables(h);
  const a = add(h, "Table person", 2, "table");
  const b = add(h, "Bar person", 2, "bar_ok");
  const s = suggest(h.state);
  assert.equal(s.find((x) => x.visitId === a), undefined);
  assert.deepEqual(s.find((x) => x.visitId === b)?.seatCodes, ["bar1", "bar2"]);
});

test("the smallest table that fits is suggested", () => {
  const h = floor();
  fillTables(h, ["104", "105"]); // 104 seats 4, 105 seats 7
  const a = add(h, "Two", 2, "table");
  assert.deepEqual(suggest(h.state)[0], { visitId: a, seatCodes: ["104"] });
});

test("a large table is held for a large party that is waiting and all here", () => {
  const h = floor();
  fillTables(h, ["105"]);
  const small = add(h, "Two", 2, "table");
  const big = add(h, "Six", 6, "table");
  const s = suggest(h.state);
  assert.equal(s.find((x) => x.visitId === small), undefined);
  assert.deepEqual(s.find((x) => x.visitId === big)?.seatCodes, ["105"]);
});

test("without a large party waiting, a small party can take the large table", () => {
  const h = floor();
  fillTables(h, ["105"]);
  const small = add(h, "Two", 2, "table");
  add(h, "Six, not here yet", 6, "table", false);
  assert.deepEqual(suggest(h.state).find((x) => x.visitId === small)?.seatCodes, ["105"]);
});

test("parties that are not all here are passed over without losing their place", () => {
  const h = floor();
  fillTables(h, ["101"]);
  add(h, "Waiting on friends", 2, "table", false);
  const next = add(h, "Ready", 2, "table");
  assert.deepEqual(suggest(h.state), [{ visitId: next, seatCodes: ["101"] }]);
});

test("seats suggested to an earlier party are not offered again", () => {
  const h = floor();
  fillTables(h, ["101"]);
  const a = add(h, "First", 2, "any");
  const b = add(h, "Second", 2, "any");
  const s = suggest(h.state);
  assert.deepEqual(s.find((x) => x.visitId === a)?.seatCodes, ["101"]);
  assert.deepEqual(s.find((x) => x.visitId === b)?.seatCodes, ["bar1", "bar2"]);
});

test("a party bigger than any table gets no suggestion", () => {
  const h = floor();
  add(h, "Ten", 10, "table");
  assert.deepEqual(suggest(h.state), []);
});
