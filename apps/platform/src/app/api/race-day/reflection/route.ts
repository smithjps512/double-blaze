import { NextResponse, type NextRequest } from "next/server";
import { isInClass, isTeacher } from "@/lib/race-day/auth";
import { checkReflection, MAX_SCORE } from "@/lib/race-day/reflection";
import { reviewReflection, submitReflection } from "@/lib/race-day-reflections-db";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * POST  /api/race-day/reflection   a student turns in the project reflection.
 *       Class password cookie. The same checks as the form run again here.
 * PATCH /api/race-day/reflection   { id, score?, teacherNote?, reviewed? }
 *       Teacher code cookie.
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(req: NextRequest) {
  if (!(await isInClass())) return NextResponse.json({ error: "Sign in with the class password first." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // A whole classroom shares one address, so throttle per student name too.
  const who = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const name = String((body as { fullName?: unknown })?.fullName ?? "").toLowerCase().slice(0, 80);
  if (throttled(`race-day-reflection:${who}:${name}`)) {
    return NextResponse.json({ error: "Wait a few seconds and press Turn in again." }, { status: 429 });
  }
  const checked = checkReflection(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const saved = await submitReflection(checked.value);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 503 });
  return NextResponse.json({ ok: true, words: checked.value.words });
}

export async function PATCH(req: NextRequest) {
  if (!(await isTeacher())) return NextResponse.json({ error: "Teacher sign in needed." }, { status: 401 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = typeof b.id === "string" && UUID.test(b.id) ? b.id : null;
  if (!id) return NextResponse.json({ error: "Which reflection?" }, { status: 400 });

  const patch: { score?: number | null; teacherNote?: string; reviewed?: boolean } = {};
  if (b.score !== undefined) {
    if (b.score === null || b.score === "") patch.score = null;
    else if (typeof b.score === "number" && Number.isInteger(b.score) && b.score >= 0 && b.score <= MAX_SCORE) patch.score = b.score;
    else return NextResponse.json({ error: `A score is a whole number from 0 to ${MAX_SCORE}.` }, { status: 400 });
  }
  if (b.teacherNote !== undefined) {
    if (typeof b.teacherNote !== "string") return NextResponse.json({ error: "Invalid note." }, { status: 400 });
    patch.teacherNote = b.teacherNote.trim().slice(0, 4000);
  }
  if (typeof b.reviewed === "boolean") patch.reviewed = b.reviewed;

  const saved = await reviewReflection(id, patch);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 503 });
  return NextResponse.json({ ok: true });
}
