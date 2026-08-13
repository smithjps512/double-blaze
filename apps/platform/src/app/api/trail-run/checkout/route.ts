import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createTrailRunSetupSession } from "@/lib/stripe-trail-run";
import { getRegionBySlug } from "@/lib/regions";
import { SITE_URL } from "@/lib/site";
import {
  buildConsentRecord,
  normalizeTrailTier,
} from "@/lib/trail-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TrailRunBody {
  /** Selected tier as a catalog_key; defaults to blue when absent or invalid. */
  selected_tier?: string;
  /** Required acknowledgment of the no-charge-until-launch-plus-30 terms. */
  consent?: boolean;
  /** Region slug the buyer started from (tags the org, assigns the lead). */
  region?: string;
}

function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}

/**
 * Starts a Trail Run signup. Captures a payment method with no charge via a
 * Stripe setup-mode Checkout Session, after the customer acknowledges the
 * Trail Run terms. No subscription is created here; the launch event (T3)
 * creates it on the saved payment method with a trial through launch + 30.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Signup is not available right now. Please contact us." },
      { status: 503 },
    );
  }

  let body: TrailRunBody;
  try {
    body = (await req.json()) as TrailRunBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Consent is required: this is the chargeback and dispute protection.
  if (body.consent !== true) {
    return NextResponse.json(
      { error: "Please acknowledge the Trail Run terms to continue." },
      { status: 400 },
    );
  }

  const tier = normalizeTrailTier(body.selected_tier);
  const region = body.region ? getRegionBySlug(body.region.trim())?.slug ?? null : null;

  const consent = buildConsentRecord({
    tier,
    consentedAt: new Date(),
    ip: clientIp(req),
  });

  try {
    const url = await createTrailRunSetupSession(stripe, {
      tier,
      consentJson: JSON.stringify(consent),
      region,
      successUrl: `${SITE_URL}/trail-run/started?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${SITE_URL}/trail-run?canceled=1`,
    });
    if (!url) {
      return NextResponse.json(
        { error: "Could not start signup. Please try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ url });
  } catch (err) {
    console.error(
      "[trail-run] setup session create failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return NextResponse.json(
      { error: "Could not start signup. Please try again." },
      { status: 502 },
    );
  }
}
