import { NextResponse, type NextRequest } from "next/server";
import { getSessionClient, getSignedInMember } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";
import { checkPhoto, cleanProfile, mediaPath, type Profile } from "@/lib/profile";

/**
 * POST  /api/profile   save the text fields
 * PUT   /api/profile   upload a photo
 *
 * Both run under the member's own session, so `site_members_self_update` is
 * what authorizes them and the privilege guard from 0013 is what stops either
 * turning into a way to change a role. Nothing here needs the service role.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ctx = await requireMember();
  if ("response" in ctx) return ctx.response;
  const { member, db } = ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const display = typeof (body as Record<string, unknown>)?.display_name === "string"
    ? (body as Record<string, string>).display_name.replace(/\s+/g, " ").trim().slice(0, 80)
    : "";

  // The existing profile is read back so the photo survives a text edit. It is
  // not taken from the request, because a caller could then point their profile
  // at somebody else's file.
  const existing = (member.profile ?? {}) as Profile;

  const { error } = await db
    .from("site_members")
    .update({
      profile: cleanProfile(body, existing),
      ...(display ? { display_name: display } : {}),
    })
    .eq("id", member.memberId);

  if (error) {
    console.error(`[members] profile save failed: ${error.message}`);
    return NextResponse.json({ error: "That could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const ctx = await requireMember();
  if ("response" in ctx) return ctx.response;
  const { tenant, member, db } = ctx;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo was sent." }, { status: 400 });
  }

  const problem = checkPhoto({ type: file.type, size: file.size });
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  // The extension comes from the mime type rather than the filename. A filename
  // is caller-controlled and the path is the security model in 0022, so nothing
  // a caller typed goes into it.
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = mediaPath(tenant.siteId, member.memberId as string, extension);

  const { error: uploadError } = await db.storage
    .from("member-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error(`[members] photo upload failed: ${uploadError.message}`);
    return NextResponse.json({ error: "That photo could not be uploaded." }, { status: 500 });
  }

  const existing = (member.profile ?? {}) as Profile;
  const previous = existing.photo_path;

  const { error } = await db
    .from("site_members")
    .update({ profile: { ...existing, photo_path: path } })
    .eq("id", member.memberId);

  if (error) {
    // The bytes are up but nothing points at them. Remove them rather than
    // leaving an orphan nobody will ever find.
    await db.storage.from("member-media").remove([path]);
    console.error(`[members] photo save failed: ${error.message}`);
    return NextResponse.json({ error: "That photo could not be saved." }, { status: 500 });
  }

  // Best effort, and after the pointer moved. An old photo left behind is
  // storage cost; an old photo removed before the pointer moves is a broken
  // profile.
  if (previous && previous !== path) {
    await db.storage.from("member-media").remove([previous]);
  }

  return NextResponse.json({ ok: true, path });
}

async function requireMember() {
  const tenant = await resolveTenant();
  if (!tenant) return { response: NextResponse.json({ error: "Unknown site." }, { status: 404 }) };

  const db = await getSessionClient();
  if (!db) return { response: NextResponse.json({ error: "Not configured." }, { status: 500 }) };

  const member = await getSignedInMember(tenant.siteId);
  if (!member) return { response: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) };
  if (member.status !== "active" || !member.memberId) {
    return { response: NextResponse.json({ error: "Members only." }, { status: 403 }) };
  }

  return { tenant, member, db };
}
