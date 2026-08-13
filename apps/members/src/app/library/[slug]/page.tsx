import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import {
  ARTICLE_COPY,
  articleDate,
  articleMeta,
  articleParagraphs,
  embedSrc,
  embedWatchUrl,
  readerCount,
} from "@/lib/articles";
import type { Profile } from "@/lib/profile";
import { profileHeadline } from "@/lib/profile";
import { Masthead, Footer } from "../../masthead";
import { RecordRead } from "./record-read";
import { ModerationControls } from "./moderation";
import { titleFor } from "@/lib/metadata";

/**
 * One article.
 *
 * There is no visibility check in this file, and that is the same rule the
 * profile page follows. The read runs under the member's own session, so 0023
 * decides: a draft belonging to somebody else, an article an administrator
 * removed, or one in another club simply does not come back, and the page 404s.
 * A second opinion here could only disagree with the policy, and when it does,
 * the page is what gets trusted.
 *
 * What the file does decide is what to say about a row the reader can see but
 * the library will not show: their own draft, and their own removed piece.
 */
export const dynamic = "force-dynamic";

/**
 * The tab carries the article's title.
 *
 * A second query rather than a shared one, because this runs before the page
 * body and Next does not hand the result across. It selects one indexed column
 * on one row, and an article left open in a tab all afternoon is the case most
 * worth spending it on.
 *
 * It runs under the reader's own session like everything else, so a title
 * cannot leak from a draft or from another club: the row simply does not come
 * back and the tab falls back to the club's name.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const tenant = await resolveTenant();
  const db = await getSessionClient();
  if (!tenant || !db) return titleFor("The library");

  const { slug } = await params;
  const { data } = await db
    .from("site_articles")
    .select("title")
    .eq("site_id", tenant.siteId)
    .eq("slug", slug)
    .maybeSingle();

  return titleFor((data?.title as string) ?? "The library");
}

/** The series is fetched separately, for the reason given in library/page.tsx. */
const SELECT =
  "id, slug, kind, status, title, summary, body, media_path, media_mime, embed_provider," +
  " embed_id, published_at, removed_at, unique_readers, total_reads, series_id, series_position," +
  " author_id," +
  " author:site_members!site_articles_author_id_fkey(id, display_name, profile)";

interface ArticleRow {
  id: string;
  slug: string;
  kind: string;
  status: string;
  title: string;
  summary: string | null;
  body: string | null;
  media_path: string | null;
  media_mime: string | null;
  embed_provider: string | null;
  embed_id: string | null;
  published_at: string | null;
  removed_at: string | null;
  unique_readers: number | null;
  total_reads: number | null;
  series_id: string | null;
  series_position: number | null;
  author_id: string;
  author: { id: string; display_name: string | null; profile: Profile | null } | null;
}

interface SeriesRow {
  id: string;
  title: string;
  slug: string;
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const tenant = await resolveTenant();
  if (!tenant) notFound();
  if (!isAuthConfigured()) notFound();

  const viewer = await getSignedInMember(tenant.siteId);
  if (!viewer) redirect("/sign-in");
  if (!viewer.memberId) redirect("/join");
  if (viewer.status !== "active") redirect("/");

  const { slug } = await params;
  const db = await getSessionClient();
  if (!db) notFound();

  const { data } = await db
    .from("site_articles")
    .select(SELECT)
    .eq("site_id", tenant.siteId)
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  const article = data as unknown as ArticleRow;

  const isAuthor = article.author_id === viewer.memberId;
  const isAdmin = viewer.role === "admin";
  const published = article.status === "published";

  // The series it belongs to, and the rest of it in order so a reader can carry
  // on. Only the published ones: an unfinished part five is not a next step.
  let series: SeriesRow | null = null;
  let siblings: { id: string; slug: string; title: string; series_position: number | null }[] = [];

