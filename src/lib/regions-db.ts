import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "./supabase";
import {
  REGIONS,
  type Region,
  type RegionStatus,
  getRegionBySlug,
} from "./regions";

/**
 * Server-side region access. The static seed in ./regions.ts is the base so the
 * storefront renders with zero secrets; when Supabase is configured these
 * helpers overlay the live DB so the readiness toggle (coming_soon -> active),
 * lead assignment, and interest capture take effect without a redeploy.
 *
 * All DB access is guarded: every function degrades to the seed (or a no-op)
 * when Supabase is not configured.
 */

interface RegionOverride {
  status: RegionStatus;
  active: boolean;
  local_phone: string | null;
  lead_user_id: string | null;
}

async function loadOverrides(): Promise<Map<string, RegionOverride>> {
  const db = getSupabaseServiceClient();
  if (!db) return new Map();
  const { data, error } = await db
    .from("regions")
    .select("slug, status, active, local_phone, lead_user_id");
  if (error) {
    console.error("[regions] override load failed:", error.message);
    return new Map();
  }
  const map = new Map<string, RegionOverride>();
  for (const row of (data ?? []) as (RegionOverride & { slug: string })[]) {
    map.set(row.slug, {
      status: row.status,
      active: row.active,
      local_phone: row.local_phone,
      lead_user_id: row.lead_user_id,
    });
  }
  return map;
}

function applyOverride(region: Region, o: RegionOverride | undefined): Region {
  if (!o) return region;
  return {
    ...region,
    status: o.status,
    enabled: o.active,
    localPhone: o.local_phone ?? region.localPhone,
  };
}

/** All publicly visible regions, DB-resolved, home region first. */
export async function getResolvedRegions(): Promise<Region[]> {
  const overrides = await loadOverrides();
  return REGIONS.map((r) => applyOverride(r, overrides.get(r.slug)))
    .filter((r) => r.enabled)
    .sort((a, b) => {
      if (a.slug === REGIONS[0].slug) return -1;
      if (b.slug === REGIONS[0].slug) return 1;
      return a.name.localeCompare(b.name);
    });
}

/** Active (live) regions only: indexable and linkable. */
export async function getResolvedActiveRegions(): Promise<Region[]> {
  return (await getResolvedRegions()).filter((r) => r.status === "active");
}

/** A single region with DB overrides applied, or undefined if unknown/disabled. */
export async function getResolvedRegion(
  slug: string,
): Promise<Region | undefined> {
  const seed = getRegionBySlug(slug);
  if (!seed) return undefined;
  const overrides = await loadOverrides();
  const resolved = applyOverride(seed, overrides.get(slug));
  return resolved.enabled ? resolved : undefined;
}

/**
 * The lead user id assigned to a region (for project assignment / portal
 * scoping). Null when no lead is onboarded (routes to the central inbox) or
 * when Supabase is not configured.
 */
export async function getRegionLeadUserId(
  db: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const { data, error } = await db
    .from("regions")
    .select("lead_user_id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[regions] lead lookup failed:", error.message);
    return null;
  }
  return (data?.lead_user_id as string | null) ?? null;
}

/**
 * Resolves the email that should receive a lead/interest from a region: the
 * region's onboarded lead when present, otherwise null so callers fall back to
 * the central inbox (LEADS_TO_EMAIL). coming_soon regions always fall through
 * to central.
 */
export async function getRegionLeadEmail(slug: string): Promise<string | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("regions")
    .select("status, lead_user_id, users:lead_user_id (email)")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[regions] lead email lookup failed:", error.message);
    return null;
  }
  if (data.status !== "active") return null;
  const user = data.users as { email: string | null } | { email: string | null }[] | null;
  const email = Array.isArray(user) ? user[0]?.email : user?.email;
  return email ?? null;
}

/** Stores a coming_soon waitlist interest. No-op (logged) without Supabase. */
export async function recordRegionInterest(input: {
  slug: string;
  name: string | null;
  email: string;
  message: string | null;
}): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) {
    console.info("[regions] interest received (not stored, no Supabase):", {
      slug: input.slug,
      email: input.email,
    });
    return false;
  }
  const { error } = await db.from("region_interests").insert({
    region_slug: input.slug,
    name: input.name,
    email: input.email,
    message: input.message,
  });
  if (error) {
    console.error("[regions] interest store failed:", error.message);
    return false;
  }
  return true;
}

/**
 * Readiness gate (task item 5). Flips a region's status. Only an onboarded lead
 * and confirmed delivery should precede activation (see docs/REGIONS.md); this
 * does not enforce that, it is the operator's call.
 */
export async function setRegionStatus(
  slug: string,
  status: RegionStatus,
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("regions")
    .update({ status })
    .eq("slug", slug);
  if (error) {
    console.error("[regions] status update failed:", error.message);
    return false;
  }
  return true;
}

export interface LeadScope {
  /** Regions this lead is assigned to. */
  regions: { slug: string; name: string; status: RegionStatus }[];
  /** Distinct client organizations in the lead's region(s). */
  clientCount: number;
  /** Projects in the lead's region(s) (their scoped board). */
  projectCount: number;
  /**
   * True when the lead has no active region assignment, so their work is the
   * central inbox (unassigned projects) rather than a region-scoped board.
   */
  isCentralInbox: boolean;
}

/**
 * Scopes a lead's portal view to their region's clients and projects (task
 * item 4). Leads assigned only to coming_soon regions, or to none, are routed
 * to the central inbox. Returns null when Supabase is not configured or the
 * user is unknown.
 */
export async function getLeadScope(
  clerkUserId: string,
): Promise<LeadScope | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;

  const { data: user } = await db
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (!user) return null;

  const { data: regionRows } = await db
    .from("regions")
    .select("slug, name, status")
    .eq("lead_user_id", user.id);
  const regions = (regionRows ?? []) as {
    slug: string;
    name: string;
    status: RegionStatus;
  }[];

  const activeSlugs = regions
    .filter((r) => r.status === "active")
    .map((r) => r.slug);

  // No active region assignment => central inbox: unassigned projects.
  if (activeSlugs.length === 0) {
    const { count } = await db
      .from("projects")
      .select("id", { count: "exact", head: true })
      .is("project_lead_id", null);
    return {
      regions,
      clientCount: 0,
      projectCount: count ?? 0,
      isCentralInbox: true,
    };
  }

  const { data: orgs } = await db
    .from("organizations")
    .select("id")
    .in("region", activeSlugs);
  const orgIds = (orgs ?? []).map((o) => o.id);

  let projectCount = 0;
  if (orgIds.length > 0) {
    const { count } = await db
      .from("projects")
      .select("id", { count: "exact", head: true })
      .in("organization_id", orgIds);
    projectCount = count ?? 0;
  }

  return {
    regions,
    clientCount: orgIds.length,
    projectCount,
    isCentralInbox: false,
  };
}

/** Assigns the lead user for a region (used when onboarding a 1099 agent). */
export async function setRegionLead(
  slug: string,
  leadUserId: string | null,
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("regions")
    .update({ lead_user_id: leadUserId })
    .eq("slug", slug);
  if (error) {
    console.error("[regions] lead assignment failed:", error.message);
    return false;
  }
  return true;
}
