import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getOfferingByKey } from "@/lib/catalog-db";
import { getRegionBySlug } from "@/lib/regions";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutBody {
  catalog_key?: string;
  consent?: boolean;
  /** Region slug the purchase was started from (tags the org, assigns the lead). */
  region?: string;
}

function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Checkout is not available right now. Please contact us." },
      { status: 503 },
    );
  }

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const key = body.catalog_key?.trim();
  if (!key) {
    return NextResponse.json({ error: "Missing offering." }, { status: 400 });
  }

  const offering = await getOfferingByKey(key);
  if (!offering) {
    return NextResponse.json(
      { error: "That offering is not available." },
      { status: 404 },
    );
  }

  // Consent gate: required for plans and any item carrying a minimum term.
  const requiresConsent = !!offering.min_term_months;
  if (requiresConsent && body.consent !== true) {
    return NextResponse.json(
      { error: "Please consent to the minimum term to continue." },
      { status: 400 },
    );
  }

  if (!offering.stripe_price_id) {
    return NextResponse.json(
      { error: "This offering is not ready for purchase yet." },
      { status: 409 },
    );
  }

  const consent = requiresConsent
    ? JSON.stringify({
        catalog_key: offering.catalog_key,
        term_months: offering.min_term_months,
        consented_at: new Date().toISOString(),
        ip: clientIp(req),
      })
    : "";

  // Branch by offering shape (purchase_kind drives the webhook too).
  let mode: Stripe.Checkout.SessionCreateParams.Mode;
  let purchaseKind: "plan" | "build_with_maintenance" | "one_time";
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  if (offering.type === "plan") {
    mode = "subscription";
    purchaseKind = "plan";
    lineItems.push({ price: offering.stripe_price_id, quantity: 1 });
  } else if (offering.requires_maintenance) {
    // Build + maintenance: subscription on the maintenance price, with the build
    // fee as a one-time line item billed on the first invoice (Stripe Checkout's
    // one-time-fee pattern, equivalent to add_invoice_items).
    const maintenance = offering.maintenance_key
      ? await getOfferingByKey(offering.maintenance_key)
      : null;
    if (!maintenance?.stripe_price_id) {
      return NextResponse.json(
        { error: "This offering is not ready for purchase yet." },
        { status: 409 },
      );
    }
    mode = "subscription";
    purchaseKind = "build_with_maintenance";
    lineItems.push({ price: maintenance.stripe_price_id, quantity: 1 });
    lineItems.push({ price: offering.stripe_price_id, quantity: 1 });
  } else {
    mode = "payment";
    purchaseKind = "one_time";
    lineItems.push({ price: offering.stripe_price_id, quantity: 1 });
  }

  const metadata: Record<string, string> = {
    catalog_key: offering.catalog_key,
    purchase_kind: purchaseKind,
  };
  if (consent) metadata.term_consent = consent;
  // Region context (validated against the seed) flows to the webhook, which
  // tags the organization and assigns the region's lead.
  const region = body.region ? getRegionBySlug(body.region.trim()) : null;
  if (region) metadata.region = region.slug;

  try {
    const params: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: lineItems,
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/checkout/${offering.catalog_key}?canceled=1`,
      metadata,
    };

    if (mode === "subscription") {
      params.subscription_data = { metadata };
    } else {
      // Capture a customer (and their email) for one-time payments too.
      params.customer_creation = "always";
      params.payment_intent_data = { metadata };
    }

    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(
      "[checkout] session create failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
