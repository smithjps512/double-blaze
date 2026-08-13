import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/server-auth";
import {
  getSiteById,
  getIntakeById,
  markPreviewSent,
  recordNotificationFailure,
} from "@/lib/trailhead-db";
import { sendTrailheadPreview } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

/**
 * POST /api/trailhead/send-preview
 * The staff review gate (brief section 4 step 5): a person reviews the built
 * site, then releases the preview to the customer. This is what moves the
 * customer's status page from "Building your site" to "Your preview is ready".
 */
export async function POST(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const siteId = String(body.site_id ?? "");
  if (!siteId) {
    return NextResponse.json({ error: "site_id required." }, { status: 400 });
  }

  const site = await getSiteById(siteId);
  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }
  if (site.status !== "preview") {
    return NextResponse.json(
      { error: "The site must be built (preview status) before the preview can be sent." },
      { status: 400 },
    );
  }

  const marked = await markPreviewSent(siteId);
  if (!marked) {
    return NextResponse.json({ error: "Could not release the preview." }, { status: 500 });
  }

  const intake = await getIntakeById(site.intake_id);
  if (intake) {
    const tag = "trailhead-preview";
    const result = await sendTrailheadPreview(intake.contact_email, {
      contactName: intake.contact_name,
      siteName: intake.site_name,
      statusUrl: `${SITE_URL}/trailhead/status/${site.preview_token}`,
    });
    if (!result.ok) {
      console.error(
        `[trailhead] email ${tag} failed for intake ${site.intake_id}: ${result.reason ?? "unknown reason"}`,
      );
      await recordNotificationFailure(siteId, tag, result.reason ?? "unknown reason");
    }
  }

  return NextResponse.json({ ok: true });
}
