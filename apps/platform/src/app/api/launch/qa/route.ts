import { NextResponse, type NextRequest } from "next/server";
import { checkReport } from "@/lib/launch/qa";
import { addReport, approvedFor } from "@/lib/launch-qa-db";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * POST /api/launch/qa          { app, kind, answers, period, team }   a QA report
 * GET  /api/launch/qa?app=...  approved reports about one app
 *
 * Anonymous, team names only. Every report waits for the teacher at
 * /play/review; nothing a student writes reaches another team before that.
 */
export const dynamic = "force-dynamic";

const OFF = "QA reports are not switched on here yet. Tell your teacher what you found.";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const checked = checkReport(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error, field: checked.field }, { status: 400 });
  const { report } = checked;
  if (throttled(`qa:${report.period}:${report.teamKey}`)) {
    return NextResponse.json({ error: "Slow down a little. Take time to test before the next report." }, { status: 429 });
  }
  const saved = await addReport(report);
  if (saved === null) return NextResponse.json({ error: OFF }, { status: 503 });
  if (!saved) return NextResponse.json({ error: "Could not send it. Try again." }, { status: 503 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const app = req.nextUrl.searchParams.get("app") ?? "";
  if (!/^[a-z0-9-]{2,60}$/.test(app)) return NextResponse.json({ error: "Which app?" }, { status: 400 });
  const reports = await approvedFor(app);
  if (!reports) return NextResponse.json({ error: OFF }, { status: 503 });
  return NextResponse.json({ reports }, { headers: { "cache-control": "no-store" } });
}
