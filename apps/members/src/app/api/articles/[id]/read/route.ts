import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/member-context";

/**
 * POST /api/articles/<id>/read
 *
 * Record that this member opened this article. The brief asks for total and
 * unique reader counts per article, and this is the one write that produces
 * them.
 *
 * Almost all of the behaviour is in migration 0023 rather than here, and that
 * is deliberate:
 *
 *  - The row is one per member per article, not an event. Two integers on the
 *    article answer both questions the brief asks, and an event log would also
 *    answer "when did Dana read this", which nobody asked for and which is the
 *    part with a retention problem while the club's policy is still open.
 *  - A reload inside half an hour is the same read, an author reading their own
 *    piece is not a read at all, and a draft cannot be read. All three are
 *    enforced by the trigger, so no caller can get them wrong.
 *  - The counter columns on the article are written by a trigger the author
 *    cannot reach, so this endpoint cannot be used to inflate anything except
 *    slowly and on purpose.
 *
 * It answers 204 whatever happens. A read is telemetry, and telemetry that can
 * break a page is worse than telemetry that is occasionally missing.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireActiveMember();
  if (!context.ok) return new NextResponse(null, { status: 204 });
  const { tenant, member, db } = context;

  const { id } = await params;

  // site_id is sent, and 0023's trigger overwrites it from the article anyway,
  // so a caller cannot file a read under a club they are a member of against an
  // article belonging to one they are not.
  const { error } = await db.from("site_article_reads").upsert(
    { site_id: tenant.siteId, article_id: id, member_id: member.memberId },
    { onConflict: "article_id,member_id" },
  );

  if (error) {
    console.error(`[members] read not recorded on ${tenant.slug}: ${error.message}`);
  }

  return new NextResponse(null, { status: 204 });
}
