import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Invitation tokens.
 *
 * Kept apart from lib/invitations.ts so that module stays importable by the
 * browser: the invite form needs the role list, and it has no business pulling
 * node:crypto into a bundle.
 *
 * The rule this file exists to enforce is that the database never holds a
 * working invitation. 0013 stores only `token_hash`, on the grounds that a
 * leaked backup should not hand somebody a set of live invites, and that only
 * holds if the raw token exists exactly twice: in the email that was sent, and
 * in the URL the invitee clicks.
 *
 * SHA-256 with no salt and no stretching, deliberately. This is not a password.
 * A token is 32 bytes from a cryptographic random source, so there is no
 * dictionary to attack and no work factor worth paying: the hash exists to stop
 * a database reader from using what they find, and a fast hash does that
 * exactly as well as a slow one. Stretching here would buy nothing and would
 * cost on every redemption.
 *
 * No em dashes anywhere, per the house rule.
 */

/** 32 bytes, base64url. Long enough that guessing is not a threat model. */
export function newInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/** What gets stored. Hex, so it is greppable and fixed width. */
export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Compare two hashes without leaking where they differ.
 *
 * The lookup is a database index scan on the hash, so the comparison that
 * matters already happens inside Postgres and this is belt and braces for any
 * caller that compares in application code. Length is checked first because
 * timingSafeEqual throws on a mismatch, and throwing is itself a signal.
 */
export function hashesMatch(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}