  if (article.series_id) {
    const [{ data: shelf }, { data: rest }] = await Promise.all([
      db
        .from("site_article_series")
        .select("id, title, slug")
        .eq("site_id", tenant.siteId)
        .eq("id", article.series_id)
        .maybeSingle(),
      db
        .from("site_articles")
        .select("id, slug, title, series_position")
        .eq("site_id", tenant.siteId)
        .eq("series_id", article.series_id)
        .eq("status", "published")
        .order("series_position", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: true }),
    ]);
    series = (shelf ?? null) as SeriesRow | null;
    siblings = (rest ?? []) as typeof siblings;
  }

  const paragraphs = articleParagraphs(article.body);
  const embed = embedSrc(article.embed_provider, article.embed_id);
  const watchUrl = embedWatchUrl(article.embed_provider, article.embed_id);
  const authorName = article.author?.display_name ?? "A member";
  const headline = profileHeadline(article.author?.profile ?? undefined);

  return (
    <>
      <Masthead member={viewer} clubName={tenant.name} current="/library" />

      <main className="reading">
        {/* Counted only when there is something to count: a draft is not a read,
            and the trigger in 0023 refuses one anyway. */}
        {published && !isAuthor ? <RecordRead articleId={article.id} /> : null}

        <p className="muted small">
          <Link href="/library">Back to the library</Link>
          {series ? (
            <>
              <span className="dot"> / </span>
              <Link href={`/series/${series.slug}`}>{series.title}</Link>
            </>
          ) : null}
        </p>

        {article.status === "draft" && isAuthor ? (
          <p className="notice">
            {ARTICLE_COPY.draftNotice} <Link href={`/write/${article.id}`}>Keep working on it</Link>.
          </p>
        ) : null}

        {article.status === "removed" && isAuthor ? (
          <p className="notice error">{ARTICLE_COPY.removedNotice}</p>
        ) : null}

        <p className="kind">
          <span className={`tag ${article.kind}`}>{articleMeta(article)}</span>
          {article.series_position ? (
            <>
              <span className="dot"> / </span>
              <span className="muted">Part {article.series_position}</span>
            </>
          ) : null}
        </p>

        <h1>{article.title}</h1>
        {article.summary ? <p className="standfirst">{article.summary}</p> : null}

        <div className="profile-head byline-block">
          {article.author?.profile?.photo_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatar" src={`/api/media/${article.author.profile.photo_path}`} alt="" />
          ) : (
            <span className="avatar placeholder" aria-hidden="true">
              {authorName.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <p>
              {article.author ? (
                <Link href={`/members/${article.author.id}`}>{authorName}</Link>
              ) : (
                authorName
              )}
            </p>
            <p className="muted small">
              {headline ? (
                <>
                  {headline}
                  <span className="dot"> / </span>
                </>
              ) : null}
              {published ? articleDate(article.published_at) : "Not published"}
            </p>
          </div>
        </div>

        {article.kind === "audio" && article.media_path ? (
          <figure className="player">
            {/* Served by /api/media under the reader's own session, so the bucket
                stays private and a recording is not reachable from outside the
                club. eslint wants a captions track; audio has no video track for
                one, and a transcript belongs in the body below. */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls preload="none" src={`/api/media/${article.media_path}`}>
              Your browser cannot play this recording.
            </audio>
          </figure>
        ) : null}

        {article.kind === "audio" && !article.media_path ? (
          <p className="notice">There is no recording on this one yet.</p>
        ) : null}

        {article.kind === "video" && embed ? (
          <figure className="player video">
            <iframe
              src={embed}
              title={article.title}
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          </figure>
        ) : null}

        {article.kind === "video" && !embed ? (
          <p className="notice">The video on this one cannot be played here.</p>
        ) : null}

        {/* Wrapped, so the drop cap can be scoped to the first paragraph of
            the piece. Without a wrapper the breadcrumb above is the first <p>
            and :first-of-type matches nothing, which is how the cap quietly
            disappeared in the first port of this design. */}
        <div className="article-body">
          {paragraphs.map((paragraph, i) => (
            // Rendered as text in a paragraph, never as markup. A member typing
            // angle brackets gets angle brackets.
            <p key={i} className="prose">
              {paragraph}
            </p>
          ))}
        </div>

        {paragraphs.length === 0 && article.kind === "written" ? (
          <p className="muted">There is nothing written here yet.</p>
        ) : null}

        {watchUrl ? (
          <p className="muted small">
            <a href={watchUrl} rel="noopener noreferrer nofollow" target="_blank">
              Watch it where it is hosted
            </a>
          </p>
        ) : null}

        {siblings.length > 1 && series ? (
          <section className="series-box">
            <h2>{series.title}</h2>
            <ol className="series-list">
              {siblings.map((part) => (
                <li key={part.id} aria-current={part.id === article.id ? "page" : undefined}>
                  {part.id === article.id ? (
                    <span>{part.title}</span>
                  ) : (
                    <Link href={`/library/${part.slug}`}>{part.title}</Link>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {published ? (
          <p className="muted small readers">
            {readerCount(article)}
            {isAuthor && (article.total_reads ?? 0) > (article.unique_readers ?? 0) ? (
              <>
                <span className="dot"> / </span>
                {article.total_reads} openings in all
              </>
            ) : null}
          </p>
        ) : null}

        {isAuthor ? (
          <p className="muted small">
            <Link href={`/write/${article.id}`}>Edit this</Link>
          </p>
        ) : null}

        {isAdmin ? <ModerationControls articleId={article.id} status={article.status} /> : null}
      </main>
      <Footer clubName={tenant.name} />
    </>
  );
}
