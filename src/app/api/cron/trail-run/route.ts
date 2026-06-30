import { NextResponse } from "next/server";
import { runTrailRunCheckins } from "@/lib/trail-run-build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily Trail Run scheduler (Sprint T3), invoked by Vercel Cron.
 *
 * Vercel Cron only triggers the request; it does not authenticate it. This
 * route enforces the CRON_SECRET bearer itself, so the endpoint is not publicly
 * hittable: without the correct secret it returns 401, otherwise anyone could
 * fire check-in emails. Treat the trigger as at-least-once: the run is
 * idempotent (the check-in ledger guards against double-sends), so a retry, an
 * overlap, or a manual re-trigger is safe.
 *
 * Cron schedule lives in vercel.json. It runs check-ins only; the 90-day purge
 * is Sprint T4.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed: with no secret configured the endpoint stays locked rather
    // than open.
    return NextResponse.json({ error: "Scheduler not configured." }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runTrailRunCheckins(new Date());
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(
      "[trail-run] scheduler run failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return NextResponse.json({ error: "Scheduler run failed." }, { status: 500 });
  }
}
