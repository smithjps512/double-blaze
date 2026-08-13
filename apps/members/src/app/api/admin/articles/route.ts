import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/member-context";

/**
 * POST /api/admin/articles   { id, action: "remove" | "restore" }
 *
 * The other half of the moderation decision in build plan section 2: publish
 * immediately, administrators can remove. Members are already vetted at the
 * door, so gating every post again would tax the activity the brief calls most
 * critical, and this is the safety net instead.
 *
 * Removal is not deletion. The row stays, its author can still see it and is
 * told what happened, and 0023 records who removed it and when. A decision
 * nobody can review is not much of a decision, and an author who finds their
 * work simply gone learns nothing.
 *
 * The write runs under the administrator's own session, so
 * `site_articles_admin_all` is what authorizes it and an administrator of
 * another club matches no rows. The check here is for the error message.
 *
 * Reporting a piece, which is the member-facing half of moderation, is session
 * 9 along with the rest of the admin console.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const context = await requireAdmin();
  if (!context.ok) return NextResponse.json({ error: context.error }, { status: context.status });
  const { tenant, db } = context;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const action = body.action;
  if (!id || (action !== "remove" && action !== "restore")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Restoring puts it back as a draft rather than straight back into the
  // library. The administrator is undoing their own removal, not republishing
  // somebody else's work on their behalf, and the author is the one who decides
  // whether it goes back up.
  const status = action === "remove" ? "removed" : "draft";

  const { data, error } = await db
    .from("site_articles")
    .update({ status })
    .eq("site_id", tenant.siteId)
    .eq("id", id)
    .select("id, slug, status")
    .maybeSingle();

  if (error) {
    console.error(`[members] article ${action} failed on ${tenant.slug}: ${error.message}`);
    return NextResponse.json({ error: "That change could not be saved." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "No such piece." }, { status: 404 });

  return NextResponse.json({ ok: true, status: data.status });
}
