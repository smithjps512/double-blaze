import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getAppUserOrg, generateTrailRunBrief } from "@/lib/trail-run-build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Assembles the Trail Run Build Brief for the signed-in client's build and
 * routes it to the team. Idempotent: a second call returns the existing brief
 * without re-seeding or re-notifying. Called when intake reports readyForBrief.
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
  if (!db) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }

  const appUser = await getAppUserOrg(db, userId);
  if (!appUser?.organizationId) {
    return NextResponse.json({ error: "No organization found." }, { status: 403 });
  }

  const result = await generateTrailRunBrief(appUser.organizationId);
  if (result.ok) {
    return NextResponse.json({
      ok: true,
      created: result.created,
      flagCount: result.flagCount,
    });
  }

  switch (result.reason) {
    case "no_build":
      return NextResponse.json(
        { error: "Trail Run intake is not available for this account." },
        { status: 409 },
      );
    case "parse_failed":
      return NextResponse.json(
        { error: "We could not assemble the brief yet. Please add a little more detail in the chat." },
        { status: 502 },
      );
    default:
      return NextResponse.json({ error: "Could not assemble the brief." }, { status: 500 });
  }
}
