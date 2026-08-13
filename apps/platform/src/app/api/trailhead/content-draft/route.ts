import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/server-auth";
import { generateDraft } from "@/lib/trailhead-pipeline";
import { recordNotificationFailure } from "@/lib/trailhead-db";
import { sendTrailheadContentReview } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

// Spark's draft is awaited inline in the request. Give it room (Vercel Pro
// allows up to 300s) so a staff-triggered re-draft is not cut off mid-call.
export const maxDuration = 300;

/**
 * POST /api/trailhead/content-draft
 * Staff re-runs Spark's content draft for an intake (it also runs
 * automatically on submission). On success, notifies the customer that their
 * draft is ready to review.
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

  const intakeId = String(body.intake_id ?? "");
  if (!intakeId) {
    return NextResponse.json({ error: "intake_id required." }, { status: 400 });
  }

  const result = await generateDraft(intakeId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (result.contactEmail && result.token) {
    const tag = "trailhead-content-review";
    const emailResult = await sendTrailheadContentReview(result.contactEmail, {
      contactName: result.contactName ?? "",
      siteName: result.siteName ?? "",
      statusUrl: `${SITE_URL}/trailhead/status/${result.token}`,
    });
    if (!emailResult.ok && result.siteId) {
      console.error(
        `[trailhead] email ${tag} failed for intake ${intakeId}: ${emailResult.reason ?? "unknown reason"}`,
      );
      await recordNotificationFailure(result.siteId, tag, emailResult.reason ?? "unknown reason");
    }
  }

  return NextResponse.json({ ok: true, draft: result.draft });
}
