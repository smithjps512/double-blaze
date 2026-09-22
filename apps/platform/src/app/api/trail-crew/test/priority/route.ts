import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/server-auth";
import { setBugPriority } from "@/lib/trail-crew-testing";

/**
 * POST /api/trail-crew/test/priority  { team, bug, priority: "now" | "next" | "later" | null }
 *
 * Staff only. The teacher's one hand on the priority board: move a bug to
 * the top, to next, or to later, or clear that and let the rule place it
 * again. Everything else about the order is the engine's.
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
  if (!slug) return NextResponse.json({ error: "Missing team." }, { status: 400 });
  const outcome = await setBugPriority(slug, body.bug, body.priority);
  return outcome.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: outcome.error }, { status: 400 });
}
