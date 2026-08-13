import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  approvalEmail,
  declineEmail,
  newApplicationEmail,
  parseAdminAction,
  type EmailCopy,
} from "./admin.js";

const ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const OTHER = "9c858901-8a57-4791-81fe-4c455b099bc9";

describe("parseAdminAction", () => {
  it("reads an approval", () => {
    const result = parseAdminAction({ memberId: ID, action: "approve" });
    assert.ok(result.ok);
    assert.deepEqual(result.action, { kind: "approve", memberId: ID });
  });

  it("reads a decline", () => {
    const result = parseAdminAction({ memberId: ID, action: "decline" });
    assert.ok(result.ok);
    assert.deepEqual(result.action, { kind: "decline", memberId: ID });
  });

  it("reads a role change", () => {
    const result = parseAdminAction({ memberId: OTHER, action: "set_role", role: "admin" });
    assert.ok(result.ok);
    assert.deepEqual(result.action, { kind: "set_role", memberId: OTHER, role: "admin" });
  });

  it("accepts every role the console offers", () => {
    for (const role of ASSIGNABLE_ROLES) {
      const result = parseAdminAction({ memberId: ID, action: "set_role", role });
      assert.ok(result.ok, `rejected ${role}`);
    }
  });

  it("refuses a role the console does not assign", () => {
    // 'guest' is a real role in the schema and deliberately not assignable
    // here, because a guest carries an access window this console does not ask
    // about.
    for (const role of ["guest", "owner", "staff", "", "ADMIN"]) {
      const result = parseAdminAction({ memberId: ID, action: "set_role", role });
      assert.ok(!result.ok, `accepted ${role}`);
    }
  });

  it("refuses an action it does not perform", () => {
    for (const action of ["suspend", "delete", "promote", "", "APPROVE"]) {
      const result = parseAdminAction({ memberId: ID, action });
      assert.ok(!result.ok, `accepted ${action}`);
    }
  });

  it("refuses anything that is not a member id", () => {
    for (const memberId of ["", "not-a-uuid", "1; drop table site_members", 42, null, undefined]) {
      const result = parseAdminAction({ memberId, action: "approve" });
      assert.ok(!result.ok, `accepted ${JSON.stringify(memberId)}`);
    }
  });

  it("survives a missing or malformed body", () => {
    for (const input of [null, undefined, "approve", 7, []]) {
      const result = parseAdminAction(input);
      assert.ok(!result.ok, `accepted ${JSON.stringify(input)}`);
    }
  });

  it("does not take a role from an approve action", () => {
    // Approving is one decision. If role selection ever moves into the queue
    // it should be a deliberate change here, not something a caller can smuggle
    // in by adding a field.
    const result = parseAdminAction({ memberId: ID, action: "approve", role: "admin" });
    assert.ok(result.ok);
    assert.deepEqual(result.action, { kind: "approve", memberId: ID });
  });
});

describe("the roles the console offers", () => {
  it("has a label and a description for each", () => {
    for (const role of ASSIGNABLE_ROLES) {
      assert.ok(ROLE_LABELS[role]?.length > 0);
      assert.ok(ROLE_DESCRIPTIONS[role]?.length > 0);
    }
  });

  it("does not offer guest, which needs an access window nobody is asked for", () => {
    assert.ok(!(ASSIGNABLE_ROLES as readonly string[]).includes("guest"));
  });
});

describe("the emails", () => {
  const CLUB = "AI Interest for Electric Grid";
  const all: EmailCopy[] = [
    approvalEmail(CLUB, "https://example.test/"),
    declineEmail(CLUB),
    newApplicationEmail(
      CLUB,
      {
        displayName: "Dana Okafor",
        email: "dana@example.test",
        joinAnswers: { employer: "Cascade Power Authority", industry: "grid" },
      },
      "https://example.test/admin",
    ),
  ];

  it("all have a subject and a heading", () => {
    for (const copy of all) {
      assert.ok(copy.subject.length > 0);
      assert.ok(copy.heading.length > 0);
      assert.ok(copy.bodyHtml.trim().length > 0);
    }
  });

  it("uses no em dashes, per the house rule", () => {
    for (const copy of all) {
      const text = `${copy.subject} ${copy.heading} ${copy.bodyHtml} ${copy.action?.label ?? ""}`;
      assert.ok(!text.includes("—"), `em dash in "${copy.subject}"`);
    }
  });

  it("avoids the coordination language the build plan flags", () => {
    // Section 3 of the build plan: utilities operate under FERC and state
    // regulators and read these words as coordination between competitors. The
    // landing page already had a pass for this; mail the club sends in its own
    // name deserves the same.
    //
    // Tags are stripped first so the check reads what a recipient reads. The
    // markup is full of `vertical-align` and friends, and a rule that trips on
    // a CSS property is a rule people learn to ignore.
    const flagged = /\b(collaborat|coordinat|align|agree to|standardiz)/i;
    for (const copy of all) {
      const prose = `${copy.subject} ${copy.heading} ${copy.bodyHtml.replace(/<[^>]*>/g, " ")}`;
      assert.ok(!flagged.test(prose), `coordination language in "${copy.subject}"`);
    }
  });

  it("names the club in every subject line, so it is recognisable in an inbox", () => {
    for (const copy of all) {
      assert.ok(copy.subject.includes(CLUB), `club missing from "${copy.subject}"`);
    }
  });

  it("gives the applicant somewhere to go when approved, and does not when declined", () => {
    assert.ok(approvalEmail(CLUB, "https://example.test/").action);
    assert.equal(declineEmail(CLUB).action, undefined);
  });

  it("gives no reason for a decline, since none was asked for", () => {
    const copy = declineEmail(CLUB);
    assert.ok(!/because/i.test(copy.bodyHtml));
    assert.ok(/reply to this email/i.test(copy.bodyHtml));
  });

  it("puts the answers in the administrator's notification", () => {
    const copy = newApplicationEmail(
      CLUB,
      {
        displayName: "Dana Okafor",
        email: "dana@example.test",
        joinAnswers: { employer: "Cascade Power Authority", industry: "grid" },
      },
      "https://example.test/admin",
    );
    assert.ok(copy.bodyHtml.includes("Cascade Power Authority"));
    assert.ok(copy.bodyHtml.includes("The electric grid or power industry"));
    assert.ok(copy.subject.includes("Dana Okafor"));
  });

  it("falls back to the address when an applicant has no name", () => {
    const copy = newApplicationEmail(
      CLUB,
      { displayName: "  ", email: "dana@example.test", joinAnswers: {} },
      "https://example.test/admin",
    );
    assert.ok(copy.subject.includes("dana@example.test"));
  });

  it("escapes what an applicant typed, since it reaches an administrator's inbox", () => {
    const copy = newApplicationEmail(
      CLUB,
      {
        displayName: "<script>alert(1)</script>",
        email: "x@example.test",
        joinAnswers: { employer: '"><img src=x onerror=alert(1)>' },
      },
      "https://example.test/admin",
    );
    assert.ok(!copy.bodyHtml.includes("<script>"));
    assert.ok(!copy.bodyHtml.includes("<img"));
    assert.ok(copy.bodyHtml.includes("&lt;script&gt;"));
  });

  it("handles an application with no answers at all", () => {
    const copy = newApplicationEmail(
      CLUB,
      { displayName: "Dana", email: "dana@example.test", joinAnswers: {} },
      "https://example.test/admin",
    );
    assert.ok(!copy.bodyHtml.includes("<table"));
    assert.ok(copy.bodyHtml.includes("Dana"));
  });
});
