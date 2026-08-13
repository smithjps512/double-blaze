import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient, getSessionClient } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";
import { validateJoinSubmission } from "@/lib/join";
import { newApplicationEmail } from "@/lib/admin";
import { sendClubEmail } from "@/lib/email";

/**
 * POST /api/join
 *
 * Turns an authenticated visitor into a pending applicant. This is the one
 * write in the whole join flow, and it deliberately runs under the applicant's
 * own session rather than the service role.
 *
 * That is the point. Every rule about what an application may claim lives in
 * the site_members_self_apply policy in migration 0017: pending, member, this
 * person's own auth id, this person's own verified address, no guest window, no
 * approval. This route validates the answers and hands the insert to the
 * database, so a mistake here cannot manufacture an administrator. If the
 * policy and this route ever disagree, the policy wins.
 *
 * The site comes from the hostname, never from the request body, so an
 * applicant cannot aim their application at another club.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const tenant = await resolveTenant();
  if (!tenant) return NextResponse.json({ error: "Unknown site." }, { status: 404 });

  const db = await getSessionClient();
  if (!db) return NextResponse.json({ error: "Joining is not configured." }, { status: 500 });

  const { data: auth } = await db.auth.getUser();
  const user = auth?.user;
  if (!user?.email) {
    // Their session lapsed while the form was open. Say so rather than
    // failing at the database, so the form can send them back to sign in.
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = validateJoinSubmission(body);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const { error } = await db.from("site_members").insert({
    site_id: tenant.siteId,
    auth_user_id: user.id,
    email: user.email.toLowerCase(),
    display_name: result.submission.displayName,
    role: "member",
    status: "pending",
    join_answers: result.submission.answers,
  });

  if (error) {
    // A membership already exists for this person or this address. Two ways in:
    // they applied in another tab, or an administrator seeded or invited them
    // between the page loading and the form being sent. Either way they have a
    // row now, so this is a success from where they are standing. The front
    // door reads their real status and shows the right thing.
    if (error.code === "23505") return NextResponse.json({ ok: true, already: true });

    // 42501 is the policy refusing the insert. Reaching it means the payload
    // claimed something an application may not claim, which the form cannot do,
    // so it is worth a log line rather than a shrug.
    if (error.code === "42501") {
      console.warn(`[members] join refused by policy for ${user.email} on ${tenant.slug}`);
      return NextResponse.json({ error: "That application could not be accepted." }, { status: 403 });
    }

    console.error(`[members] join failed for ${user.email} on ${tenant.slug}: ${error.message}`);
    return NextResponse.json(
      { error: "Something went wrong saving your request. Please try again." },
      { status: 500 },
    );
  }

  // The application is saved. Telling the administrators is best effort: an
  // applicant who is in the queue is in the queue whether or not the mail
  // server answered, and failing their request over an email would be worse
  // than a notification arriving late. The bounce webhook catches the rest.
  await notifyAdministrators(
    { siteId: tenant.siteId, clubName: tenant.name },
    {
      displayName: result.submission.displayName,
      email: user.email,
      joinAnswers: result.submission.answers,
    },
    `${new URL(req.url).origin}/admin`,
  );

  return NextResponse.json({ ok: true });
}

/**
 * Tell the club's administrators that somebody is waiting.
 *
 * Runs under the service role, and this is one of the few places that has to.
 * The applicant is pending, so no policy lets them see another member, let
 * alone the administrators' addresses. That is the correct rule and it is
 * exactly what has to be stepped around to send this: the message is about
 * them but it is not for them.
 *
 * Only the addresses leave this function. Nothing about the administrators
 * reaches the applicant's response, so the endpoint cannot be used to find out
 * who runs the club.
 */
async function notifyAdministrators(
  site: { siteId: string; clubName: string },
  applicant: { displayName: string; email: string; joinAnswers: Record<string, string> },
  queueUrl: string,
): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;

  const { data, error } = await admin
    .from("site_members")
    .select("email")
    .eq("site_id", site.siteId)
    .eq("role", "admin")
    .eq("status", "active");

  if (error) {
    console.error(`[members] could not list administrators of ${site.siteId}: ${error.message}`);
    return;
  }

  const to = (data ?? []).map((row) => row.email as string).filter(Boolean);
  if (to.length === 0) {
    // Worth a loud line rather than silence. A club with no administrator
    // cannot approve anyone, so this applicant is going to wait forever and
    // nobody would otherwise find out.
    console.error(`[members] application received but site ${site.siteId} has no administrator`);
    return;
  }

  const copy = newApplicationEmail(site.clubName, applicant, queueUrl);
  await sendClubEmail({
    clubName: site.clubName,
    to,
    subject: copy.subject,
    heading: copy.heading,
    bodyHtml: copy.bodyHtml,
    action: copy.action,
  });
}
