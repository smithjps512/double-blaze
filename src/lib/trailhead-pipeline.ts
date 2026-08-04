import "server-only";
import {
  getIntakeById,
  getSiteByIntakeId,
  getSiteById,
  updateSiteStatus,
  storeBuiltContent,
  markPreviewSent,
  recordNotificationFailure,
  findStuckBuilds,
} from "./trailhead-db";
import { draftContent, buildSite, isAnthropicConfigured } from "./spark-trailhead";
import type { ContentDraft } from "./spark-trailhead";
import type { BoundaryViolation } from "./trailhead-boundary";
import { sendTrailheadPreview } from "./email";
import { SITE_URL } from "./site";

/**
 * Shared build-chain steps, so the same logic runs whether a step is triggered
 * automatically (intake, customer approval) or by staff. Keeping it here is what
 * lets the chain be automatic with a human reviewing, rather than a human
 * driving every step (brief section 3).
 */

export interface DraftResult {
  ok: boolean;
  error?: string;
  draft?: ContentDraft;
  /** The site record id, present whenever the site was found. */
  siteId?: string;
  /** The lifecycle token, for building the status URL in the review email. */
  token?: string;
  contactEmail?: string;
  contactName?: string;
  siteName?: string;
}

/**
 * Draft site content from an intake and store it for the customer's review.
 * Sets the site to awaiting_approval. Does not email: the caller owns
 * notification so it can record failures against the record.
 */
export async function generateDraft(intakeId: string): Promise<DraftResult> {
  if (!isAnthropicConfigured()) {
    return { ok: false, error: "Spark is not configured (no ANTHROPIC_API_KEY)." };
  }

  const intake = await getIntakeById(intakeId);
  if (!intake) return { ok: false, error: "Intake not found." };

  const site = await getSiteByIntakeId(intakeId);
  if (!site) return { ok: false, error: "Site record not found." };

  const draft = await draftContent(intake);
  if (!draft) return { ok: false, error: "Spark could not draft content." };

  const stored = await updateSiteStatus(site.id, "awaiting_approval", {
    approved_content: draft,
  });
  if (!stored) return { ok: false, error: "Could not store the draft." };

  return {
    ok: true,
    draft,
    siteId: site.id,
    token: site.preview_token,
    contactEmail: intake.contact_email,
    contactName: intake.contact_name,
    siteName: intake.site_name,
  };
}

export interface BuildResult {
  ok: boolean;
  error?: string;
  violations?: BoundaryViolation[];
}

/**
 * Build a site from its approved content. Requires the site to be in the
 * approved state. Leaves it at preview on success (built, awaiting the staff
 * review gate before the customer is shown anything). Reverts to approved on
 * failure so it can be retried.
 */
export async function runBuild(siteId: string): Promise<BuildResult> {
  const site = await getSiteById(siteId);
  if (!site) return { ok: false, error: "Site not found." };

  // Valid start states are "approved" (a fresh build) and "building" (a retry of
  // a build that was interrupted or failed partway). Accepting "building" is what
  // un-traps a stuck site: runBuild sets "building" before the long model call,
  // so if the function is killed mid-build the record is left at "building", and
  // a guard that only accepted "approved" would make it impossible to retry.
  if (site.status !== "approved" && site.status !== "building") {
    return { ok: false, error: "Content must be approved before building." };
  }

  const intake = await getIntakeById(site.intake_id);
  if (!intake) return { ok: false, error: "Intake not found." };

  await updateSiteStatus(siteId, "building");

  const approvedContent = site.approved_content as ContentDraft;
  const { site: builtSite, violations } = await buildSite(approvedContent, intake);

  if (violations.length > 0) {
    await updateSiteStatus(siteId, "approved");
    return { ok: false, error: "Build has boundary violations that could not be resolved.", violations };
  }
  if (!builtSite) {
    await updateSiteStatus(siteId, "approved");
    return { ok: false, error: "Spark could not build the site." };
  }

  await storeBuiltContent(siteId, builtSite);
  return { ok: true };
}

/**
 * Build a site and, on success, release the preview to the customer and email
 * them. This is the whole "after approval" chain in one place so the live path
 * (approve route) and the self-healing sweep behave identically. On build
 * failure the record is left retriable (runBuild reverts to approved) and a
 * staff-visible failure is recorded. Email failure is best-effort and recorded.
 */
