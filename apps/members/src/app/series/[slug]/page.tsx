import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { Masthead, Footer } from "../../masthead";
import { ArticleList, type LibraryRow } from "../../library/list";

/**
 * One series.
 *
 * At the top level rather than under /library/<slug> on purpose. Nesting it
 * would put series names and article slugs in the same namespace, and an
 * article somebody titled "Series" would then quietly shadow this page. A
 * reserved-word list is the other way to solve that, and it is the kind of rule
 * nobody remembers to check.
 *
 * Order is the position an author gave the piece, then publication date for
 * anything unnumbered, which is what makes a series with three numbered parts
 * and one afterthought still read in a sensible order.
 */
export const dynamic = "force-dynamic";

const SELECT =
  "id, slug, kind, title, summary, body, published_at, unique_readers, series_position," +
  " author:site_members!site_articles_author_id_fkey(id, display_name, profile)";

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
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

  const { data: series } = await db
    .from("site_article_series")
    .select("id, title, description")
    .eq("site_id", tenant.siteId)
    .eq("slug", slug)
    .maybeSingle();

  if (!series) notFound();

  const { data } = await db
    .from("site_articles")
    .select(SELECT)
    .eq("site_id", tenant.siteId)
    .eq("series_id", series.id)
    .eq("status", "published")
    .order("series_position", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: true });

  const rows = (data ?? []) as unknown as LibraryRow[];

  return (
    <>
      <Masthead member={viewer} clubName={tenant.name} current="/library" />

      <main className="list-page">
        <p className="muted small">
          <Link href="/library">Back to the library</Link>
        </p>

        <h1>{series.title as string}</h1>
        {series.description ? <p className="standfirst">{series.description as string}</p> : null}

        {rows.length === 0 ? (
          <p className="notice">
            Nothing has been published in this series yet.{" "}
            <Link href="/write/new">Add the first piece</Link>.
          </p>
        ) : (
          <ArticleList articles={rows} showSeries={false} />
        )}
      </main>
      <Footer clubName={tenant.name} />
    </>
  );
}
