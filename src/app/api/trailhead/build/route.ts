import { NextResponse, type NextRequest } from "next/server";
import { getSiteById, getIntakeById, storeBuiltContent, updateSiteStatus } from "@/lib/trailhead-db";
import { buildSite } from "@/lib/spark-trailhead";
import type { ContentDraft } from "@/lib/spark-trailhead";
import { requireStaff } from "@/lib/server-auth";

/**
 * POST /api/trailhead/build
 * Staff triggers the build after content is approved. Spark builds the site
 * from approved content. Boundary violations block the build.
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

  if (site.status !== "approved") {
    return NextResponse.json(
      { error: "Content must be approved before building." },
      { status: 400 },
    );
  }

  const intake = await getIntakeById(site.intake_id);
  if (!intake) {
    return NextResponse.json({ error: "Intake not found." }, { status: 404 });
  }

  // Set status to building
  await updateSiteStatus(siteId, "building");

  const approvedContent = site.approved_content as ContentDraft;
  const { site: builtSite, violations } = await buildSite(approvedContent, intake);

  if (violations.length > 0) {
    // Revert to approved status, report violations
    await updateSiteStatus(siteId, "approved");
    return NextResponse.json({
      ok: false,
      error: "Build has boundary violations that could not be resolved.",
      violations,
    }, { status: 422 });
  }

  if (!builtSite) {
    await updateSiteStatus(siteId, "approved");
    return NextResponse.json({ error: "Spark could not build the site. Try again." }, { status: 500 });
  }

  // Store built content and set to preview
  await storeBuiltContent(siteId, builtSite);

  return NextResponse.json({ ok: true });
}
