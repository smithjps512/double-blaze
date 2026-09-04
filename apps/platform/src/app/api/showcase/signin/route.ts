import { NextResponse, type NextRequest } from "next/server";
import { checkPasscode, cookieName, COOKIE_MAX_AGE, passcodeIsConfigured } from "@/lib/showcase-auth";

/**
 * POST /api/showcase/signin
 *
 * A shared passcode, not accounts. See `showcase-auth.ts` for why, and the
 * admin page says the same thing to the students in their own words: this site
 * cannot tell which of them added a car, and the reason it cannot is worth
 * understanding before they ever build something that has to.
 */
export async function POST(req: NextRequest) {
  if (!passcodeIsConfigured()) {
    return NextResponse.json(
      { error: "The passcode is not set up yet. Ask your teacher." },
      { status: 200 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const team = typeof body.team === "string" ? body.team : "";
  const attempt = typeof body.passcode === "string" ? body.passcode : "";
  if (!team || !attempt) {
    return NextResponse.json({ error: "Type the passcode first." }, { status: 400 });
  }

  const result = checkPasscode(team, attempt);
  if (!result.ok) {
    return NextResponse.json({ error: "That is not the passcode." }, { status: 200 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName(team), result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

/** Signing out is a real thing a site does, so it is a real thing here. */
export async function DELETE(req: NextRequest) {
  const team = new URL(req.url).searchParams.get("team") ?? "";
  const res = NextResponse.json({ ok: true });
  if (team) res.cookies.set(cookieName(team), "", { path: "/", maxAge: 0 });
  return res;
}
