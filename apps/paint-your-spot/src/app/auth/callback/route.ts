import { NextResponse, type NextRequest } from "next/server";
import { getSessionClient } from "@/lib/supabase";
import { isStaffEmail, safeNext } from "@/lib/auth-rules";
import { syncProfile, viewerFromUser } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * GET /auth/callback
 *
 * Google sends people back here. The code becomes a session on the server,
 * and the domain check happens here, server side: anyone outside @mcps.org is
 * signed straight back out.
 */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const code = req.nextUrl.searchParams.get("code");
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const fail = (reason: string) => NextResponse.redirect(new URL(`/?error=${reason}`, origin));

  if (!code) return fail("signin");
  const db = await getSessionClient();
  if (!db) return fail("unconfigured");

  const { data, error } = await db.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.warn("[paint-your-spot] code exchange failed:", error?.message);
    return fail("signin");
  }

  if (!isStaffEmail(data.user.email)) {
    await db.auth.signOut();
    return fail("domain");
  }

  const viewer = viewerFromUser(data.user);
  if (viewer) await syncProfile(viewer);
  return NextResponse.redirect(new URL(next, origin));
}
