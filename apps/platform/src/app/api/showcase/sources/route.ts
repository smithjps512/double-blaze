import { NextResponse, type NextRequest } from "next/server";
import { isSignedIn } from "@/lib/showcase-auth";
import { addSource, removeSource } from "@/lib/showcase-db";

/**
 * POST/DELETE /api/showcase/sources
 *
 * A citation belongs to a car and has three parts: what it was, where it is,
 * and which bit of the page it backs up. The third one is the part students
 * skip and the part that makes a reference list useful to anybody else.
 */
export const maxDuration = 30;

const MAX = 300;

/**
 * A link, in the sense a reader could actually open.
 *
 * Deliberately not a general URL check. It has to be http or https, because a
 * citation somebody cannot click is not a citation, and it has to have a dot in
 * the host, because "https://wikipedia" is the shape of a guess.
 */
function looksLikeALink(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes(".") && parsed.hostname.length > 3;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const team = typeof body.team === "string" ? body.team : "";
  const carId = typeof body.carId === "string" ? body.carId : "";
  if (!team || !carId) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!(await isSignedIn(team))) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const title = String(body.title ?? "").trim().slice(0, MAX);
  const url = String(body.url ?? "").trim().slice(0, MAX);
  const covers = String(body.covers ?? "").trim().slice(0, MAX);

  if (!title) {
    return NextResponse.json(
      { error: "What was it called? The name of the site, the book or the video." },
      { status: 200 },
    );
  }
  if (!looksLikeALink(url)) {
    return NextResponse.json(
      {
        error:
          "That is not a link anybody could open. Copy the address out of the top of the browser, the bit that starts with https://",
      },
      { status: 200 },
    );
  }
  if (!covers) {
    return NextResponse.json(
      {
        error:
          "Say which part of the page this backs up, like “engine and transmission”. A source that could be about anything is not much of a source.",
      },
      { status: 200 },
    );
  }

  const error = await addSource(team, carId, { title, url, covers });
  return error
    ? NextResponse.json({ error }, { status: 200 })
    : NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const team = typeof body.team === "string" ? body.team : "";
  const id = typeof body.id === "string" ? body.id : "";
  if (!team || !id) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!(await isSignedIn(team))) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const error = await removeSource(team, id);
  return error
    ? NextResponse.json({ error }, { status: 200 })
    : NextResponse.json({ ok: true });
}
