import { type NextRequest } from "next/server";
import {
  resolveSiteByHost,
  getVersion,
  readArtifact,
  getPublishedTrailheadSite,
} from "@double-blaze/site-db";
import { renderPage } from "@double-blaze/site-render";
import { resolveSiteSubdomain } from "@double-blaze/site-schema";

/**
 * Public serving for every customer site.
 *
 * This app owns one job: turn a hostname and a path into a customer's page. It
 * has no storefront, no portals, no Stripe webhook, no Clerk. That is the point
 * of it being a separate deployment. A traffic spike or a bad build on a
 * customer site cannot take down Double Blaze's own revenue surfaces, and
 * customer traffic never shares an origin with staff authentication.
 *
 * There is no middleware because there is nothing to route: every request that
 * reaches this deployment is for a customer site. Which hostnames arrive is
 * decided by Vercel domain assignment, where a specific assignment beats the
 * wildcard, so reserved names are attached to the platform project and never
 * reach this code.
 *
 * Two serving paths, tried in order:
 *
 *  1. `sites` plus a published version, served from pre-rendered artifacts in
 *     storage. No rendering, no content parsing, and no database read of the
 *     content itself. The bytes a visitor receives are the bytes that were
 *     reviewed and approved, not whatever the current renderer would produce.
 *  2. Legacy Trailhead, rendered from `built_content` on the way out.
 *
 * Two paths converge on the new model over time rather than one migration
 * risking a working program.
 */
export const revalidate = 60;

const PRIMARY_DOMAIN =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ?? "doubleblaze.solutions";

const notFound = () => new Response("Not found", { status: 404 });

/** Published pages are cached at the edge so a hit never reaches storage. */
const CACHE_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
};

/** The requested page slug, tolerating a trailing .html from an export bundle. */
function slugFromPath(path?: string[]): string {
  if (!path || path.length === 0) return "home";
  const last = path[path.length - 1].replace(/\.html$/i, "");
  return last === "" || last === "index" ? "home" : last;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  const host = req.headers.get("host") ?? "";
  const slug = slugFromPath(path);

  const site = await resolveSiteByHost(host, PRIMARY_DOMAIN);

  if (site) {
    // A site reached at its platform subdomain when it has a verified custom
    // domain redirects permanently. Links never rot, the slug stays a stable
    // internal handle, and search engines are told which hostname is canonical
    // rather than indexing both.
    const hostname = host.split(":")[0].toLowerCase();
    if (site.primaryHostname && hostname !== site.primaryHostname) {
      const target = new URL(req.url);
      target.hostname = site.primaryHostname;
      target.port = "";
      target.protocol = "https:";
      return Response.redirect(target.toString(), 308);
    }

    if (!site.liveVersionId) return notFound();

    const version = await getVersion(site.liveVersionId);
    const page = version?.manifest?.pages.find((p) => p.slug === slug);
    if (!page) return notFound();

    const html = await readArtifact(site.id, site.liveVersionId, page.filename);
    if (html === null) {
      // The pointer names a version whose artifacts are missing. Publishing
      // writes artifacts before moving the pointer, so this should be
      // unreachable; log loudly rather than silently 404 if it ever happens.
      console.error(
        `[sites] artifact missing for site=${site.id} version=${site.liveVersionId} file=${page.filename}`,
      );
      return notFound();
    }

    return new Response(html, { headers: CACHE_HEADERS });
  }

  // Legacy Trailhead.
  const subdomain = resolveSiteSubdomain(host, PRIMARY_DOMAIN);
  if (!subdomain) return notFound();

  const legacy = await getPublishedTrailheadSite(subdomain);
  const built = legacy?.builtContent;
  if (!built?.pages?.length) return notFound();

  const index =
    slug === "home"
      ? 0
      : built.pages.findIndex((p) => p.slug === slug);
  if (index < 0) return notFound();

  const rendered = renderPage(built, index, subdomain, "live");
  if (!rendered) return notFound();

  return new Response(rendered.html, { headers: CACHE_HEADERS });
}
