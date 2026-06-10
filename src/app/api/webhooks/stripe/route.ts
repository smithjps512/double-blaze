import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getOfferingByKey } from "@/lib/catalog-db";
import { sendPurchaseConfirmation, sendAccountSetup } from "@/lib/email";
import { inviteClient } from "@/lib/clerk-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUB_STATUS: Record<string, string> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  unpaid: "past_due",
  canceled: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "canceled",
  paused: "active",
};

function asId(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === "string" ? v : v.id;
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const db = getSupabaseServiceClient();

  if (!stripe || !secret || !db) {
    // Misconfigured environment. 503 lets Stripe retry once configured.
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error(
      "[stripe-webhook] signature verification failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Idempotency: skip events already fully processed.
  const { data: existing } = await db
    .from("stripe_events")
    .select("processed_at")
    .eq("id", event.id)
    .maybeSingle();
  if (existing?.processed_at) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  await db
    .from("stripe_events")
    .upsert({ id: event.id, type: event.type }, { onConflict: "id" });

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          stripe,
          db,
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await updateSubscriptionStatus(
          db,
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await setSubscriptionStatusById(
          db,
          (event.data.object as Stripe.Subscription).id,
          "canceled",
        );
        break;
      case "invoice.paid":
        await handleInvoice(db, event.data.object as Stripe.Invoice, "active");
        break;
      case "invoice.payment_failed":
        await handleInvoice(db, event.data.object as Stripe.Invoice, "past_due");
        break;
      default:
        // Unhandled event types are acknowledged without action.
        break;
    }
  } catch (err) {
    console.error(
      `[stripe-webhook] handler error for ${event.type}:`,
      err instanceof Error ? err.message : "unknown error",
    );
    // Leave processed_at null so Stripe's retry reprocesses this event.
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  await db
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", event.id);

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// checkout.session.completed: provision org, subscription/order, project, then
// send emails and invite the buyer (workflow steps 1 and 2).
// ---------------------------------------------------------------------------
async function handleCheckoutCompleted(
  stripe: Stripe,
  db: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  const catalogKey = session.metadata?.catalog_key;
  const purchaseKind = session.metadata?.purchase_kind;
  if (!catalogKey || !purchaseKind) {
    console.error("[stripe-webhook] checkout missing metadata; skipping");
    return;
  }

  // Idempotent guard: if we already created rows for this session, stop.
  const [{ data: subDup }, { data: ordDup }] = await Promise.all([
    db.from("subscriptions").select("id").eq("stripe_checkout_session_id", session.id).maybeSingle(),
    db.from("orders").select("id").eq("stripe_checkout_session_id", session.id).maybeSingle(),
  ]);
  if (subDup || ordDup) return;

  const offering = await getOfferingByKey(catalogKey);
  if (!offering) {
    console.error("[stripe-webhook] unknown catalog_key:", catalogKey);
    return;
  }

  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const customerId = asId(session.customer);
  const subscriptionId = asId(session.subscription);
  const paymentIntentId = asId(session.payment_intent);
  const consent = session.metadata?.term_consent
    ? safeParse(session.metadata.term_consent)
    : null;

  const organizationId = await findOrCreateOrg(db, { customerId, email });

  let sourceSubscriptionId: string | null = null;
  let sourceOrderId: string | null = null;

  if (purchaseKind === "plan") {
    const termStart = new Date();
    const minTermEnd = offering.min_term_months
      ? addMonths(termStart, offering.min_term_months)
      : null;
    const { data } = await db
      .from("subscriptions")
      .insert({
        organization_id: organizationId,
        plan: offering.catalog_key,
        catalog_key: offering.catalog_key,
        status: "active",
        term_start: termStart.toISOString(),
        min_term_end: minTermEnd?.toISOString() ?? null,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        stripe_checkout_session_id: session.id,
        term_consent: consent,
      })
      .select("id")
      .single();
    sourceSubscriptionId = data?.id ?? null;
  } else if (purchaseKind === "build_with_maintenance") {
    // Maintenance subscription + a one-time build order.
    const { data: sub } = await db
      .from("subscriptions")
      .insert({
        organization_id: organizationId,
        plan: "maintenance",
        catalog_key: offering.maintenance_key ?? "maintenance",
        status: "active",
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        stripe_checkout_session_id: `${session.id}:maintenance`,
      })
      .select("id")
      .single();
    sourceSubscriptionId = sub?.id ?? null;

    const { data: ord } = await db
      .from("orders")
      .insert({
        organization_id: organizationId,
        catalog_key: offering.catalog_key,
        line_items: [
          { catalog_key: offering.catalog_key, name: offering.name, amount: offering.unit_amount },
        ],
        amount_total: offering.unit_amount,
        currency: offering.currency,
        status: "paid",
        stripe_subscription_id: subscriptionId,
        stripe_checkout_session_id: session.id,
        term_consent: consent,
      })
      .select("id")
      .single();
    sourceOrderId = ord?.id ?? null;
  } else {
    // one_time
    const { data } = await db
      .from("orders")
      .insert({
        organization_id: organizationId,
        catalog_key: offering.catalog_key,
        line_items: [
          { catalog_key: offering.catalog_key, name: offering.name, amount: offering.unit_amount },
        ],
        amount_total: session.amount_total ?? offering.unit_amount,
        currency: offering.currency,
        status: "paid",
        stripe_payment_intent_id: paymentIntentId,
        stripe_checkout_session_id: session.id,
      })
      .select("id")
      .single();
    sourceOrderId = data?.id ?? null;
  }

  // Project in status `new` (workflow step 1).
  await db.from("projects").insert({
    organization_id: organizationId,
    source_subscription_id: sourceSubscriptionId,
    source_order_id: sourceOrderId,
    status: "new",
  });

  // Workflow step 1 + 2: confirm, invite, account setup.
  if (email) {
    await sendPurchaseConfirmation(email, offering.name);
    await inviteClient(email);
    await sendAccountSetup(email);
  } else {
    console.warn("[stripe-webhook] no buyer email; skipped emails/invite");
  }
}

async function findOrCreateOrg(
  db: SupabaseClient,
  { customerId, email }: { customerId: string | null; email: string | null },
): Promise<string> {
  if (customerId) {
    const { data } = await db
      .from("organizations")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data) return data.id;
  }
  if (email) {
    const { data } = await db
      .from("organizations")
      .select("id")
      .eq("primary_contact_email", email)
      .maybeSingle();
    if (data) {
      if (customerId) {
        await db.from("organizations").update({ stripe_customer_id: customerId }).eq("id", data.id);
      }
      return data.id;
    }
  }
  const { data, error } = await db
    .from("organizations")
    .insert({
      name: email ?? "New client",
      primary_contact_email: email,
      stripe_customer_id: customerId,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`org create failed: ${error?.message}`);
  return data.id;
}

async function updateSubscriptionStatus(db: SupabaseClient, sub: Stripe.Subscription) {
  const status = SUB_STATUS[sub.status] ?? "incomplete";
  await setSubscriptionStatusById(db, sub.id, status);
}

async function setSubscriptionStatusById(
  db: SupabaseClient,
  stripeSubscriptionId: string,
  status: string,
) {
  await db
    .from("subscriptions")
    .update({ status })
    .eq("stripe_subscription_id", stripeSubscriptionId);
}

async function handleInvoice(
  db: SupabaseClient,
  invoice: Stripe.Invoice,
  status: "active" | "past_due",
) {
  const subId = asId(
    (invoice as unknown as { subscription?: string | { id: string } | null })
      .subscription ?? null,
  );
  if (subId) await setSubscriptionStatusById(db, subId, status);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
