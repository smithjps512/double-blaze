import { NextResponse, type NextRequest } from "next/server";
import { checkSecret, cookieName, isConfigured, MAX_AGE_S, type Role } from "@/lib/race-day/auth";
import { throttled } from "@/lib/plant-id-throttle";

/**
 * POST   /api/race-day/sign-in   { role: "class" | "teacher", password }
 * DELETE /api/race-day/sign-in   signs this browser out of both
 *
 * Sets an httpOnly cookie that the Race Day pages check on every request.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const role: Role | null = body.role === "class" || body.role === "teacher" ? body.role : null;
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!role) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const who = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (throttled(`race-day-sign-in:${who}`)) {
    return NextResponse.json({ error: "Too many tries. Wait a few seconds." }, { status: 429 });
  }
  if (!isConfigured(role)) {
    return NextResponse.json({ error: "Race Day is not set up on this server yet. Ask your teacher." }, { status: 503 });
  }

  const value = checkSecret(role, password);
  if (!value) {
    return NextResponse.json({ error: role === "teacher" ? "That teacher code is not right." : "That password is not right." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName(role), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  for (const role of ["class", "teacher"] as const) res.cookies.delete(cookieName(role));
  return res;
}
