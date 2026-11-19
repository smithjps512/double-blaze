import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSignup, yearsLabel } from "./signup";
import { applyFilters, csvCell, summarize, toCsv, type SignupRow } from "./summary";

const good = {
  firstName: "  Sam ",
  lastName: "Rivera",
  grade: "7",
  positions: ["short", "pitcher", "bogus", "short"],
  yearsPlayed: "0",
  playedWhere: [],
  teamNames: "",
  notes: "",
};

test("a first-timer with a messy form is accepted and cleaned", () => {
  const r = validateSignup(good);
  assert.ok(r.ok);
  assert.equal(r.data.firstName, "Sam");
  assert.equal(r.data.grade, 7);
  assert.deepEqual(r.data.positions, ["pitcher", "short"]);
  assert.equal(r.data.yearsPlayed, 0);
  assert.equal(r.data.teamNames, null);
});

test("missing required answers each get a friendly message", () => {
  const r = validateSignup({});
  assert.ok(!r.ok);
  assert.deepEqual(Object.keys(r.errors).sort(), ["firstName", "grade", "lastName", "positions", "yearsPlayed"]);
});

test("grade must be 6, 7, or 8 and years must be 0 to 6", () => {
  for (const grade of ["5", "9", "seven"]) assert.ok(!validateSignup({ ...good, grade }).ok);
  for (const yearsPlayed of ["-1", "7", "1.5", ""]) assert.ok(!validateSignup({ ...good, yearsPlayed }).ok);
  assert.ok(validateSignup({ ...good, yearsPlayed: 6 }).ok);
});

test("long text is refused", () => {
  assert.ok(!validateSignup({ ...good, firstName: "x".repeat(51) }).ok);
  assert.ok(!validateSignup({ ...good, notes: "x".repeat(1001) }).ok);
});

test("years label", () => {
  assert.equal(yearsLabel(0), "First year");
  assert.equal(yearsLabel(1), "1 year");
  assert.equal(yearsLabel(6), "6+ years");
});

const rows: SignupRow[] = [
  { id: "1", first_name: "Sam", last_name: "R", grade: 6, positions: ["pitcher", "not_sure"], years_played: 0, played_where: [], team_names: null, notes: null, created_at: "2026-11-19T12:00:00Z" },
  { id: "2", first_name: "=HYPERLINK()", last_name: "Lee, Jr.", grade: 8, positions: ["catcher"], years_played: 4, played_where: ["little_league"], team_names: "Blue Jays", notes: 'Said "hi"', created_at: "2026-11-20T12:00:00Z" },
];

test("summary counts grades, positions, first-timers", () => {
  const s = summarize(rows);
  assert.equal(s.total, 2);
  assert.deepEqual(s.byGrade.map((g) => g.count), [1, 0, 1]);
  assert.equal(s.byPosition.find((p) => p.id === "pitcher")?.count, 1);
  assert.equal(s.firstTimers, 1);
});

test("filters", () => {
  assert.equal(applyFilters(rows, { grade: 8 }).length, 1);
  assert.equal(applyFilters(rows, { position: "pitcher" })[0].id, "1");
  assert.equal(applyFilters(rows, {}).length, 2);
});

test("csv quotes and defuses formulas", () => {
  assert.equal(csvCell("=1+1"), "'=1+1");
  assert.equal(csvCell("Lee, Jr."), '"Lee, Jr."');
  assert.equal(csvCell('a "b"'), '"a ""b"""');
  const csv = toCsv(rows);
  assert.ok(csv.startsWith("﻿Signed up,"));
  assert.ok(csv.includes("'=HYPERLINK()"));
  assert.ok(csv.includes("Pitcher; Not sure yet. I'll try anything!"));
});
