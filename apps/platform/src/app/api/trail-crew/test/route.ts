import { NextResponse, type NextRequest } from "next/server";
import {
  finishSheet,
  getTeamTesting,
  recordBreakTest,
  recordResult,
  reportBug,
  startSheet,
} from "@/lib/trail-crew-testing";
import { shapeTesting } from "@/lib/trail-crew-testing-shape";

/**
 * GET  /api/trail-crew/test?team=slug   the team's cards with what testing found
 * POST /api/trail-crew/test             one action from the live test sheet
 *
 * Anonymous, like the project board: the team slug in the request is the
 * whole identity, and every write is checked against the team's committed
 * cards before it lands. The actions are the parts of the paper sheet:
 *
 *   start    a new numbered sheet for this team          { device? }
 *   result   a card tested, or a bug re-tested           { sheetId?, card | bug, outcome, whatIDid?, whatHappened? }
 *   bug      one row of "Bugs you found"                 { sheetId?, card?, title, steps?, severity? }
 *   break    one of the six "try to break it" rows       { sheetId?, index, handled, whatHappened? }
 *   finish   ratings and the tester's own words          { sheetId, keep?, change?, missingStory?, ratings? }
 */
export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

function throttled(slug: string): boolean {
  const now = Date.now();
  const hits = (recent.get(slug) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(slug, hits);
  return hits.length > MAX_PER_WINDOW;
}

async function current(slug: string) {
  const v = await getTeamTesting(slug);
  return v ? shapeTesting(v) : null;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("team") ?? "";
  const shape = slug ? await current(slug) : null;
  if (!shape) return NextResponse.json({ error: "No such team." }, { status: 404 });
  return NextResponse.json(shape, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const slug = typeof body.team === "string" ? body.team : "";
  if (!slug) return NextResponse.json({ error: "Missing team." }, { status: 400 });
  if (throttled(slug)) {
    return NextResponse.json({ error: "Slow down a little. Try again in a minute." }, { status: 429 });
  }

  let outcome: { ok: true; id?: string; tester?: string } | { ok: false; error: string };
  switch (body.action) {
    case "start":
      outcome = await startSheet(slug, { device: body.device });
      break;
    case "result":
      outcome = await recordResult(slug, {
        sheetId: body.sheetId,
        cardSlug: body.card,
        bugId: body.bug,
        outcome: body.outcome,
        whatIDid: body.whatIDid,
        whatHappened: body.whatHappened,
      });
      break;
    case "bug":
      outcome = await reportBug(slug, {
        sheetId: body.sheetId,
        cardSlug: body.card,
        title: body.title,
        steps: body.steps,
        severity: body.severity,
      });
      break;
    case "break":
      outcome = await recordBreakTest(slug, {
        sheetId: body.sheetId,
        index: body.index,
        handled: body.handled,
        whatHappened: body.whatHappened,
      });
      break;
    case "finish":
      outcome = await finishSheet(slug, {
        sheetId: body.sheetId,
        keep: body.keep,
        change: body.change,
        missingStory: body.missingStory,
        ratings: body.ratings,
      });
      break;
    default:
      return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }

  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: 400 });
  const shape = await current(slug);
  return NextResponse.json({ ...(shape ?? {}), saved: { id: outcome.id ?? null, tester: outcome.tester ?? null } });
}
