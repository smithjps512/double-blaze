import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { ARTICLE_COPY } from "@/lib/articles";
import { Masthead, Footer } from "../../masthead";
import { ArticleEditor, type SeriesOption } from "../editor";
import { titleFor } from "@/lib/metadata";

/**
 * A blank piece.
 *
 * Nothing is written to the database until the author saves, so opening this
 * page and changing your mind leaves nothing behind. The one exception is
 * choosing an audio file before saving, which creates the draft first because
 * the upload needs a row to attach to. The editor says so.
 */
export const dynamic = "force-dynamic";

export function generateMetadata() {
  return titleFor("Write something");
}

export default async function NewArticlePage() {
  const tenant = await resolveTenant();
  if (!tenant) notFound();
  if (!isAuthConfigured()) notFound();

  const viewer = await getSignedInMember(tenant.siteId);
  if (!viewer) redirect("/sign-in");
  if (!viewer.memberId) redirect("/join");
  if (viewer.status !== "active") redirect("/");

  const db = await getSessionClient();
  if (!db) notFound();

  const { data } = await db
    .from("site_article_series")
    .select("id, title")
    .eq("site_id", tenant.siteId)
    .order("title", { ascending: true });

  return (
    <>
      <Masthead member={viewer} clubName={tenant.name} current="/write" />

      <main className="reading">
        <p className="muted small">
          <Link href="/write">Back to what you have written</Link>
        </p>

        <h1>{ARTICLE_COPY.newTitle}</h1>

        <ArticleEditor
          series={(data ?? []) as SeriesOption[]}
          initial={{
            id: null,
            kind: "written",
            status: "draft",
            slug: null,
            title: "",
            summary: "",
            body: "",
            video_url: "",
            series_id: "",
            series_position: "",
            media_path: null,
            media_bytes: null,
          }}
        />
      </main>
      <Footer clubName={tenant.name} />
    </>
  );
}
