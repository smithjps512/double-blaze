import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "./supabase";
import { getRegionLeadUserId } from "./regions-db";
import { sendTrailRunBriefReady, sendTrailRunLaunch, sendTrailRunCheckin } from "./email";
import { getStripe } from "./stripe";
import { getOfferingByKey } from "./catalog-db";
import { createTrailRunSubscription, cancelTrailRunSubscription } from "./stripe-trail-run";
import {
  computeWindowEnd,
  computeRetentionExpiry,
  normalizeTrailTier,
  daysRemaining,
  checkinDayFor,
} from "./trail-run";
import { SITE_URL } from "./site";
import type { AnthropicMessage } from "./anthropic";
import { assembleBrief, renderBriefSummary, type BriefContent } from "./spark";
import {
  buildTaskSeeds,
  backstopFeasibilityFlags,
  mergeFeasibilityFlags,
  intakeComplete,
} from "./trail-run-intake";

/**
 * Trail Run build plumbing (Sprint T2). All operations run server-side with the
 * service-role client. The build is a `projects` row linked to the Trail Run
 * engagement (migration 0006). Spark intake transcript and captured fields live
 * on that project's intake_sessions row; the assembled brief and the Blue Trail
 * checklist hang off the same project.
 */

export interface AppUserOrg {
  appUserId: string;
  organizationId: string | null;
  role: string | null;
}

/** Resolves the signed-in Clerk user to their app user id, org, and role. */
export async function getAppUserOrg(
  db: SupabaseClient,
  clerkUserId: string,
): Promise<AppUserOrg | null> {
  const { data } = await db
    .from("users")
    .select("id, organization_id, role")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (!data) return null;
  return {
    appUserId: data.id as string,
    organizationId: (data.organization_id as string | null) ?? null,
    role: (data.role as string | null) ?? null,
  };
}

interface Engagement {
  id: string;
  status: string;
}

async function findEngagement(
  db: SupabaseClient,
  organizationId: string,
): Promise<Engagement | null> {
  const { data } = await db
    .from("trail_run_engagements")
    .select("id, status")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Engagement | null) ?? null;
}

export interface BuildContext {
  engagementId: string;
  engagementStatus: string;
  projectId: string;
}

/**
 * Ensures the build project exists for the org's Trail Run engagement, creating
 * it (and assigning the region lead) on first use. Returns null when the org
 * has no engagement, so callers can hide Spark for non-Trail-Run clients.
 */
export async function ensureBuild(
  db: SupabaseClient,
  organizationId: string,
): Promise<BuildContext | null> {
  const engagement = await findEngagement(db, organizationId);
  if (!engagement) return null;

  const { data: existing } = await db
    .from("projects")
    .select("id")
    .eq("trail_run_engagement_id", engagement.id)
    .maybeSingle();
  if (existing) {
    return {
      engagementId: engagement.id,
      engagementStatus: engagement.status,
      projectId: existing.id as string,
    };
  }

  // Assign the region's lead, if any. A null lead leaves it unassigned (central
  // inbox), consistent with the T1 checkout webhook.
  const { data: org } = await db
    .from("organizations")
    .select("region")
    .eq("id", organizationId)
    .maybeSingle();
  const regionSlug = (org?.region as string | null) ?? null;
  const leadId = regionSlug ? await getRegionLeadUserId(db, regionSlug) : null;

  const { data: created, error } = await db
    .from("projects")
    .insert({
      organization_id: organizationId,
      trail_run_engagement_id: engagement.id,
      project_lead_id: leadId,
      status: "new",
    })
    .select("id")
    .single();
  if (error || !created) {
    throw new Error(`trail run project create failed: ${error?.message}`);
  }
  return {
    engagementId: engagement.id,
    engagementStatus: engagement.status,
    projectId: created.id as string,
  };
}

export interface PortalWindow {
  selectedTier: string;
  daysRemaining: number;
  windowEndIso: string | null;
  liveUrl: string | null;
  summary: string | null;
}

export interface PortalState {
  /**
   * intake: show Spark. building: brief routed, build underway. window: live,
   * inside the 30-day window (the customer portal). active: converted or
   * reactivated (T4 fleshes this out). canceled: stopped. none: not a Trail
   * Run client.
   */
  phase: "intake" | "building" | "window" | "active" | "canceled" | "none";
  transcript: AnthropicMessage[];
  ready: boolean;
  window?: PortalWindow;
}

