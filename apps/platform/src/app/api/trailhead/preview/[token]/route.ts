import { type NextRequest } from "next/server";
import { getSiteByPreviewToken } from "@/lib/trailhead-db";
import { renderPage } from "@double-blaze/site-render";
import { isValidStatusToken } from "@/lib/trailhead";
import type { BuiltSite } from "@double-blaze/site-schema";

/**
 * GET /api/trailhead/preview/[token]?page=slug
 * Token-scoped preview of a built site, so the customer can view it from the
 * status page without depending on the public subdomain (which needs DNS that
 * is not set up yet). Serves the built HTML directly. Only for sites that have
 * been built (preview or published).
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!isValidStatusToken(token)) {
    return new Response("Not found", { status: 404 });
  }

  let site;
  try {
    site = await getSiteByPreviewToken(token);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!site || (site.status !== "preview" && site.status !== "published")) {
    return new Response("Not found", { status: 404 });
  }

  const built = site.built_content as BuiltSite | null;
  if (!built?.pages?.length) {
    return new Response("Not found", { status: 404 });
  }

  const wanted = req.nextUrl.searchParams.get("page");
  const index = wanted
    ? Math.max(0, built.pages.findIndex((p) => p.slug === wanted))
    : 0;
  const rendered = renderPage(built, index, site.subdomain, "preview", token);
  if (!rendered) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(rendered.html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
