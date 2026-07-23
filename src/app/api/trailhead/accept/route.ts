import { NextResponse, type NextRequest } from "next/server";
import { getSiteByPreviewToken, acceptPreview } from "@/lib/trailhead-db";
import { isValidStatusToken } from "@/lib/trailhead";

/**
 * POST /api/trailhead/accept
 * The customer accepts their preview. Requires their lifecycle token. Records
 * acceptance, which is the cue for staff to publish (brief section 4 step 7:
 * on acceptance, the site publishes). Publishing itself stays a staff action.
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

  // Only a released preview can be accepted.
  if (site.status !== "preview" || !site.preview_sent_at) {
    return NextResponse.json(
      { error: "There is no preview ready to accept yet." },
      { status: 400 },
    );
  }

  const ok = await acceptPreview(site.id);
  if (!ok) {
    return NextResponse.json({ error: "Could not record your acceptance." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