/**
 * Read-only portal state for a client's org. Does not create any rows (viewing
 * the portal must not mutate); the build project and intake session are created
 * lazily on the first Spark turn. For the live window it loads the client-safe
 * rendered summary and the live URL, never the internal brief row.
 */
export async function loadPortalState(
  db: SupabaseClient,
  organizationId: string,
  now: Date = new Date(),
): Promise<PortalState> {
  const { data: engagement } = await db
    .from("trail_run_engagements")
    .select("id, status, selected_tier, window_end_date")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!engagement) return { phase: "none", transcript: [], ready: false };

  const status = engagement.status as string;

  if (status === "canceled") return { phase: "canceled", transcript: [], ready: false };
  if (["converting", "converted", "reactivated"].includes(status)) {
    return { phase: "active", transcript: [], ready: false };
  }

  if (status === "active_window" || status === "launched") {
    const { data: project } = await db
      .from("projects")
      .select("id, live_url")
      .eq("trail_run_engagement_id", engagement.id)
      .maybeSingle();
    let summary: string | null = null;
    if (project) {
      const { data: brief } = await db
        .from("project_briefs")
        .select("rendered_summary")
        .eq("project_id", project.id)
        .maybeSingle();
      summary = (brief?.rendered_summary as string | null) ?? null;
    }
    const windowEndIso = (engagement.window_end_date as string | null) ?? null;
    return {
      phase: "window",
      transcript: [],
      ready: false,
      window: {
        selectedTier: normalizeTrailTier(engagement.selected_tier as string | null),
        daysRemaining: windowEndIso ? daysRemaining(new Date(windowEndIso), now) : 0,
        windowEndIso,
        liveUrl: (project?.live_url as string | null) ?? null,
        summary,
      },
    };
  }

  if (status === "building") return { phase: "building", transcript: [], ready: false };

  // signup: show Spark, resuming from any saved transcript.
  const { data: project } = await db
    .from("projects")
    .select("id")
    .eq("trail_run_engagement_id", engagement.id)
    .maybeSingle();
  if (!project) return { phase: "intake", transcript: [], ready: false };
  const intake = await loadIntake(db, project.id as string);
  return { phase: "intake", transcript: intake.transcript, ready: intakeComplete(intake.captured) };
}

export type CancelResult =
  | { ok: true; alreadyCanceled: boolean }
  | { ok: false; reason: "not_found" | "not_cancelable" | "error" };

/**
 * Cancels a Trail Run during the window (portal action). Cancels the trialing
 * Stripe subscription with no charge, then sets the engagement to canceled with
 * cancellation_date now and retention_expires_at now plus 90. Take-offline, the
 * purge, and reactivation are Sprint T4; this only cancels and stamps the
 * timestamps. Idempotent: a second cancel is a success no-op.
 */
export async function cancelTrailRun(organizationId: string): Promise<CancelResult> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, reason: "error" };

  const { data: engagement } = await db
    .from("trail_run_engagements")
    .select("id, status, subscription_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!engagement) return { ok: false, reason: "not_found" };
  if (engagement.status === "canceled") return { ok: true, alreadyCanceled: true };
  if (!["active_window", "launched"].includes(engagement.status as string)) {
    return { ok: false, reason: "not_cancelable" };
  }

  // Cancel the Stripe subscription (no charge during trial). Tolerate an
  // already-canceled subscription on Stripe's side.
  if (engagement.subscription_id) {
    const { data: sub } = await db
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("id", engagement.subscription_id)
      .maybeSingle();
    const stripe = getStripe();
    const stripeSubId = sub?.stripe_subscription_id as string | null;
    if (stripe && stripeSubId) {
      try {
        await cancelTrailRunSubscription(stripe, stripeSubId);
      } catch (err) {
        console.error(
          "[trail-run] cancel subscription failed:",
          err instanceof Error ? err.message : "unknown error",
        );
      }
    }
    await db.from("subscriptions").update({ status: "canceled" }).eq("id", engagement.subscription_id);
  }

  const nowDate = new Date();
  const { error } = await db
    .from("trail_run_engagements")
    .update({
      status: "canceled",
      cancellation_date: nowDate.toISOString(),
      retention_expires_at: computeRetentionExpiry(nowDate).toISOString(),
    })
    .eq("id", engagement.id);
  if (error) return { ok: false, reason: "error" };

  await db.from("lifecycle_events").insert({
    engagement_id: engagement.id,
    type: "canceled",
    payload: { source: "portal" },
  });

  return { ok: true, alreadyCanceled: false };
}

