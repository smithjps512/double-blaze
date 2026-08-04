import { NextResponse } from "next/server";
import { runStuckBuildSweep } from "@/lib/trailhead-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A single sweep may run one or more multi-page builds. Give it the same room
// the build routes get (Vercel Pro allows up to 300s); the sweep itself stops
// starting new builds before that so it always returns cleanly.
export const maxDuration = 300;

/**
 * Self-healing Trailhead build sweep, invoked by Vercel Cron.
 *
 * The auto-build after approval can silently stall (a truncated or interrupted
 * build), leaving a customer on a "building" screen with no preview. This sweep
 * finds those stalled sites and drives them the rest of the way: build, release
 * the preview, email the customer.
 *
 * Vercel Cron only triggers the request; it does not authenticate it. This
 * route enforces the CRON_SECRET bearer itself so the endpoint is not publicly
 * hittable. Treat the trigger as at-least-once: the sweep is idempotent (grace
 * windows keep it from racing an in-flight build, and it only ever advances a
 * stalled site forward), so a retry or overlap is safe.
 *
 * Cron schedule lives in vercel.json.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed: with no secret configured the endpoint stays locked.
    return NextResponse.json({ error: "Sweep not configured." }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runStuckBuildSweep(new Date());
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(
      "[trailhead] build sweep failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return NextResponse.json({ error: "Sweep run failed." }, { status: 500 });
  }
}
