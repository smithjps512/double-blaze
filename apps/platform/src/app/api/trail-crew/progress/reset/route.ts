import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/server-auth";
import { clearProgress } from "@/lib/trail-crew-progress";
import { teamExists } from "@/lib/trail-crew-edits";

/**
 * POST /api/trail-crew/progress/reset  { team }
 *
 * Staff only. Wipes a team's project board: every tick and every card status.
 * The one moderation tool the board needs, for the day a team ticks everything
 * to see what happens.
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
  const ok = await clearProgress(slug);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Could not reset that board." }, { status: 500 });
}
