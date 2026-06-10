import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "./supabase";
import { getOfferingByKey } from "./catalog-db";
import { getQuestionSet } from "./intake-questions";
import { buildInitialDeliverables } from "./deliverable-templates";
import {
  assembleBrief,
  reviseBrief,
  renderBriefSummary,
  type BriefContent,
} from "./spark";
import {
  sendBriefReadyForAcceptance,
  sendBriefAccepted,
  sendNewAcceptedProject,
} from "./email";
import type { AppUser, PortalProject, PortalBrief } from "./portal";

/**
 * Brief lifecycle service (spec sections 5 step 4 and 6). All operations run
 * server-side with the service-role client and are idempotent:
 * - brief generation never creates a duplicate (one brief per project),
 * - acceptance never double-generates deliverables or a second kickoff.
 */

async function offeringName(catalogKey: string | null): Promise<string> {
  if (!catalogKey) return "your project";
  const offering = await getOfferingByKey(catalogKey);
  if (offering?.name) return offering.name;
  return getQuestionSet(catalogKey)?.offeringName ?? "your project";
}

async function clientEmailForOrg(
  db: SupabaseClient,
  organizationId: string,
): Promise<string | null> {
  const { data } = await db
    .from("organizations")
    .select("primary_contact_email")
    .eq("id", organizationId)
    .maybeSingle();
  return (data?.primary_contact_email as string | null) ?? null;
}

export type GenerateResult =
  | { ok: true; briefId: string; created: boolean }
  | { ok: false; reason: "disabled" | "parse_failed" | "error" };

/**
 * Generate the brief for a project from captured intake. Idempotent: if a brief
 * already exists, returns it without creating a second. Sets the brief to
 * submitted_for_acceptance, marks intake complete, moves the project to
 * brief_ready, and emails the client.
 */
export async function generateBriefForProject(args: {
  project: PortalProject;
  captured: Record<string, unknown>;
}): Promise<GenerateResult> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, reason: "error" };
  const { project, captured } = args;
  if (!project.catalog_key) return { ok: false, reason: "error" };

  // Idempotency: never create a duplicate brief.
  const { data: existing } = await db
    .from("project_briefs")
    .select("id")
    .eq("project_id", project.id)
    .maybeSingle();
  if (existing) return { ok: true, briefId: existing.id, created: false };

  const content = await assembleBrief({
    catalogKey: project.catalog_key,
    captured,
  });
  if (!content) return { ok: false, reason: "parse_failed" };

  const rendered = renderBriefSummary(content);

  const { data: inserted, error } = await db
    .from("project_briefs")
    .upsert(
      {
        project_id: project.id,
        content,
        rendered_summary: rendered,
        status: "submitted_for_acceptance",
        revision: 1,
      },
      { onConflict: "project_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[brief] generate insert failed:", error.message);
    return { ok: false, reason: "error" };
  }

  // If a concurrent request won the upsert race, read the existing row.
  let briefId = inserted?.id as string | undefined;
  if (!briefId) {
    const { data: row } = await db
      .from("project_briefs")
      .select("id")
      .eq("project_id", project.id)
      .maybeSingle();
    briefId = row?.id;
    if (briefId) return { ok: true, briefId, created: false };
    return { ok: false, reason: "error" };
  }

  await db
    .from("intake_sessions")
    .update({ status: "complete" })
    .eq("project_id", project.id);

  await db
    .from("projects")
    .update({ status: "brief_ready" })
    .eq("id", project.id);

  await db.from("events").insert({
    project_id: project.id,
    type: "brief_ready",
    payload: { revision: 1 },
  });

  const email = await clientEmailForOrg(db, project.organization_id);
  if (email) {
    await sendBriefReadyForAcceptance(email, await offeringName(project.catalog_key));
  }

  return { ok: true, briefId, created: true };
}

