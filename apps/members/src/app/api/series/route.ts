import { NextResponse, type NextRequest } from "next/server";
import { requireActiveMember } from "@/lib/member-context";
import { slugAttempt, validateSeries } from "@/lib/articles";

/**
 * POST /api/series
 *
 * Start a series, so a piece can be filed alongside others on the same subject.
 *
 * Any active member may start one, per the policy in 0023. A series is a shelf
 * rather than a publication, and a club where only administrators can name a
 * shelf ends up with no shelves.
 *
 * An exact name match returns the existing series rather than refusing. Two
 * members typing the same name mean the same thing, and a second shelf with the
 * same label helps nobody.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_ATTEMPTS = 6;

export async function POST(req: NextRequest) {
  const context = await requireActiveMember();
  if (!context.ok) return NextResponse.json({ error: context.error }, { status: context.status });
  const { tenant, member, db } = context;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = validateSeries(body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  const series = result.series;

  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const slug = slugAttempt(series.slug, attempt);

    const { data, error } = await db
      .from("site_article_series")
      .insert({
        site_id: tenant.siteId,
        created_by: member.memberId,
        title: series.title,
        slug,
        description: series.description,
      })
      .select("id, title, slug")
      .maybeSingle();

    if (!error && data) return NextResponse.json({ ok: true, series: data });

    if (error?.code === "23505") {
      // The slug is taken. If it is taken by a series with this exact name,
      // that is the one the author meant.
      const { data: existing } = await db
        .from("site_article_series")
        .select("id, title, slug")
        .eq("site_id", tenant.siteId)
        .eq("slug", slug)
        .maybeSingle();

      if (existing && (existing.title as string).toLowerCase() === series.title.toLowerCase()) {
        return NextResponse.json({ ok: true, series: existing });
      }
      continue;
    }

    console.error(`[members] series create failed on ${tenant.slug}: ${error?.message}`);
    return NextResponse.json({ error: "That series could not be created." }, { status: 500 });
  }

  return NextResponse.json(
    { errors: { title: "A series with a very similar name already exists." } },
    { status: 409 },
  );
}
