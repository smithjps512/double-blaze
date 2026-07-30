import { type NextRequest } from "next/server";
import { getSiteByPreviewToken } from "@/lib/trailhead-db";
import { renderDraftPage, draftPageIndex } from "@/lib/trailhead-draft-render";
import { isValidStatusToken } from "@/lib/trailhead";
import type { ContentDraft } from "@/lib/spark-trailhead";

/**
 * GET /api/trailhead/draft-preview/[token]?page=slug
 * A clickable HTML rendering of the Spark content draft, so the customer reviews
 * a real page (flow + look) before approving, instead of a text outline.
 *
 * Rendered on demand from approved_content, gated by status: it serves only
 * while the site is pre-publish (draft/approved/building/preview). Once the
 * customer publishes (published/exported/upgraded) or the request is declined,
 * the link 404s, so the draft "expires" on publish with nothing to clean up.
 */
export const dynamic = "force-dynamic";

const RETIRED_STATUSES = ["published", "exported", "upgraded", "declined"];

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

  // Must have a draft, and must not be past publish.
  if (!site || !site.approved_content || RETIRED_STATUSES.includes(site.status)) {
    return new Response("This draft is no longer available.", { status: 404 });
  }

  const draft = site.approved_content as ContentDraft;
  const wanted = req.nextUrl.searchParams.get("page");
  const index = draftPageIndex(draft, wanted);
  const html = renderDraftPage(draft, index, site.subdomain, token);
  if (!html) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // A capability link: never cache or index it.
      "cache-control": "no-store",
    },
  });
}
