import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Member authentication.
 *
 * Two clients, and which one is used is a security decision rather than a
 * convenience:
 *
 *  - `getSessionClient` carries the member's own session, so every query runs
 *    under row level security as that member. This is the default and covers
 *    everything a member does. If a policy is wrong, this client is what
 *    catches it.
 *
 *  - `getAdminClient` uses the service role and bypasses RLS entirely. It
 *    exists only for the handful of operations that cannot run as the member:
 *    creating their membership row before they are a member, and looking up an
 *    invitation by a token they hold but cannot read.
 *
 * The rule is that any query which could run under the member's session must.
 * Reaching for the admin client to make something work is how tenant isolation
 * quietly stops being enforced.
 */

function env() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  };
}

export function isAuthConfigured(): boolean {
  const { url, anonKey } = env();
  return Boolean(url && anonKey);
}

/** The member's own session. Subject to RLS. */
export async function getSessionClient(): Promise<SupabaseClient | null> {
  const { url, anonKey } = env();
  if (!url || !anonKey) return null;

  const store = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options?: Record<string, unknown> }[]) => {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Refresh is handled in the callback route and middleware instead.
        }
      },
    },
  });
}

/** Service role. Bypasses RLS. Use only where a member session cannot work. */
export function getAdminClient(): SupabaseClient | null {
  const { url, serviceKey } = env();
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface SignedInMember {
  authUserId: string;
  email: string;
  memberId: string | null;
  status: "pending" | "active" | "suspended" | "declined" | null;
  role: "member" | "guest" | "officer" | "admin" | null;
  displayName: string | null;
  /** What they answered at the door. Read back to them while they wait. */
  joinAnswers: Record<string, unknown>;
  /** Their profile map. Empty until session 4's prompt is answered. */
  profile: Record<string, unknown>;
}

/** The columns every membership read needs. One list, so the two agree. */
const MEMBER_COLUMNS = "id, status, role, display_name, join_answers, profile";

interface MemberRow {
  id: string;
  status: string;
  role: string;
  display_name: string | null;
  join_answers: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
}

/**
 * Who is signed in, and what they are to this club.
 *
 * An authenticated visitor with no membership row is a real state, not an
 * error: they have proved an email address and have not applied yet. The three
 * cases the caller must handle are no session, a session with no membership,
 * and a membership whose status decides what they can see.
 *
 * The membership read runs under the member's session, so RLS is what confines
 * it to this site rather than the `eq` below being trusted to.
 */
export async function getSignedInMember(
  siteId: string,
): Promise<SignedInMember | null> {
  const db = await getSessionClient();
  if (!db) return null;

  const { data: auth } = await db.auth.getUser();
  const user = auth?.user;
  if (!user) return null;

  let { data: member } = (await db
    .from("site_members")
    .select(MEMBER_COLUMNS)
    .eq("site_id", siteId)
    .eq("auth_user_id", user.id)
    .maybeSingle()) as { data: MemberRow | null };

  // No linked membership yet. There may still be one waiting on this address:
  // a seeded administrator, or an invitation created before the person had an
  // account. Claiming it is safe because the magic link already proved they
  // control the address, which is the only thing the claim checks.
  if (!member && user.email) {
    member = await claimMembershipByEmail(siteId, user.id, user.email);
  }

  return {
    authUserId: user.id,
    email: user.email ?? "",
    memberId: member?.id ?? null,
    status: (member?.status as SignedInMember["status"]) ?? null,
    role: (member?.role as SignedInMember["role"]) ?? null,
    displayName: member?.display_name ?? null,
    joinAnswers: member?.join_answers ?? {},
    profile: member?.profile ?? {},
  };
}

/**
 * Link an unclaimed membership row to the identity that just proved its email.
 *
 * Two cases need this, and they are the same shape: a member seeded ahead of
 * time (the first administrator, who must exist before anyone can be approved)
 * and an invitation issued to someone with no account yet.
 *
 * Runs under the service role because the row is not readable by the person
 * claiming it: they are not a member yet, so no policy grants them sight of
 * it. This is one of the few places that is legitimate.
 *
 * The claim is narrow on purpose. It matches on site, on email, and only where
 * auth_user_id is still null, so it can never take over a membership that
 * already belongs to somebody. Email ownership was proved by the magic link
 * before this runs; nothing here trusts a claim made by the caller.
 *
 * Demo rows are excluded (0024). Seeded members exist without an auth identity,
 * which is the same shape as an unaccepted invitation, so without this line a
 * seeded person is a membership waiting to be claimed by whoever can receive
 * mail at their address. Their addresses are at a reserved domain nobody can
 * register, so this is a second lock rather than the only one.
 */
async function claimMembershipByEmail(
  siteId: string,
  authUserId: string,
  email: string,
): Promise<MemberRow | null> {
  const admin = getAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("site_members")
    .update({ auth_user_id: authUserId })
    .eq("site_id", siteId)
    .eq("email", email.toLowerCase())
    .is("auth_user_id", null)
    .eq("is_demo", false)
    .select(MEMBER_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error(`[members] could not claim membership for ${email}: ${error.message}`);
    return null;
  }
  return data as never;
}

/**
 * Whether this member may see member-only content.
 *
 * Suspended, declined, and pending all read as no. Guest expiry is enforced in
 * the database by is_active_site_member, so a lapsed guest also fails their
 * queries even if a caller forgets to check here.
 */
export function canSeeMemberContent(member: SignedInMember | null): boolean {
  return member?.status === "active";
}
