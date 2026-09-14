import "server-only";
import { SITE_URL } from "./site";
import { signApproval, verifyApproval, type ApprovalClaims, type VerifyOutcome } from "./trail-crew-approval-token";

/**
 * The server side of the signed approval links: reads the secret, mints the
 * URLs that go in the email, and checks the token a request carries.
 *
 * `TRAIL_CREW_APPROVAL_SECRET` is any long random string. Without it there
 * are no links, the email says to sign in instead, and nothing else changes.
 */

const SECRET = process.env.TRAIL_CREW_APPROVAL_SECRET?.trim() ?? "";

/** A week. Long enough to catch up after a weekend, short enough to bound a leaked mail. */
const PROPOSAL_LINK_SECONDS = 7 * 24 * 3600;
/** A queue link is broader, so it is shorter lived. */
const QUEUE_LINK_SECONDS = 3 * 24 * 3600;

export function approvalLinksAreConfigured(): boolean {
  return SECRET.length >= 16;
}

function now(): number {
  return Math.floor(Date.now() / 1000);
}

export function proposalLink(id: string): string | null {
  if (!approvalLinksAreConfigured()) return null;
  const token = signApproval({ scope: "one", id, exp: now() + PROPOSAL_LINK_SECONDS }, SECRET);
  return `${SITE_URL}/trail-crew/decide?token=${encodeURIComponent(token)}`;
}

export function queueLink(): string | null {
  if (!approvalLinksAreConfigured()) return null;
  const token = signApproval({ scope: "queue", exp: now() + QUEUE_LINK_SECONDS }, SECRET);
  return `${SITE_URL}/trail-crew/decide?token=${encodeURIComponent(token)}`;
}

export function checkApprovalToken(token: string | null | undefined): VerifyOutcome {
  if (!token) return { ok: false, reason: "malformed" };
  return verifyApproval(token, SECRET, now());
}

export type { ApprovalClaims };
