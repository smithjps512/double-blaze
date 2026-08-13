import { type NextRequest } from "next/server";
import { getPublishedSiteBySubdomain } from "@double-blaze/site-db";
import { renderPage } from "@double-blaze/site-render";
import { resolveSiteSubdomain } from "@double-blaze/site-schema";

/**
 * Public serving for every customer site.
 *
 * This app owns one job: turn a hostname and a path into a customer's page.
 * It has no storefront, no portals, no Stripe webhook, no Clerk. That is the
 * point of it being a separate deployment. A traffic spike or a bad build on a
 * customer site cannot take down Double Blaze's own revenue surfaces, and
 * customer traffic never shares an origin with staff authentication.
 *
 * There is no middleware here because there is nothing to route: every request
 * that reaches this deployment is for a customer site. Which hostnames arrive
 * is decided by Vercel domain assignment, where a specific assignment beats the
 * wildcard, so reserved names like app.doubleblaze.solutions are attached to
 * the platform project and never reach this code at all.
 */
export const revalidate = 60;

function pageIndexForPath(
  slugs: string[],
  path?: string[],
): number {
  if (!path || path.length === 0) return 0;
  // Live links are extension-less (/about); tolerate a trailing .html too, so
  // an exported bundle re-uploaded somewhere still resolves.
  const slug = path[path.length - 1].replace(/\.html$/, "");
  if (slug === "" || slug === "index") return 0;
  return slugs.indexOf(slug);
}

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;

  const host = req.headers.get("host") ?? "";
  const primaryDomain =
    process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ?? "doubleblaze.solutions";

  // Custom domains are resolved by hostname rather than by subdomain label and
  // arrive in a later session. Until then, only the platform subdomain serves.
  const subdomain = resolveSiteSubdomain(host, primaryDomain);
  if (!subdomain) return notFound();

  const site = await getPublishedSiteBySubdomain(subdomain);
  if (!site?.builtContent?.pages?.length) return notFound();

  const built = site.builtContent;
  const index = pageIndexForPath(
    built.pages.map((p) => p.slug),
    path,
  );
  if (index < 0) return notFound();

  const rendered = renderPage(built, index, subdomain, "live");
  if (!rendered) return notFound();

  return new Response(rendered.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Served from the edge cache so a published page does not hit the
      // database on every request.
      "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
