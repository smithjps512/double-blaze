import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BuiltSite } from "@double-blaze/site-schema";

/**
 * Customer site data access, shared by the platform and the site runtime.
 *
 * Deliberately narrow. The platform's own `trailhead-db` stays where it is and
 * keeps the whole lifecycle: intake, drafting, approval, publish, corrections.
 * This package holds only what a request serving a public page needs, so the
 * site runtime never links against the staff-facing surface it has no business
 * being able to call.
 *
 * Env is read lazily rather than at module load. Reading at load time bakes
 * whatever was set during the build into the bundle, which is wrong for a
 * runtime that is deployed once and serves many hostnames.
 */

function readEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/** Server-only. Returns null when Supabase is not configured. */
export function getServiceClient(): SupabaseClient | null {
  const { url, serviceRoleKey } = readEnv();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface ServableSite {
  id: string;
  subdomain: string;
  status: string;
  builtContent: BuiltSite | null;
  footerCredit: boolean;
}

/**
 * Look up a published Trailhead site by its subdomain.
 *
 * Only `published` rows resolve. A site in preview, correcting, upgraded, or
 * declined is not public, and the status check is here rather than at the call
 * site so no future caller can forget it.
 *
 * Returns null rather than throwing on a missing or misconfigured backend: a
 * lookup failure and an unknown subdomain both mean the same thing to a
 * visitor, which is a 404.
 */
export async function getPublishedSiteBySubdomain(
  subdomain: string,
): Promise<ServableSite | null> {
  const db = getServiceClient();
  if (!db) return null;

  const { data, error } = await db
    .from("trailhead_sites")
    .select("id, subdomain, status, built_content, footer_credit")
    .eq("subdomain", subdomain)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status !== "published") return null;

  return {
    id: data.id as string,
    subdomain: data.subdomain as string,
    status: data.status as string,
    builtContent: (data.built_content as BuiltSite | null) ?? null,
    footerCredit: data.footer_credit !== false,
  };
}
