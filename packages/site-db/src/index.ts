import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BuiltSite, SiteContent } from "@double-blaze/site-schema";
import { resolveSiteSubdomain } from "@double-blaze/site-schema";

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
 * runtime deployed once and serving many hostnames.
 */

export const ARTIFACT_BUCKET = "site-artifacts";
export const ASSET_BUCKET = "site-assets";

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

// ---------------------------------------------------------------------------
// Manifests
// ---------------------------------------------------------------------------

export interface ManifestPage {
  slug: string;
  /** Path within the artifact bucket, relative to the version prefix. */
  filename: string;
  title: string;
  /** Content hash, so an unchanged page is detectable across publishes. */
  hash: string;
}

export interface BuildManifest {
  version: 1;
  pages: ManifestPage[];
  generatedAt: string;
}

/** Storage prefix for one version's artifacts. Immutable once written. */
export function versionPrefix(siteId: string, versionId: string): string {
  return `${siteId}/${versionId}`;
}

export function isBuildManifest(value: unknown): value is BuildManifest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.pages);
}

// ---------------------------------------------------------------------------
// Resolution: hostname to a servable site
// ---------------------------------------------------------------------------

export interface ServableSite {
  id: string;
  slug: string;
  name: string;
  status: string;
  liveVersionId: string | null;
  footerCredit: boolean;
  /** Canonical hostname, when a custom domain is primary. */
  primaryHostname: string | null;
}

/**
 * Resolve a request hostname to a site.
 *
 * Custom domains are checked first and platform subdomains second, because a
 * client who has attached their own domain should be served by it even though
 * their `doubleblaze.solutions` subdomain still resolves. The subdomain remains
 * a stable internal handle that redirects to the primary hostname.
 *
 * Returns null rather than throwing on a missing site or a misconfigured
 * backend: to a visitor, a lookup failure and an unknown hostname are the same
 * 404, and a stack trace helps nobody.
 */
export async function resolveSiteByHost(
  host: string,
  primaryDomain: string,
): Promise<ServableSite | null> {
  const db = getServiceClient();
  if (!db) return null;

  const hostname = host.split(":")[0].toLowerCase();

  try {
    // 1. A verified custom domain pointing at this site.
    const { data: domain } = await db
      .from("site_domains")
      .select("site_id, verification_status")
      .eq("hostname", hostname)
      .maybeSingle();

    if (domain?.site_id && domain.verification_status === "verified") {
      return loadSite(db, "id", domain.site_id as string);
    }

    // 2. A platform subdomain.
    const subdomain = resolveSiteSubdomain(hostname, primaryDomain);
    if (!subdomain) return null;
    return loadSite(db, "slug", subdomain);
  } catch {
    return null;
  }
}

async function loadSite(
  db: SupabaseClient,
  column: "id" | "slug",
  value: string,
): Promise<ServableSite | null> {
  const { data, error } = await db
    .from("sites")
    .select("id, slug, name, status, live_version_id, footer_credit")
    .eq(column, value)
    .maybeSingle();

  if (error || !data) return null;
  // Only published sites are public. Checking here rather than at the call site
  // means no future caller can forget it.
  if (data.status !== "published") return null;

  const { data: primary } = await db
    .from("site_domains")
    .select("hostname")
    .eq("site_id", data.id)
    .eq("is_primary", true)
    .eq("verification_status", "verified")
    .maybeSingle();

  return {
    id: data.id as string,
    slug: data.slug as string,
    name: data.name as string,
    status: data.status as string,
    liveVersionId: (data.live_version_id as string | null) ?? null,
    footerCredit: data.footer_credit !== false,
    primaryHostname: (primary?.hostname as string | undefined) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Versions and artifacts
// ---------------------------------------------------------------------------

export interface SiteVersion {
  id: string;
  siteId: string;
  versionNumber: number;
  content: SiteContent | null;
  manifest: BuildManifest | null;
  status: string;
}

export async function getVersion(versionId: string): Promise<SiteVersion | null> {
  const db = getServiceClient();
  if (!db) return null;

  const { data, error } = await db
    .from("site_versions")
    .select("id, site_id, version_number, content, built_manifest, status")
    .eq("id", versionId)
    .maybeSingle();

  if (error || !data) return null;
  const manifest = data.built_manifest;
  return {
    id: data.id as string,
    siteId: data.site_id as string,
    versionNumber: data.version_number as number,
    content: (data.content as SiteContent | null) ?? null,
    manifest: isBuildManifest(manifest) ? manifest : null,
    status: data.status as string,
  };
}

/**
 * Read one rendered page from storage.
 *
 * Serving fetches the artifact rather than re-rendering, so a published page
 * costs one object read and no model, no template, and no content parsing. It
 * also guarantees the bytes a visitor gets are the bytes that were reviewed and
 * approved, rather than whatever the current renderer would produce today.
 */
export async function readArtifact(
  siteId: string,
  versionId: string,
  filename: string,
): Promise<string | null> {
  const db = getServiceClient();
  if (!db) return null;

  const path = `${versionPrefix(siteId, versionId)}/${filename}`;
  try {
    const { data, error } = await db.storage.from(ARTIFACT_BUCKET).download(path);
    if (error || !data) return null;
    return await data.text();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Legacy Trailhead serving
// ---------------------------------------------------------------------------

export interface LegacyTrailheadSite {
  id: string;
  subdomain: string;
  builtContent: BuiltSite | null;
}

/**
 * Look up a published Trailhead site by subdomain.
 *
 * The Trailhead program keeps its own tables and its own serving path. Two
 * paths converge on the new model over time rather than one migration risking a
 * working program, so the runtime tries `sites` first and falls back here.
 */
export async function getPublishedTrailheadSite(
  subdomain: string,
): Promise<LegacyTrailheadSite | null> {
  const db = getServiceClient();
  if (!db) return null;

  const { data, error } = await db
    .from("trailhead_sites")
    .select("id, subdomain, status, built_content")
    .eq("subdomain", subdomain)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status !== "published") return null;

  return {
    id: data.id as string,
    subdomain: data.subdomain as string,
    builtContent: (data.built_content as BuiltSite | null) ?? null,
  };
}
