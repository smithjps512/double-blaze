import { NextResponse, type NextRequest } from "next/server";
import { requireActiveMember } from "@/lib/member-context";
import { articleMediaPath, audioExtension, checkAudio } from "@/lib/articles";

/**
 * PUT /api/articles/<id>/audio
 *
 * Upload the recording for an audio piece.
 *
 * Separate from saving the rest because a multipart body and a JSON body are
 * different requests anyway, and because the result is worth seeing before
 * committing to the rest of the form. The same shape as the photo upload in
 * /api/profile.
 *
 * The upload runs under the author's own session, so the path policies in 0022
 * are what authorize it, and the path is built here rather than taken from the
 * filename because in that migration the path IS the security model.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireActiveMember();
  if (!context.ok) return NextResponse.json({ error: context.error }, { status: context.status });
  const { tenant, member, db } = context;

  const { id } = await params;

  const { data: article } = await db
    .from("site_articles")
    .select("id, kind, media_path")
    .eq("site_id", tenant.siteId)
    .eq("id", id)
    .maybeSingle();

  if (!article) return NextResponse.json({ error: "No such piece." }, { status: 404 });
  if (article.kind !== "audio") {
    return NextResponse.json({ error: "That piece is not an audio one." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was sent." }, { status: 400 });
  }

  const problem = checkAudio({ type: file.type, size: file.size });
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const path = articleMediaPath(tenant.siteId, member.memberId, audioExtension(file.type));

  const { error: uploadError } = await db.storage
    .from("member-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error(`[members] audio upload failed on ${tenant.slug}: ${uploadError.message}`);
    return NextResponse.json({ error: "That file could not be uploaded." }, { status: 500 });
  }

  const previous = article.media_path as string | null;

  const { data, error } = await db
    .from("site_articles")
    .update({ media_path: path, media_mime: file.type, media_bytes: file.size })
    .eq("site_id", tenant.siteId)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    // The bytes are up and nothing points at them. Remove them rather than
    // leaving an orphan nobody will ever find.
    await db.storage.from("member-media").remove([path]);
    if (error) console.error(`[members] audio save failed on ${tenant.slug}: ${error.message}`);
    return NextResponse.json({ error: "That file could not be saved." }, { status: 500 });
  }

  // Best effort, and after the pointer moved. An old recording left behind is
  // storage cost; one removed before the pointer moves is a broken article.
  if (previous && previous !== path) {
    await db.storage.from("member-media").remove([previous]);
  }

  return NextResponse.json({ ok: true, path, mime: file.type, bytes: file.size });
}
