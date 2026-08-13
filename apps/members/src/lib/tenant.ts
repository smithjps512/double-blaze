import "server-only";
import { headers } from "next/headers";
import { getServiceClient } from "@double-blaze/site-db";
import { resolveSiteSubdomain } from "@double-blaze/site-schema";

/**
 * Tenant resolution.
 *
 * Every request to this app belongs to exactly one club, and which one is
 * decided by the hostname. Nothing downstream may query without a site id, and
 * nothing may take one from a query parameter or a request body: a tenant
 * identifier the caller can choose is not a tenant boundary at all.
 *
 * The lookup uses the service role because an anonymous visitor at the sign-in
 * page has no session yet and still needs to know which club they are looking
 * at. Only non-sensitive site configuration is read here.
 */

export interface Tenant {
  siteId: string;
  slug: string;
  name: string;
  primaryHostname: string | null;
}

const PRIMARY_DOMAIN =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ?? "doubleblaze.solutions";

export async function resolveTenant(): Promise<Tenant | null> {
  const host = (await headers()).get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();

  const db = getServiceClient();
  if (!db) return null;

  try {
    // A verified custom domain first, since a club that has one should be
    // served by it even though its platform subdomain still resolves.
    const { data: domain } = await db
      .from("site_domains")
      .select("site_id")
      .eq("hostname", hostname)
      .eq("verification_status", "verified")
      .maybeSingle();

    let query = db.from("sites").select("id, slug, name, status");
    if (domain?.site_id) {
      query = query.eq("id", domain.site_id as string);
    } else {
      const subdomain = resolveSiteSubdomain(hostname, PRIMARY_DOMAIN);
      if (!subdomain) return null;
      query = query.eq("slug", subdomain);
    }

    const { data: site } = await query.maybeSingle();
    if (!site) return null;

    // Deliberately not the same rule the public site uses.
    //
    // A public page requires publication, because an unpublished site has
    // nothing to show the world. A member area is different: it exists as soon
    // as the site does, and is gated by membership rather than by publication.
    // Requiring 'published' here would make the member area unreachable for the
    // whole build, and would take a club's members offline the moment someone
    // moved the site back to draft to work on the public page.
    //
    // Suspended and archived do close it, for everyone including members.
    if (site.status === "suspended" || site.status === "archived") return null;

    const { data: primary } = await db
      .from("site_domains")
      .select("hostname")
      .eq("site_id", site.id)
      .eq("is_primary", true)
      .eq("verification_status", "verified")
      .maybeSingle();

    return {
      siteId: site.id as string,
      slug: site.slug as string,
      name: site.name as string,
      primaryHostname: (primary?.hostname as string | undefined) ?? null,
    };
  } catch {
    return null;
  }
}
