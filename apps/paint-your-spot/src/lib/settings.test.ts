import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultSettings, formatMoney, mergeSettings, toGoal, validateSettings } from "./settings";

test("money formats or stays Coming soon", () => {
  assert.equal(formatMoney("40"), "$40");
  assert.equal(formatMoney("$40.5"), "$40.50");
  assert.equal(formatMoney(""), null);
  assert.equal(formatMoney("forty"), null);
});

test("database values override defaults, blanks do not", () => {
  const s = mergeSettings(defaultSettings({ INTEREST_GOAL: "30" }), [
    { key: "standard_fee", value: "40" },
    { key: "boss_pot_goal", value: "" },
    { key: "bogus", value: "x" },
  ]);
  assert.equal(s.standard_fee, "40");
  assert.equal(s.boss_pot_goal, "100");
  assert.equal(s.interest_goal, "30");
  assert.equal(toGoal(s.interest_goal), 30);
  assert.equal(toGoal("zero", 20), 20);
});

test("settings validation", () => {
  assert.ok(validateSettings({ standard_fee: "40", payment_link: "https://example.com/pay" }).ok);
  const bad = validateSettings({ standard_fee: "lots", interest_goal: "-3", payment_link: "javascript:alert(1)" });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["interest_goal", "payment_link", "standard_fee"]);
});

test("deadline counts calendar days in Eastern time", async () => {
  const { deadlineInfo, daysLeftText, parseDate } = await import("./settings");
  assert.equal(parseDate("2026-02-30"), null);
  assert.equal(parseDate("10/16/2026"), null);

  // 10 PM Eastern on Oct 15 is already Oct 16 in UTC; still one day left.
  const d1 = deadlineInfo("2026-10-16", new Date("2026-10-16T02:00:00Z"))!;
  assert.equal(d1.label, "Friday, October 16");
  assert.equal(d1.daysLeft, 1);
  assert.equal(daysLeftText(d1), "1 day left");

  const last = deadlineInfo("2026-10-16", new Date("2026-10-17T03:30:00Z"))!; // 11:30 PM Oct 16 Eastern
  assert.equal(daysLeftText(last), "Last day!");

  const past = deadlineInfo("2026-10-16", new Date("2026-10-17T04:30:00Z"))!; // 12:30 AM Oct 17 Eastern
  assert.equal(past.closed, true);

  assert.equal(deadlineInfo("2026-10-16", new Date("2026-10-07T12:00:00Z"))!.daysLeft, 9);
  assert.equal(deadlineInfo("", new Date()), null);
});
