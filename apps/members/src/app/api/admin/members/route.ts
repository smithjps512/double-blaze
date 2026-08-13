import { NextResponse, type NextRequest } from "next/server";
import { getSessionClient, getSignedInMember } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";
import { parseAdminAction, approvalEmail, declineEmail } from "@/lib/admin";
import { sendClubEmail } from "@/lib/email";

/**
 * POST /api/admin/members
 *
 * Approve an applicant, decline one, or change a member's role.
 *
 * Runs under the administrator's own session, so `site_members_admin_all` is
 * what actually authorizes every write here. The explicit check below is for
 * the error message: without it a non-administrator gets an update that
 * silently matches zero rows, which is the correct security outcome and a
 * terrible thing to debug.
 *
 * Tenant comes from the hostname, and the update is scoped to it as well as
 * relying on the policy. An administrator of one club must not be able to reach
 * into another by passing an id, and neither the policy nor the scope is trusted
 * alone.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const tenant = await resolveTenant();
  if (!tenant) return NextResponse.json({ error: "Unknown site." }, { status: 404 });

  const db = await getSessionClient();
  if (!db) return NextResponse.json({ error: "Not configured." }, { status: 500 });

  const admin = await getSignedInMember(tenant.siteId);
  if (!admin) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (admin.role !== "admin" || admin.status !== "active") {
    return NextResponse.json({ error: "Administrators only." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseAdminAction(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const action = parsed.action;

  // Read the target first. Two reasons: the decision email needs the address,
  // and acting on a row that has already been decided should say so rather than
  // quietly overwriting somebody else's decision. Two administrators working
  // the same queue is the ordinary case, not the unusual one.
  const { data: target, error: readError } = await db
    .from("site_members")
    .select("id, email, display_name, status, role")
    .eq("site_id", tenant.siteId)
    .eq("id", action.memberId)
    .maybeSingle();

  if (readError) {
    console.error(`[members] admin read failed on ${tenant.slug}: ${readError.message}`);
    return NextResponse.json({ error: "Could not read that member." }, { status: 500 });
  }
  if (!target) return NextResponse.json({ error: "No such member." }, { status: 404 });

  const now = new Date().toISOString();
  let patch: Record<string, unknown>;

  if (action.kind === "approve" || action.kind === "decline") {
    if (target.status !== "pending") {
      return NextResponse.json(
        { error: `That request was already handled. It is ${target.status}.` },
        { status: 409 },
      );
    }
    patch = {
      status: action.kind === "approve" ? "active" : "declined",
      approved_by: admin.memberId,
      approved_at: now,
    };
  } else {
    // A role change on someone who was never admitted would make them a
    // pending administrator, which is a state nothing else in the build
    // expects. Approve first, then appoint.
    if (target.status !== "active") {
      return NextResponse.json(
        { error: "Only an active member can hold a role." },
        { status: 409 },
      );
    }
    patch = { role: action.role };
  }

  const { error } = await db
    .from("site_members")
    .update(patch)
    .eq("site_id", tenant.siteId)
    .eq("id", action.memberId);

  if (error) {
    // The last-administrator guard from migration 0019. It is the one failure
    // here that is a sentence worth reading rather than a status code, since
    // the administrator is one click from locking their club out.
    if (error.code === "23001" || /last administrator/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            "This is the last administrator. Appoint another one before changing this.",
        },
        { status: 409 },
      );
    }
    console.error(`[members] admin action failed on ${tenant.slug}: ${error.message}`);
    return NextResponse.json({ error: "That change could not be saved." }, { status: 500 });
  }

  // The decision is recorded. Everything below is best effort: a member who
  // was approved is approved whether or not the mail server was reachable.
  if (action.kind === "approve" || action.kind === "decline") {
    const origin = new URL(req.url).origin;
    const copy =
      action.kind === "approve" ? approvalEmail(tenant.name, `${origin}/`) : declineEmail(tenant.name);

    const sent = await sendClubEmail({
      clubName: tenant.name,
      to: [target.email as string],
      subject: copy.subject,
      heading: copy.heading,
      bodyHtml: copy.bodyHtml,
      action: copy.action,
    });

    // The pending screen promises "we will email you as soon as there is an
    // answer". If that email did not go, the administrator is the only person
    // who can know, so tell them rather than reporting a clean success.
    return NextResponse.json({ ok: true, emailed: sent });
  }

  return NextResponse.json({ ok: true });
}
