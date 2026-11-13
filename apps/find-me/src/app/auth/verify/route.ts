import { NextResponse, type NextRequest } from "next/server";
import { adoptCookieAnswers } from "@/lib/answers";
import { safeNext } from "@/lib/auth-rules";
import { getSessionClient } from "@/lib/supabase";
import { syncProfile } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * Supabase files the same emailed link under a different type depending on
 * the account (signup for a new address, recovery for a returning one).
 * Verifying with the wrong type fails without spending the token, so try
 * them all. Learned the hard way on Paint Your Spot.
 */
const TYPES = ["magiclink", "recovery", "signup", "email"] as const;
type LinkType = (typeof TYPES)[number];

/** POST /auth/verify. Only reachable from the button on /auth/confirm. */
export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const form = await req.formData();
  const field = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : null;
  };
  const tokenHash = field("token_hash");
  const declared = field("type");
  const next = safeNext(field("next"));
  const go = (path: string) => NextResponse.redirect(new URL(path, origin), { status: 303 });
  const fail = (reason: string) => go(`/sign-in?error=${reason}&next=${encodeURIComponent(next)}`);

  if (!tokenHash) return fail("signin");
  const db = await getSessionClient();
  if (!db) return fail("signin");

  const first = (TYPES as readonly string[]).includes(declared ?? "") ? (declared as LinkType) : "magiclink";
  for (const type of [first, ...TYPES.filter((t) => t !== first)]) {
    const { data, error } = await db.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error || !data.user) continue;
    await syncProfile(data.user);
    await adoptCookieAnswers(data.user.id, db);
    return go(next);
  }
  const { data: current } = await db.auth.getUser();
  if (current.user) return go(next);
  return fail("expired");
}
