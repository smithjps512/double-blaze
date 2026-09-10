import { NextResponse, type NextRequest } from "next/server";
import { settleName } from "@/lib/plant-id";

/**
 * POST /api/greenhouse/settle
 *
 * The teacher locks in the winning name. Gated on a code in the server
 * environment, which is a classroom lock rather than a security boundary.
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
  const code = typeof body.code === "string" ? body.code : "";
  if (!specimenId) return NextResponse.json({ error: "Which plant?" }, { status: 400 });

  const result = await settleName(specimenId, name, code);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 200 });
  return NextResponse.json({ ok: true });
}
