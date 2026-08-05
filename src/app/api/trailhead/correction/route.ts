import { NextResponse, after, type NextRequest } from "next/server";
import {
  getSiteByPreviewToken,
  getIntakeById,
  recordNotificationFailure,
  updateSiteStatus,
} from "@/lib/trailhead-db";
import { sendTrailheadCorrectionNotification } from "@/lib/email";

/**
 * POST /api/trailhead/correction
 * Customer requests a correction. Scoped to our errors: spelling, wrong
 * brand colors, messaging that does not match approved content, broken links,
 * factual errors. Anything beyond that is an upgrade conversation.
 *
 * The token is the site's capability: the site (and its intake) are resolved
 * server-side, so the customer only sends their message. We move the site to
 * "correcting" (back in our hands), append the request to staff_notes without
 * clobbering earlier notes, and notify staff best-effort so the message reaches
 * a human. A dropped staff email is recorded on the site so it stays visible.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = String(body.token ?? "");
  const description = String(body.description ?? "").trim();

  if (!token) {
    return NextResponse.json({ error: "Token required." }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "Please describe the correction needed." }, { status: 400 });
  }

  const site = await getSiteByPreviewToken(token);
  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  if (site.status !== "published" && site.status !== "preview") {
    return NextResponse.json(
      { error: "Corrections can only be requested for published or previewed sites." },
      { status: 400 },
    );
  }

  // Append to staff_notes rather than overwrite, so a second request does not
  // erase the first. Each entry is timestamped for staff.
  const entry = `[${new Date().toISOString()}] Correction request: ${description}`;
  const existingNotes = typeof site.staff_notes === "string" ? site.staff_notes.trim() : "";
  const staff_notes = existingNotes ? `${existingNotes}\n\n${entry}` : entry;

  await updateSiteStatus(site.id, "correcting", { staff_notes });

  // Notify staff out of band so the response stays immediate. A dropped email
  // is recorded on the site (it also lives in staff_notes above regardless).
  after(async () => {
    const intake = site.intake_id ? await getIntakeById(site.intake_id) : null;
    const res = await sendTrailheadCorrectionNotification({
      siteName: intake?.site_name ?? site.subdomain,
      subdomain: site.subdomain,
      description,
      intakeId: site.intake_id,
      contactEmail: intake?.contact_email,
    });
    if (!res.ok) {
      await recordNotificationFailure(
        site.id,
        "trailhead-correction",
        res.reason ?? "correction notification failed",
      );
    }
  });

  return NextResponse.json({ ok: true });
}
