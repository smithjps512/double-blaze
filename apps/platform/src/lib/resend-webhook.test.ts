import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  verifySignature,
  readSignatureHeaders,
  parseEmailEvent,
  FAILURE_EVENT_TYPES,
  SIGNATURE_TOLERANCE_SECONDS,
} from "./resend-webhook.js";

const SECRET_KEY = Buffer.from("double-blaze-test-signing-key-000");
const SECRET = `whsec_${SECRET_KEY.toString("base64")}`;
const NOW = 1_760_000_000;

/** Produce the signature Svix would send for this payload. */
function sign(payload: string, id: string, timestamp: number, key = SECRET_KEY): string {
  const mac = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  return `v1,${mac}`;
}

describe("verifySignature", () => {
  const payload = JSON.stringify({ type: "email.bounced" });
  const id = "msg_2abc";

  it("accepts a correctly signed payload", () => {
    const result = verifySignature({
      payload,
      id,
      timestamp: String(NOW),
      signature: sign(payload, id, NOW),
      secret: SECRET,
      nowSeconds: NOW,
    });
    assert.deepStrictEqual(result, { ok: true });
  });

  it("accepts a secret stored without the whsec_ prefix", () => {
    const result = verifySignature({
      payload,
      id,
      timestamp: String(NOW),
      signature: sign(payload, id, NOW),
      secret: SECRET_KEY.toString("base64"),
      nowSeconds: NOW,
    });
    assert.equal(result.ok, true);
  });

  it("accepts when one of several rotated signatures matches", () => {
    // During rotation Svix sends a signature per active secret.
    const other = sign(payload, id, NOW, Buffer.from("some-other-key-entirely-00000000"));
    const mine = sign(payload, id, NOW);
    const result = verifySignature({
      payload,
      id,
      timestamp: String(NOW),
      signature: `${other} ${mine}`,
      secret: SECRET,
      nowSeconds: NOW,
    });
    assert.equal(result.ok, true);
  });

  it("rejects a tampered payload", () => {
    const result = verifySignature({
      payload: JSON.stringify({ type: "email.delivered" }),
      id,
      timestamp: String(NOW),
      signature: sign(payload, id, NOW),
      secret: SECRET,
      nowSeconds: NOW,
    });
    assert.equal(result.ok, false);
  });

  it("rejects a signature made with the wrong secret", () => {
    const result = verifySignature({
      payload,
      id,
      timestamp: String(NOW),
      signature: sign(payload, id, NOW, Buffer.from("attacker-key-aaaaaaaaaaaaaaaaaaa")),
      secret: SECRET,
      nowSeconds: NOW,
    });
    assert.equal(result.ok, false);
  });

  it("rejects a replay outside the tolerance window", () => {
    const old = NOW - SIGNATURE_TOLERANCE_SECONDS - 1;
    const result = verifySignature({
      payload,
      id,
      timestamp: String(old),
      signature: sign(payload, id, old),
      secret: SECRET,
      nowSeconds: NOW,
    });
    assert.equal(result.ok, false);
    assert.match((result as { reason: string }).reason, /tolerance/);
  });

  it("rejects a future-dated timestamp just as firmly", () => {
    const ahead = NOW + SIGNATURE_TOLERANCE_SECONDS + 1;
    const result = verifySignature({
      payload,
      id,
      timestamp: String(ahead),
      signature: sign(payload, id, ahead),
      secret: SECRET,
      nowSeconds: NOW,
    });
    assert.equal(result.ok, false);
  });

  it("accepts a timestamp at the edge of tolerance", () => {
    const edge = NOW - SIGNATURE_TOLERANCE_SECONDS;
    const result = verifySignature({
      payload,
      id,
      timestamp: String(edge),
      signature: sign(payload, id, edge),
      secret: SECRET,
      nowSeconds: NOW,
    });
    assert.equal(result.ok, true);
  });

  it("rejects missing headers and an unset secret", () => {
    const base = {
      payload,
      id,
      timestamp: String(NOW),
      signature: sign(payload, id, NOW),
      secret: SECRET,
      nowSeconds: NOW,
    };
    assert.equal(verifySignature({ ...base, id: null }).ok, false);
    assert.equal(verifySignature({ ...base, timestamp: null }).ok, false);
    assert.equal(verifySignature({ ...base, signature: null }).ok, false);
    assert.equal(verifySignature({ ...base, secret: "" }).ok, false);
  });

  it("rejects a malformed timestamp rather than treating it as zero", () => {
    const result = verifySignature({
      payload,
      id,
      timestamp: "not-a-number",
      signature: sign(payload, id, NOW),
      secret: SECRET,
      nowSeconds: NOW,
    });
    assert.equal(result.ok, false);
    assert.match((result as { reason: string }).reason, /timestamp/);
  });

  it("ignores signature entries of an unknown version", () => {
    const result = verifySignature({
      payload,
      id,
      timestamp: String(NOW),
      signature: `v2,${sign(payload, id, NOW).slice(3)}`,
      secret: SECRET,
      nowSeconds: NOW,
    });
    assert.equal(result.ok, false);
  });
});

