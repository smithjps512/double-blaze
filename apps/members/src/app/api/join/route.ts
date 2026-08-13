import { NextResponse, type NextRequest } from "next/server";
import { getSessionClient } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";
import { validateJoinSubmission } from "@/lib/join";

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

  return NextResponse.json({ ok: true });
}
