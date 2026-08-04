import "server-only";
import {
  getIntakeById,
  getSiteByIntakeId,
  getSiteById,
  updateSiteStatus,
  storeBuiltContent,
} from "./trailhead-db";
import { draftContent, buildSite, isAnthropicConfigured } from "./spark-trailhead";
import type { ContentDraft } from "./spark-trailhead";
import type { BoundaryViolation } from "./trailhead-boundary";

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
