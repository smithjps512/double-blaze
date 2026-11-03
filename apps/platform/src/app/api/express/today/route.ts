import { NextResponse, type NextRequest } from "next/server";
import { gamesToday } from "@/lib/express-db";

/** GET /api/express/today?period=3: each Chromebook's latest game today. Initials and studio names only. */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const period = Number(req.nextUrl.searchParams.get("period") ?? 3);
  if (!Number.isInteger(period) || period < 1 || period > 7) return NextResponse.json({ error: "Pick a period." }, { status: 400 });
  const games = await gamesToday(period);
  if (!games) return NextResponse.json({ error: "The games list is not switched on here yet." }, { status: 503 });
  return NextResponse.json({ games }, { headers: { "cache-control": "no-store" } });
}
