import { NextResponse, type NextRequest } from "next/server";
import { getSessionClient, getSignedInMember } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";
import {
  accessExpiry,
  invitationEmail,
  invitationExpiry,
  parseInvitationRequest,
} from "@/lib/invitations";
import { hashInvitationToken, newInvitationToken } from "@/lib/tokens";
import { sendClubEmail } from "@/lib/email";

/**
 * POST /api/admin/invitations   issue one
 * PATCH /api/admin/invitations  revoke one
 *
 * An invited member joins without approval, per the brief, which makes the
 * invitation itself the credential and this route the thing that mints it.
 *
 * The write runs under the administrator's own session, so
 * `site_invitations_admin_all` is what authorizes it and confines it to their
 * own club. Only the token generation and the send use anything else.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const context = await requireAdmin();
  if ("response" in context) return context.response;
  const { tenant, admin, db } = context;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseInvitationRequest(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { email, role, windowDays } = parsed.invitation;

  // Somebody who already has a row does not need an invitation, and issuing one
  // would produce a link that cannot be redeemed: the unique index on
  // (site_id, lower(email)) in site_members would reject the membership at the
  // far end, long after the email had gone out. Refuse here, where it can still
  // be explained.
  //
  // This read is deliberately under the administrator's session. An
  // administrator may see their own club's membership, so if this finds nothing
  // there is nothing for them to find.
  const { data: existing } = await db
    .from("site_members")
    .select("id, status")
    .eq("site_id", tenant.siteId)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === "pending"
            ? "That address has already applied. Approve them from the queue instead."
            : `That address is already on the membership, as ${existing.status}.`,
      },
      { status: 409 },
    );
  }

  // Re-inviting is revoke then issue, so exactly one link works. The partial
  // unique index in 0021 enforces the invariant; doing it in this order is what
  // stops that enforcement showing up as an error an administrator has to
  // interpret.
  const { error: revokeError } = await db
    .from("site_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("site_id", tenant.siteId)
    .eq("email", email)
    .is("accepted_at", null)
    .is("revoked_at", null);

  if (revokeError) {
    console.error(`[members] could not clear old invitations: ${revokeError.message}`);
    return NextResponse.json({ error: "That invitation could not be issued." }, { status: 500 });
  }

  const token = newInvitationToken();
  const issuedAt = new Date();
  const expires = accessExpiry(issuedAt, windowDays);

  const { data: created, error } = await db
    .from("site_invitations")
    .insert({
      site_id: tenant.siteId,
      email,
      role,
      token_hash: hashInvitationToken(token),
      access_expires_at: expires ? expires.toISOString() : null,
      invited_by: admin.memberId,
      expires_at: invitationExpiry(issuedAt).toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[members] invitation insert failed on ${tenant.slug}: ${error.message}`);
    return NextResponse.json({ error: "That invitation could not be issued." }, { status: 500 });
  }

  const origin = new URL(req.url).origin;
  const copy = invitationEmail(
    tenant.name,
    { role, windowDays, invitedBy: admin.displayName },
    `${origin}/invite/${token}`,
  );

  const sent = await sendClubEmail({
    clubName: tenant.name,
    to: [email],
    subject: copy.subject,
    heading: copy.heading,
    bodyHtml: copy.bodyHtml,
    action: copy.action,
  });

  if (!sent) {
    // The row exists and the token is unrecoverable, since only its hash was
    // kept. Leaving it open would be an invitation nobody can accept sitting in
    // the list looking live, so it goes back the way it came and the
    // administrator is told to try again.
    await db
      .from("site_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", created.id);

    return NextResponse.json(
      { error: `The invitation to ${email} could not be sent. Nothing was issued.` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

/** Revoke an open invitation. The link stops working immediately. */
export async function PATCH(req: NextRequest) {
  const context = await requireAdmin();
  if ("response" in context) return context.response;
  const { tenant, db } = context;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = typeof body.invitationId === "string" ? body.invitationId.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Which invitation was not clear." }, { status: 400 });
  }

  const { error } = await db
    .from("site_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("site_id", tenant.siteId)
    .eq("id", id)
    .is("accepted_at", null);

  if (error) {
    console.error(`[members] revoke failed on ${tenant.slug}: ${error.message}`);
    return NextResponse.json({ error: "That could not be revoked." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * Everything both handlers need, or the response to send instead.
 *
 * The explicit role check is for the error message rather than the security.
 * Without it a non-administrator gets a write that matches zero rows, which is
 * the correct outcome and impossible to debug from outside.
 */
async function requireAdmin() {
  const tenant = await resolveTenant();
  if (!tenant) {
    return { response: NextResponse.json({ error: "Unknown site." }, { status: 404 }) };
  }

  const db = await getSessionClient();
  if (!db) {
    return { response: NextResponse.json({ error: "Not configured." }, { status: 500 }) };
  }

  const admin = await getSignedInMember(tenant.siteId);
  if (!admin) {
    return { response: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) };
  }
  if (admin.role !== "admin" || admin.status !== "active") {
    return { response: NextResponse.json({ error: "Administrators only." }, { status: 403 }) };
  }

  return { tenant, admin, db };
}
