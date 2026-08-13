import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { ARTICLE_COPY } from "@/lib/articles";
import { Masthead, Footer } from "../masthead";
import { ArticleList, type LibraryRow } from "./list";
import { titleFor } from "@/lib/metadata";

/**
 * The gated library.
 *
 * "Access media" is one of the brief's core features and this is the front of
 * it: everything the membership has published, in one list, visible to nobody
 * outside the club.
 *
 * The query does no filtering of its own beyond the tenant. `site_articles_library_read`
 * from 0023 already restricts this to published articles in the reader's own
 * club, so a draft is absent from the result set rather than removed from it
 * afterwards, and a lapsed guest gets an empty library because they are no
 * longer an active member. Adding a status filter here would suggest the
 * filtering happens in this file, which is the misunderstanding that leads
 * somebody to delete it later.
 *
 * One thing to know when reading this: an author's own drafts DO satisfy
 * `site_articles_author_read`, so the explicit `status` filter below is not
 * security, it is the difference between a library and a library with your own
 * unfinished work in it.
 */
export const dynamic = "force-dynamic";

export function generateMetadata() {
  return titleFor("The library");
}

/**
 * The author is embedded, because it is a plain single-column reference and
 * PostgREST resolves it from the constraint name.
 *
 * The series deliberately is not. Its reference is composite, (series_id,
 * site_id) against (id, site_id), which is what stops one club's article being
 * filed under another club's shelf. That is worth having, and it makes the
 * embed the one part of this page that could not be exercised from the sandbox,
 * because the egress proxy refuses a request to the live API. So the series are
 * fetched separately, which this page needs anyway for the shelves, and joined
 * below.
 */
const SELECT =
  "id, slug, kind, title, summary, body, published_at, unique_readers, series_id, series_position," +
  " author:site_members!site_articles_author_id_fkey(id, display_name, profile)";

export default async function LibraryPage() {
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  if (!isAuthConfigured()) {
    return (
      <main>
        <h1>{tenant.name}</h1>
        <p className="notice">The member area is not configured yet.</p>
      </main>
    );
  }

  const viewer = await getSignedInMember(tenant.siteId);
  if (!viewer) redirect("/sign-in");
  if (!viewer.memberId) redirect("/join");
  if (viewer.status !== "active") redirect("/");

  const db = await getSessionClient();
  if (!db) notFound();

  const [{ data: articles, error }, { data: series }] = await Promise.all([
    db
      .from("site_articles")
      .select(SELECT)
      .eq("site_id", tenant.siteId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(200),
    db
      .from("site_article_series")
      .select("id, title, slug, description")
      .eq("site_id", tenant.siteId)
      .order("title", { ascending: true }),
  ]);

  // An empty library and a failed query look identical to a reader, and only
  // one of them is worth waking somebody up about.
  if (error) console.error(`[members] library query failed on ${tenant.slug}: ${error.message}`);

  const shelves = (series ?? []) as { id: string; title: string; slug: string; description: string | null }[];
  const byId = new Map(shelves.map((shelf) => [shelf.id, shelf]));

  const rows = ((articles ?? []) as unknown as LibraryRow[]).map((row) => ({
    ...row,
    series: row.series_id ? (byId.get(row.series_id) ?? null) : null,
  }));

  return (
    <>
      <Masthead member={viewer} clubName={tenant.name} current="/library" />

      <main className="list-page">
        <h1>{ARTICLE_COPY.libraryTitle}</h1>
        <p className="muted">{ARTICLE_COPY.libraryIntro}</p>

        {shelves.length > 0 ? (
          <ul className="shelves">
            <li className="shelf-label" aria-hidden="true">
              Series
            </li>
            {shelves.map((shelf) => (
              <li key={shelf.id}>
                <Link href={`/series/${shelf.slug}`}>{shelf.title}</Link>
              </li>
            ))}
          </ul>
        ) : null}

        {rows.length === 0 ? (
          <p className="notice">
            {ARTICLE_COPY.libraryEmpty} <Link href="/write/new">Write the first one</Link>.
          </p>
        ) : (
          <ArticleList articles={rows} />
        )}
      </main>
      <Footer clubName={tenant.name} />
    </>
  );
}