export interface IntakeState {
  transcript: AnthropicMessage[];
  captured: Record<string, string>;
  status: "in_progress" | "complete";
}

/** Loads the project's intake session, returning empty state if none yet. */
export async function loadIntake(
  db: SupabaseClient,
  projectId: string,
): Promise<IntakeState> {
  const { data } = await db
    .from("intake_sessions")
    .select("transcript, captured_fields, status")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) return { transcript: [], captured: {}, status: "in_progress" };
  return {
    transcript: Array.isArray(data.transcript) ? (data.transcript as AnthropicMessage[]) : [],
    captured:
      data.captured_fields && typeof data.captured_fields === "object"
        ? (data.captured_fields as Record<string, string>)
        : {},
    status: (data.status as "in_progress" | "complete") ?? "in_progress",
  };
}

/** Upserts the intake session for a project (idempotent on project_id). */
export async function saveIntake(
  db: SupabaseClient,
  projectId: string,
  state: IntakeState,
): Promise<void> {
  const { error } = await db.from("intake_sessions").upsert(
    {
      project_id: projectId,
      program_type: "trail_run",
      transcript: state.transcript,
      captured_fields: state.captured,
      status: state.status,
    },
    { onConflict: "project_id" },
  );
  if (error) throw new Error(`intake save failed: ${error.message}`);
}

export type GenerateBriefResult =
  | { ok: true; created: boolean; flagCount: number }
  | { ok: false; reason: "no_build" | "disabled" | "parse_failed" | "error" };

/**
 * Generates the Trail Run Build Brief for the org's build: assembles the brief
 * (structured output with fallback), merges model and backstop feasibility
 * flags, persists the brief and the seeded Blue Trail checklist, marks intake
 * complete, flips the engagement to `building`, and notifies the lead and
 * admins. Idempotent: a second call returns the existing brief without
 * re-seeding or re-notifying.
 */
export async function generateTrailRunBrief(
  organizationId: string,
): Promise<GenerateBriefResult> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, reason: "error" };

  const build = await ensureBuild(db, organizationId);
  if (!build) return { ok: false, reason: "no_build" };

  // Idempotency: never create a duplicate brief.
  const { data: existingBrief } = await db
    .from("project_briefs")
    .select("id, feasibility_flags")
    .eq("project_id", build.projectId)
    .maybeSingle();
  if (existingBrief) {
    const flags = Array.isArray(existingBrief.feasibility_flags)
      ? existingBrief.feasibility_flags
      : [];
    return { ok: true, created: false, flagCount: flags.length };
  }

  const intake = await loadIntake(db, build.projectId);
  const brief = await assembleBrief({ captured: intake.captured });
  if (!brief) return { ok: false, reason: "parse_failed" };

  const flags = mergeFeasibilityFlags(
    brief.feasibility_flags,
    backstopFeasibilityFlags(intake.captured),
  );
  const content: BriefContent = { ...brief, feasibility_flags: flags };

  const { error: insertErr } = await db.from("project_briefs").insert({
    project_id: build.projectId,
    content,
    rendered_summary: renderBriefSummary(content),
    feasibility_flags: flags,
    raw_intake: intake.captured,
    // For Trail Run there is no client acceptance loop; this state means the
    // brief is assembled and routed to the build team (see migration 0006).
    status: "submitted_for_acceptance",
  });
  if (insertErr) {
    // Unique index on project_id: a concurrent caller won the race.
    if ((insertErr as { code?: string }).code === "23505") {
      return { ok: true, created: false, flagCount: flags.length };
    }
    console.error("[trail-run] brief insert failed:", insertErr.message);
    return { ok: false, reason: "error" };
  }

  // Seed the Blue Trail checklist if not already present.
  const { count: taskCount } = await db
    .from("build_tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", build.projectId);
  if (!taskCount) {
    const seeds = buildTaskSeeds({
      priorityWorkflow: intake.captured.priority_workflow ?? content.priority_workflow_summary,
      targetKpis: intake.captured.target_kpis ?? content.target_kpis.join(", "),
    });
    await db.from("build_tasks").insert(
      seeds.map((s) => ({ project_id: build.projectId, ...s })),
    );
  }

  // Mark intake complete, move project to brief_ready, flip engagement.
  await Promise.all([
    db.from("intake_sessions").update({ status: "complete" }).eq("project_id", build.projectId),
    db.from("projects").update({ status: "brief_ready" }).eq("id", build.projectId),
    db.from("trail_run_engagements").update({ status: "building" }).eq("id", build.engagementId),
  ]);

  await db.from("events").insert({
    project_id: build.projectId,
    type: "trail_run_brief_ready",
    payload: { flag_count: flags.length },
  });

  await notifyBuildTeam(db, organizationId, build.projectId, flags.length);

  return { ok: true, created: true, flagCount: flags.length };
}

