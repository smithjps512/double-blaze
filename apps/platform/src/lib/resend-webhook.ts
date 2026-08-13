/**
 * Resend webhook verification and event parsing.
 *
 * Resend signs webhooks with Svix, which implements the Standard Webhooks
 * spec. Verification is a plain HMAC, so this is hand-rolled rather than
 * pulling in the svix package, matching the export route's approach of not
 * adding a dependency for something small and well specified.
 *
 * Pure and framework-free (node:crypto only) so it can be unit tested directly,
 * the same reason trailhead.ts is structured this way.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** How far a webhook timestamp may drift before we treat it as a replay. */
export const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

/**
 * The three headers Svix signs with. Resend sends the `svix-*` spelling;
 * the Standard Webhooks spec renames them `webhook-*`. Accept either, since
 * which one arrives is Resend's choice and not ours.
 */
export function readSignatureHeaders(headers: Headers): {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
} {
  const pick = (a: string, b: string) => headers.get(a) ?? headers.get(b);
  return {
    id: pick("svix-id", "webhook-id"),
    timestamp: pick("svix-timestamp", "webhook-timestamp"),
    signature: pick("svix-signature", "webhook-signature"),
  };
}

export interface VerifyInput {
  /** Raw request body, exactly as received. Re-serializing invalidates it. */
  payload: string;
  id: string | null;
  timestamp: string | null;
  signature: string | null;
  /** The `whsec_...` signing secret from the Resend webhook settings. */
  secret: string;
  /** Injected so tests are not clock-dependent. */
  nowSeconds: number;
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

/**
 * Verify a Svix signature.
 *
 * The signed content is `${id}.${timestamp}.${payload}`, HMAC-SHA256 with the
 * base64-decoded secret, encoded base64. The signature header carries a
 * space-delimited list of versioned signatures (`v1,<sig> v1,<sig>`) because a
 * secret can be rotated with both old and new live at once, so a match against
 * any v1 entry is a pass.
 */
export function verifySignature(input: VerifyInput): VerifyResult {
  const { payload, id, timestamp, signature, secret, nowSeconds } = input;

  if (!secret) return { ok: false, reason: "No RESEND_WEBHOOK_SECRET configured." };
  if (!id || !timestamp || !signature) {
    return { ok: false, reason: "Missing webhook signature headers." };
  }

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) {
    return { ok: false, reason: "Malformed webhook timestamp." };
  }
  // Reject old and future-dated timestamps alike. Without this the signature
  // alone would let a captured request be replayed forever.
  if (Math.abs(nowSeconds - sentAt) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "Webhook timestamp outside tolerance." };
  }

  // The secret is `whsec_` followed by the base64 key. Older secrets are
  // sometimes stored without the prefix, so treat it as optional.
  const rawSecret = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(rawSecret, "base64");
  } catch {
    return { ok: false, reason: "Signing secret is not valid base64." };
  }
  if (key.length === 0) return { ok: false, reason: "Signing secret is empty." };

  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest();

  for (const part of signature.split(" ")) {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) continue;
    let candidate: Buffer;
    try {
      candidate = Buffer.from(value, "base64");
    } catch {
      continue;
    }
    // timingSafeEqual throws on a length mismatch, so guard before calling it.
    if (candidate.length !== expected.length) continue;
    if (timingSafeEqual(candidate, expected)) return { ok: true };
  }

  return { ok: false, reason: "No matching signature." };
}

/**
 * Event types that mean a human did not receive the message.
 *
 * `delivery_delayed` is included deliberately. It is not yet a failure, but it
 * is the only warning you get before one, and staying silent about it is what
 * this whole module exists to stop.
 */
export const FAILURE_EVENT_TYPES: ReadonlySet<string> = new Set([
  "email.bounced",
  "email.complained",
  "email.delivery_delayed",
  "email.failed",
]);

export interface ParsedEmailEvent {
  eventType: string;
  resendEmailId: string | null;
  recipient: string | null;
  subject: string | null;
  isFailure: boolean;
  reason: string | null;
  occurredAt: string | null;
}

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstString(entry);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Pull the fields worth querying out of a Resend event. Everything is optional
 * and defensively read: the payload shape differs per event type, and an event
 * we cannot fully parse must still be recorded rather than dropped, because a
 * bounce we failed to understand is still a bounce.
 */
export function parseEmailEvent(body: unknown): ParsedEmailEvent | null {
  if (typeof body !== "object" || body === null) return null;
  const root = body as Record<string, unknown>;

  const eventType = typeof root.type === "string" ? root.type : null;
  if (!eventType) return null;

  const data =
    typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : {};

  // The cause lives under a different key per event type.
  const detail = (key: string): Record<string, unknown> =>
    typeof data[key] === "object" && data[key] !== null
      ? (data[key] as Record<string, unknown>)
      : {};

  const bounce = detail("bounce");
  const failed = detail("failed");
  const reason =
    firstString(bounce.message) ??
    firstString(failed.reason) ??
    firstString(bounce.subType) ??
    firstString(bounce.type) ??
    null;

  return {
    eventType,
    resendEmailId: firstString(data.email_id) ?? firstString(root.email_id),
    recipient: firstString(data.to),
    subject: firstString(data.subject),
    isFailure: FAILURE_EVENT_TYPES.has(eventType),
    reason,
    occurredAt: firstString(data.created_at) ?? firstString(root.created_at),
  };
}
