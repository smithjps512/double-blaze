import "server-only";
import { getSupabaseServiceClient } from "./supabase";
import { TRAILHEAD_MONTHLY_CAP, capacityMonthKey, nextMonthKey } from "./trailhead";
import type { TrailheadSiteStatus } from "./trailhead";

/**
 * Server-side Trailhead database operations. All writes use the service-role
 * client (no open insert RLS policies).
 */

function getClient() {
  const client = getSupabaseServiceClient();
  if (!client) throw new Error("Supabase not configured");
  return client;
}

// ---------------------------------------------------------------------------
// Capacity: derived from count of current month's non-declined intakes.
// ---------------------------------------------------------------------------

export interface CapacityInfo {
  used: number;
  remaining: number;
  cap: number;
  full: boolean;
}

/**
 * Get the current month's capacity. Count is derived, not stored.
 */
export async function getCapacity(): Promise<CapacityInfo> {
  const db = getClient();
  const monthKey = capacityMonthKey();
  const monthStart = `${monthKey}-01T00:00:00Z`;
  const nextStart = `${nextMonthKey()}-01T00:00:00Z`;

  const { count, error } = await db
    .from("trailhead_intakes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", monthStart)
    .lt("created_at", nextStart)
    .neq("status", "declined");

  if (error) {
    console.error("[trailhead] capacity query failed:", error);
    return { used: 0, remaining: TRAILHEAD_MONTHLY_CAP, cap: TRAILHEAD_MONTHLY_CAP, full: false };
  }

  const used = count ?? 0;
  const remaining = Math.max(0, TRAILHEAD_MONTHLY_CAP - used);
  return { used, remaining, cap: TRAILHEAD_MONTHLY_CAP, full: remaining === 0 };
}

// ---------------------------------------------------------------------------
// Subdomain availability (DB uniqueness check, belt on top of the unique index)
// ---------------------------------------------------------------------------

export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const db = getClient();
  const { count, error } = await db
    .from("trailhead_intakes")
    .select("id", { count: "exact", head: true })
    .eq("subdomain", subdomain);

  if (error) {
    console.error("[trailhead] subdomain check failed:", error);
    return false; // fail closed
  }
  return (count ?? 0) === 0;
}

// ---------------------------------------------------------------------------
// Intake submission (inside a capacity check, atomic via the unique constraint)
// ---------------------------------------------------------------------------

export interface IntakeData {
  site_name: string;
  subdomain: string;
  site_type: "marketing" | "member";
  org_type: string;
  org_type_other?: string;
  contact_email: string;
  contact_name: string;
  pitch?: string;
  audience?: string;
  primary_action?: string;
  primary_action_other?: string;
  differentiator?: string;
  pages: string[];
  logo_choice?: string;
  photos_choice?: string;
  copy_choice?: string;
  hours?: string;
  location?: string;
  social_links?: string;
  must_see?: string;
  member_join_method?: string;
  member_fee?: string;
  member_private_area?: string;
  member_roster?: string;
  template?: string;
  colors?: string;
  inspiration_url?: string;
  tone?: string;
  contact_form_email?: string;
  show_phone?: boolean;
  phone?: string;
  show_address?: boolean;
  address?: string;
  freetext_anything_else?: string;
  freetext_not_asked?: string;
  honeypot?: string;
}

export interface IntakeResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Submit an intake. Checks capacity inside the insert to avoid race conditions:
 * the database-level unique constraint on subdomain prevents duplicates, and we
 * re-check capacity just before insert. If two submissions race for the last
 * slot, the unique constraint or a re-check failure rejects the loser.
 */
