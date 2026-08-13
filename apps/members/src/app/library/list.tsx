import Link from "next/link";
import { articleDate, articleMeta, readerCount } from "@/lib/articles";
import type { Profile } from "@/lib/profile";

/**
 * One row in the library, and the list of them.
 *
 * Shared by the library and by a series page so the two cannot drift, in the
 * same spirit as the field definitions living in lib/. A server component,
 * because nothing here is interactive.
 *
 * The author may be null. `site_members_directory_read` from 0013 is what
 * decides whether the embedded profile comes back, and a member who has hidden
 * themselves is absent from the result rather than filtered out of it. So a
 * hidden author's work is attributed to "a member", which is the honest reading
 * of what hidden means and not a bug to route around here.
 */
export interface LibraryAuthor {
  id: string;
  display_name: string | null;
  profile: Profile | null;
}

export interface LibraryRow {
  id: string;
  slug: string;
  kind: string;
  title: string;
  summary: string | null;
  body: string | null;
  published_at: string | null;
  unique_readers: number | null;
  series_id?: string | null;
  series_position: number | null;
  /** Joined in the page rather than embedded. See the note in library/page.tsx. */
  series?: { id: string; title: string; slug: string } | null;
  author?: LibraryAuthor | null;
}

export function AuthorLine({ author }: { author?: LibraryAuthor | null }) {
  const name = author?.display_name ?? "A member";
  const photo = author?.profile?.photo_path;

  const face = photo ? (
    // next/image is not used anywhere in this app: every photo is served by our
    // own authenticated proxy from a private bucket, which the optimizer cannot
    // reach.
    // eslint-disable-next-line @next/next/no-img-element
    <img className="avatar" src={`/api/media/${photo}`} alt="" />
  ) : (
    <span className="avatar" aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );

  return (
    <span className="byline-inline">
      {face}
      {author ? <Link href={`/members/${author.id}`}>{name}</Link> : <span>{name}</span>}
    </span>
  );
}

export function ArticleList({
  articles,
  showSeries = true,
}: {
  articles: LibraryRow[];
  showSeries?: boolean;
}) {
  return (
    <ul className="library">
      {articles.map((article, index) => (
        // The newest piece leads. Only in the library: inside a series the
        // first part is not more important than the rest of it.
        <li key={article.id} className={index === 0 && showSeries ? "lead" : undefined}>
          <p className="kind">
            <span className={`tag ${article.kind}`}>{articleMeta(article)}</span>
            {showSeries && article.series ? (
              <>
                <span className="dot"> / </span>
                <Link href={`/series/${article.series.slug}`}>{article.series.title}</Link>
              </>
            ) : null}
            {!showSeries && article.series_position ? (
              <>
                <span className="dot"> / </span>
                <span className="muted">Part {article.series_position}</span>
              </>
            ) : null}
          </p>

          <h2>
            <Link href={`/library/${article.slug}`}>{article.title}</Link>
          </h2>

          {article.summary ? <p className="summary">{article.summary}</p> : null}

          <p className="muted small">
            <AuthorLine author={article.author} />
            {article.published_at ? (
              <>
                <span className="dot"> / </span>
                {articleDate(article.published_at)}
              </>
            ) : null}
            <span className="dot"> / </span>
            {readerCount(article)}
          </p>
        </li>
      ))}
    </ul>
  );
}
