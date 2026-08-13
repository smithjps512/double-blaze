/**
 * Structural boundary enforcement for Trailhead builds (stage 3).
 *
 * This validates built content structurally, not by keyword scanning prose.
 * Checks for payment forms, cart/checkout components, external payment scripts,
 * page count, footer credit, and custom domain config. Legitimate copy that
 * mentions buying, scheduling, or shopping is allowed.
 */

import { MAX_PAGES } from "./trailhead";

export interface BoundaryViolation {
  type: string;
  detail: string;
}

/**
 * Validate built site content for Trailhead boundary violations.
 * Returns an empty array if the content passes all checks.
 *
 * `content` is the built_content JSON: an object with a `pages` array of
 * { slug, title, html, css } and a `config` object.
 */
export function validateTrailheadBuild(content: {
  pages?: Array<{ slug?: string; html?: string }>;
  config?: { customDomain?: string; footerCredit?: boolean };
}): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];

  const pages = content.pages ?? [];

  // Page count
  if (pages.length > MAX_PAGES) {
    violations.push({
      type: "page_count",
      detail: `Build has ${pages.length} pages, maximum is ${MAX_PAGES}.`,
    });
  }

  // Footer credit must be present
  if (content.config?.footerCredit === false) {
    violations.push({
      type: "footer_credit",
      detail: "Footer credit cannot be removed on Trailhead.",
    });
  }

  // Custom domain config
  if (content.config?.customDomain) {
    violations.push({
      type: "custom_domain",
      detail: "Custom domains are not available on Trailhead.",
    });
  }

  // Scan HTML structurally for payment forms, cart components, and payment scripts
  for (const page of pages) {
    const html = page.html ?? "";
    const slug = page.slug ?? "unknown";

    // Payment form inputs (type="number" with payment-related names, hidden payment fields)
    if (hasPaymentFormElements(html)) {
      violations.push({
        type: "payment_form",
        detail: `Page "${slug}" contains payment form elements.`,
      });
    }

    // Cart or checkout components (custom elements, data attributes)
    if (hasCartCheckoutComponents(html)) {
      violations.push({
        type: "cart_component",
        detail: `Page "${slug}" contains cart or checkout components.`,
      });
    }

    // External payment scripts (Stripe.js, PayPal SDK, Square, etc.)
    if (hasPaymentScripts(html)) {
      violations.push({
        type: "payment_script",
        detail: `Page "${slug}" includes external payment scripts.`,
      });
    }
  }

  return violations;
}

/** Detect form elements with payment-related structural patterns. */
function hasPaymentFormElements(html: string): boolean {
  // Input fields for credit card data, CVV, card number, expiry
  const paymentInputPattern =
    /<input[^>]*(?:name|id|autocomplete)\s*=\s*["'](?:cc-|card[-_]?(?:number|cvc|cvv|exp)|payment|billing[-_]amount|price|total[-_]amount|checkout[-_]amount)[^"']*["'][^>]*>/i;
  if (paymentInputPattern.test(html)) return true;

  // Forms with action pointing to payment processors
  const paymentFormAction =
    /<form[^>]*action\s*=\s*["'][^"']*(?:stripe\.com|paypal\.com|square\.com|checkout|pay)[^"']*["'][^>]*>/i;
  if (paymentFormAction.test(html)) return true;

  return false;
}

/** Detect cart or checkout component markup. */
function hasCartCheckoutComponents(html: string): boolean {
  // Custom elements like <stripe-buy-button>, <paypal-button>, etc.
  const paymentElements =
    /<(?:stripe-|paypal-|square-)[a-z-]+[^>]*>/i;
  if (paymentElements.test(html)) return true;

  // Data attributes for cart/checkout functionality
  const cartDataAttrs =
    /data-(?:stripe|paypal|square|checkout|payment)[-_]?(?:key|id|button|widget|embed)/i;
  if (cartDataAttrs.test(html)) return true;

  // Cart item data attributes (snipcart pattern: data-cart-item-*)
  const cartItemAttrs = /data-cart[-_]item[-_]/i;
  if (cartItemAttrs.test(html)) return true;

  // Snipcart, Shopify buy button, Gumroad overlays
  const embeddedCommerce =
    /(?:snipcart|shopify-buy|gumroad-overlay|buy-button-|add-to-cart-widget)/i;
  if (embeddedCommerce.test(html)) return true;

  return false;
}

/** Detect external payment processor scripts. */
function hasPaymentScripts(html: string): boolean {
  const paymentScriptSrcs = [
    /js\.stripe\.com/i,
    /www\.paypal\.com\/sdk/i,
    /sandbox\.paypal\.com/i,
    /web\.squarecdn\.com/i,
    /square\.com\/payments/i,
    /js\.braintreegateway\.com/i,
    /gumroad\.com\/js/i,
    /snipcart\.com/i,
    /cdn\.shopify\.com\/buy-button/i,
  ];

  for (const pattern of paymentScriptSrcs) {
    if (pattern.test(html)) return true;
  }

  return false;
}
