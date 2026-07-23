import { type NextRequest } from "next/server";
import { getSiteBySubdomain } from "@/lib/trailhead-db";
import { renderPage } from "@/lib/trailhead-render";
import type { BuiltSite } from "@/lib/spark-trailhead";

/**
 * Live subdomain serving. Middleware rewrites {sub}.doubleblaze.solutions and
 * its paths here. We return the built HTML as a proper standalone document with
 * the right content type, rather than embedding a full document inside the
 * app's own <html>. Serves all pages, not just the home page.
 *
 * ISR-style caching via s-maxage so published sites serve fast without a DB hit
 * on every request. Only published sites are publicly served.
 */
export const revalidate = 60;

function pageIndexForPath(built: BuiltSite, path?: string[]): number {
  if (!path || path.length === 0) return 0;
  // Live links are extension-less (/about); tolerate a trailing .html too.
  const slug = path[path.length - 1].replace(/\.html$/, "");
  if (slug === "" || slug === "index") return 0;
  const idx = built.pages.findIndex((p) => p.slug === slug);
  return idx;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ subdomain: string; path?: string[] }> },
) {
  const { subdomain, path } = await ctx.params;

  let site;
  try {
    site = await getSiteBySubdomain(subdomain);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  // Only published sites are publicly served at the subdomain.
  if (!site || site.status !== "published") {
    return new Response("Not found", { status: 404 });
  }

  const built = site.built_content as BuiltSite | null;
  if (!built?.pages?.length) {
    return new Response("Not found", { status: 404 });
  }

  const index = pageIndexForPath(built, path);
  if (index < 0) {
    return new Response("Not found", { status: 404 });
  }

  const rendered = renderPage(built, index, subdomain, "live");
  if (!rendered) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(rendered.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
