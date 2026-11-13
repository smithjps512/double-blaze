import { test } from "node:test";
import assert from "node:assert/strict";
import { groupByAdoption, needsReminder, type ReminderRow } from "./reminders";

const row = (o: Partial<ReminderRow>): ReminderRow => ({
  id: "t",
  adoptionId: "a",
  kind: "vet",
  title: "First vet visit",
  dueOn: "2026-11-15",
  enabled: true,
  repeatDays: null,
  lastDoneOn: null,
  remindedFor: null,
  ...o,
});
const today = "2026-11-13";

test("due within three days, or overdue, gets a reminder", () => {
  assert.ok(needsReminder(row({ dueOn: "2026-11-16" }), today));
  assert.ok(needsReminder(row({ dueOn: "2026-11-01" }), today));
  assert.ok(!needsReminder(row({ dueOn: "2026-11-17" }), today));
});

test("each due date is emailed once", () => {
  assert.ok(!needsReminder(row({ remindedFor: "2026-11-15" }), today));
  assert.ok(needsReminder(row({ remindedFor: "2026-10-15" }), today));
});

test("switched off, finished, and feeding tasks are never emailed", () => {
  assert.ok(!needsReminder(row({ enabled: false }), today));
  assert.ok(!needsReminder(row({ lastDoneOn: "2026-11-10" }), today));
  assert.ok(!needsReminder(row({ kind: "feeding", repeatDays: 1 }), today));
  assert.ok(needsReminder(row({ repeatDays: 30, lastDoneOn: "2026-10-16" }), today));
});

test("grouped by pet, soonest first", () => {
  const g = groupByAdoption(
    [row({ id: "1", dueOn: "2026-11-16" }), row({ id: "2", dueOn: "2026-11-14" }), row({ id: "3", adoptionId: "b" }), row({ id: "4", enabled: false })],
    today,
  );
  assert.deepEqual(g.get("a")?.map((r) => r.id), ["2", "1"]);
  assert.equal(g.get("b")?.length, 1);
});
