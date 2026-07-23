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

/**
 * The customer-facing lifecycle stages shown on the status page
 * (docs/trailhead-program-brief.md section 4, docs/trailhead-messaging.md).
 * Order matters: it is the stepper order. `waitingOn` says who has to act:
 * "us" means we are working, "you" means the customer holds the gate, "none"
 * means the stage is a milestone with no pending action.
 */
export type WaitingOn = "us" | "you" | "none";

export interface TrailheadStage {
  id: "details" | "drafting" | "review" | "building" | "preview" | "live";
  label: string;
  waitingOn: WaitingOn;
}

export const TRAILHEAD_STAGES: readonly TrailheadStage[] = [
  { id: "details", label: "Got your details", waitingOn: "none" },
  { id: "drafting", label: "Drafting your content", waitingOn: "us" },
  { id: "review", label: "Your review needed", waitingOn: "you" },
  { id: "building", label: "Building your site", waitingOn: "us" },
  { id: "preview", label: "Your preview is ready", waitingOn: "you" },
  { id: "live", label: "Live", waitingOn: "none" },
] as const;

/**
 * Honest turnaround estimates, in business days. These are the single place to
 * tune the timing copy on the status page. They are estimates we set, not
 * promises: the copy says "usually within" so a busy week never makes us a liar.
 */
export const TRAILHEAD_TURNAROUND = {
  draftBusinessDays: 2,
  buildBusinessDays: 3,
  correctionBusinessDays: 2,
} as const;

/** Special states that sit outside the linear stepper. */
export type TrailheadSpecialState = "waitlisted" | "correcting" | "declined";

export interface StatusStageView {
  /** Id of the stage the customer is currently on, or null for special states. */
  currentStageId: TrailheadStage["id"] | null;
  /** Index into TRAILHEAD_STAGES of the current stage, or -1 for special states. */
  currentIndex: number;
  /** Who the flow is waiting on right now. */
  waitingOn: WaitingOn;
  /** Non-null when the record is off the linear path. */
  special: TrailheadSpecialState | null;
}

/**
 * Map a site status to the customer-facing stage view. Pure so it can be unit
 * tested directly and shared between server and client.
 *
 * `previewSent` distinguishes "built, staff has not sent the preview yet" (we
 * are still finishing up, so the customer sees "Building your site") from
 * "preview sent, your turn". It defaults to true so a bare status maps to its
 * natural stage. This is the human review gate from brief section 4 step 5:
 * a person reviews the build before the customer is shown anything.
 */
export function statusToStageView(
  status: TrailheadSiteStatus,
  previewSent = true,
): StatusStageView {
  const at = (id: TrailheadStage["id"]): StatusStageView => {
    const currentIndex = TRAILHEAD_STAGES.findIndex((s) => s.id === id);
    return {
      currentStageId: id,
      currentIndex,
      waitingOn: TRAILHEAD_STAGES[currentIndex].waitingOn,
      special: null,
    };
  };

  switch (status) {
    case "submitted":
      return at("drafting");
    case "awaiting_approval":
      return at("review");
    case "approved":
    case "building":
      return at("building");
    case "preview":
      // Built, but the customer only sees the preview stage once staff has
      // reviewed and released it. Until then we are still "building".
      return previewSent ? at("preview") : at("building");
    case "published":
    case "exported":
    case "upgraded":
      return at("live");
    case "waitlisted":
      return { currentStageId: null, currentIndex: -1, waitingOn: "us", special: "waitlisted" };
    case "correcting":
      return { currentStageId: null, currentIndex: -1, waitingOn: "us", special: "correcting" };
    case "declined":
      return { currentStageId: null, currentIndex: -1, waitingOn: "none", special: "declined" };
  }
}

/** Stepper state for a given stage index relative to the current one. */
export type StepState = "done" | "current" | "upcoming";

export function stepState(index: number, currentIndex: number): StepState {
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "upcoming";
}

/**
 * A token is the durable, unguessable key for a single site record. It is a
 * v4-style UUID (crypto.randomUUID). Validate shape before any DB lookup so a
 * malformed or probing token never reaches the query.
 */
const STATUS_TOKEN_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidStatusToken(token: unknown): token is string {
  return typeof token === "string" && STATUS_TOKEN_RE.test(token);
}

/**
 * A permissive email shape check. It exists to catch obviously-broken input
 * before we hand an address to Resend, not to be a spec-perfect validator.
 * Plus-addressing (name+tag@example.com) is explicitly allowed: the local part
 * is any run of non-space, non-@ characters, so `+` passes.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isPlausibleEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

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
