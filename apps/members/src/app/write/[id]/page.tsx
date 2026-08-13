import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { embedWatchUrl, type ArticleKind } from "@/lib/articles";
import { Nav } from "../../nav";
import { ArticleEditor, type SeriesOption } from "../editor";

/**
 * Editing a piece you wrote.
 *
 * No ownership check in this file. The read runs under the author's own
 * session, and `site_articles_author_read` from 0023 is what decides: somebody
 * else's article does not come back, and the page 404s. The same rule the
 * profile and directory pages follow.
 *
 * The video URL is rebuilt from the provider and the id rather than stored, so
 * an author editing a video piece sees a link that works rather than an empty
 * box. It is the canonical form of what they pasted, which is the honest thing
 * to show them.
 */
export const dynamic = "force-dynamic";

interface EditableArticle {
  id: string;
  slug: string;
  kind: string;
  status: string;
  title: string | null;
  summary: string | null;
  body: string | null;
  media_path: string | null;
  media_bytes: number | null;
  embed_provider: string | null;
  embed_id: string | null;
  series_id: string | null;
  series_position: number | null;
  author_id: string;
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await resolveTenant();
  if (!tenant) notFound();
  if (!isAuthConfigured()) notFound();

  const viewer = await getSignedInMember(tenant.siteId);
  if (!viewer) redirect("/sign-in");
  if (!viewer.memberId) redirect("/join");
  if (viewer.status !== "active") redirect("/");

  const { id } = await params;
  const db = await getSessionClient();
  if (!db) notFound();

  const [{ data: row }, { data: series }] = await Promise.all([
    db
      .from("site_articles")
      .select(
        "id, slug, kind, status, title, summary, body, media_path, media_bytes," +
          " embed_provider, embed_id, series_id, series_position, author_id",
      )
      .eq("site_id", tenant.siteId)
      .eq("id", id)
      .maybeSingle(),
    db
      .from("site_article_series")
      .select("id, title")
      .eq("site_id", tenant.siteId)
      .order("title", { ascending: true }),
  ]);

  if (!row) notFound();
  const article = row as unknown as EditableArticle;

  // An administrator opening somebody else's piece can read it through
  // site_articles_admin_all, and this is not the page for that. Removal lives
  // on the article itself.
  if (article.author_id !== viewer.memberId) redirect(`/library/${article.slug}`);

  return (
    <main>
      <Nav member={viewer} current="/write" />

      <p className="muted small">
        <Link href="/write">Back to what you have written</Link>
        {article.status === "published" ? (
          <>
            <span className="dot"> / </span>
            <Link href={`/library/${article.slug}`}>Read it as others see it</Link>
          </>
        ) : null}
      </p>

      <h1>Editing</h1>

      <ArticleEditor
        series={(series ?? []) as SeriesOption[]}
        initial={{
          id: article.id,
          kind: article.kind as ArticleKind,
          status: article.status as "draft" | "published" | "removed",
          slug: article.slug,
          title: article.title ?? "",
          summary: article.summary ?? "",
          body: article.body ?? "",
          video_url: embedWatchUrl(article.embed_provider, article.embed_id) ?? "",
          series_id: article.series_id ?? "",
          series_position: article.series_position ? String(article.series_position) : "",
          media_path: article.media_path,
          media_bytes: article.media_bytes,
        }}
      />
    </main>
  );
}
