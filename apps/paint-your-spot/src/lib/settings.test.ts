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
  const s = mergeSettings(defaultSettings({ INTEREST_GOAL: "25" }), [
    { key: "standard_fee", value: "40" },
    { key: "boss_pot_goal", value: "" },
    { key: "bogus", value: "x" },
  ]);
  assert.equal(s.standard_fee, "40");
  assert.equal(s.boss_pot_goal, "100");
  assert.equal(s.interest_goal, "25");
  assert.equal(toGoal(s.interest_goal, 20), 25);
  assert.equal(toGoal("zero", 20), 20);
});

test("settings validation", () => {
  assert.ok(validateSettings({ standard_fee: "40", payment_link: "https://example.com/pay" }).ok);
  const bad = validateSettings({ standard_fee: "lots", interest_goal: "-3", payment_link: "javascript:alert(1)" });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["interest_goal", "payment_link", "standard_fee"]);
});
