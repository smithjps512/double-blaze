import { test } from "node:test";
import assert from "node:assert/strict";
import { applyFilters, csvField, summarize, toCsv } from "./summary";
import type { ResponseRow } from "./survey";

function row(over: Partial<ResponseRow>): ResponseRow {
  return {
    user_id: Math.random().toString(36),
    email: "a@mcps.org",
    name: "A",
    role: "teacher",
    interest_level: "in",
    interests: ["standard"],
    preferred_lot: "front",
    painter: "self",
    keep_yearly: "yes",
    price_comfort: "up_to_40",
    comments: null,
    created_at: "2026-10-07T12:00:00Z",
    updated_at: "2026-10-07T12:00:00Z",
    ...over,
  };
}

const rows = [
  row({}),
  row({ interest_level: "probably", interests: ["prime", "boss"], painter: "art_student", preferred_lot: "back" }),
  row({ interest_level: "curious", interests: [], price_comfort: "up_to_25" }),
];

test("summary counts", () => {
  const s = summarize(rows);
  assert.equal(s.total, 3);
  assert.equal(s.interested, 2);
  assert.equal(s.artStudentRequests, 1);
  assert.equal(s.bossInterest, 1);
  assert.equal(s.byLot.find((t) => t.value === "front")?.count, 2);
  assert.equal(s.byPrice.find((t) => t.value === "up_to_25")?.count, 1);
});

test("filters combine", () => {
  assert.equal(applyFilters(rows, { lot: "front" }).length, 2);
  assert.equal(applyFilters(rows, { interest: "boss" }).length, 1);
  assert.equal(applyFilters(rows, { level: "in", lot: "back" }).length, 0);
  assert.equal(applyFilters(rows, {}).length, 3);
});

test("csv quotes, escapes, and defuses formulas", () => {
  assert.equal(csvField("plain"), "plain");
  assert.equal(csvField('say "hi", ok'), '"say ""hi"", ok"');
  assert.equal(csvField("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  const csv = toCsv([row({ name: "Lee, Pat", comments: "line1\nline2" })]);
  const lines = csv.split("\r\n");
  assert.match(lines[0], /^Name,Email,Role/);
  assert.match(lines[1], /^"Lee, Pat",a@mcps.org,Teacher,I'm in,Front lot,/);
  assert.match(csv, /"line1\nline2"/);
});
