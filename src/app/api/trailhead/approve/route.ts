import { NextResponse, type NextRequest } from "next/server";
import { getSiteByPreviewToken, storeApprovedContent } from "@/lib/trailhead-db";
import { isValidStatusToken } from "@/lib/trailhead";
import { runBuild } from "@/lib/trailhead-pipeline";

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

  // Kick off the build automatically. Fire-and-forget: the customer's approval
  // is already recorded, and staff can re-run the build if Spark stumbles. The
  // built site waits at the staff review gate before any preview goes out.
  runBuild(site.id).catch((err: unknown) =>
    console.error(`[trailhead] auto-build after approval failed for site ${site.id}:`, err),
  );

  return NextResponse.json({ ok: true });
}
