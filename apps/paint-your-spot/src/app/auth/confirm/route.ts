import { NextResponse, type NextRequest } from "next/server";
import { isStaffEmail, safeNext } from "@/lib/auth-rules";
import { getSessionClient } from "@/lib/supabase";
import { syncProfile, viewerFromUser } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * GET /auth/confirm?token_hash=...&type=...&next=...
 *
 * Where the emailed sign-in link lands. The token becomes a session on the
 * server, and the @mcps.org check runs again here.
 */
const TYPES = ["magiclink", "signup", "email"] as const;
type LinkType = (typeof TYPES)[number];

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const params = req.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const declared = params.get("type");
  const next = safeNext(params.get("next"));
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/sign-in?error=${reason}&next=${encodeURIComponent(next)}`, origin));

  if (!tokenHash) return fail("signin");
  const db = await getSessionClient();
  if (!db) return fail("signin");

  // Try the declared type first, then the others. A failed attempt does not
  // consume the token, and a type mismatch otherwise reads as "expired".
  const first = (TYPES as readonly string[]).includes(declared ?? "") ? (declared as LinkType) : "magiclink";
  const attempts: LinkType[] = [first, ...TYPES.filter((t) => t !== first)];
  for (const type of attempts) {
    const { data, error } = await db.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error || !data.user) continue;
    if (!isStaffEmail(data.user.email)) {
      await db.auth.signOut();
      return fail("domain");
    }
    const viewer = viewerFromUser(data.user);
    if (viewer) await syncProfile(viewer);
    return NextResponse.redirect(new URL(next, origin));
  }
  return fail("expired");
}
