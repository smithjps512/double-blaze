import { NextResponse, type NextRequest } from "next/server";
import { getSiteByPreviewToken, createTipRecord } from "@/lib/trailhead-db";
import { validateTipAmount } from "@/lib/trailhead";
import Stripe from "stripe";
import { SITE_URL } from "@/lib/site";

/**
 * POST /api/trailhead/tip
 * Creates a Stripe Checkout session for a one-time tip. Amount is collected
 * on our page (presets or custom), validated server-side, then a payment-mode
 * session is created with inline price_data. No Stripe Price objects per tip.
 */
export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = String(body.token ?? "");
  const amountCents = Number(body.amount_cents ?? 0);

  if (!token) {
    return NextResponse.json({ error: "Token required." }, { status: 400 });
  }

  // Validate amount server-side
  const amountError = validateTipAmount(amountCents);
  if (amountError) {
    return NextResponse.json({ error: amountError }, { status: 400 });
  }

  const site = await getSiteByPreviewToken(token);
  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const stripe = new Stripe(stripeKey);

  // Tax: tips use tax_behavior "inclusive" — the customer-facing amount is
  // the total. If Stripe Tax is enabled later, tax is backed out of the
  // displayed amount rather than added on top.

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Trailhead tip",
            description: `Tip for ${site.subdomain}.doubleblaze.solutions`,
          },
          unit_amount: amountCents,
          tax_behavior: "inclusive",
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/trailhead/tip/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/trailhead/status/${token}`,
    metadata: {
      trailhead_site_id: site.id,
      type: "trailhead_tip",
    },
  });

  // Create a pending tip record
  await createTipRecord(site.id, amountCents, session.id);

  return NextResponse.json({ ok: true, checkout_url: session.url });
}