export type LaunchResult =
  | { ok: true; alreadyLaunched: boolean }
  | {
      ok: false;
      reason:
        | "not_found"
        | "not_building"
        | "missing_payment_method"
        | "missing_live_url"
        | "price_unavailable"
        | "stripe_error"
        | "disabled"
        | "error";
    };

/**
 * Launch event (Sprint T3). Marks a build live for an engagement in `building`
 * status: creates the Stripe subscription on the saved payment method with a
 * trial through launch + 30, records the live URL and window dates, links the
 * subscription, flips the engagement to `active_window`, and fires the launch
 * email with the client-safe summary.
 *
 * Invariants:
 * - A missing live URL blocks launch (validation error), and live_url is set
 *   on the project before the engagement flips, so an engagement can never be
 *   active_window without a live URL.
 * - Stripe creation uses an idempotency key on the engagement id, and the
 *   engagement flip is the last write, so a retried launch never creates a
 *   second subscription or a half-launched state.
 */
export async function launchTrailRun(args: {
  projectId: string;
  liveUrl: string;
}): Promise<LaunchResult> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, reason: "error" };
  const stripe = getStripe();
  if (!stripe) return { ok: false, reason: "disabled" };

  const liveUrl = args.liveUrl.trim();
  if (!liveUrl) return { ok: false, reason: "missing_live_url" };

  const { data: project } = await db
    .from("projects")
    .select("id, organization_id, trail_run_engagement_id")
    .eq("id", args.projectId)
    .maybeSingle();
  if (!project?.trail_run_engagement_id) return { ok: false, reason: "not_found" };

  const { data: engagement } = await db
    .from("trail_run_engagements")
    .select("id, status, stripe_customer_id, stripe_payment_method_id, selected_tier, subscription_id")
    .eq("id", project.trail_run_engagement_id)
    .maybeSingle();
  if (!engagement) return { ok: false, reason: "not_found" };

  // Idempotency: already launched is a success no-op; other non-building states
  // cannot launch.
  if (engagement.subscription_id || ["launched", "active_window", "converting", "converted"].includes(engagement.status)) {
    return { ok: true, alreadyLaunched: true };
  }
  if (engagement.status !== "building") return { ok: false, reason: "not_building" };

  if (!engagement.stripe_customer_id || !engagement.stripe_payment_method_id) {
    return { ok: false, reason: "missing_payment_method" };
  }

  const tier = normalizeTrailTier(engagement.selected_tier as string | null);
  const offering = await getOfferingByKey(tier);
  if (!offering?.stripe_price_id) return { ok: false, reason: "price_unavailable" };

  const launchDate = new Date();
  const windowEnd = computeWindowEnd(launchDate);
  const trialEndUnix = Math.floor(windowEnd.getTime() / 1000);

  let stripeSubscriptionId: string;
  try {
    const sub = await createTrailRunSubscription(stripe, {
      customerId: engagement.stripe_customer_id as string,
      paymentMethodId: engagement.stripe_payment_method_id as string,
      priceId: offering.stripe_price_id,
      trialEndUnix,
      engagementId: engagement.id as string,
    });
    stripeSubscriptionId = sub.id;
  } catch (err) {
    console.error(
      "[trail-run] launch subscription create failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return { ok: false, reason: "stripe_error" };
  }

  // Local subscription row. term_start / min_term_end begin at the T4 day-31
  // conversion, so they stay null here; status is trialing.
  const { data: localSub, error: subErr } = await db
    .from("subscriptions")
    .insert({
      organization_id: project.organization_id,
      plan: tier,
      catalog_key: tier,
      status: "trialing",
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: engagement.stripe_customer_id,
      stripe_price_id: offering.stripe_price_id,
    })
    .select("id")
    .single();
  if (subErr || !localSub) {
    console.error("[trail-run] launch local subscription insert failed:", subErr?.message);
    return { ok: false, reason: "error" };
  }

  // Set live_url BEFORE flipping the engagement, so active_window implies a URL.
  await db
    .from("projects")
    .update({ live_url: liveUrl, status: "in_delivery" })
    .eq("id", project.id);

  // Engagement flip is the last write: status, dates, and the subscription link
  // together. If anything above failed we never reach this, so no half-launch.
  const { error: engErr } = await db
    .from("trail_run_engagements")
    .update({
      status: "active_window",
      launch_date: launchDate.toISOString(),
      window_end_date: windowEnd.toISOString(),
      subscription_id: localSub.id,
    })
    .eq("id", engagement.id);
  if (engErr) {
    console.error("[trail-run] launch engagement update failed:", engErr.message);
    return { ok: false, reason: "error" };
  }

  await db.from("lifecycle_events").insert({
    engagement_id: engagement.id,
    type: "launched",
    payload: {
      live_url: liveUrl,
      stripe_subscription_id: stripeSubscriptionId,
      window_end_date: windowEnd.toISOString(),
    },
  });

  // Launch email with the client-safe rendered summary only.
  const [{ data: brief }, { data: org }] = await Promise.all([
    db.from("project_briefs").select("rendered_summary").eq("project_id", project.id).maybeSingle(),
    db.from("organizations").select("primary_contact_email").eq("id", project.organization_id).maybeSingle(),
  ]);
  const email = (org?.primary_contact_email as string | null) ?? null;
  if (email) {
    await sendTrailRunLaunch(email, {
      liveUrl,
      summary: (brief?.rendered_summary as string | null) ?? "Your Blue Trail solution is live.",
      portalUrl: `${SITE_URL}/portal`,
    });
  }

  return { ok: true, alreadyLaunched: false };
}

