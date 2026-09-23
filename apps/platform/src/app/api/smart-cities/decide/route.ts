import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/server-auth";
import { findCity, isMode } from "@/lib/smart-cities";
import { clearBoard, decideAnswer, removeScore } from "@/lib/smart-cities-db";

/**
 * POST /api/smart-cities/decide   staff only
 *   { action: "answer", id, decision: "approved" | "rejected" | "pending" }
 *   { action: "clear", city, mode }             wipe one leaderboard
 *   { action: "remove", city, mode, initials }  take one entry off a board
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: "Staff only." }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.action === "answer") {
    const id = typeof body.id === "string" && UUID.test(body.id) ? body.id : null;
    const decision = body.decision;
    if (!id || (decision !== "approved" && decision !== "rejected" && decision !== "pending")) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const ok = await decideAnswer(id, decision);
    return NextResponse.json(ok ? { ok } : { error: "Could not save." }, { status: ok ? 200 : 500 });
  }

  const city = findCity(body.city);
  if (!city || !isMode(city, body.mode)) return NextResponse.json({ error: "No such game." }, { status: 400 });

  if (body.action === "clear") {
    const ok = await clearBoard(city.slug, body.mode);
    return NextResponse.json(ok ? { ok } : { error: "Could not clear." }, { status: ok ? 200 : 500 });
  }
  if (body.action === "remove" && typeof body.initials === "string") {
    const ok = await removeScore(city.slug, body.mode, body.initials.toUpperCase());
    return NextResponse.json(ok ? { ok } : { error: "Could not remove." }, { status: ok ? 200 : 500 });
  }
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}
