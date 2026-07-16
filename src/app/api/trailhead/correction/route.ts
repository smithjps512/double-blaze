import { NextResponse, type NextRequest } from "next/server";
import { getSiteByPreviewToken, updateSiteStatus } from "@/lib/trailhead-db";

/**
 * POST /api/trailhead/correction
 * Customer requests a correction. Scoped to our errors: spelling, wrong
 * brand colors, messaging that does not match approved content, broken links,
 * factual errors. Anything beyond that is an upgrade conversation.
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

  await updateSiteStatus(site.id, "correcting", {
    staff_notes: `Correction request: ${description}`,
  });

  return NextResponse.json({ ok: true });
}
