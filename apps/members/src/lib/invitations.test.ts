import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GUEST_WINDOW_DAYS,
  INVITABLE_ROLES,
  INVITABLE_ROLE_OPTIONS,
  INVITATION_VALID_DAYS,
  accessExpiry,
  invitationEmail,
  invitationExpiry,
  invitationState,
  parseInvitationRequest,
} from "./invitations.js";
import { hashInvitationToken, hashesMatch, newInvitationToken } from "./tokens.js";

const AT = new Date("2026-08-13T12:00:00.000Z");

describe("parseInvitationRequest", () => {
  it("reads an ordinary member invitation", () => {
    const result = parseInvitationRequest({ email: "Dana@Example.test", role: "member" });
    assert.ok(result.ok);
    assert.deepEqual(result.invitation, {
      email: "dana@example.test",
      role: "member",
      windowDays: null,
    });
  });

  it("lowercases the address, since the unique index is on lower(email)", () => {
    const result = parseInvitationRequest({ email: "  DANA@EXAMPLE.TEST ", role: "member" });
    assert.ok(result.ok);
    assert.equal(result.invitation.email, "dana@example.test");
  });

  it("reads a guest invitation with a window", () => {
    const result = parseInvitationRequest({ email: "d@example.test", role: "guest", windowDays: 30 });
    assert.ok(result.ok);
    assert.equal(result.invitation.windowDays, 30);
  });

  it("refuses a guest with no window", () => {
    const result = parseInvitationRequest({ email: "d@example.test", role: "guest" });
    assert.ok(!result.ok);
  });

  it("refuses a window on a role that does not lapse", () => {
    // Silently ignoring it would be worse: an administrator would think they
    // had time-boxed somebody who in fact has permanent access.
    const result = parseInvitationRequest({
      email: "d@example.test",
      role: "member",
      windowDays: 30,
    });
    assert.ok(!result.ok);
    assert.match(result.error, /only a guest/i);
  });

  it("refuses a nonsensical window", () => {
    for (const windowDays of [0, -5, 1.5, 5000, "thirty", null]) {
      const result = parseInvitationRequest({ email: "d@example.test", role: "guest", windowDays });
      assert.ok(!result.ok, `accepted ${JSON.stringify(windowDays)}`);
    }
  });

  it("refuses a role it cannot invite", () => {
    for (const role of ["staff", "owner", "", "Member", "pending"]) {
      const result = parseInvitationRequest({ email: "d@example.test", role });
      assert.ok(!result.ok, `accepted ${role}`);
    }
  });

  it("accepts every role it offers", () => {
    for (const option of INVITABLE_ROLE_OPTIONS) {
      const result = parseInvitationRequest({
        email: "d@example.test",
        role: option.value,
        ...(option.bounded ? { windowDays: GUEST_WINDOW_DAYS } : {}),
      });
      assert.ok(result.ok, `rejected ${option.value}`);
    }
  });

  it("refuses anything that is not an address", () => {
    for (const email of ["", "nope", "a@b", "@example.test", 42, null, undefined]) {
      const result = parseInvitationRequest({ email, role: "member" });
      assert.ok(!result.ok, `accepted ${JSON.stringify(email)}`);
    }
  });

  it("survives a missing or malformed body", () => {
    for (const input of [null, undefined, "member", 7, []]) {
      assert.ok(!parseInvitationRequest(input).ok);
    }
  });

  it("offers a role option for every invitable role, with help text", () => {
    assert.equal(INVITABLE_ROLE_OPTIONS.length, INVITABLE_ROLES.length);
    for (const option of INVITABLE_ROLE_OPTIONS) {
      assert.ok(option.label.length > 0);
      assert.ok(option.help.length > 0);
    }
  });

  it("marks exactly one role as needing a window", () => {
    const bounded = INVITABLE_ROLE_OPTIONS.filter((o) => o.bounded);
    assert.deepEqual(
      bounded.map((o) => o.value),
      ["guest"],
    );
  });
});

describe("the two clocks", () => {
  it("keeps the invitation window separate from the access window", () => {
    // 0013 gave them separate columns for this reason: how long somebody has to
    // accept has nothing to do with how long their access then lasts.
    const invite = invitationExpiry(AT);
    const access = accessExpiry(AT, 90);
    assert.notEqual(invite.toISOString(), access?.toISOString());
    assert.equal(invite.toISOString(), "2026-08-27T12:00:00.000Z");
    assert.equal(access?.toISOString(), "2026-11-11T12:00:00.000Z");
  });

  it("gives an unbounded role no access expiry at all", () => {
    assert.equal(accessExpiry(AT, null), null);
  });

  it("uses the documented invitation window", () => {
    const days = (invitationExpiry(AT).getTime() - AT.getTime()) / 86_400_000;
    assert.equal(days, INVITATION_VALID_DAYS);
  });

  it("crosses a month boundary without drifting", () => {
    assert.equal(
      accessExpiry(new Date("2026-01-31T00:00:00.000Z"), 30)?.toISOString(),
      "2026-03-02T00:00:00.000Z",
    );
  });
});

