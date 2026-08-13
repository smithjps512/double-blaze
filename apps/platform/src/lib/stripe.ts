import "server-only";
import Stripe from "stripe";

/**
 * Server-only Stripe client. Returns null when STRIPE_SECRET_KEY is absent so
 * the app builds and the public storefront renders with zero secrets. We do not
 * pin an apiVersion here; the account default is used, which keeps the SDK types
 * and runtime in agreement across upgrades.
 *
 * Use Stripe TEST keys (sk_test_...) for development. Never log the key.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const isStripeEnabled = !!process.env.STRIPE_SECRET_KEY;
