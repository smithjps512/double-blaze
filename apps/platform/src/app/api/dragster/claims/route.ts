import { NextResponse, type NextRequest } from "next/server";
import { checkInitials, checkPlayerKey } from "@/lib/smart-cities";
import { findCar } from "@/lib/dragster/library";
import { claimCar, listClaims, releaseCar } from "@/lib/dragster-db";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * GET  /api/dragster/claims?period=1&player=key   which library cars are taken
 * POST /api/dragster/claims   { period, car, initials, player }   take a car
 * POST /api/dragster/claims   { period, player, release: true }   give it back
 *
 * A library car can be taken once per class period. Any other period can
 * still take it. Anonymous: initials and the Lab's device token only.
 */
export const dynamic = "force-dynamic";

const PERIODS = new Set([1, 2, 3, 4, 5, 6, 7]);
function parsePeriod(raw: unknown): number | null {
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && PERIODS.has(n) ? n : null;
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const period = parsePeriod(p.get("period"));
  if (!period) return NextResponse.json({ error: "Pick a period." }, { status: 400 });
  const claims = await listClaims(period, checkPlayerKey(p.get("player")));
  if (!claims) return NextResponse.json({ error: "The Car Library is not switched on yet." }, { status: 503 });
  return NextResponse.json(claims, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const period = parsePeriod(body.period);
  if (!period) return NextResponse.json({ error: "Pick your class period first." }, { status: 400 });
  const player = checkPlayerKey(body.player);
  if (!player) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (throttled(`claim:${player}`)) return NextResponse.json({ error: "Slow down a little." }, { status: 429 });

  if (body.release === true) {
    const ok = await releaseCar(period, player);
    if (!ok) return NextResponse.json({ error: "The Car Library is not switched on yet." }, { status: 503 });
    return NextResponse.json({ ok: true, ...((await listClaims(period, player)) ?? { taken: [], mine: null }) });
  }

  const car = findCar(body.car);
  if (!car) return NextResponse.json({ error: "No such car." }, { status: 400 });
  const initials = checkInitials(body.initials);
  if (!initials.ok) return NextResponse.json({ error: initials.error }, { status: 400 });

  const result = await claimCar({ period, carNo: car.no, playerKey: player, initials: initials.initials });
  const claims = (await listClaims(period, player)) ?? { taken: [], mine: null };
  if (!result.ok) return NextResponse.json({ error: result.error, ...claims }, { status: result.taken ? 409 : 503 });
  return NextResponse.json({ ok: true, ...claims });
}
