import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/server-auth";
import { runBuild } from "@/lib/trailhead-pipeline";

// The build is a large multi-page generation awaited inline in the request.
// Give it room (Vercel Pro allows up to 300s) so a staff-triggered rebuild is
// not cut off before Spark finishes.
export const maxDuration = 300;

/**
 * POST /api/trailhead/build
 * Staff re-runs the build (it also runs automatically on customer approval).
 * Shares the same pipeline. Boundary violations block the build.
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

  const result = await runBuild(siteId);
  if (!result.ok) {
    if (result.violations && result.violations.length > 0) {
      return NextResponse.json(
        { ok: false, error: result.error, violations: result.violations },
        { status: 422 },
      );
    }
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
