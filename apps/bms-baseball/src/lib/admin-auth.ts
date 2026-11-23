import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The coach page is behind one shared password (ADMIN_PASSWORD). The cookie
 * holds an HMAC derived from it, never the password, so changing the
 * password signs everyone out.
 */

export const COOKIE = "bmsb_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function password(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function adminConfigured(): boolean {
  return password().length >= 8;
}

function token(): string {
  return createHmac("sha256", password()).update("bmsb-admin-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function passwordMatches(attempt: string): boolean {
  return adminConfigured() && safeEqual(attempt, password());
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value ?? "";
  return value !== "" && safeEqual(value, token());
}

export async function signIn(): Promise<void> {
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
