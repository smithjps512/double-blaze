import { NextResponse, type NextRequest } from "next/server";
import { checkInitials, checkPlayerKey } from "@/lib/smart-cities";
import { checkTeamName } from "@/lib/launch/plan";
import { cleanDesign, designGaps } from "@/lib/express/spec";
import { designGame } from "@/lib/express/spark";
import { BUILDS_PER_DAY, buildsToday, saveGame } from "@/lib/express-db";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * POST /api/express/build  { design, device }
 *
 * Checks the design, has Spark design the game (or the rules, if Spark is not
 * there or too slow), stores it, and returns the spec and a play link slug.
 * A Chromebook gets BUILDS_PER_DAY builds a day: enough to remix twice, not
 * enough to spend the class pressing Build.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const device = checkPlayerKey(body.device);
  if (!device) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const design = cleanDesign(body.design);
  const initials = checkInitials(design.initials);
  if (!initials.ok) return NextResponse.json({ error: initials.error, field: "initials" }, { status: 400 });
  const studio = checkTeamName(design.studio);
  if (!studio.ok) return NextResponse.json({ error: studio.error, field: "studio" }, { status: 400 });
  const gaps = designGaps(design);
  if (gaps.length) return NextResponse.json({ error: `Still missing: ${gaps.join(", ")}.`, gaps }, { status: 400 });
  if (throttled(`express:${device}`)) return NextResponse.json({ error: "One build at a time. Wait for this one to finish." }, { status: 429 });

  const used = await buildsToday(device);
  if (used !== null && used >= BUILDS_PER_DAY) {
    return NextResponse.json({ error: `You have used all ${BUILDS_PER_DAY} builds for today. Play your game, then play your classmates' games!` }, { status: 429 });
  }

  const spec = await designGame({ ...design, initials: initials.initials, studio: studio.name });
  const slug = await saveGame({ design: { ...design, initials: initials.initials, studio: studio.name }, spec, deviceKey: device });
  return NextResponse.json({ spec, slug, buildsLeft: used === null ? null : BUILDS_PER_DAY - used - 1, saved: !!slug });
}
