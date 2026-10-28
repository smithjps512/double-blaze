import { NextResponse, type NextRequest } from "next/server";
import { checkTeamName } from "@/lib/launch/plan";
import { cleanDesign } from "@/lib/studio/design";
import { getPlan, listTeams, savePlan } from "@/lib/studio-db";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * GET  /api/studio?period=3                 studio names in the period
 * GET  /api/studio?period=3&team=Pixel+Pickles  one studio's design (404 if new)
 * POST /api/studio  { period, team, plan, rev }   (plan is the game design)
 *
 * Anonymous, team names only. A save carries the rev it was based on; if a
 * teammate saved in between, the answer is 409 with their version, and the
 * page asks which one to keep.
 */
export const dynamic = "force-dynamic";

function parsePeriod(raw: unknown): number | null {
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 7 ? n : null;
}

const NO_STORE = { "cache-control": "no-store" };
const OFF = "Saving to the class is not switched on here. Your design is kept on this Chromebook.";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const period = parsePeriod(p.get("period"));
  if (!period) return NextResponse.json({ error: "Pick your period." }, { status: 400 });

  const rawTeam = p.get("team");
  if (rawTeam === null) {
    const teams = await listTeams(period);
    if (!teams) return NextResponse.json({ error: OFF }, { status: 503 });
    return NextResponse.json({ teams }, { headers: NO_STORE });
  }

  const team = checkTeamName(rawTeam);
  if (!team.ok) return NextResponse.json({ error: team.error }, { status: 400 });
  const found = await getPlan(period, team.key);
  if (found === "off") return NextResponse.json({ error: OFF }, { status: 503 });
  if (!found) return NextResponse.json({ found: false, teamName: team.name }, { status: 404, headers: NO_STORE });
  return NextResponse.json({ found: true, ...found }, { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const period = parsePeriod(body.period);
  if (!period) return NextResponse.json({ error: "Pick your period first." }, { status: 400 });
  const team = checkTeamName(body.team);
  if (!team.ok) return NextResponse.json({ error: team.error }, { status: 400 });
  const rev = typeof body.rev === "number" && Number.isInteger(body.rev) && body.rev >= 0 ? body.rev : null;
  if (rev === null) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (throttled(`studio:${period}:${team.key}`)) {
    return NextResponse.json({ error: "Saving too fast. It will catch up." }, { status: 429 });
  }

  const saved = await savePlan({ period, key: team.key, teamName: team.name, plan: cleanDesign(body.plan), rev });
  if (saved.ok) return NextResponse.json({ ok: true, rev: saved.rev });
  if ("conflict" in saved) return NextResponse.json({ conflict: saved.conflict }, { status: 409 });
  return NextResponse.json({ error: saved.error }, { status: 503 });
}
