import { NextResponse, type NextRequest } from "next/server";
import { isTeacher } from "@/lib/race-day/auth";
import { addRun, addStudent, updateCar, updateRun, updateSession, updateStudent, type Saved } from "@/lib/race-day-db";
import { cleanText, parsePeriod, parseQuality, parseSeconds } from "@/lib/race-day/model";

/**
 * POST /api/race-day/teacher   { op, ... }
 *
 * Every change the teacher screen makes. Teacher code cookie required.
 *
 *   session   { id, period }                      set the class period
 *   car       { id, label?, confirmed? }          rename or confirm a car
 *   run       { id, carId?, gateS?, quality?, note?, rerun?, excluded? }
 *   add-run   { sessionId, carId | newCarLabel, clip, startS, finishS, quality, note, rerun }
 *   student   { id, firstName?, carNote?, carId? (null unlinks), showName? }
 *   add-student { firstName, carNote, carId? }
 */
export const dynamic = "force-dynamic";

const ID = /^[A-Za-z0-9_-]{1,40}$/;

function id(raw: unknown): string | null {
  return typeof raw === "string" && ID.test(raw) ? raw : null;
}

function bool(raw: unknown): boolean | undefined {
  return typeof raw === "boolean" ? raw : undefined;
}

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: NextRequest) {
  if (!(await isTeacher())) return NextResponse.json({ error: "Teacher sign in needed." }, { status: 401 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return bad("Invalid request.");
  }

  let saved: Saved;
  switch (b.op) {
    case "session": {
      const sid = id(b.id);
      const period = parsePeriod(b.period);
      if (!sid || period === undefined) return bad("Pick a period from 1 to 7, or none.");
      saved = await updateSession(sid, { period });
      break;
    }
    case "car": {
      const cid = id(b.id);
      if (!cid) return bad("Which car?");
      const patch: { label?: string; confirmed?: boolean } = { confirmed: bool(b.confirmed) };
      if (b.label !== undefined) {
        const label = cleanText(b.label, 60);
        if (!label) return bad("A car needs a name, like its color.");
        patch.label = label;
      }
      saved = await updateCar(cid, patch);
      break;
    }
    case "run": {
      const rid = id(b.id);
      if (!rid) return bad("Which run?");
      const patch: Parameters<typeof updateRun>[1] = {
        rerun: bool(b.rerun),
        excluded: bool(b.excluded),
      };
      if (b.carId !== undefined) {
        const cid = id(b.carId);
        if (!cid) return bad("Which car?");
        patch.carId = cid;
      }
      if (b.gateS !== undefined) {
        if (b.gateS === null || b.gateS === "") patch.gateS = null;
        else {
          const g = parseSeconds(b.gateS, 0.3, 10);
          if (g === null) return bad("A gate time is in seconds, between 0.300 and 10.000.");
          patch.gateS = g;
        }
      }
      if (b.quality !== undefined) {
        const q = parseQuality(b.quality);
        if (!q) return bad("Unknown quality flag.");
        patch.quality = q;
      }
      if (b.note !== undefined) patch.note = cleanText(b.note, 300);
      saved = await updateRun(rid, patch);
      break;
    }
    case "add-run": {
      const sessionId = id(b.sessionId);
      if (!sessionId) return bad("Pick a session.");
      const carId = b.carId ? id(b.carId) : null;
      const newCarLabel = cleanText(b.newCarLabel, 60);
      if (!carId && !newCarLabel) return bad("Pick a car or name a new one.");
      const startS = parseSeconds(b.startS, 0, 600);
      const finishS = parseSeconds(b.finishS, 0, 600);
      if (startS === null || finishS === null) return bad("Start and finish are clip times in seconds.");
      const elapsed = finishS - startS;
      if (elapsed < 0.3 || elapsed > 10) return bad("Finish should be 0.3 to 10 seconds after start.");
      const quality = parseQuality(b.quality ?? "ok");
      if (!quality) return bad("Unknown quality flag.");
      const clip = cleanText(b.clip, 40).replace(/\.mov$/i, "");
      if (!clip) return bad("Which clip is it in? For example IMG_7830.");
      saved = await addRun({
        sessionId,
        carId,
        newCarLabel,
        clip,
        startS,
        finishS,
        quality,
        note: cleanText(b.note, 300),
        rerun: b.rerun === true,
      });
      break;
    }
    case "student": {
      const sid = typeof b.id === "string" && /^[0-9a-f-]{36}$/.test(b.id) ? b.id : null;
      if (!sid) return bad("Which student?");
      const patch: Parameters<typeof updateStudent>[1] = { showName: bool(b.showName) };
      if (b.firstName !== undefined) {
        const name = cleanText(b.firstName, 40);
        if (!name) return bad("A first name, please.");
        patch.firstName = name;
      }
      if (b.carNote !== undefined) patch.carNote = cleanText(b.carNote, 200);
      if (b.carId !== undefined) {
        if (b.carId === null || b.carId === "") patch.carId = null;
        else {
          const cid = id(b.carId);
          if (!cid) return bad("Which car?");
          patch.carId = cid;
        }
      }
      saved = await updateStudent(sid, patch);
      break;
    }
    case "add-student": {
      const firstName = cleanText(b.firstName, 40);
      if (!firstName) return bad("A first name, please.");
      saved = await addStudent({ firstName, carNote: cleanText(b.carNote, 200), carId: b.carId ? id(b.carId) : null });
      break;
    }
    default:
      return bad("Unknown change.");
  }

  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 503 });
  return NextResponse.json({ ok: true });
}
