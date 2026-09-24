import { NextResponse, type NextRequest } from "next/server";
import { checkInitials, checkPlayerKey, checkScore, findCity, isMode } from "@/lib/smart-cities";
import { leaderboard, postScore } from "@/lib/smart-cities-db";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * GET  /api/smart-cities/scores?city=slug&mode=hunt&player=key   top ten
 * POST /api/smart-cities/scores   { city, mode, initials, score, player }
 *
 * Anonymous. Initials only, checked against a short blocklist; each device
 * keeps its best score per game. The teacher can clear a board.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const city = findCity(p.get("city"));
  const mode = p.get("mode");
  if (!city || !isMode(city, mode)) return NextResponse.json({ error: "No such game." }, { status: 404 });
  const board = await leaderboard(city.slug, mode, checkPlayerKey(p.get("player")));
  if (!board) return NextResponse.json({ error: "The class leaderboard is not switched on yet." }, { status: 503 });
  return NextResponse.json({ board }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const city = findCity(body.city);
  if (!city || !isMode(city, body.mode)) return NextResponse.json({ error: "No such game." }, { status: 400 });
  const mode = body.mode;
  const initials = checkInitials(body.initials);
  if (!initials.ok) return NextResponse.json({ error: initials.error }, { status: 400 });
  const score = checkScore(body.score);
  if (!score.ok) return NextResponse.json({ error: score.error }, { status: 400 });
  const player = checkPlayerKey(body.player);
  if (!player) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (throttled(`score:${player}`)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 });
  }

  const saved = await postScore({ citySlug: city.slug, mode, initials: initials.initials, score: score.score, playerKey: player });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 503 });
  const board = await leaderboard(city.slug, mode, player);
  return NextResponse.json({ ok: true, best: saved.best, board: board ?? [] });
}