export async function buildAndReleasePreview(
  siteId: string,
): Promise<{ ok: boolean; error?: string }> {
  const built = await runBuild(siteId);
  if (!built.ok) {
    const reason = built.error ?? "unknown error";
    console.error(`[trailhead] build did not complete for site ${siteId}: ${reason}`);
    await recordNotificationFailure(siteId, "trailhead-build", reason).catch(() => {});
    return { ok: false, error: reason };
  }

  const released = await markPreviewSent(siteId);
  if (!released) {
    console.error(`[trailhead] could not release preview for site ${siteId}`);
    return { ok: false, error: "could not release preview" };
  }

  const site = await getSiteById(siteId);
  const intake = site ? await getIntakeById(site.intake_id) : null;
  if (site && intake) {
    const result = await sendTrailheadPreview(intake.contact_email, {
      contactName: intake.contact_name,
      siteName: intake.site_name,
      statusUrl: `${SITE_URL}/trailhead/status/${site.preview_token}`,
    });
    if (!result.ok) {
      console.error(
        `[trailhead] email trailhead-preview failed for intake ${site.intake_id}: ${result.reason ?? "unknown reason"}`,
      );
      await recordNotificationFailure(
        siteId,
        "trailhead-preview",
        result.reason ?? "unknown reason",
      ).catch(() => {});
    }
  }

  return { ok: true };
}

export interface SweepResult {
  scanned: number;
  healed: number;
  failed: number;
  skipped: number;
}

// A failed auto-build reverts to "approved". Wait longer than the function's
// maxDuration (300s) before treating an approved-but-unbuilt site as stalled,
// so the sweep never races a build that is legitimately still running.
const APPROVED_GRACE_MS = 6 * 60 * 1000;
// A site left at "building" this long was interrupted mid-build (a healthy
// build finishes well within maxDuration and moves to "preview").
const BUILDING_GRACE_MS = 10 * 60 * 1000;
// Stop starting new builds past this point in a single sweep so we stay under
// the route's maxDuration; whatever is left is picked up on the next run.
const SWEEP_DEADLINE_MS = 4 * 60 * 1000;
// How many stalled sites to consider per run (small: this is a 10/month program).
const SWEEP_LIMIT = 5;
// Give up auto-retrying after this many recorded build failures and leave it for
// staff, so a genuinely unbuildable site does not loop and burn tokens forever.
const MAX_BUILD_ATTEMPTS = 3;

function buildFailureCount(failures: unknown[]): number {
  return failures.filter(
    (f) => typeof f === "object" && f !== null && (f as { tag?: string }).tag === "trailhead-build",
  ).length;
}

/**
 * Self-healing sweep: find sites whose build stalled (a silently failed or
 * interrupted auto-build) and drive them the rest of the way, building and
 * releasing the preview. Idempotent and safe to run on a schedule: grace
 * windows keep it from racing an in-flight build, and a per-site failure cap
 * stops it retrying an unbuildable site forever. Invoked by Vercel Cron.
 */
export async function runStuckBuildSweep(now: Date): Promise<SweepResult> {
  const stuck = await findStuckBuilds({
    approvedBefore: new Date(now.getTime() - APPROVED_GRACE_MS).toISOString(),
    buildingBefore: new Date(now.getTime() - BUILDING_GRACE_MS).toISOString(),
    limit: SWEEP_LIMIT,
  });

  let healed = 0;
  let failed = 0;
  let skipped = 0;
  const startedAt = now.getTime();

  for (const site of stuck) {
    if (buildFailureCount(site.notification_failures) >= MAX_BUILD_ATTEMPTS) {
      console.warn(
        `[trailhead] sweep skipping site ${site.id}: ${MAX_BUILD_ATTEMPTS}+ build failures, needs staff`,
      );
      skipped++;
      continue;
    }
    if (Date.now() - startedAt > SWEEP_DEADLINE_MS) {
      console.warn("[trailhead] sweep hit its time budget; remaining sites retry next run");
      break;
    }
    const res = await buildAndReleasePreview(site.id);
    if (res.ok) healed++;
    else failed++;
  }

  return { scanned: stuck.length, healed, failed, skipped };
}
