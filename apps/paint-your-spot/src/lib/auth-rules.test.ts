import { test } from "node:test";
import assert from "node:assert/strict";
import { inList, isStaffEmail, parseEmailList, safeNext } from "./auth-rules";

test("only exact @mcps.org addresses are staff", () => {
  assert.equal(isStaffEmail("someone@mcps.org"), true);
  assert.equal(isStaffEmail("  Someone@MCPS.ORG "), true);
  assert.equal(isStaffEmail("someone@gmail.com"), false);
  assert.equal(isStaffEmail("someone@students.mcps.org"), false);
  assert.equal(isStaffEmail("someone@mcps.org.evil.com"), false);
  assert.equal(isStaffEmail("mcps.org"), false);
  assert.equal(isStaffEmail("@mcps.org"), false);
  assert.equal(isStaffEmail(null), false);
});

test("email lists parse loosely and match case-insensitively", () => {
  const list = parseEmailList(" A@mcps.org, b@mcps.org\nc@mcps.org ");
  assert.deepEqual(list, ["a@mcps.org", "b@mcps.org", "c@mcps.org"]);
  assert.equal(inList(list, "B@MCPS.org"), true);
  assert.equal(inList(list, "d@mcps.org"), false);
  assert.equal(inList(parseEmailList(undefined), "a@mcps.org"), false);
});

test("next paths stay on this site", () => {
  assert.equal(safeNext("/admin"), "/admin");
  assert.equal(safeNext("//evil.com"), "/interest");
  assert.equal(safeNext("https://evil.com"), "/interest");
  assert.equal(safeNext("/\\evil.com"), "/interest");
  assert.equal(safeNext(null), "/interest");
});
