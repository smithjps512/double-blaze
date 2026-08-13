import "server-only";
import { createHash } from "node:crypto";
import {
  getServiceClient,
  versionPrefix,
  ARTIFACT_BUCKET,
  type BuildManifest,
  type ManifestPage,
} from "@double-blaze/site-db";
import { renderSite } from "@double-blaze/site-render";
import { isSiteContent, type SiteContent } from "@double-blaze/site-schema";

/**
 * Publishing: render a version, write its artifacts to storage, then move the
 * pointer.
 *
 * The ordering is the whole design. Artifacts are written under an immutable
 * `{site_id}/{version_id}/` prefix *before* `sites.live_version_id` changes, so
 * at no point is the pointer aimed at files that do not exist yet. Because each
 * version's files are written to their own prefix and never overwritten, the
 * previous version is still sitting in storage untouched, which is what makes
 * rollback a single column update rather than a rebuild.
 *
 * This replaces the Trailhead approach of overwriting `built_content` in place,
 * where a client who disliked a change had no way back.
 */

export interface PublishResult {
  ok: boolean;
  error?: string;
  versionId?: string;
  pageCount?: number;
}

function hash(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

/**
 * Build a version: render its content and write the artifacts. Does not
 * publish. Leaves the version at `preview` so it can be reviewed before
 * anything the public sees changes.
 */
export async function buildVersion(versionId: string): Promise<PublishResult> {
  const db = getServiceClient();
  if (!db) return { ok: false, error: "Supabase is not configured." };

  const { data: version, error } = await db
    .from("site_versions")
    .select("id, site_id, content, status")
    .eq("id", versionId)
    .maybeSingle();

  if (error || !version) return { ok: false, error: "Version not found." };

  const content = version.content as unknown;
  if (!isSiteContent(content)) {
    return { ok: false, error: "Version content is not valid site content." };
  }

  await db.from("site_versions").update({ status: "building" }).eq("id", versionId);

  const siteId = version.site_id as string;

  // Assets resolve to a path served by the runtime rather than a storage URL.
  // Storage URLs are signed and expiring, so baking one into a cached artifact
  // would produce pages that work for an hour and then quietly break.
  const rendered = renderSite(content as SiteContent, {
    linkStyle: "live",
    assetUrl: (assetId) => `/_assets/${assetId}`,
  });

  if (rendered.length === 0) {
    await db.from("site_versions").update({ status: "draft" }).eq("id", versionId);
    return { ok: false, error: "Version has no pages to render." };
  }

  const prefix = versionPrefix(siteId, versionId);
  const pages: ManifestPage[] = [];

  for (const page of rendered) {
    const { error: uploadError } = await db.storage
      .from(ARTIFACT_BUCKET)
      .upload(`${prefix}/${page.filename}`, page.html, {
        contentType: "text/html; charset=utf-8",
        // Artifacts are immutable per version, so an upsert only ever happens
        // when rebuilding the same version, and overwriting is then correct.
        upsert: true,
      });

    if (uploadError) {
      await db.from("site_versions").update({ status: "draft" }).eq("id", versionId);
      return { ok: false, error: `Could not write ${page.filename}: ${uploadError.message}` };
    }

    pages.push({
      slug: page.slug,
      filename: page.filename,
      title: page.title,
      hash: hash(page.html),
    });
  }

  const manifest: BuildManifest = {
    version: 1,
    pages,
    generatedAt: new Date().toISOString(),
  };

  const { error: manifestError } = await db
    .from("site_versions")
    .update({ built_manifest: manifest, status: "preview" })
    .eq("id", versionId);

  if (manifestError) {
    return { ok: false, error: `Could not record the manifest: ${manifestError.message}` };
  }

  return { ok: true, versionId, pageCount: pages.length };
}

/**
 * Publish a built version: point the site at it.
 *
 * Refuses to publish a version with no manifest. Without that guard the pointer
 * could be moved to a version whose artifacts were never written, which serves
 * 404s from a site that reports itself as published.
 */
export async function publishVersion(versionId: string): Promise<PublishResult> {
  const db = getServiceClient();
  if (!db) return { ok: false, error: "Supabase is not configured." };

  const { data: version } = await db
    .from("site_versions")
    .select("id, site_id, built_manifest")
    .eq("id", versionId)
    .maybeSingle();

  if (!version) return { ok: false, error: "Version not found." };
  if (!version.built_manifest) {
    return { ok: false, error: "Version has not been built. Build it before publishing." };
  }

  const now = new Date().toISOString();

  // Retire whatever was live. Archiving rather than deleting keeps the old
  // artifacts in storage, which is exactly what rollback needs.
  const { data: site } = await db
    .from("sites")
    .select("live_version_id")
    .eq("id", version.site_id)
    .maybeSingle();

  if (site?.live_version_id && site.live_version_id !== versionId) {
    await db
      .from("site_versions")
      .update({ status: "archived" })
      .eq("id", site.live_version_id);
  }

  const { error: versionError } = await db
    .from("site_versions")
    .update({ status: "published", published_at: now })
    .eq("id", versionId);
  if (versionError) return { ok: false, error: versionError.message };

  // The pointer moves last. Until this line, the public is still being served
  // the previous version.
  const { error: pointerError } = await db
    .from("sites")
    .update({ live_version_id: versionId, status: "published" })
    .eq("id", version.site_id);
  if (pointerError) return { ok: false, error: pointerError.message };

  return { ok: true, versionId };
}

/** Build and publish in one step, for the common case. */
export async function buildAndPublish(versionId: string): Promise<PublishResult> {
  const built = await buildVersion(versionId);
  if (!built.ok) return built;
  const published = await publishVersion(versionId);
  return published.ok ? { ...published, pageCount: built.pageCount } : published;
}

/**
 * Roll back to a previously published version.
 *
 * A pointer move, nothing more. The target's artifacts were never deleted, so
 * there is no rebuild and no model call, and the bytes served after a rollback
 * are exactly the bytes that were live before.
 */
export async function rollbackTo(
  siteId: string,
  versionId: string,
): Promise<PublishResult> {
  const db = getServiceClient();
  if (!db) return { ok: false, error: "Supabase is not configured." };

  const { data: version } = await db
    .from("site_versions")
    .select("id, site_id, built_manifest")
    .eq("id", versionId)
    .maybeSingle();

  if (!version || version.site_id !== siteId) {
    return { ok: false, error: "Version does not belong to this site." };
  }
  if (!version.built_manifest) {
    return { ok: false, error: "That version was never built, so there is nothing to serve." };
  }

  return publishVersion(versionId);
}

/**
 * Create the next version of a site's content.
 *
 * Version numbers are allocated from the current maximum rather than a count,
 * so deleting an old version cannot cause a number to be reused and make the
 * history read wrongly.
 */
export async function createVersion(
  siteId: string,
  content: SiteContent,
  notes?: string,
): Promise<{ ok: boolean; versionId?: string; error?: string }> {
  const db = getServiceClient();
  if (!db) return { ok: false, error: "Supabase is not configured." };

  const { data: latest } = await db
    .from("site_versions")
    .select("version_number")
    .eq("site_id", siteId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = ((latest?.version_number as number | undefined) ?? 0) + 1;

  const { data, error } = await db
    .from("site_versions")
    .insert({
      site_id: siteId,
      version_number: nextNumber,
      content,
      status: "draft",
      notes: notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create the version." };
  }
  return { ok: true, versionId: data.id as string };
}
