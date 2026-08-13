import { NextResponse } from "next/server";
import {
  readSignatureHeaders,
  verifySignature,
  parseEmailEvent,
} from "@/lib/resend-webhook";
import { recordEmailEvent } from "@/lib/email-events-db";

/**
 * POST /api/webhooks/resend
 *
 * Receives Resend delivery events so a dropped email stops being invisible.
 * The app has always known whether Resend *accepted* a message; it never knew
 * whether anyone *received* one. Bounces happen after the API call returns
 * success, so recordNotificationFailure never fired for them and every bounced
 * send was recorded as a success.
 *
 * Configure in Resend under Webhooks, pointing at this path, subscribed to at
 * least email.bounced, email.complained, and email.delivery_delayed. Put the
 * signing secret in RESEND_WEBHOOK_SECRET.
 *
 * Status codes matter here: Resend retries on non-2xx. A rejected signature is
 * a permanent condition, so it answers 401 and stops. A storage failure is
 * transient, so it answers 500 and lets the retry do its job.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[resend-webhook] rejected: RESEND_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  // The signature covers the exact bytes received. Parsing and re-serializing
  // would change key order or whitespace and invalidate it, so read text first
  // and only then parse.
  const raw = await req.text();
  const { id, timestamp, signature } = readSignatureHeaders(req.headers);

  const verified = verifySignature({
    payload: raw,
    id,
    timestamp,
    signature,
    secret,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  if (!verified.ok) {
    console.error(`[resend-webhook] signature rejected: ${verified.reason}`);
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    // Signed but unparseable. Retrying will not help, so accept and drop it.
    console.error("[resend-webhook] signed payload was not valid JSON");
    return NextResponse.json({ ok: true, ignored: "unparseable" });
  }

  const event = parseEmailEvent(body);
  if (!event) {
    console.warn("[resend-webhook] event had no recognizable type; ignoring");
    return NextResponse.json({ ok: true, ignored: "no event type" });
  }

  try {
    const result = await recordEmailEvent(event, id, body);

    if (event.isFailure && !result.duplicate) {
      // Loud on purpose. This line is the one that would have surfaced the
      // yourteam+intake@ bounce weeks before anyone opened the dashboard.
      console.error(
        `[resend-webhook] DELIVERY FAILURE ${event.eventType} to=${event.recipient ?? "unknown"} ` +
          `reason=${event.reason ?? "unspecified"} site=${result.siteId ?? "unattributed"}`,
      );
    }

    return NextResponse.json({ ok: true, duplicate: result.duplicate });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown error";
    console.error(`[resend-webhook] could not record ${event.eventType}: ${reason}`);
    // Transient. 500 asks Resend to retry, and the svix_id unique index makes
    // that retry safe.
    return NextResponse.json({ error: "Could not record event." }, { status: 500 });
  }
}
