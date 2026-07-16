/**
 * Trailhead: shared constants and pure helpers (docs/trailhead-program-brief.md).
 *
 * Trailhead is the free, tip-based rung below Green Trail. Spark builds a
 * simple marketing or member site at no cost, hosted at a doubleblaze.solutions
 * subdomain. The customer tips what they think it was worth.
 *
 * This module is pure and framework-free so it can be unit tested directly and
 * imported from both server and client code.
 */

/** Monthly build cap. Single constant to raise. */
export const TRAILHEAD_MONTHLY_CAP = 10;

/** Tip presets in dollars. */
export const TIP_PRESETS = [100, 200, 350] as const;

/** Minimum custom tip in cents. */
export const TIP_MIN_CENTS = 100; // $1

/** Maximum custom tip in cents (sanity bound). */
export const TIP_MAX_CENTS = 100_000; // $1,000

/**
 * Reserved subdomains: system routes, infrastructure names, and anything that
 * would collide with a current or future Double Blaze path.
 */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "www",
  "app",
  "api",
  "mail",
  "admin",
  "portal",
  "studio",
  "docs",
  "blog",
  "status",
  // Current and future routes
  "pricing",
  "services",
  "solutions",
  "about",
  "regions",
  "start-a-project",
  "trail-run",
  "trailhead",
  "checkout",
  "execution",
  "sign-in",
  "sign-up",
  "sitemap",
  "robots",
]);

export interface SubdomainValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validate a candidate subdomain. Rules:
 * - Lowercase alphanumeric and hyphens only
 * - No leading or trailing hyphen
 * - 3 to 40 characters
 * - Not in the reserved list
 */
export function validateSubdomain(name: string): SubdomainValidation {
  if (!name) {
    return { valid: false, error: "Subdomain is required." };
  }
  if (name !== name.toLowerCase()) {
    return { valid: false, error: "Subdomain must be lowercase." };
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    return {
      valid: false,
      error: "Only lowercase letters, numbers, and hyphens are allowed.",
    };
  }
  if (name.startsWith("-") || name.endsWith("-")) {
    return {
      valid: false,
      error: "Subdomain cannot start or end with a hyphen.",
    };
  }
  if (name.length < 3) {
    return { valid: false, error: "Subdomain must be at least 3 characters." };
  }
  if (name.length > 40) {
    return { valid: false, error: "Subdomain must be 40 characters or fewer." };
  }
  if (RESERVED_SUBDOMAINS.has(name)) {
    return { valid: false, error: "That name is reserved. Please choose another." };
  }
  return { valid: true };
}

/** Site status flow (matches the trailhead_site_status enum in migration 0008). */
export type TrailheadSiteStatus =
  | "submitted"
  | "awaiting_approval"
  | "approved"
  | "building"
  | "preview"
  | "published"
  | "correcting"
  | "exported"
  | "upgraded"
  | "declined"
  | "waitlisted";

/** Pages available in the intake form (section 2). Home is required. */
export const TRAILHEAD_PAGES = [
  { id: "home", label: "Home", required: true },
  { id: "about", label: "About" },
  { id: "services", label: "Services or What we do" },
  { id: "members", label: "Members or Roster" },
  { id: "events", label: "Events or Schedule" },
  { id: "gallery", label: "Gallery or Photos" },
  { id: "contact", label: "Contact" },
] as const;

export const MAX_PAGES = 5;

/** Tone options for section 5. */
export const TONE_OPTIONS = [
  { id: "warm", label: "Warm and friendly" },
  { id: "professional", label: "Clean and professional" },
  { id: "bold", label: "Bold and energetic" },
  { id: "classic", label: "Quiet and classic" },
] as const;

/** Org type options for section 0. */
export const ORG_TYPES = [
  { id: "home_business", label: "Home business" },
  { id: "club", label: "Club or group" },
  { id: "community", label: "Community organization" },
  { id: "nonprofit", label: "Nonprofit" },
  { id: "association", label: "Association" },
  { id: "other", label: "Other" },
] as const;

/** Primary action options for section 1. */
export const PRIMARY_ACTIONS = [
  { id: "learn", label: "Learn about us" },
  { id: "contact", label: "Contact us" },
  { id: "join", label: "Join us" },
  { id: "visit", label: "Visit us in person" },
  { id: "schedule", label: "Find our schedule" },
  { id: "other", label: "Other" },
] as const;

/**
 * Get the current capacity month key (YYYY-MM) for a given date.
 */
export function capacityMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Compute the next month key for waitlist targeting.
 */
export function nextMonthKey(date: Date = new Date()): string {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return capacityMonthKey(next);
}

/**
 * Validate a tip amount in cents. Returns an error string or null if valid.
 */
export function validateTipAmount(cents: number): string | null {
  if (!Number.isFinite(cents) || !Number.isInteger(cents)) {
    return "Amount must be a whole number.";
  }
  if (cents <= 0) {
    return "Amount must be greater than zero.";
  }
  if (cents < TIP_MIN_CENTS) {
    return "Minimum tip is $1.";
  }
  if (cents > TIP_MAX_CENTS) {
    return "Maximum tip is $1,000.";
  }
  return null;
}