export interface CheckinRunResult {
  claimed: number;
  sent: number;
  failed: number;
}

/**
 * Daily check-in run (Sprint T3). At-least-once safe: it claims a ledger slot
 * per due check-in, then sends, then marks the slot sent or failed. A later run
 * retries pending or failed slots whose window has not passed, so a transient
 * email failure does not silently skip a check-in. The unique index on
 * (engagement_id, checkin_day) guarantees no double-send even on overlap or a
 * manual re-trigger.
 *
 * `now` is injectable for testing; production passes the request time.
 */
export async function runTrailRunCheckins(now: Date): Promise<CheckinRunResult> {
  const db = getSupabaseServiceClient();
  if (!db) return { claimed: 0, sent: 0, failed: 0 };

  // Pass A: claim a ledger slot for every engagement with a due check-in today.
  const { data: active } = await db
    .from("trail_run_engagements")
    .select("id, window_end_date")
    .eq("status", "active_window");

  let claimed = 0;
  for (const eng of active ?? []) {
    if (!eng.window_end_date) continue;
    const day = checkinDayFor(daysRemaining(new Date(eng.window_end_date as string), now));
    if (!day) continue;
    // Claim: insert pending, do nothing if the slot already exists.
    const { data: inserted } = await db
      .from("trail_run_checkins")
      .upsert(
        { engagement_id: eng.id, checkin_day: day, status: "pending" },
        { onConflict: "engagement_id,checkin_day", ignoreDuplicates: true },
      )
      .select("id");
    if (inserted && inserted.length > 0) claimed += 1;
  }

  // Pass B: send every unsent slot whose window is still open. This covers
  // today's fresh claims plus retries of prior pending/failed slots.
  const { data: pending } = await db
    .from("trail_run_checkins")
    .select(
      "id, engagement_id, checkin_day, attempts, trail_run_engagements!inner(status, window_end_date, organization_id)",
    )
    .in("status", ["pending", "failed"]);

  let sent = 0;
  let failed = 0;
  // Cache per-engagement recipient + live URL to avoid duplicate lookups.
  const ctxCache = new Map<string, { email: string | null; liveUrl: string | null }>();

  for (const row of pending ?? []) {
    const eng = (row as unknown as {
      trail_run_engagements: { status: string; window_end_date: string | null; organization_id: string };
    }).trail_run_engagements;
    if (!eng || eng.status !== "active_window") continue;
    if (!eng.window_end_date || new Date(eng.window_end_date) <= now) continue; // window passed

    let ctx = ctxCache.get(eng.organization_id);
    if (!ctx) {
      const [{ data: org }, { data: project }] = await Promise.all([
        db.from("organizations").select("primary_contact_email").eq("id", eng.organization_id).maybeSingle(),
        db.from("projects").select("live_url").eq("trail_run_engagement_id", row.engagement_id).maybeSingle(),
      ]);
      ctx = {
        email: (org?.primary_contact_email as string | null) ?? null,
        liveUrl: (project?.live_url as string | null) ?? null,
      };
      ctxCache.set(eng.organization_id, ctx);
    }

    const attempts = ((row.attempts as number) ?? 0) + 1;
    if (!ctx.email) {
      await db
        .from("trail_run_checkins")
        .update({ status: "failed", attempts, last_error: "no recipient email" })
        .eq("id", row.id);
      failed += 1;
      continue;
    }

    const ok = await sendTrailRunCheckin(ctx.email, {
      day: row.checkin_day as number,
      liveUrl: ctx.liveUrl,
      portalUrl: `${SITE_URL}/portal`,
    });

    if (ok) {
      await db
        .from("trail_run_checkins")
        .update({ status: "sent", attempts, sent_at: now.toISOString(), last_error: null })
        .eq("id", row.id);
      // Append-only audit + client dashboard notification, once per slot.
      await db.from("lifecycle_events").insert({
        engagement_id: row.engagement_id,
        type: "checkin_sent",
        payload: { checkin_day: row.checkin_day },
      });
      const { data: clientUsers } = await db
        .from("users")
        .select("id")
        .eq("organization_id", eng.organization_id);
      if (clientUsers && clientUsers.length > 0) {
        await db.from("notifications").insert(
          clientUsers.map((u) => ({
            user_id: u.id as string,
            type: "trail_run_checkin",
            link: "/portal",
          })),
        );
      }
      sent += 1;
    } else {
      await db
        .from("trail_run_checkins")
        .update({ status: "failed", attempts, last_error: "send failed or email not configured" })
        .eq("id", row.id);
      failed += 1;
    }
  }

  return { claimed, sent, failed };
}

