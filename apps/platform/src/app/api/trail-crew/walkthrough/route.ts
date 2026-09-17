import { NextResponse, type NextRequest } from "next/server";
import { getWalkthroughProgress, writeWalkthroughProgress } from "@/lib/trail-crew-walkthrough";

/**
 * GET  /api/trail-crew/walkthrough?team=slug   the team's track and done steps
 * POST /api/trail-crew/walkthrough             mark a step, or pick a track
 *
 * Anonymous, like the progress board: the team slug is the whole identity, and
 * every write is checked against the walkthrough generated from the team's
 * own committed documents. The worst a bored student can do is tick their own
 * team's steps, which the page shows and the teacher can reset.
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

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("team") ?? "";
  const progress = slug ? await getWalkthroughProgress(slug) : null;
  if (!progress) return NextResponse.json({ error: "No walkthrough for that team." }, { status: 404 });
  return NextResponse.json(progress, { headers: { "cache-control": "no-store" } });
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
    return NextResponse.json({ ok: false, error: "Slow down a little. Try again in a minute." }, { status: 429 });
  }

  let result: { ok: boolean; error?: string };
  if (typeof body.step === "string") {
    result = await writeWalkthroughProgress(slug, { kind: "step", stepId: body.step, done: body.done !== false });
  } else if (typeof body.track === "string") {
    result = await writeWalkthroughProgress(slug, { kind: "track", track: body.track });
  } else {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }

  // A failed save is not an error to the page: it keeps the tick in the
  // browser and says so. The status stays 200 so the page can read the reason.
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error ?? "Could not save." });
  const progress = await getWalkthroughProgress(slug);
  return NextResponse.json({ ok: true, ...(progress ?? {}) });
}
