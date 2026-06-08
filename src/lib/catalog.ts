/**
 * Commercial model as data (spec section 3). This is the single source of
 * truth for pricing in the storefront. Sprint 2 mirrors these in Stripe and,
 * ultimately, in the `subscriptions` / `orders` tables; until then the
 * `stripePriceId` fields stay null and checkout is not wired.
 */

export type BillingType = "recurring" | "one-time";

export interface Plan {
  slug: string;
  name: string;
  priceMonthly: number;
  tagline: string;
  /** Cumulative feature highlights; each tier adds to the one before it. */
  features: string[];
  /** What this tier adds on top of the previous one. */
  adds?: string;
  featured?: boolean;
  stripePriceId?: string | null;
}

export interface AlaCarteItem {
  slug: string;
  name: string;
  price: number;
  type: BillingType;
  /** Recurring maintenance fee, in dollars per month, if any. */
  maintenanceMonthly: number | null;
  description: string;
  stripePriceId?: string | null;
}

/** Monthly packages, 12-month minimum term (spec section 3). */
export const PLANS: Plan[] = [
  {
    slug: "green-trail",
    name: "Green Trail",
    priceMonthly: 199,
    tagline: "Get found and start selling.",
    features: [
      "Website refresh",
      "Basic ecommerce",
      "Social setup",
      "1 daily AI post",
    ],
    stripePriceId: null,
  },
  {
    slug: "blue-trail",
    name: "Blue Trail",
    priceMonthly: 499,
    tagline: "Run leaner with automation and insight.",
    adds: "Everything in Green Trail, plus:",
    features: [
      "Workflow automation",
      "AI customer support",
      "Inventory management",
      "KPI dashboard",
    ],
    featured: true,
    stripePriceId: null,
  },
  {
    slug: "black-trail",
    name: "Black Trail",
    priceMonthly: 999,
    tagline: "We handle your content, every month.",
    adds: "Everything in Blue Trail, plus:",
    features: [
      "Monthly custom content by Double Blaze",
      "Promo and product updates",
    ],
    stripePriceId: null,
  },
  {
    slug: "double-black",
    name: "Double Black",
    priceMonthly: 1499,
    tagline: "The full operation, built and run for you.",
    adds: "Everything in Black Trail, plus:",
    features: [
      "Monthly video reels",
      "Training platform",
      "Third-party app integrations",
    ],
    stripePriceId: null,
  },
];

/** A-la-carte / project work (spec section 3). */
export const ALA_CARTE: AlaCarteItem[] = [
  {
    slug: "commerce-site-client-content",
    name: "Commerce site, your content",
    price: 1500,
    type: "one-time",
    maintenanceMonthly: 29,
    description:
      "A complete ecommerce site built around content you provide. Launch-ready and yours to grow.",
    stripePriceId: null,
  },
  {
    slug: "commerce-site-double-blaze-content",
    name: "Commerce site, our content",
    price: 4500,
    type: "one-time",
    maintenanceMonthly: 29,
    description:
      "A complete ecommerce site with copy, imagery, and product content produced by Double Blaze.",
    stripePriceId: null,
  },
  {
    slug: "workflow-automation",
    name: "Workflow automation",
    price: 1500,
    type: "one-time",
    maintenanceMonthly: null,
    description:
      "One automated workflow that removes a manual step from your operation. Priced per workflow, client hosted.",
    stripePriceId: null,
  },
  {
    slug: "business-dashboard",
    name: "Business dashboard",
    price: 2500,
    type: "one-time",
    maintenanceMonthly: null,
    description:
      "A live dashboard tracking up to 15 metrics that matter to your business. Client hosted.",
    stripePriceId: null,
  },
];

/** $29/mo maintenance attaches to a-la-carte builds (spec section 3). */
export const MAINTENANCE_MONTHLY = 29;

/** Minimum contract term on monthly packages, in months (spec section 3). */
export const MIN_TERM_MONTHS = 12;

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
