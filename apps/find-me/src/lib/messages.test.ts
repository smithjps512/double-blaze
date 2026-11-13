import { test } from "node:test";
import assert from "node:assert/strict";
import { isUnread, shouldNotify, sideOf } from "./messages";

const now = new Date("2026-11-13T12:00:00Z");

test("first message always notifies", () => {
  assert.ok(shouldNotify(null, null, now));
});

test("a burst of messages sends one email", () => {
  assert.ok(!shouldNotify("2026-11-13T11:50:00Z", null, now));
  assert.ok(shouldNotify("2026-11-13T11:20:00Z", null, now));
});

test("once they have read the thread, the next message notifies again", () => {
  assert.ok(shouldNotify("2026-11-13T11:50:00Z", "2026-11-13T11:55:00Z", now));
});

test("sideOf and isUnread", () => {
  const c = { posterId: "p", helperId: "h" };
  assert.equal(sideOf(c, "p"), "poster");
  assert.equal(sideOf(c, "h"), "helper");
  assert.equal(sideOf(c, "x"), null);
  assert.ok(isUnread("2026-11-13T12:00:00Z", null));
  assert.ok(!isUnread("2026-11-13T12:00:00Z", "2026-11-13T12:01:00Z"));
});
