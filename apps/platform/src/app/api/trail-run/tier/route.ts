import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getOfferingByKey } from "@/lib/catalog-db";
import { swapTrailRunSubscriptionTier } from "@/lib/stripe-trail-run";
import { isClerkEnabled, isStaffRole, type Role } from "@/lib/auth";
import { isValidTrailTier } from "@/lib/trail-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TierBody {
  selected_tier?: string;
  /** Staff may target a specific engagement; clients act on their own. */
  engagement_id?: string;
}

/**
 * Changes the selected tier on a Trail Run engagement before the window ends.
 *
 * Before launch (T1) there is no subscription, so this updates only the
 * engagement's selected_tier, which the launch event reads to price the trial.
 * After launch (T3) the engagement carries a subscription; we also swap the
 * Stripe subscription item so the trial-end charge bills the new tier.
 *
 * The customer-facing portal arrives in T3. For now this is an authenticated
 * endpoint: a client may change their own org's engagement, staff may target
 * any engagement by id.
 */
export async function POST(req: Request) {
  const db = getSupabaseServiceClient();
  if (!db) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }
  if (!isClerkEnabled) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: TierBody;
  try {
    body = (await req.json()) as TierBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const tier = body.selected_tier?.trim();
  if (!isValidTrailTier(tier)) {
    return NextResponse.json({ error: "Unknown tier." }, { status: 400 });
  }

  // Resolve the acting user's role and org from the users table.
  const { data: appUser } = await db
    .from("users")
    .select("role, organization_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  const role = (appUser?.role as Role | undefined) ?? null;
  const staff = isStaffRole(role);

  // Select the target engagement: staff by id, clients by their own org.
  let query = db
    .from("trail_run_engagements")
    .select("id, organization_id, status, subscription_id");
  if (staff && body.engagement_id) {
    query = query.eq("id", body.engagement_id);
  } else {
    if (!appUser?.organization_id) {
      return NextResponse.json({ error: "No engagement found." }, { status: 404 });
    }
    query = query.eq("organization_id", appUser.organization_id);
  }
  const { data: engagement } = await query.maybeSingle();
  if (!engagement) {
    return NextResponse.json({ error: "No engagement found." }, { status: 404 });
  }

  // The window is open through active_window; converting or later is too late.
  const OPEN: string[] = ["signup", "building", "launched", "active_window"];
  if (!OPEN.includes(engagement.status)) {
    return NextResponse.json(
      { error: "The Trail Run window is closed for tier changes." },
      { status: 409 },
    );
  }

  // If the subscription already exists (post-launch), swap the Stripe item too.
  if (engagement.subscription_id) {
    const { data: sub } = await db
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("id", engagement.subscription_id)
      .maybeSingle();
    const stripe = getStripe();
    const offering = await getOfferingByKey(tier);
    if (stripe && sub?.stripe_subscription_id && offering?.stripe_price_id) {
      try {
        await swapTrailRunSubscriptionTier(
          stripe,
          sub.stripe_subscription_id,
          offering.stripe_price_id,
        );
      } catch (err) {
        console.error(
          "[trail-run] tier swap on Stripe failed:",
          err instanceof Error ? err.message : "unknown error",
        );
        return NextResponse.json(
          { error: "Could not change tier. Please try again." },
          { status: 502 },
        );
      }
    }
  }

  const { error } = await db
    .from("trail_run_engagements")
    .update({ selected_tier: tier })
    .eq("id", engagement.id);
  if (error) {
    return NextResponse.json(
      { error: "Could not save the tier change." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, selected_tier: tier });
}
