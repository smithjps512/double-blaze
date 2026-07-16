import { NextResponse, type NextRequest } from "next/server";
import { getIntakeById, getSiteBySubdomain, updateSiteStatus } from "@/lib/trailhead-db";
import { draftContent } from "@/lib/spark-trailhead";
import { requireStaff } from "@/lib/server-auth";

/**
 * POST /api/trailhead/content-draft
 * Staff triggers Spark to draft content from an intake. The draft goes to
 * staff review first, then to the customer.
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

  const intake = await getIntakeById(intakeId);
  if (!intake) {
    return NextResponse.json({ error: "Intake not found." }, { status: 404 });
  }

  const site = await getSiteBySubdomain(intake.subdomain);
  if (!site) {
    return NextResponse.json({ error: "Site record not found." }, { status: 404 });
  }

  const draft = await draftContent(intake);
  if (!draft) {
    return NextResponse.json({ error: "Spark could not draft content. Try again." }, { status: 500 });
  }

  // Store draft as approved_content (pre-approval, staff reviews first)
  await updateSiteStatus(site.id, "awaiting_approval", {
    approved_content: draft,
  });

  return NextResponse.json({ ok: true, draft });
}
