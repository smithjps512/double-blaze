import { test } from "node:test";
import assert from "node:assert/strict";
import { parseIntake, routeIntake, validateIntake } from "./intake";

const CENTRAL = "central@example.com";

test("routes to each selected practice inbox plus the central inbox, deduplicated", () => {
  const env = {
    PRACTICE_INBOX_TECHNOLOGY: "tech@example.com",
    PRACTICE_INBOX_DATA: "Tech@example.com",
    PRACTICE_INBOX_EVENTS: "events@example.com",
  };
  assert.deepEqual(routeIntake(["technology", "data-analytics", "event-management"], env, CENTRAL), [
    "tech@example.com",
    "events@example.com",
    CENTRAL,
  ]);
});

test("practices without an inbox, not-sure, and no selection fall back to central", () => {
  assert.deepEqual(routeIntake(["facility-management"], {}, CENTRAL), [CENTRAL]);
  assert.deepEqual(routeIntake(["not-sure"], {}, CENTRAL), [CENTRAL]);
  assert.deepEqual(routeIntake([], {}, CENTRAL), [CENTRAL]);
});

test("parse drops unknown option values and keeps solicitation for government only", () => {
  const gov = parseIntake({
    orgType: "state-gov",
    practices: ["technology", "bogus", "technology"],
    needType: "nope",
    solicitation: "RFP 123",
  });
  assert.deepEqual(gov.practices, ["technology"]);
  assert.equal(gov.needType, "");
  assert.equal(gov.solicitation, "RFP 123");

  const biz = parseIntake({ orgType: "smb", solicitation: "RFP 123", practices: "data-analytics" });
  assert.equal(biz.solicitation, "");
  assert.deepEqual(biz.practices, ["data-analytics"]);
});

test("validation requires contact, organization, org type, and a message", () => {
  const base = parseIntake({
    name: "A",
    email: "a@b.co",
    organization: "Org",
    orgType: "enterprise",
    message: "Help",
  });
  assert.equal(validateIntake(base), null);
  assert.match(validateIntake({ ...base, email: "nope" }) ?? "", /valid email/);
  assert.match(validateIntake({ ...base, orgType: "" }) ?? "", /organization/);
  assert.match(validateIntake({ ...base, message: "" }) ?? "", /needs/);
});
