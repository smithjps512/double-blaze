import { NextResponse, type NextRequest } from "next/server";
import { checkInitials, checkPlayerKey } from "@/lib/smart-cities";
import { isLegal, parseSpec, run } from "@/lib/dragster/sim";
import { dragsterBoard, postRun, type RunKind } from "@/lib/dragster-db";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * GET  /api/dragster/runs?period=1&kind=twin&player=key   the period's board
 * POST /api/dragster/runs   { period, kind, initials, car, player }
 *
 * Anonymous, initials only. The client never sends a time: the server runs
 * the car itself, refuses it if it breaks a class rule, and stores the time
 * the physics gives. Each device keeps its best run per period and stage.
 */
export const dynamic = "force-dynamic";

const PERIODS = new Set([1, 2, 3, 4, 5, 6, 7]);

function parsePeriod(raw: unknown): number | null {
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && PERIODS.has(n) ? n : null;
}

function parseKind(raw: unknown): RunKind | null {
  return raw === "twin" || raw === "mod" ? raw : null;
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const period = parsePeriod(p.get("period"));
  const kind = parseKind(p.get("kind"));
  if (!period || !kind) return NextResponse.json({ error: "Pick a period." }, { status: 400 });
  const board = await dragsterBoard(period, kind, checkPlayerKey(p.get("player")));
  if (!board) return NextResponse.json({ error: "The class board is not switched on yet." }, { status: 503 });
  return NextResponse.json({ board }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const period = parsePeriod(body.period);
  const kind = parseKind(body.kind);
  if (!period || !kind) return NextResponse.json({ error: "Pick your class period first." }, { status: 400 });
  const initials = checkInitials(body.initials);
  if (!initials.ok) return NextResponse.json({ error: initials.error }, { status: 400 });
  const player = checkPlayerKey(body.player);
  if (!player) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const spec = parseSpec(body.car);
  if (!spec.ok) return NextResponse.json({ error: spec.error }, { status: 400 });
  const car = kind === "twin" ? { ...spec.car, mods: [] } : spec.car;
  if (!isLegal(car)) {
    return NextResponse.json({ error: "This car breaks a class rule. Fix the red rules first." }, { status: 400 });
  }
  if (throttled(`dragster:${player}`)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 });
  }

  const result = run(car);
  if (!Number.isFinite(result.time)) {
    return NextResponse.json({ error: "That car never reached the finish line." }, { status: 400 });
  }

  const saved = await postRun({ period, kind, initials: initials.initials, timeMs: result.timeMs, car, playerKey: player });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 503 });
  const board = await dragsterBoard(period, kind, player);
  return NextResponse.json({ ok: true, best: saved.best, timeMs: result.timeMs, board: board ?? [] });
}
