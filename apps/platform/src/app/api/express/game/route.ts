import { NextResponse, type NextRequest } from "next/server";
import { getGame } from "@/lib/express-db";

/** GET /api/express/game?slug=abcd2345: one game's spec, for the play page. */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const game = await getGame(req.nextUrl.searchParams.get("slug") ?? "");
  if (!game) return NextResponse.json({ error: "No game with that link." }, { status: 404 });
  return NextResponse.json({ spec: game.spec, studio: game.design.studio, initials: game.design.initials }, { headers: { "cache-control": "no-store" } });
}
