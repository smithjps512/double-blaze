import { NextResponse, type NextRequest } from "next/server";
import { getSiteByPreviewToken, storeApprovedContent } from "@/lib/trailhead-db";

/**
 * POST /api/trailhead/approve
 * Customer approves the content draft. Requires their preview token.
 * Records approval with timestamp and stores the approved content.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = String(body.token ?? "");
  if (!token) {
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

  return NextResponse.json({ ok: true });
}
