import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSurvey } from "./survey";

const good = {
  name: "  Pat Teacher ",
  role: "teacher",
  interest_level: "in",
  interests: ["standard", "boss", "boss", "nonsense"],
  preferred_lot: "front",
  painter: "art_student",
  keep_yearly: "maybe",
  price_comfort: "up_to_40",
  comments: "  ",
};

test("a complete survey validates and is cleaned up", () => {
  const r = validateSurvey(good, { isBoss: false });
  assert.ok(r.ok);
  assert.equal(r.answers.name, "Pat Teacher");
  assert.deepEqual(r.answers.interests, ["standard", "boss"]);
  assert.equal(r.answers.comments, null);
});

test("the boss can never pick Paint the Boss", () => {
  const r = validateSurvey(good, { isBoss: true });
  assert.ok(r.ok);
  assert.deepEqual(r.answers.interests, ["standard"]);
});

test("missing and unknown answers are rejected", () => {
  const r = validateSurvey({ ...good, name: "", role: "principal", price_comfort: undefined }, { isBoss: false });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["name", "price_comfort", "role"]);
});

test("interests are optional", () => {
  const r = validateSurvey({ ...good, interests: undefined }, { isBoss: false });
  assert.ok(r.ok);
  assert.deepEqual(r.answers.interests, []);
});
