import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { signApproval, tokenCovers, verifyApproval } from "./trail-crew-approval-token.js";

/**
 * These links are the only credential on the approval page, so the cases are
 * about the ways a link could be wrong: tampered, expired, signed with a
 * different secret, or pointed at a different proposal.
 */
describe("approval tokens", () => {
  const secret = "test-secret";
  const now = 1_800_000_000;

  it("round trips a single-proposal token", () => {
    const token = signApproval({ scope: "one", id: "abc", exp: now + 60 }, secret);
    const result = verifyApproval(token, secret, now);
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.claims.id, "abc");
      assert.ok(tokenCovers(result.claims, "abc"));
      assert.ok(!tokenCovers(result.claims, "xyz"));
    }
  });

  it("a queue token covers every proposal", () => {
    const token = signApproval({ scope: "queue", exp: now + 60 }, secret);
    const result = verifyApproval(token, secret, now);
    assert.ok(result.ok);
    if (result.ok) assert.ok(tokenCovers(result.claims, "anything"));
  });

  it("rejects an expired token", () => {
    const token = signApproval({ scope: "queue", exp: now - 1 }, secret);
    const result = verifyApproval(token, secret, now);
    assert.deepEqual(result, { ok: false, reason: "expired" });
  });

  it("rejects a token signed with another secret", () => {
    const token = signApproval({ scope: "queue", exp: now + 60 }, "other");
    assert.deepEqual(verifyApproval(token, secret, now), { ok: false, reason: "bad_signature" });
  });

  it("rejects a tampered payload", () => {
    const token = signApproval({ scope: "one", id: "abc", exp: now + 60 }, secret);
    const [, sig] = token.split(".");
    const forged = `${Buffer.from(JSON.stringify({ scope: "queue", exp: now + 60 })).toString("base64url")}.${sig}`;
    assert.deepEqual(verifyApproval(forged, secret, now), { ok: false, reason: "bad_signature" });
  });

  it("rejects junk and a missing secret", () => {
    assert.deepEqual(verifyApproval("nope", secret, now), { ok: false, reason: "malformed" });
    assert.deepEqual(verifyApproval("a.b", "", now), { ok: false, reason: "no_secret" });
  });
});
