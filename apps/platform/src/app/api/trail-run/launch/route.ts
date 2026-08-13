import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isClerkEnabled, isStaffRole, type Role } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getAppUserOrg, launchTrailRun } from "@/lib/trail-run-build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LaunchBody {
  projectId?: string;
  liveUrl?: string;
}

/**
 * Launches a Trail Run build (staff only). Creates the Stripe subscription on
 * the saved payment method with a trial through launch + 30, sets the live URL
 * and window dates, and flips the engagement to active_window. A missing live
 * URL blocks the launch. Idempotent: re-launching returns the existing one.
 */
export async function POST(req: Request) {
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
  if (!isStaffRole((appUser?.role as Role | null) ?? null)) {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }

  let body: LaunchBody;
  try {
    body = (await req.json()) as LaunchBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const projectId = body.projectId?.trim();
  const liveUrl = body.liveUrl?.trim() ?? "";
  if (!projectId) {
    return NextResponse.json({ error: "Missing project." }, { status: 400 });
  }
  if (!liveUrl) {
    return NextResponse.json(
      { error: "A live URL is required to launch." },
      { status: 400 },
    );
  }

  const result = await launchTrailRun({ projectId, liveUrl });
  if (result.ok) {
    return NextResponse.json({ ok: true, alreadyLaunched: result.alreadyLaunched });
  }

  const status =
    result.reason === "not_found"
      ? 404
      : result.reason === "not_building" || result.reason === "missing_payment_method"
        ? 409
        : result.reason === "missing_live_url"
          ? 400
          : result.reason === "disabled"
            ? 503
            : result.reason === "stripe_error" || result.reason === "price_unavailable"
              ? 502
              : 500;
  const message: Record<string, string> = {
    not_found: "Build not found.",
    not_building: "This build is not ready to launch.",
    missing_payment_method: "No saved payment method on the engagement.",
    missing_live_url: "A live URL is required to launch.",
    price_unavailable: "The tier price is not configured in Stripe.",
    stripe_error: "Stripe could not create the subscription. Please try again.",
    disabled: "Billing is not configured.",
    error: "Could not launch. Please try again.",
  };
  return NextResponse.json({ error: message[result.reason] }, { status });
}
