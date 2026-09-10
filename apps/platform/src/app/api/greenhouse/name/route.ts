import { NextResponse, type NextRequest } from "next/server";
import { addName, castVote } from "@/lib/plant-id";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * POST /api/greenhouse/name
 *
 * A student puts a name up. Their own vote goes on it straight away, because
 * putting a name up is the strongest way of saying you think it is right.
 *
 * Anonymous: no account, no name, nothing that identifies a child.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const specimenId = typeof body.specimenId === "string" ? body.specimenId : "";
  const name = typeof body.name === "string" ? body.name : "";
  const voter = typeof body.voter === "string" ? body.voter : "";
  if (!specimenId) return NextResponse.json({ error: "Which plant?" }, { status: 400 });

  if (throttled(voter)) {
    return NextResponse.json(
      { error: "That is a lot very fast. Give it a moment." },
      { status: 429 },
    );
  }

  const result = await addName(specimenId, name);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 200 });

  if (voter) await castVote(specimenId, result.nameId, voter);
  return NextResponse.json({ ok: true });
}