/** Find the default project lead (staff user), preferring a configured email. */
async function findDefaultProjectLead(
  db: SupabaseClient,
): Promise<{ id: string; email: string | null } | null> {
  const configured = process.env.DEFAULT_PROJECT_LEAD_EMAIL?.trim();
  if (configured) {
    const { data } = await db
      .from("users")
      .select("id, email")
      .eq("email", configured)
      .maybeSingle();
    if (data) return data as { id: string; email: string | null };
  }
  const { data } = await db
    .from("users")
    .select("id, email")
    .in("role", ["project_lead", "admin"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as { id: string; email: string | null } | null) ?? null;
}

export type AcceptResult =
  | { ok: true; alreadyAccepted: boolean }
  | { ok: false; reason: "error" };

/**
 * Accept a brief (workflow step 4). Idempotent across the board: a re-accept
 * does not create a second deliverable schedule or kickoff. On first accept it
 * sets the brief and project to accepted, generates deliverables from the
 * template with monthly-cadence due dates, creates the kickoff meeting, assigns
 * the default project lead, and notifies the client and lead.
 */
export async function acceptBrief(args: {
  appUser: AppUser;
  project: PortalProject;
}): Promise<AcceptResult> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, reason: "error" };
  const { appUser, project } = args;

  const { data: brief } = await db
    .from("project_briefs")
    .select("id, status")
    .eq("project_id", project.id)
    .maybeSingle();
  if (!brief) return { ok: false, reason: "error" };

  const alreadyAccepted = brief.status === "accepted";

  if (!alreadyAccepted) {
    await db
      .from("project_briefs")
      .update({
        status: "accepted",
        accepted_by: appUser.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", brief.id);
  }

  // Assign project lead if not already set.
  const { data: projRow } = await db
    .from("projects")
    .select("project_lead_id, start_date")
    .eq("id", project.id)
    .maybeSingle();

  const lead = await findDefaultProjectLead(db);
  const projectUpdate: Record<string, unknown> = { status: "accepted" };
  if (!projRow?.project_lead_id && lead) {
    projectUpdate.project_lead_id = lead.id;
  }
  const startDate = projRow?.start_date
    ? new Date(projRow.start_date as string)
    : new Date();
  if (!projRow?.start_date) {
    projectUpdate.start_date = startDate.toISOString().slice(0, 10);
  }
  await db.from("projects").update(projectUpdate).eq("id", project.id);

  // Generate deliverables only if none exist (idempotent).
  const { count: deliverableCount } = await db
    .from("deliverables")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id);

  if (!deliverableCount && project.catalog_key) {
    const planned = buildInitialDeliverables(project.catalog_key, startDate);
    if (planned.length) {
      await db.from("deliverables").insert(
        planned.map((p) => ({
          project_id: project.id,
          title: p.title,
          description: p.description,
          due_date: p.due_date,
          status: "pending",
        })),
      );
    }
  }

  // Create the kickoff meeting only if none exists (idempotent).
  const { data: existingKickoff } = await db
    .from("meetings")
    .select("id")
    .eq("project_id", project.id)
    .eq("type", "kickoff")
    .maybeSingle();
  if (!existingKickoff) {
    await db.from("meetings").insert({
      project_id: project.id,
      type: "kickoff",
      status: "proposed",
    });
  }

  if (alreadyAccepted) {
    return { ok: true, alreadyAccepted: true };
  }

  // First acceptance: audit, notify client and lead.
  await db.from("events").insert({
    project_id: project.id,
    type: "brief_accepted",
    actor_id: appUser.id,
    payload: {},
  });

  const name = await offeringName(project.catalog_key);
  const clientEmail = await clientEmailForOrg(db, project.organization_id);
  const { data: org } = await db
    .from("organizations")
    .select("name")
    .eq("id", project.organization_id)
    .maybeSingle();

  if (clientEmail) await sendBriefAccepted(clientEmail, name);

  if (lead) {
    // Dashboard notification for the project lead.
    await db.from("notifications").insert({
      user_id: lead.id,
      type: "new_accepted_project",
      link: "/execution",
    });
    if (lead.email) {
      await sendNewAcceptedProject(lead.email, {
        offeringName: name,
        organizationName: (org?.name as string | null) ?? null,
      });
    }
  }

  return { ok: true, alreadyAccepted: false };
}

export type ChangesResult =
  | { ok: true; revised: boolean }
  | { ok: false; reason: "error" | "not_found" };

/**
 * Request changes to a brief (workflow step 4 loop-back). Captures the client's
 * notes, sets the brief to changes_requested, has Spark revise from the notes,
 * bumps the revision, and returns it to submitted_for_acceptance. If revision
 * fails, the brief stays in changes_requested with the notes recorded.
 */
export async function requestBriefChanges(args: {
  appUser: AppUser;
  project: PortalProject;
  notes: string;
}): Promise<ChangesResult> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, reason: "error" };
  const { appUser, project, notes } = args;

  const { data: brief } = await db
    .from("project_briefs")
    .select("id, content, revision")
    .eq("project_id", project.id)
    .maybeSingle();
  if (!brief) return { ok: false, reason: "not_found" };

  // Record the request and notes (audit + client message).
  await db.from("project_briefs").update({ status: "changes_requested" }).eq("id", brief.id);
  await db.from("events").insert({
    project_id: project.id,
    type: "brief_changes_requested",
    actor_id: appUser.id,
    payload: { notes },
  });
  await db.from("messages").insert({
    project_id: project.id,
    author_id: appUser.id,
    channel: "dashboard",
    body: notes,
    related_event: "brief_changes_requested",
  });

  if (!project.catalog_key) return { ok: true, revised: false };

  const revised = await reviseBrief({
    catalogKey: project.catalog_key,
    current: brief.content as BriefContent,
    notes,
  });

  if (!revised) {
    // Keep notes and changes_requested state; client/staff can follow up.
    return { ok: true, revised: false };
  }

  await db
    .from("project_briefs")
    .update({
      content: revised,
      rendered_summary: renderBriefSummary(revised),
      status: "submitted_for_acceptance",
      revision: (brief.revision as number) + 1,
    })
    .eq("id", brief.id);

  await db.from("events").insert({
    project_id: project.id,
    type: "brief_revised",
    payload: { revision: (brief.revision as number) + 1 },
  });

  return { ok: true, revised: true };
}

export type { PortalBrief };
