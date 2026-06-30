import "server-only";
import type Stripe from "stripe";
import type { TrailRunTier } from "./trail-run";

/**
 * Stripe operations for the Trail Run billing spine (Sprint T1).
 *
 * At signup we capture a payment method with NO charge. We do this with a
 * Checkout Session in `setup` mode, which runs a SetupIntent and saves the card
 * to a Customer. No subscription exists yet, so a pre-launch charge is
 * impossible by construction: the subscription with its 30-day trial is created
 * later by the launch event (Sprint T3) on this saved payment method, with
 * trial_end set to launch + 30 so the first charge lands on day 31.
 *
 * Confirmed against Stripe's current docs (June 2026): setup mode saves a
 * customer's payment details without an initial payment; passing an existing
 * customer attaches the resulting payment method to it for later off-session
 * billing.
 */

export interface CreateSetupSessionOpts {
  /** Selected tier as a catalog_key; recorded for the trial-end charge in T3. */
  tier: TrailRunTier;
  /** Consent record, serialized, stored on the engagement by the webhook. */
  consentJson: string;
  /** Region slug, if the buyer arrived from a region page. */
  region?: string | null;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Creates the Customer and the setup-mode Checkout Session. We create the
 * Customer up front (rather than letting Checkout create one) so the saved
 * payment method is reliably attached to a customer we control, and so the
 * billing address Checkout collects is written back for Stripe Tax in T3.
 *
 * Returns the hosted Checkout URL. The webhook reads the metadata to provision
 * the engagement on `checkout.session.completed`.
 */
export async function createTrailRunSetupSession(
  stripe: Stripe,
  opts: CreateSetupSessionOpts,
): Promise<string | null> {
  const metadata: Record<string, string> = {
    purchase_kind: "trail_run",
    selected_tier: opts.tier,
    trail_run_consent: opts.consentJson,
  };
  if (opts.region) metadata.region = opts.region;

  const customer = await stripe.customers.create({
    metadata: { program: "trail_run", selected_tier: opts.tier },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customer.id,
    // Collect the billing address now so Stripe Tax can compute correctly when
    // the subscription is created at launch (T3).
    // TODO: confirm Virginia and Texas sales-tax treatment with the CPA before
    // go-live. Stripe Tax is enabled on the launch-created subscription (T3).
    billing_address_collection: "required",
    customer_update: { address: "auto", name: "auto" },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata,
    setup_intent_data: { metadata },
  });

  return session.url;
}

/**
 * Reads the saved payment method id from a completed setup session. Prefers the
 * SetupIntent's payment_method, which is the card the customer just saved.
 */
export async function resolveSetupPaymentMethodId(
  stripe: Stripe,
  setupIntentId: string,
): Promise<string | null> {
  const intent = await stripe.setupIntents.retrieve(setupIntentId);
  const pm = intent.payment_method;
  if (!pm) return null;
  return typeof pm === "string" ? pm : pm.id;
}

/**
 * Tier-swap on the Stripe side. Once the subscription exists (created at launch
 * in T3), changing tier before the window ends updates the subscription item to
 * the new tier's price. Proration is off because we are inside the trial, so the
 * trial-end invoice simply bills the new tier. Before launch there is no
 * subscription, so the caller updates only the engagement's selected_tier.
 */
export async function swapTrailRunSubscriptionTier(
  stripe: Stripe,
  stripeSubscriptionId: string,
  newPriceId: string,
): Promise<void> {
  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) {
    throw new Error(`subscription ${stripeSubscriptionId} has no items to swap`);
  }
  await stripe.subscriptions.update(stripeSubscriptionId, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: "none",
  });
}
