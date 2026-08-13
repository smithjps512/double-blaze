import { NextResponse, type NextRequest } from "next/server";
import { requireActiveMember } from "@/lib/member-context";
import { slugAttempt, slugify, validateArticle } from "@/lib/articles";

/**
 * POST   /api/articles        create a piece, or save one that exists
 * DELETE /api/articles?id=    delete your own
 *
 * Creating and saving share a route because they share the part that is worth
 * getting right once: choosing a slug that is free, and doing it again when
 * somebody else took it between the check and the write.
 *
 * Everything runs under the author's own session, so `site_articles_author_write`
 * and `site_articles_author_update` from 0023 are what authorize it, and the
 * guard trigger in the same migration is what stops an author restoring
 * something an administrator removed. Nothing here needs the service role.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How many times to try a slug before giving up. Collisions are rare. */
const SLUG_ATTEMPTS = 6;

interface StoredArticle {
  slug: string;
  published_at: string | null;
  media_path: string | null;
  media_mime: string | null;
  media_bytes: number | null;
}

export async function POST(req: NextRequest) {
  const context = await requireActiveMember();
  if (!context.ok) return NextResponse.json({ error: context.error }, { status: context.status });
  const { tenant, member, db } = context;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = typeof body.id === "string" && body.id ? body.id : null;

  // What is already stored, when there is something. The audio path comes from
  // here rather than from the request, exactly like photo_path in the profile
  // route: a caller who could name the file could point their article at
  // somebody else's upload.
  let existing: StoredArticle | null = null;

  if (id) {
    const { data } = await db
      .from("site_articles")
      .select("slug, published_at, media_path, media_mime, media_bytes")
      .eq("site_id", tenant.siteId)
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "No such piece." }, { status: 404 });
    existing = data as unknown as StoredArticle;
  }

  const result = validateArticle(body, existing ?? undefined);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  const article = result.article;

  // The slug follows the title while a piece has never been published, and is
  // fixed from the moment it has. A published article's URL is something other
  // members have already opened, and a title tweak should not break it.
  const base = slugify(article.title);
  const keepSlug = Boolean(existing?.published_at);

  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const slug = keepSlug ? (existing?.slug as string) : slugAttempt(base, attempt);

    const { data, error } = id
      ? await db
          .from("site_articles")
          .update({ ...article, slug })
          .eq("site_id", tenant.siteId)
          .eq("id", id)
          .select("id, slug, status")
          .maybeSingle()
      : await db
          .from("site_articles")
          .insert({
            ...article,
            slug,
            site_id: tenant.siteId,
            author_id: member.memberId,
          })
          .select("id, slug, status")
          .maybeSingle();

    if (!error) {
      if (!data) {
        // The write matched no rows, which under RLS means the policy refused
        // it rather than the row being missing.
        return NextResponse.json({ error: "That piece is not yours to edit." }, { status: 403 });
      }

      // Changing an audio piece into another kind leaves the bytes orphaned.
      // Removed after the pointer moved, never before, so a failed save never
      // costs somebody their recording.
      if (existing?.media_path && !article.media_path) {
        await db.storage.from("member-media").remove([existing.media_path]);
      }

      return NextResponse.json({ ok: true, id: data.id, slug: data.slug, status: data.status });
    }

    // Somebody else has this slug. Only worth retrying when we are the ones
    // choosing it.
    if (error.code === "23505" && !keepSlug) continue;

    // The guard trigger in 0023. An author cannot bring back something an
    // administrator took down, and saying so beats a 500.
    if (error.code === "42501") {
      return NextResponse.json(
        { error: "An administrator has removed this piece. Only they can restore it." },
        { status: 409 },
      );
    }

    console.error(`[members] article save failed on ${tenant.slug}: ${error.message}`);
    return NextResponse.json({ error: "That could not be saved." }, { status: 500 });
  }

  return NextResponse.json(
    { errors: { title: "Another piece already has a very similar title. Try a different one." } },
    { status: 409 },
  );
}

export async function DELETE(req: NextRequest) {
  const context = await requireActiveMember();
  if (!context.ok) return NextResponse.json({ error: context.error }, { status: context.status });
  const { tenant, db } = context;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Nothing to delete." }, { status: 400 });

  // Read the media path first, because the row is about to stop existing and it
  // is the only thing that knows where the bytes are.
  const { data: existing } = await db
    .from("site_articles")
    .select("media_path")
    .eq("site_id", tenant.siteId)
    .eq("id", id)
    .maybeSingle();

  // `site_articles_author_delete` decides. It refuses a piece an administrator
  // removed, because that row is the record of a decision and its subject does
  // not get to erase it.
  const { data, error } = await db
    .from("site_articles")
    .delete()
    .eq("site_id", tenant.siteId)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(`[members] article delete failed on ${tenant.slug}: ${error.message}`);
    return NextResponse.json({ error: "That could not be deleted." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "That piece is not yours to delete, or an administrator has removed it." },
      { status: 403 },
    );
  }

  if (existing?.media_path) {
    await db.storage.from("member-media").remove([existing.media_path as string]);
  }

  return NextResponse.json({ ok: true });
}
