import { test } from "node:test";
import assert from "node:assert/strict";
import { isTeacherAccount, parseTeacherEmails } from "./class-teacher.js";

test("unset or empty list lets nobody in", () => {
  assert.deepEqual(parseTeacherEmails(undefined), []);
  assert.deepEqual(parseTeacherEmails(""), []);
  assert.equal(isTeacherAccount([{ address: "teacher@school.org", verified: true }], []), false);
});

test("list is trimmed, lowercased, and skips junk", () => {
  assert.deepEqual(parseTeacherEmails(" Teacher@School.org , ,nope, b@x.com"), ["teacher@school.org", "b@x.com"]);
});

test("a verified listed email gets in, whatever its case", () => {
  const allowed = parseTeacherEmails("teacher@school.org");
  assert.equal(isTeacherAccount([{ address: "Teacher@School.org", verified: true }], allowed), true);
});

test("an unverified listed email does not get in", () => {
  const allowed = parseTeacherEmails("teacher@school.org");
  assert.equal(isTeacherAccount([{ address: "teacher@school.org", verified: false }], allowed), false);
});

test("a staff account with other emails does not get in", () => {
  const allowed = parseTeacherEmails("teacher@school.org");
  assert.equal(
    isTeacherAccount(
      [
        { address: "partner@doubleblaze.solutions", verified: true },
        { address: "teacher@school.org", verified: false },
      ],
      allowed,
    ),
    false,
  );
});
