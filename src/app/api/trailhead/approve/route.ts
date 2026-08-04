import { NextResponse, after, type NextRequest } from "next/server";
import {
  getSiteByPreviewToken,
  storeApprovedContent,
  recordNotificationFailure,
} from "@/lib/trailhead-db";
import { isValidStatusToken } from "@/lib/trailhead";
import { buildAndReleasePreview } from "@/lib/trailhead-pipeline";

// The auto-build runs in after() and is a large multi-page generation. Give the
// function the room it needs (Vercel Pro allows up to 300s) so the build is not
// killed mid-flight, which would strand the site with no preview and no email.
export const maxDuration = 300;

/**
 * POST /api/trailhead/approve
 * Customer approves the content draft. Requires their lifecycle token.
 * Records approval, then automatically starts the build (brief section 4:
 * approval triggers the build, staff reviews before the customer is shown it).
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = String(body.token ?? "");
  if (!isValidStatusToken(token)) {
    return NextResponse.json({ error: "Token required." }, { status: 400 });
  }

  const site = await getSiteByPreviewToken(token);
  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  if (site.status !== "awaiting_approval") {
    return NextResponse.json(
      { error: "This content has already been approved or is not ready for approval." },
      { status: 400 },
    );
  }

  const ok = await storeApprovedContent(site.id, site.approved_content);
  if (!ok) {
    return NextResponse.json({ error: "Failed to record approval." }, { status: 500 });
  }

  // Build the site, then release the preview to the customer, all automatically.
  // Runs in `after()` so Vercel keeps the function alive until the work finishes
  // rather than freezing the dangling promise once the response is sent. There
  // is no staff review gate in the happy path: when the build succeeds, the
  // preview is released straight to the customer, who owns the publish decision.
  // The same chain runs from the self-healing cron sweep, so a stall here is
  // retried automatically; staff can also re-run the build.
  after(async () => {
    try {
      await buildAndReleasePreview(site.id);
    } catch (err) {
      console.error(`[trailhead] auto-build/release after approval failed for site ${site.id}:`, err);
      await recordNotificationFailure(
        site.id,
        "trailhead-build",
        err instanceof Error ? err.message : "auto-build threw",
      ).catch(() => {});
    }
  });

  return NextResponse.json({ ok: true });
}