describe("invitationState", () => {
  const live = {
    accepted_at: null,
    revoked_at: null,
    expires_at: "2026-08-27T12:00:00.000Z",
  };

  it("accepts a live invitation", () => {
    assert.deepEqual(invitationState(live, AT), { usable: true });
  });

  it("refuses one already accepted, so a link works exactly once", () => {
    const result = invitationState({ ...live, accepted_at: "2026-08-14T00:00:00Z" }, AT);
    assert.deepEqual(result, { usable: false, reason: "accepted" });
  });

  it("refuses one an administrator revoked", () => {
    const result = invitationState({ ...live, revoked_at: "2026-08-14T00:00:00Z" }, AT);
    assert.deepEqual(result, { usable: false, reason: "revoked" });
  });

  it("refuses one past its expiry", () => {
    const result = invitationState(live, new Date("2026-09-01T00:00:00.000Z"));
    assert.deepEqual(result, { usable: false, reason: "expired" });
  });

  it("treats the exact expiry moment as expired", () => {
    const result = invitationState(live, new Date(live.expires_at));
    assert.deepEqual(result, { usable: false, reason: "expired" });
  });

  it("reports accepted ahead of expired when both are true", () => {
    // The distinction matters to the person reading the message: "you already
    // used this" and "you waited too long" call for different next steps.
    const result = invitationState(
      { ...live, accepted_at: "2026-08-14T00:00:00Z" },
      new Date("2026-09-01T00:00:00.000Z"),
    );
    assert.equal(result.usable, false);
    assert.equal((result as { reason: string }).reason, "accepted");
  });
});

describe("the invitation email", () => {
  const CLUB = "AI Interest for Electric Grid";

  it("says what the club is, because an unannounced invitation reads as phishing", () => {
    const copy = invitationEmail(
      CLUB,
      { role: "member", windowDays: null, invitedBy: "James" },
      "https://example.test/invite/abc",
    );
    assert.ok(copy.bodyHtml.includes("electric grid"));
    assert.ok(copy.bodyHtml.includes("James"));
    assert.equal(copy.action.url, "https://example.test/invite/abc");
  });

  it("tells a guest how long they have and that their work outlives it", () => {
    const copy = invitationEmail(
      CLUB,
      { role: "guest", windowDays: 30, invitedBy: null },
      "https://example.test/invite/abc",
    );
    assert.ok(copy.bodyHtml.includes("30 days"));
    assert.match(copy.bodyHtml, /stays available/i);
  });

  it("does not mention a window for a role that has none", () => {
    const copy = invitationEmail(
      CLUB,
      { role: "member", windowDays: null, invitedBy: null },
      "https://example.test/invite/abc",
    );
    assert.ok(!copy.bodyHtml.includes("Guest access"));
    assert.ok(!/stays available/i.test(copy.bodyHtml));
  });

  it("says there is no approval to wait for, which is the point of an invitation", () => {
    const copy = invitationEmail(
      CLUB,
      { role: "member", windowDays: null, invitedBy: null },
      "https://example.test/invite/abc",
    );
    assert.match(copy.bodyHtml, /no approval/i);
  });

  it("escapes the inviter's name, which came out of a database", () => {
    const copy = invitationEmail(
      CLUB,
      { role: "member", windowDays: null, invitedBy: "<script>alert(1)</script>" },
      "https://example.test/invite/abc",
    );
    assert.ok(!copy.bodyHtml.includes("<script>"));
  });

  it("uses no em dashes and no coordination language", () => {
    const flagged = /\b(collaborat|coordinat|align|agree to|standardiz)/i;
    for (const role of INVITABLE_ROLES) {
      const copy = invitationEmail(
        CLUB,
        { role, windowDays: role === "guest" ? 90 : null, invitedBy: "James" },
        "https://example.test/invite/abc",
      );
      const prose = `${copy.subject} ${copy.heading} ${copy.bodyHtml.replace(/<[^>]*>/g, " ")}`;
      assert.ok(!prose.includes("—"), `em dash for ${role}`);
      assert.ok(!flagged.test(prose), `coordination language for ${role}`);
    }
  });
});

describe("invitation tokens", () => {
  it("never issues the same token twice", () => {
    const seen = new Set(Array.from({ length: 500 }, () => newInvitationToken()));
    assert.equal(seen.size, 500);
  });

  it("issues a token long enough that guessing is not a threat model", () => {
    // 32 bytes base64url, so 43 characters with no padding.
    assert.equal(newInvitationToken().length, 43);
  });

  it("issues URL-safe tokens, since they travel in a path segment", () => {
    for (let i = 0; i < 200; i++) {
      assert.match(newInvitationToken(), /^[A-Za-z0-9_-]+$/);
    }
  });

  it("hashes the same token to the same value, which is what makes lookup work", () => {
    const token = newInvitationToken();
    assert.equal(hashInvitationToken(token), hashInvitationToken(token));
  });

  it("hashes different tokens differently", () => {
    assert.notEqual(hashInvitationToken("a"), hashInvitationToken("b"));
  });

  it("stores something that is not the token, which is the whole point", () => {
    const token = newInvitationToken();
    const hash = hashInvitationToken(token);
    assert.notEqual(hash, token);
    assert.ok(!hash.includes(token));
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  it("matches a hash against itself and nothing else", () => {
    const hash = hashInvitationToken("one");
    assert.ok(hashesMatch(hash, hashInvitationToken("one")));
    assert.ok(!hashesMatch(hash, hashInvitationToken("two")));
  });

  it("returns false rather than throwing on a length mismatch", () => {
    assert.equal(hashesMatch("short", hashInvitationToken("one")), false);
    assert.equal(hashesMatch("", ""), true);
  });
});
