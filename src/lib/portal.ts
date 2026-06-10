import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkEnabled, isStaffRole, type Role } from "./auth";
import { getSupabaseServiceClient } from "./supabase";

/**
 * Server-only data layer for the client portal (spec section 1, surface 2).
 *
 * All reads and writes use the Supabase service-role client and are manually
 * scoped to the signed-in user's organization. RLS in the database is the
 * second line of defense for any anon/authenticated path; here, on the trusted
 * server, we scope by org explicitly. Every function guards on configuration so
 * the public site builds and runs with no secrets.
 */

export interface AppUser {
  id: string;
  clerk_user_id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  is_staff: boolean;
  organization_id: string | null;
}

export interface PortalProject {
  id: string;
  organization_id: string;
  status: string;
  catalog_key: string | null;
}

export interface PortalBrief {
  id: string;
  project_id: string;
  content: unknown;
  rendered_summary: string | null;
  status: string;
  revision: number;
}

export interface PortalContext {
  appUser: AppUser;
  organizationName: string | null;
  project: PortalProject | null;
  brief: PortalBrief | null;
  /** Captured intake state for the active project, if any. */
  intakeCaptured: Record<string, unknown>;
  intakeStatus: string | null;
  /** Prior intake transcript (role/content turns) for resuming the chat. */
  intakeTranscript: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Resolve the active offering catalog_key for a project from its source
 * subscription or order. Returns null if neither is set.
 */
async function resolveProjectCatalogKey(
  db: SupabaseClient,
  project: { source_subscription_id: string | null; source_order_id: string | null },
): Promise<string | null> {
  if (project.source_subscription_id) {
    const { data } = await db
      .from("subscriptions")
      .select("catalog_key")
      .eq("id", project.source_subscription_id)
      .maybeSingle();
    if (data?.catalog_key) return data.catalog_key as string;
  }
  if (project.source_order_id) {
    const { data } = await db
      .from("orders")
      .select("catalog_key")
      .eq("id", project.source_order_id)
      .maybeSingle();
    if (data?.catalog_key) return data.catalog_key as string;
  }
  return null;
}

/**
 * Ensure a `users` row exists for the signed-in Clerk user and is linked to
 * their organization. Organizations are created at purchase keyed by the
 * buyer's email, so we link by matching email. Idempotent.
 */
export async function ensureAppUser(): Promise<AppUser | null> {
  if (!isClerkEnabled) return null;
  const { userId } = await auth();
  if (!userId) return null;

  const db = getSupabaseServiceClient();
  if (!db) return null;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    null;
  const fullName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || null;
  const metaRole = clerkUser?.publicMetadata?.role;
  const role: Role =
    metaRole === "project_lead" || metaRole === "admin" || metaRole === "client"
      ? metaRole
      : "client";
  const isStaff = isStaffRole(role);

  // Existing row?
  const { data: existing } = await db
    .from("users")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existing) {
    const row = existing as AppUser;
    // Link to an org by email if not already linked (clients only).
    if (!row.organization_id && !isStaff && email) {
      const orgId = await findOrgByEmail(db, email);
      if (orgId) {
        await db.from("users").update({ organization_id: orgId }).eq("id", row.id);
        row.organization_id = orgId;
      }
    }
    return row;
  }

  const organizationId = isStaff || !email ? null : await findOrgByEmail(db, email);

  const { data: created, error } = await db
    .from("users")
    .insert({
      clerk_user_id: userId,
      email,
      full_name: fullName,
      role,
      is_staff: isStaff,
      organization_id: organizationId,
    })
    .select("*")
    .single();

  if (error || !created) {
    console.error("[portal] ensureAppUser insert failed:", error?.message);
    return null;
  }
  return created as AppUser;
}

async function findOrgByEmail(
  db: SupabaseClient,
  email: string,
): Promise<string | null> {
  const { data } = await db
    .from("organizations")
    .select("id")
    .eq("primary_contact_email", email)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Load everything the portal needs for the signed-in client: their app user,
 * org, the active project (most recent non-canceled), its brief, and intake
 * state. Returns null when Clerk/Supabase are not configured or no user.
 */
export async function getPortalContext(): Promise<PortalContext | null> {
  const appUser = await ensureAppUser();
  if (!appUser) return null;

  const db = getSupabaseServiceClient();
  if (!db) return null;

  // Staff have no client project context.
  if (appUser.is_staff || !appUser.organization_id) {
    return {
      appUser,
      organizationName: null,
      project: null,
      brief: null,
      intakeCaptured: {},
      intakeStatus: null,
      intakeTranscript: [],
    };
  }

  const { data: org } = await db
    .from("organizations")
    .select("name")
    .eq("id", appUser.organization_id)
    .maybeSingle();

  // Most recent active project for this org.
  const { data: projectRow } = await db
    .from("projects")
    .select("id, organization_id, status, source_subscription_id, source_order_id")
    .eq("organization_id", appUser.organization_id)
    .neq("status", "canceled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!projectRow) {
    return {
      appUser,
      organizationName: org?.name ?? null,
      project: null,
      brief: null,
      intakeCaptured: {},
      intakeStatus: null,
      intakeTranscript: [],
    };
  }

  const catalogKey = await resolveProjectCatalogKey(db, projectRow);

  const [{ data: briefRow }, { data: intakeRow }] = await Promise.all([
    db
      .from("project_briefs")
      .select("id, project_id, content, rendered_summary, status, revision")
      .eq("project_id", projectRow.id)
      .maybeSingle(),
    db
      .from("intake_sessions")
      .select("captured, status, transcript")
      .eq("project_id", projectRow.id)
      .maybeSingle(),
  ]);

  return {
    appUser,
    organizationName: org?.name ?? null,
    project: {
      id: projectRow.id,
      organization_id: projectRow.organization_id,
      status: projectRow.status,
      catalog_key: catalogKey,
    },
    brief: (briefRow as PortalBrief | null) ?? null,
    intakeCaptured:
      (intakeRow?.captured as Record<string, unknown> | undefined) ?? {},
    intakeStatus: (intakeRow?.status as string | undefined) ?? null,
    intakeTranscript: Array.isArray(intakeRow?.transcript)
      ? (intakeRow!.transcript as Array<{
          role: "user" | "assistant";
          content: string;
        }>)
      : [],
  };
}

/**
 * Verify the signed-in client owns a project, returning the project with its
 * resolved catalog_key. Used by the Spark and brief API routes to scope writes.
 * Returns null if not configured, not signed in, or not the owner.
 */
export async function getOwnedProject(
  projectId: string,
): Promise<{ appUser: AppUser; project: PortalProject } | null> {
  const appUser = await ensureAppUser();
  if (!appUser || !appUser.organization_id) return null;

  const db = getSupabaseServiceClient();
  if (!db) return null;

  const { data: projectRow } = await db
    .from("projects")
    .select("id, organization_id, status, source_subscription_id, source_order_id")
    .eq("id", projectId)
    .eq("organization_id", appUser.organization_id)
    .maybeSingle();

  if (!projectRow) return null;

  const catalogKey = await resolveProjectCatalogKey(db, projectRow);
  return {
    appUser,
    project: {
      id: projectRow.id,
      organization_id: projectRow.organization_id,
      status: projectRow.status,
      catalog_key: catalogKey,
    },
  };
}