export async function submitIntake(data: IntakeData): Promise<IntakeResult> {
  const db = getClient();

  // Re-check capacity at insert time
  const capacity = await getCapacity();
  if (capacity.full) {
    return { ok: false, error: "capacity_full" };
  }

  const { data: row, error } = await db
    .from("trailhead_intakes")
    .insert({
      site_name: data.site_name,
      subdomain: data.subdomain,
      site_type: data.site_type,
      org_type: data.org_type,
      org_type_other: data.org_type_other || null,
      contact_email: data.contact_email,
      contact_name: data.contact_name,
      pitch: data.pitch || null,
      audience: data.audience || null,
      primary_action: data.primary_action || null,
      primary_action_other: data.primary_action_other || null,
      differentiator: data.differentiator || null,
      pages: JSON.stringify(data.pages),
      logo_choice: data.logo_choice || null,
      photos_choice: data.photos_choice || null,
      copy_choice: data.copy_choice || null,
      hours: data.hours || null,
      location: data.location || null,
      social_links: data.social_links || null,
      must_see: data.must_see || null,
      member_join_method: data.member_join_method || null,
      member_fee: data.member_fee || null,
      member_private_area: data.member_private_area || null,
      member_roster: data.member_roster || null,
      template: data.template || null,
      colors: data.colors || null,
      inspiration_url: data.inspiration_url || null,
      tone: data.tone || null,
      contact_form_email: data.contact_form_email || null,
      show_phone: data.show_phone ?? false,
      phone: data.phone || null,
      show_address: data.show_address ?? false,
      address: data.address || null,
      freetext_anything_else: data.freetext_anything_else || null,
      freetext_not_asked: data.freetext_not_asked || null,
      honeypot: data.honeypot || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) {
    // Unique constraint violation on subdomain
    if (error.code === "23505") {
      return { ok: false, error: "subdomain_taken" };
    }
    console.error("[trailhead] intake insert failed:", error);
    return { ok: false, error: "internal" };
  }

  return { ok: true, id: row.id };
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

export async function addToWaitlist(email: string, name?: string): Promise<boolean> {
  const db = getClient();
  const targetMonth = nextMonthKey();
  const { error } = await db.from("trailhead_waitlist").insert({
    email,
    name: name || null,
    target_month: targetMonth,
  });
  if (error) {
    console.error("[trailhead] waitlist insert failed:", error);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Site record operations
// ---------------------------------------------------------------------------

export interface SiteRecordRef {
  id: string;
  /** The durable, unguessable token that keys the whole lifecycle. */
  token: string;
}

export async function createSiteRecord(
  intakeId: string,
  subdomain: string,
): Promise<SiteRecordRef | null> {
  const db = getClient();
  const previewToken = crypto.randomUUID();
  const { data, error } = await db
    .from("trailhead_sites")
    .insert({
      intake_id: intakeId,
      subdomain,
      status: "submitted",
      preview_token: previewToken,
      footer_credit: true,
    })
    .select("id, preview_token")
    .single();

  if (error) {
    console.error("[trailhead] site record insert failed:", error);
    return null;
  }
  return { id: data.id, token: data.preview_token };
}

/**
 * Record a failed best-effort notification on the site record so a dropped
 * email is visible to staff. Appends to notification_failures; never throws
 * into the caller (best-effort itself).
 */
export async function recordNotificationFailure(
  siteId: string,
  tag: string,
  reason: string,
): Promise<void> {
  try {
    const db = getClient();
    const { data } = await db
      .from("trailhead_sites")
      .select("notification_failures")
      .eq("id", siteId)
      .single();
    const existing = Array.isArray(data?.notification_failures)
      ? (data!.notification_failures as unknown[])
      : [];
    const entry = { tag, reason, at: new Date().toISOString() };
    await db
      .from("trailhead_sites")
      .update({ notification_failures: [...existing, entry] })
      .eq("id", siteId);
  } catch (err) {
    console.error("[trailhead] recording notification failure failed:", err);
  }
}

/** Mark the preview as released to the customer (the staff review gate). */
export async function markPreviewSent(siteId: string): Promise<boolean> {
  const db = getClient();
  const { error } = await db
    .from("trailhead_sites")
    .update({ preview_sent_at: new Date().toISOString() })
    .eq("id", siteId);
  if (error) {
    console.error("[trailhead] mark preview sent failed:", error);
    return false;
  }
  return true;
}

/** Record the customer accepting their preview (the cue for staff to publish). */
export async function acceptPreview(siteId: string): Promise<boolean> {
  const db = getClient();
  const { error } = await db
    .from("trailhead_sites")
    .update({ preview_accepted_at: new Date().toISOString() })
    .eq("id", siteId);
  if (error) {
    console.error("[trailhead] accept preview failed:", error);
    return false;
  }
  return true;
}

export async function updateSiteStatus(
  siteId: string,
  status: TrailheadSiteStatus,
  extra?: Record<string, unknown>,
): Promise<boolean> {
  const db = getClient();
  const { error } = await db
    .from("trailhead_sites")
    .update({ status, ...extra })
    .eq("id", siteId);

  if (error) {
    console.error("[trailhead] site status update failed:", error);
    return false;
  }
  return true;
}

export async function storeApprovedContent(
  siteId: string,
  content: unknown,
): Promise<boolean> {
  return updateSiteStatus(siteId, "approved", {
    approved_content: content,
    approval_timestamp: new Date().toISOString(),
  });
}

export async function storeBuiltContent(
  siteId: string,
  content: unknown,
): Promise<boolean> {
  return updateSiteStatus(siteId, "preview", {
    built_content: content,
  });
}

export async function publishSite(
  siteId: string,
  subdomain: string,
): Promise<boolean> {
  const liveUrl = `https://${subdomain}.doubleblaze.solutions`;
  return updateSiteStatus(siteId, "published", { live_url: liveUrl });
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export async function getSiteBySubdomain(subdomain: string) {
  const db = getClient();
  const { data, error } = await db
    .from("trailhead_sites")
    .select("*")
    .eq("subdomain", subdomain)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getSiteByPreviewToken(token: string) {
  const db = getClient();
  const { data, error } = await db
    .from("trailhead_sites")
    .select("*")
    .eq("preview_token", token)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getIntakeById(id: string) {
  const db = getClient();
  const { data, error } = await db
    .from("trailhead_intakes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getSiteById(id: string) {
  const db = getClient();
  const { data, error } = await db
    .from("trailhead_sites")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getSiteByIntakeId(intakeId: string) {
  const db = getClient();
  const { data, error } = await db
    .from("trailhead_sites")
    .select("*")
    .eq("intake_id", intakeId)
    .single();

  if (error || !data) return null;
  return data;
}

/** A site whose build stalled, for the self-healing sweep. */
export interface StuckBuild {
  id: string;
  intake_id: string;
  status: TrailheadSiteStatus;
  updated_at: string;
  notification_failures: unknown[];
}

/**
 * Find sites whose build stalled and should be retried by the sweep:
 * - "approved" with no built_content, idle past the approved grace window (a
 *   failed auto-build reverts to approved; the grace window is longer than the
 *   function's maxDuration so we never race a build that is still running).
 * - "building", idle past the longer building grace window (an auto-build that
 *   was interrupted after it set "building" but before it finished).
 * Oldest first, bounded by `limit`. Returns [] on error (the sweep no-ops).
 */
export async function findStuckBuilds(opts: {
  approvedBefore: string;
  buildingBefore: string;
  limit: number;
}): Promise<StuckBuild[]> {
  const db = getClient();
  const cols = "id, intake_id, status, updated_at, notification_failures";

  const { data: approved, error: approvedErr } = await db
    .from("trailhead_sites")
    .select(cols)
    .eq("status", "approved")
    .is("built_content", null)
    .lt("updated_at", opts.approvedBefore)
    .order("updated_at", { ascending: true })
    .limit(opts.limit);
  if (approvedErr) console.error("[trailhead] stuck approved query failed:", approvedErr);

  const { data: building, error: buildingErr } = await db
    .from("trailhead_sites")
    .select(cols)
    .eq("status", "building")
    .lt("updated_at", opts.buildingBefore)
    .order("updated_at", { ascending: true })
    .limit(opts.limit);
  if (buildingErr) console.error("[trailhead] stuck building query failed:", buildingErr);

  const rows = [...(approved ?? []), ...(building ?? [])];
  return rows.map((r) => ({
    id: r.id as string,
    intake_id: r.intake_id as string,
    status: r.status as TrailheadSiteStatus,
    updated_at: r.updated_at as string,
    notification_failures: Array.isArray(r.notification_failures)
      ? (r.notification_failures as unknown[])
      : [],
  }));
}

/**
 * The client-safe view of a site, keyed by its lifecycle token. This is the
 * ONLY shape the customer status page reads. It deliberately excludes every
 * staff-only field: no out_of_scope_flags, no staff_notes, no
 * notification_failures, no internal routing. The content draft is included
 * because reviewing it is the customer's own step.
 */
export interface PublicSiteStatus {
  status: TrailheadSiteStatus;
  subdomain: string;
  siteName: string;
  liveUrl: string | null;
  footerCredit: boolean;
  previewSent: boolean;
  previewAccepted: boolean;
  createdAt: string;
  /** The Spark draft the customer reviews at the approval gate, if present. */
  draft: unknown | null;
}

export async function getPublicSiteStatusByToken(
  token: string,
): Promise<PublicSiteStatus | null> {
  const db = getClient();
  const { data, error } = await db
    .from("trailhead_sites")
    .select(
      "status, subdomain, live_url, footer_credit, preview_sent_at, preview_accepted_at, created_at, approved_content, intake_id",
    )
    .eq("preview_token", token)
    .single();

  if (error || !data) return null;

  // Site name lives on the intake. Pull just that one client-safe field.
  let siteName = data.subdomain as string;
  const { data: intake } = await db
    .from("trailhead_intakes")
    .select("site_name")
    .eq("id", data.intake_id)
    .single();
  if (intake?.site_name) siteName = intake.site_name;

  // The draft is only relevant, and only shown, at the review gate.
  const draft = data.status === "awaiting_approval" ? data.approved_content ?? null : null;

  return {
    status: data.status as TrailheadSiteStatus,
    subdomain: data.subdomain,
    siteName,
    liveUrl: data.live_url ?? null,
    footerCredit: data.footer_credit ?? true,
    previewSent: Boolean(data.preview_sent_at),
    previewAccepted: Boolean(data.preview_accepted_at),
    createdAt: data.created_at,
    draft,
  };
}

// ---------------------------------------------------------------------------
// Tips
// ---------------------------------------------------------------------------

export async function createTipRecord(
  siteId: string,
  amountCents: number,
  stripeSessionId: string,
): Promise<string | null> {
  const db = getClient();
  const { data, error } = await db
    .from("trailhead_tips")
    .insert({
      site_id: siteId,
      amount_cents: amountCents,
      stripe_session_id: stripeSessionId,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[trailhead] tip insert failed:", error);
    return null;
  }
  return data.id;
}

export async function completeTip(
  stripeSessionId: string,
  paymentIntentId: string,
): Promise<boolean> {
  const db = getClient();
  const { error } = await db
    .from("trailhead_tips")
    .update({
      status: "completed",
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("stripe_session_id", stripeSessionId);

  if (error) {
    console.error("[trailhead] tip complete failed:", error);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Intake flag storage (out-of-scope flags from Spark scan)
// ---------------------------------------------------------------------------

export async function storeIntakeFlags(intakeId: string, flags: string[]): Promise<boolean> {
  const db = getClient();
  const { error } = await db
    .from("trailhead_intakes")
    .update({ out_of_scope_flags: flags })
    .eq("id", intakeId);

  if (error) {
    console.error("[trailhead] flag store failed:", error);
    return false;
  }
  return true;
}
