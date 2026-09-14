import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed links for the teacher's approval email.
 *
 * The queue page lives behind a staff sign-in, which is right for a portal
 * and wrong for a teacher on a phone between classes. A link in the email
 * that opens the proposal with no sign-in is the version that gets used, so
 * the link has to be the credential: a token naming one proposal (or the
 * whole queue), signed with a secret only the server holds, and expiring.
 *
 * Whoever holds the teacher's inbox can act on the queue. That is already
 * true of most things, and the email is the one place these tokens go.
 *
 * Pure and separate from the server-only wrapper so it can be tested.
 */

export type ApprovalScope = "one" | "queue";

export interface ApprovalClaims {
  /** "one" for a single proposal, "queue" for everything pending. */
  scope: ApprovalScope;
  /** The proposal id, for scope "one". */
  id?: string;
  /** Unix seconds. */
  exp: number;
}

const b64url = (buf: Buffer): string =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromB64url = (s: string): Buffer =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

function mac(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

export function signApproval(claims: ApprovalClaims, secret: string): string {
  const payload = b64url(Buffer.from(JSON.stringify(claims), "utf8"));
  return `${payload}.${b64url(mac(payload, secret))}`;
}

export type VerifyOutcome =
  | { ok: true; claims: ApprovalClaims }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "no_secret" };

export function verifyApproval(token: string, secret: string, nowSeconds: number): VerifyOutcome {
  if (!secret) return { ok: false, reason: "no_secret" };
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return { ok: false, reason: "malformed" };

  const expected = mac(payload, secret);
  const given = fromB64url(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: "bad_signature" };
  }

  let claims: ApprovalClaims;
  try {
    claims = JSON.parse(fromB64url(payload).toString("utf8")) as ApprovalClaims;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    (claims.scope !== "one" && claims.scope !== "queue") ||
    typeof claims.exp !== "number" ||
    (claims.scope === "one" && typeof claims.id !== "string")
  ) {
    return { ok: false, reason: "malformed" };
  }
  if (claims.exp <= nowSeconds) return { ok: false, reason: "expired" };
  return { ok: true, claims };
}

/** Whether a verified token lets somebody decide this particular proposal. */
export function tokenCovers(claims: ApprovalClaims, proposalId: string): boolean {
  return claims.scope === "queue" || claims.id === proposalId;
}
