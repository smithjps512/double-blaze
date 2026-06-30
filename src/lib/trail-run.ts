/**
 * Trail Run program: shared constants and pure helpers (Sprint T1).
 *
 * Trail Run is the first-month-free program (docs/trail-run-program-brief.md).
 * Card captured at signup with no charge, a 30-day window that starts the day
 * the solution launches, then billing at the selected tier (default Blue Trail)
 * on day 31 with the 12-month term beginning that day.
 *
 * This module is pure and framework-free so it can be unit tested directly and
 * imported from both server and client code. Keep Stripe and Supabase out of it.
 */

/** Lifecycle status, matching the `trail_run_status` enum (migration 0005). */
export type TrailRunStatus =
  | "signup"
  | "building"
  | "launched"
  | "active_window"
  | "converting"
  | "converted"
  | "canceled"
  | "reactivated";

/**
 * Selectable tiers, as catalog_keys (migration 0002 / src/lib/catalog.ts).
 * Everyone runs on Blue Trail during the window; the customer can right-size at
 * day 31. The tier here drives the trial-end charge.
 */
export const TRAIL_RUN_TIERS = ["green", "blue", "black", "double_black"] as const;
export type TrailRunTier = (typeof TRAIL_RUN_TIERS)[number];

/** Default tier when the customer never changes it. */
export const DEFAULT_TRAIL_TIER: TrailRunTier = "blue";

/** The evaluation window, in days, beginning at launch. */
export const TRAIL_RUN_WINDOW_DAYS = 30;

/**
 * Trial length, in days, for the subscription the launch event creates in
 * Sprint T3. The trial ends window-end (launch + 30), so the first charge lands
 * on day 31. Exported here as the single source of truth for that math.
 */
export const TRAIL_RUN_TRIAL_DAYS = TRAIL_RUN_WINDOW_DAYS;

/** Retention window after cancellation, in days, before the build is purged. */
export const TRAIL_RUN_RETENTION_DAYS = 90;

/** Minimum term, in months, that begins on the conversion (day 31) date. */
export const TRAIL_RUN_TERM_MONTHS = 12;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** True when `key` is a tier the customer may select. */
export function isValidTrailTier(key: string | null | undefined): key is TrailRunTier {
  return !!key && (TRAIL_RUN_TIERS as readonly string[]).includes(key);
}

/** Normalizes any input to a valid tier, falling back to the default. */
export function normalizeTrailTier(key: string | null | undefined): TrailRunTier {
  return isValidTrailTier(key) ? key : DEFAULT_TRAIL_TIER;
}

/** Returns a new Date `days` after `from` without mutating `from`. */
export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * MS_PER_DAY);
}

/** Window end (day 30 boundary): launch + 30 days. */
export function computeWindowEnd(launch: Date): Date {
  return addDays(launch, TRAIL_RUN_WINDOW_DAYS);
}

/** Retention expiry: cancellation + 90 days, after which the build is purged. */
export function computeRetentionExpiry(cancellation: Date): Date {
  return addDays(cancellation, TRAIL_RUN_RETENTION_DAYS);
}

/**
 * The locked check-in cadence: a value check-in fires when this many days
 * remain in the window. Final decision, no presets (program brief section 4).
 */
export const TRAIL_RUN_CHECKIN_DAYS = [14, 7, 3, 1] as const;
export type TrailRunCheckinDay = (typeof TRAIL_RUN_CHECKIN_DAYS)[number];

/**
 * Whole days remaining until the window ends, counting the partial current day
 * as a full day (ceil). On the launch day with a 30-day window this returns 30,
 * and it decrements by one each calendar day, so the cadence days are hit
 * exactly once by a daily run. Never returns below 0.
 */
export function daysRemaining(windowEnd: Date, now: Date): number {
  const diffMs = windowEnd.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / MS_PER_DAY);
}

/**
 * Maps days remaining to the check-in day it triggers (14, 7, 3, or 1), or null
 * when no check-in is due. The scheduler also relies on the ledger's unique
 * constraint, so even a boundary miss cannot double-send.
 */
export function checkinDayFor(remaining: number): TrailRunCheckinDay | null {
  return (TRAIL_RUN_CHECKIN_DAYS as readonly number[]).includes(remaining)
    ? (remaining as TrailRunCheckinDay)
    : null;
}

/** Shape of the stored consent record (engagement.consent jsonb). */
export interface TrailRunConsent {
  program: "trail_run";
  selected_tier: TrailRunTier;
  term_months: number;
  /** Plain-language acknowledgment, stored verbatim for dispute protection. */
  acknowledgment: string;
  consented_at: string;
  ip: string | null;
}

/**
 * The exact acknowledgment text the customer agrees to at checkout. No charge
 * until the launch-plus-30 date, then the selected tier monthly on a 12-month
 * term beginning that date. No em dashes, per the house rule.
 */
export function consentAcknowledgment(tier: TrailRunTier): string {
  const name = TRAIL_TIER_LABELS[tier];
  return (
    `I understand there is no charge until 30 days after my solution launches. ` +
    `On that date, my card is charged for ${name} monthly and a ` +
    `${TRAIL_RUN_TERM_MONTHS}-month term begins. I can cancel anytime before ` +
    `then with no charge.`
  );
}

/** Builds the consent record persisted on the engagement at signup. */
export function buildConsentRecord(opts: {
  tier: TrailRunTier;
  consentedAt: Date;
  ip: string | null;
}): TrailRunConsent {
  return {
    program: "trail_run",
    selected_tier: opts.tier,
    term_months: TRAIL_RUN_TERM_MONTHS,
    acknowledgment: consentAcknowledgment(opts.tier),
    consented_at: opts.consentedAt.toISOString(),
    ip: opts.ip,
  };
}

/** Display labels for the selectable tiers. */
export const TRAIL_TIER_LABELS: Record<TrailRunTier, string> = {
  green: "Green Trail",
  blue: "Blue Trail",
  black: "Black Trail",
  double_black: "Double Black",
};
