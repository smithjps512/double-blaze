import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionClient, getSignedInMember, type SignedInMember } from "./auth";
import { resolveTenant, type Tenant } from "./tenant";

/**
 * The three things every member-facing API route needs, resolved once.
 *
 * Which club (from the hostname, never from the request body), who is asking,
 * and a Supabase client carrying their session so row level security is what
 * decides. Session 5 added enough routes that writing this out five more times
 * would have been the third copy of it.
 *
 * It returns a plain result rather than a NextResponse so this file stays
 * usable from a page as well as from a route, and so the framework's response
 * type does not leak into the modules that resolve identity.
 *
 * The status check here is for the error message rather than for the security.
 * Every query below it runs under the member's own session, so a suspended
 * member who got past this would still match no rows.
 */
export type MemberContext =
  | {
      ok: true;
      tenant: Tenant;
      member: SignedInMember & { memberId: string };
      db: SupabaseClient;
    }
  | { ok: false; status: number; error: string };

export async function requireActiveMember(): Promise<MemberContext> {
  const tenant = await resolveTenant();
  if (!tenant) return { ok: false, status: 404, error: "Unknown site." };

  const db = await getSessionClient();
  if (!db) return { ok: false, status: 500, error: "Not configured." };

  const member = await getSignedInMember(tenant.siteId);
  if (!member) return { ok: false, status: 401, error: "Please sign in again." };
  if (member.status !== "active" || !member.memberId) {
    return { ok: false, status: 403, error: "Members only." };
  }

  return {
    ok: true,
    tenant,
    member: member as SignedInMember & { memberId: string },
    db,
  };
}

/** The same, and an administrator. Used by the removal route. */
export async function requireAdmin(): Promise<MemberContext> {
  const context = await requireActiveMember();
  if (!context.ok) return context;
  if (context.member.role !== "admin") {
    return { ok: false, status: 403, error: "Administrators only." };
  }
  return context;
}