describe("readSignatureHeaders", () => {
  it("reads the svix spelling", () => {
    const h = new Headers({
      "svix-id": "msg_1",
      "svix-timestamp": "123",
      "svix-signature": "v1,abc",
    });
    assert.deepStrictEqual(readSignatureHeaders(h), {
      id: "msg_1",
      timestamp: "123",
      signature: "v1,abc",
    });
  });

  it("falls back to the standard-webhooks spelling", () => {
    const h = new Headers({
      "webhook-id": "msg_2",
      "webhook-timestamp": "456",
      "webhook-signature": "v1,def",
    });
    assert.deepStrictEqual(readSignatureHeaders(h), {
      id: "msg_2",
      timestamp: "456",
      signature: "v1,def",
    });
  });

  it("returns nulls when neither spelling is present", () => {
    assert.deepStrictEqual(readSignatureHeaders(new Headers()), {
      id: null,
      timestamp: null,
      signature: null,
    });
  });
});

describe("parseEmailEvent", () => {
  it("parses a bounce, including the cause", () => {
    const parsed = parseEmailEvent({
      type: "email.bounced",
      created_at: "2026-08-12T15:00:00.000Z",
      data: {
        email_id: "e-123",
        to: ["yourteam+intake@doubleblaze.solutions"],
        subject: "Trailhead intake: AI Interest for Electric Grid",
        bounce: { type: "Permanent", subType: "NoEmail", message: "Recipient does not exist" },
      },
    });
    assert.equal(parsed?.eventType, "email.bounced");
    assert.equal(parsed?.resendEmailId, "e-123");
    assert.equal(parsed?.recipient, "yourteam+intake@doubleblaze.solutions");
    assert.equal(parsed?.isFailure, true);
    assert.equal(parsed?.reason, "Recipient does not exist");
  });

  it("treats a delivery as a non-failure", () => {
    const parsed = parseEmailEvent({
      type: "email.delivered",
      data: { email_id: "e-1", to: ["someone@example.com"] },
    });
    assert.equal(parsed?.isFailure, false);
    assert.equal(parsed?.reason, null);
  });

  it("flags every failure type", () => {
    for (const type of FAILURE_EVENT_TYPES) {
      const parsed = parseEmailEvent({ type, data: {} });
      assert.equal(parsed?.isFailure, true, `${type} should be a failure`);
    }
  });

  it("takes the first recipient when several are listed", () => {
    const parsed = parseEmailEvent({
      type: "email.bounced",
      data: { to: ["first@example.com", "second@example.com"] },
    });
    assert.equal(parsed?.recipient, "first@example.com");
  });

  it("tolerates a string recipient rather than an array", () => {
    const parsed = parseEmailEvent({
      type: "email.bounced",
      data: { to: "solo@example.com" },
    });
    assert.equal(parsed?.recipient, "solo@example.com");
  });

  it("still records a failure whose detail it cannot read", () => {
    // An unparseable bounce is still a bounce; dropping it is the bug.
    const parsed = parseEmailEvent({ type: "email.bounced", data: {} });
    assert.equal(parsed?.isFailure, true);
    assert.equal(parsed?.recipient, null);
    assert.equal(parsed?.reason, null);
  });

  it("falls back through the cause fields when no message is given", () => {
    const parsed = parseEmailEvent({
      type: "email.bounced",
      data: { bounce: { type: "Transient" } },
    });
    assert.equal(parsed?.reason, "Transient");
  });

  it("reads the reason for a failed send", () => {
    const parsed = parseEmailEvent({
      type: "email.failed",
      data: { failed: { reason: "Domain is not verified" } },
    });
    assert.equal(parsed?.reason, "Domain is not verified");
  });

  it("returns null for input that is not an event", () => {
    assert.equal(parseEmailEvent(null), null);
    assert.equal(parseEmailEvent("nope"), null);
    assert.equal(parseEmailEvent({ data: {} }), null);
  });
});
