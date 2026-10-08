import { NextResponse, type NextRequest } from "next/server";
import { getSessionClient } from "@/lib/supabase";
import { safeNext } from "@/lib/auth-rules";

export const dynamic = "force-dynamic";

/**
 * GET /auth/sign-in?next=/interest
 *
 * Google sign-in. Not linked from the site for now: the MCPS Google Workspace
 * blocks outside apps until district IT approves this one, so staff use the
 * emailed link at /sign-in. Point the links back here once IT approves it.
 *
 * Starts Google sign-in. `hd` asks Google to show only mcps.org accounts, but
 * that is a hint anyone can strip. The real check is in the callback.
 */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const db = await getSessionClient();
  if (!db) return NextResponse.redirect(new URL("/?error=unconfigured", origin));

  const { data, error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { hd: "mcps.org", prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    console.error("[paint-your-spot] sign in failed to start:", error?.message);
    return NextResponse.redirect(new URL("/?error=signin", origin));
  }
  return NextResponse.redirect(data.url);
}
