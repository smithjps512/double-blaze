import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getAppUserOrg, cancelTrailRun } from "@/lib/trail-run-build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cancels the signed-in client's Trail Run during the window (no charge). Sets
 * the engagement to canceled and stamps cancellation_date and
 * retention_expires_at. Take-offline, purge, and reactivation are Sprint T4.
 */
export async function POST() {
  if (!isClerkEnabled) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const db = getSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "Not available." }, { status: 503 });

  const appUser = await getAppUserOrg(db, userId);
  if (!appUser?.organizationId) {
    return NextResponse.json({ error: "No organization found." }, { status: 403 });
  }

  const result = await cancelTrailRun(appUser.organizationId);
  if (result.ok) return NextResponse.json({ ok: true, alreadyCanceled: result.alreadyCanceled });

  const status = result.reason === "not_found" ? 404 : result.reason === "not_cancelable" ? 409 : 500;
  const message: Record<string, string> = {
    not_found: "No Trail Run found.",
    not_cancelable: "This Trail Run cannot be canceled right now.",
    error: "Could not cancel. Please try again.",
  };
  return NextResponse.json({ error: message[result.reason] }, { status });
}
