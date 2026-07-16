import { NextResponse, type NextRequest } from "next/server";
import { getSiteById, publishSite } from "@/lib/trailhead-db";
import { getIntakeById } from "@/lib/trailhead-db";
import { sendTrailheadPublished } from "@/lib/email";
import { requireStaff } from "@/lib/server-auth";
import { SITE_URL } from "@/lib/site";

/**
 * POST /api/trailhead/publish
 * Staff publishes a site after the customer accepts the preview.
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
      { error: "Site must be in preview status to publish." },
      { status: 400 },
    );
  }

  const ok = await publishSite(siteId, site.subdomain);
  if (!ok) {
    return NextResponse.json({ error: "Failed to publish." }, { status: 500 });
  }

  // Send published email
  const intake = await getIntakeById(site.intake_id);
  if (intake) {
    const liveUrl = `https://${site.subdomain}.doubleblaze.solutions`;
    const dashboardUrl = `${SITE_URL}/trailhead/dashboard/${site.preview_token}`;
    sendTrailheadPublished(intake.contact_email, {
      contactName: intake.contact_name,
      siteName: intake.site_name,
      liveUrl,
      dashboardUrl,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, liveUrl: `https://${site.subdomain}.doubleblaze.solutions` });
}
