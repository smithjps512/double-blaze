import { NextResponse, type NextRequest } from "next/server";
import { checkPlayerKey } from "@/lib/smart-cities";
import { POLLS, checkBallot, tally } from "@/lib/launch/vote";
import { ballotsFor, castBallot } from "@/lib/launch-vote-db";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * POST /api/launch/vote   { poll, ranking, why, period, team, voter }   cast or replace a ballot
 * GET  /api/launch/vote?poll=p3-whats-next[&reasons=1]                    the live tally
 *
 * Anonymous, team names only, one ballot per Chromebook (`voter`). The
 * reasons are only sent when asked for, because the results page hides them
 * until the teacher chooses to show them.
 */
export const dynamic = "force-dynamic";

const OFF = "Voting is not switched on here yet. Tell your teacher your #1.";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const voter = checkPlayerKey(body.voter);
  if (!voter) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const checked = checkBallot(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  if (throttled(`vote:${voter}`)) return NextResponse.json({ error: "Slow down a little." }, { status: 429 });
  const saved = await castBallot(checked.ballot, voter);
  if (saved === null) return NextResponse.json({ error: OFF }, { status: 503 });
  if (!saved) return NextResponse.json({ error: "Could not save your vote. Try again." }, { status: 503 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const poll = POLLS[p.get("poll") ?? ""];
  if (!poll) return NextResponse.json({ error: "No such vote." }, { status: 404 });
  const ballots = await ballotsFor(poll.id);
  if (!ballots) return NextResponse.json({ error: OFF }, { status: 503 });
  const body: Record<string, unknown> = { tally: tally(poll, ballots) };
  if (p.get("reasons") === "1") {
    body.reasons = ballots.map((b) => ({ first: b.ranking[0], why: b.why, team: b.teamName }));
  }
  return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
}
