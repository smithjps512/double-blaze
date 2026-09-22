import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/server-auth";
import { clearTesting } from "@/lib/trail-crew-testing";
import { teamExists } from "@/lib/trail-crew-edits";

/**
 * POST /api/trail-crew/test/reset  { team }
 *
 * Staff only. Wipes a team's testing: every sheet, result and bug. For the
 * day a class tests the wrong app, or a team fills the bug list with jokes.
 */
export async function POST(req: NextRequest) {
  if (!(await requireStaff())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const slug = typeof body.team === "string" ? body.team : "";
  if (!slug || !teamExists(slug)) return NextResponse.json({ error: "No such team." }, { status: 400 });
  const ok = await clearTesting(slug);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Could not reset that team's testing." }, { status: 500 });
}
