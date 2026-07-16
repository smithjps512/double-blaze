import { NextResponse, type NextRequest } from "next/server";
import { addToWaitlist } from "@/lib/trailhead-db";

/**
 * POST /api/trailhead/waitlist
 * Add someone to the next month's waitlist when capacity is full.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot
  if (body.website && String(body.website).trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = String(body.email ?? "").trim();
  const name = body.name ? String(body.name).trim() : undefined;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }

  try {
    const ok = await addToWaitlist(email, name);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: true }); // fail open in dev
  }
}
