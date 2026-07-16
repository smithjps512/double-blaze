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

export async function createSiteRecord(intakeId: string, subdomain: string): Promise<string | null> {
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
    .select("id")
    .single();

  if (error) {
    console.error("[trailhead] site record insert failed:", error);
    return null;
  }
  return data.id;
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
