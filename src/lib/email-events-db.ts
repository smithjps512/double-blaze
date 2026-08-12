import "server-only";
import { getSupabaseServiceClient } from "./supabase";
import { recordNotificationFailure } from "./trailhead-db";
import type { ParsedEmailEvent } from "./resend-webhook";

/**
 * Storage for Resend delivery events (migration 0010).
 *
 * All writes use the service-role client, since the webhook is unauthenticated
 * by design and its caller is verified by signature rather than by session.
 */

function getClient() {
  const db = getSupabaseServiceClient();
  if (!db) throw new Error("Supabase is not configured.");
  return db;
}

/**
 * Find the Trailhead site a failed message belongs to, by matching the
 * recipient against the intake contact.
 *
 * Attribution by recipient rather than by a tag carried on the message: the
 * send helpers do not thread a site id today, and recipient matching already
 * covers the case that costs a customer, which is a customer-facing email that
 * silently did not arrive. Internal-inbox failures have no site to attribute to
 * and are caught by the global failure list instead.
 */
async function findSiteIdForRecipient(recipient: string): Promise<string | null> {
  try {
    const db = getClient();
    const { data } = await db
      .from("trailhead_intakes")
      .select("id")
      .ilike("contact_email", recipient)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.id) return null;

    const { data: site } = await db
      .from("trailhead_sites")
      .select("id")
      .eq("intake_id", data.id)
      .maybeSingle();
    return (site?.id as string | undefined) ?? null;
  } catch (err) {
    console.error("[email-events] attribution lookup failed:", err);
    return null;
  }
}

export interface RecordResult {
  stored: boolean;
  duplicate: boolean;
  siteId: string | null;
}

/**
 * Store one delivery event and, when it is a failure against a known Trailhead
 * customer, mirror it onto that site's notification_failures so it surfaces
 * everywhere staff already look.
 *
 * Idempotent on svix_id: webhook delivery is at-least-once, and a retry must
 * not record the same bounce twice or append a duplicate failure to a site.
 */
export async function recordEmailEvent(
  event: ParsedEmailEvent,
  svixId: string | null,
  payload: unknown,
): Promise<RecordResult> {
  const db = getClient();

  const siteId =
    event.isFailure && event.recipient
      ? await findSiteIdForRecipient(event.recipient)
      : null;

  const { error } = await db.from("email_events").insert({
    resend_email_id: event.resendEmailId,
    svix_id: svixId,
    event_type: event.eventType,
    recipient: event.recipient,
    subject: event.subject,
    is_failure: event.isFailure,
    reason: event.reason,
    payload: payload ?? {},
    trailhead_site_id: siteId,
    occurred_at: event.occurredAt,
  });

  if (error) {
    // 23505 is unique_violation: the same svix_id already landed, so this is a
    // retry of an event we have. Report it as handled so Resend stops retrying.
    if (error.code === "23505") {
      return { stored: false, duplicate: true, siteId };
    }
    throw new Error(error.message);
  }

  // Mirror onto the site only after a successful insert, so the idempotency
  // guard above also protects against a duplicated failure entry.
  if (siteId && event.isFailure) {
    await recordNotificationFailure(
      siteId,
      `resend-${event.eventType.replace(/^email\./, "")}`,
      event.reason ?? event.eventType,
    );
  }

  return { stored: true, duplicate: false, siteId };
}

export interface EmailFailure {
  id: string;
  event_type: string;
  recipient: string | null;
  subject: string | null;
  reason: string | null;
  trailhead_site_id: string | null;
  created_at: string;
}

/** Recent delivery failures, newest first. For the staff-facing view. */
export async function listRecentFailures(limit = 50): Promise<EmailFailure[]> {
  const db = getClient();
  const { data, error } = await db
    .from("email_events")
    .select("id, event_type, recipient, subject, reason, trailhead_site_id, created_at")
    .eq("is_failure", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as EmailFailure[];
}