/** Dashboard + email notification to the assigned lead and all admins. */
async function notifyBuildTeam(
  db: SupabaseClient,
  organizationId: string,
  projectId: string,
  flagCount: number,
): Promise<void> {
  const workspacePath = `/execution/build/${projectId}`;

  const { data: org } = await db
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();
  const orgName = (org?.name as string | null) ?? null;

  const { data: project } = await db
    .from("projects")
    .select("project_lead_id")
    .eq("id", projectId)
    .maybeSingle();
  const leadId = (project?.project_lead_id as string | null) ?? null;

  // Recipients: the assigned lead (if any) plus all admins, de-duplicated.
  const recipientIds = new Set<string>();
  if (leadId) recipientIds.add(leadId);
  const { data: admins } = await db.from("users").select("id").eq("role", "admin");
  for (const a of admins ?? []) recipientIds.add(a.id as string);

  if (recipientIds.size > 0) {
    await db.from("notifications").insert(
      [...recipientIds].map((userId) => ({
        user_id: userId,
        type: "trail_run_brief_ready",
        link: workspacePath,
      })),
    );

    const { data: emailRows } = await db
      .from("users")
      .select("email")
      .in("id", [...recipientIds]);
    const emails = (emailRows ?? [])
      .map((r) => r.email as string | null)
      .filter((e): e is string => !!e);
    for (const email of emails) {
      await sendTrailRunBriefReady(email, {
        organizationName: orgName,
        workspacePath,
        flagCount,
      });
    }
  }
}
