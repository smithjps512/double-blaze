import { NextResponse, after, type NextRequest } from "next/server";
import {
  getSiteByPreviewToken,
  acceptPreview,
  publishSite,
  getIntakeById,
  recordNotificationFailure,
} from "@/lib/trailhead-db";
import { isValidStatusToken } from "@/lib/trailhead";
import { sendTrailheadPublished } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

/**
 * POST /api/trailhead/accept
 * The customer accepts their preview, which publishes the site. This is the
 * customer's own publish decision ("I see it, I like it, I publish it, I share
 * it"): it is keyed by the lifecycle token and takes no staff step. It records
 * acceptance, flips the site to published with its live URL, and emails the live
 * link. The published email is best-effort in after() so the response is
 * immediate. Idempotent: accepting an already-live site just returns the URL.
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

  const liveUrl = site.live_url ?? `https://${site.subdomain}.doubleblaze.solutions`;

  // Already live: accepting again is a no-op that returns the link.
  if (["published", "exported", "upgraded"].includes(site.status)) {
    return NextResponse.json({ ok: true, liveUrl });
  }

  // Only a released preview can be accepted and published.
  if (site.status !== "preview" || !site.preview_sent_at) {
    return NextResponse.json(
      { error: "There is no preview ready to accept yet." },
      { status: 400 },
    );
  }

  // Record the acceptance, then publish. Acceptance is recorded first so the
  // decision is captured even if the status write races.
  await acceptPreview(site.id);
  const published = await publishSite(site.id, site.subdomain);
  if (!published) {
    return NextResponse.json({ error: "Could not publish your site." }, { status: 500 });
  }

  // Tell the customer it is live (best-effort, never blocks the response).
  after(async () => {
    const intake = await getIntakeById(site.intake_id);
    if (!intake) return;
    const tag = "trailhead-published";
    const result = await sendTrailheadPublished(intake.contact_email, {
      contactName: intake.contact_name,
      siteName: intake.site_name,
      liveUrl,
      statusUrl: `${SITE_URL}/trailhead/status/${site.preview_token}`,
    });
    if (!result.ok) {
      console.error(
        `[trailhead] email ${tag} failed for intake ${site.intake_id}: ${result.reason ?? "unknown reason"}`,
      );
      await recordNotificationFailure(site.id, tag, result.reason ?? "unknown reason");
    }
  });

  return NextResponse.json({ ok: true, liveUrl });
}
