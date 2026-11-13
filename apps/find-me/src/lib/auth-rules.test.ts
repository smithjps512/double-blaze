import { test } from "node:test";
import assert from "node:assert/strict";
import { isEmail, safeNext } from "./auth-rules";

test("safeNext only allows same-site paths", () => {
  assert.equal(safeNext("/animals/1"), "/animals/1");
  assert.equal(safeNext("//evil.com"), "/my");
  assert.equal(safeNext("https://evil.com"), "/my");
  assert.equal(safeNext("/\\evil.com"), "/my");
  assert.equal(safeNext(null, "/x"), "/x");
});

test("isEmail", () => {
  assert.ok(isEmail("a@b.co"));
  assert.ok(!isEmail("nope"));
  assert.ok(!isEmail("a b@c.d"));
});
