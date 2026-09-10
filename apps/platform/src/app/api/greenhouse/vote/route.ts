import { NextResponse, type NextRequest } from "next/server";
import { castVote } from "@/lib/plant-id";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * POST /api/greenhouse/vote
 *
 * One vote per plant per device, enforced by a unique constraint in the
 * database rather than trusted from the browser.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const specimenId = typeof body.specimenId === "string" ? body.specimenId : "";
  const nameId = typeof body.nameId === "string" ? body.nameId : "";
  const voter = typeof body.voter === "string" ? body.voter : "";
  if (!specimenId || !nameId) {
    return NextResponse.json({ error: "Which name?" }, { status: 400 });
  }
  if (throttled(voter)) {
    return NextResponse.json({ error: "Slow down a moment." }, { status: 429 });
  }

  const result = await castVote(specimenId, nameId, voter);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 200 });
  return NextResponse.json({ ok: true });
}
