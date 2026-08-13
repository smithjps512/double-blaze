import { NextResponse, type NextRequest } from "next/server";
import { getSessionClient } from "@/lib/auth";

/**
 * GET /api/auth/callback
 *
 * Where the emailed sign-in link lands. The token hash is exchanged for a
 * session here, server-side, so the session cookie is set with HttpOnly and
 * never passes through JavaScript. That is the reason the link points at this
 * route rather than at Supabase's own verify endpoint, which returns tokens in
 * a URL fragment that only client-side code can read.
 *
 * Verification consumes the token, so a link works exactly once.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const failed = (reason: string) =>
    NextResponse.redirect(new URL(`/sign-in?error=${reason}`, url.origin));

  if (!tokenHash || (type !== "magiclink" && type !== "signup")) {
    return failed("invalid");
  }

  const db = await getSessionClient();
  if (!db) return failed("unconfigured");

  const { error } = await db.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    // Expired and already-used are the same to a visitor: ask for a new link.
    console.warn(`[members] sign-in verification failed: ${error.message}`);
    return failed("expired");
  }

  // Land on the root, which decides what to show based on membership status:
  // the join questionnaire, a pending notice, or the member area.
  return NextResponse.redirect(new URL("/", url.origin));
}
