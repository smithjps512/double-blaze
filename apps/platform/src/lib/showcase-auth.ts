import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Who is allowed to change the site.
 *
 * A shared passcode, not accounts. That is a real decision and it is worth
 * being straight about it on the page rather than implying more security than
 * exists: everyone who has the passcode is the same person as far as this site
 * is concerned, so it cannot tell who added a car and cannot take one person's
 * access away without changing it for everybody. That is exactly the trade a
 * small real site makes, and naming it is the lesson. Accounts are what you
 * build when you need to answer "who did this", and nothing here needs to.
 *
 * The students are twelve and thirteen, so accounts would also mean collecting
 * their details, and this feature deliberately knows nothing about them.
 *
 * The cookie holds an HMAC of the team slug keyed by the passcode itself, so a
 * cookie cannot be forged without knowing the passcode and no second secret has
 * to be configured to make it work.
 */

const COOKIE = "showcase_admin";
const MAX_AGE = 60 * 60 * 8; // A school day, then sign in again.

function passcode(): string | null {
  const value = process.env.SHOWCASE_ADMIN_PASSCODE?.trim();
  return value ? value : null;
}

export function passcodeIsConfigured(): boolean {
  return passcode() !== null;
}

function token(team: string, secret: string): string {
  return createHmac("sha256", secret).update(`showcase:${team}`).digest("hex");
}

/** Constant time, because the comparison itself should not leak the answer. */
function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function checkPasscode(team: string, attempt: string): { ok: true; token: string } | { ok: false } {
  const secret = passcode();
  if (!secret) return { ok: false };
  const given = Buffer.from(attempt);
  const real = Buffer.from(secret);
  if (given.length !== real.length || !timingSafeEqual(given, real)) return { ok: false };
  return { ok: true, token: token(team, secret) };
}

export async function isSignedIn(team: string): Promise<boolean> {
  const secret = passcode();
  if (!secret) return false;
  const jar = await cookies();
  const value = jar.get(cookieName(team))?.value;
  return !!value && sameToken(value, token(team, secret));
}

export function cookieName(team: string): string {
  return `${COOKIE}_${team.replace(/[^a-z0-9]+/gi, "_")}`;
}

export const COOKIE_MAX_AGE = MAX_AGE;
