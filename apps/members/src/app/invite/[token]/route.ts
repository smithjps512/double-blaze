import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";
import { invitationState } from "@/lib/invitations";
import { hashInvitationToken } from "@/lib/tokens";

/**
 * GET /invite/[token]
 *
 * Where an invitation is accepted. One click turns a token into an active
 * membership and a signed-in session, with no questionnaire and no approval,
 * which is what the brief asks for: "if invited, the member can join without
 * any further approval".
 *
 * ---------------------------------------------------------------------------
 * Why this runs as the service role
 * ---------------------------------------------------------------------------
 *
 * Nobody arriving here has a session, and the invitation is not readable by the
 * person holding it: `site_invitations_admin_all` is the only policy on that
 * table, deliberately, because an invitee never queries it. They present a raw
 * token and a server route looks up its hash. That is the design from 0013 and
 * this is the route it was designed for.
 *
 * ---------------------------------------------------------------------------
 * What the token is worth, and why that is acceptable
 * ---------------------------------------------------------------------------
 *
 * Possession of this link signs the holder in as the invited address. That is
 * the same bargain the sign-in email already makes, so it adds no new class of
 * exposure to the system: both are bearer credentials delivered to an inbox.
 * What bounds it is that the link works exactly once, stops working after
 * fourteen days, is revocable from the console at any moment before it is used,
 * and exists in the database only as a SHA-256 hash, so a leaked backup yields
 * nothing usable.
 *
 * The membership row is created before the session, and that ordering is doing
 * real work: the row lands with `auth_user_id` null, so if the link is
 * forwarded and the redemption half-completes, what exists is an unclaimed
 * membership that only somebody who can receive mail at the invited address can
 * ever attach to.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const url = new URL(req.url);
  const failed = (reason: string) =>
    NextResponse.redirect(new URL(`/sign-in?invite=${reason}`, url.origin));

  const tenant = await resolveTenant();
  if (!tenant) return NextResponse.redirect(new URL("/", url.origin));

  const { token } = await params;
  if (!token || token.length < 20) return failed("invalid");

  const db = getAdminClient();
  if (!db) return failed("unconfigured");

  // The hash is what is stored, so the hash is what is looked up. The token
  // itself never reaches a query, which is what keeps it out of slow query logs
  // and error reports.
  //
  // Scoped to this club as well as to the hash. Tokens are unique platform
  // wide, so this changes no outcome today, and it means an invitation to one
  // club can never be redeemed on the hostname of another.
  const { data: invitation, error } = await db
    .from("site_invitations")
    .select("id, site_id, email, role, access_expires_at, invited_by, accepted_at, revoked_at, expires_at")
    .eq("token_hash", hashInvitationToken(token))
    .eq("site_id", tenant.siteId)
    .maybeSingle();

  if (error) {
    console.error(`[members] invitation lookup failed: ${error.message}`);
    return failed("unconfigured");
  }
  if (!invitation) return failed("invalid");

  const state = invitationState(invitation as never, new Date());
  if (!state.usable) return failed(state.reason);

  const email = (invitation.email as string).toLowerCase();

  // Claim the invitation first, and only then build the membership.
  //
  // The update is conditional on the row still being open, so two clicks in
  // flight at once resolve to one winner: the second update matches no row and
  // is told the invitation was already accepted. Doing it in the other order
  // would leave the window where both requests believe they are the first.
  const { data: claimed, error: claimError } = await db
    .from("site_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error(`[members] could not claim invitation: ${claimError.message}`);
    return failed("unconfigured");
  }
  if (!claimed) return failed("accepted");

  // An invited member arrives active. That is the whole difference between this
  // path and the questionnaire: an administrator already made the decision the
  // approval queue exists to capture, so there is nothing left to decide.
  //
  // auth_user_id stays null. `claimMembershipByEmail` in lib/auth.ts attaches
  // it once the magic link below proves the address, which is the same
  // mechanism that has linked James's seeded row since 3b.
  const { data: member, error: memberError } = await db
    .from("site_members")
    .insert({
      site_id: tenant.siteId,
      email,
      role: invitation.role,
      status: "active",
      access_expires_at: invitation.access_expires_at,
      invited_by: invitation.invited_by,
      approved_by: invitation.invited_by,
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (memberError) {
    // 23505 means a membership for this address already exists. Somebody was
    // invited and also applied, or was invited twice across two clubs' worth of
    // administrator enthusiasm. They have a membership either way, so sign them
    // in and let the front door read their real status rather than failing them
    // at the door of a club they belong to.
    if (memberError.code !== "23505") {
      console.error(`[members] invited membership insert failed: ${memberError.message}`);
      // The invitation is spent and no membership exists. Say so plainly; an
      // administrator can issue another.
      return failed("failed");
    }
  } else if (!member) {
    return failed("failed");
  }

  // Now sign them in, by the same route every other session in this app is
  // created: a Supabase magic link, verified server side so the cookie is set
  // HttpOnly and no token passes through JavaScript.
  const { data: link, error: linkError } = await db.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${url.origin}/` },
  });

  const hashedToken = link?.properties?.hashed_token;
  const actionLink = link?.properties?.action_link;
  if (linkError || !hashedToken || !actionLink) {
    console.error(
      `[members] invited member created but sign-in link failed for ${email}: ${linkError?.message ?? "no token"}`,
    );
    // Their membership is real and active. Signing in from the front door works
    // and lands them in the same place, so this is a detour rather than a dead
    // end.
    return NextResponse.redirect(new URL("/sign-in?invite=ready", url.origin));
  }

  // Read the type Supabase issued rather than assuming it matches what was
  // asked for. An address with no account gets a signup token instead, and
  // verifying it as a magiclink fails with a message that reads as an expired
  // link. This is the bug from session 3b, and an invitee is precisely the
  // person most likely to be brand new.
  const linkType = new URL(actionLink).searchParams.get("type") ?? "magiclink";

  return NextResponse.redirect(
    new URL(
      `/api/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=${encodeURIComponent(linkType)}`,
      url.origin,
    ),
  );
}
