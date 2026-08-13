import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { ARTICLE_COPY, articleDate, articleMeta, readerCount } from "@/lib/articles";
import { Masthead, Footer } from "../masthead";
import { titleFor } from "@/lib/metadata";

/**
 * Everything you have written.
 *
 * Drafts, published pieces, and anything an administrator has removed, which is
 * here rather than hidden because an author who finds their work simply gone
 * learns nothing from it.
 *
 * The query filters by author for the same reason the library filters by
 * status: not for security, since `site_articles_author_read` in 0023 already
 * limits this to rows the reader wrote, but because "everything in the club"
 * would be a different page.
 */
export const dynamic = "force-dynamic";

export function generateMetadata() {
  return titleFor("What you have written");
}

interface OwnRow {
  id: string;
  slug: string;
  kind: string;
  status: string;
  title: string;
  body: string | null;
  published_at: string | null;
  updated_at: string;
  unique_readers: number | null;
  total_reads: number | null;
}

export default async function WritePage() {
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

  const { data } = await db
    .from("site_articles")
    .select("id, slug, kind, status, title, body, published_at, updated_at, unique_readers, total_reads")
    .eq("site_id", tenant.siteId)
    .eq("author_id", viewer.memberId)
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as OwnRow[];

  return (
    <>
      <Masthead member={viewer} clubName={tenant.name} current="/write" />

      <main className="wide">
        <h1>{ARTICLE_COPY.writeTitle}</h1>
        <p className="muted">{ARTICLE_COPY.writeIntro}</p>

        <p>
          <Link href="/write/new">Start something new</Link>
        </p>

        {rows.length === 0 ? (
          <p className="notice">{ARTICLE_COPY.writeEmpty}</p>
        ) : (
          <div className="table-scroll">
            <table className="members">
            <thead>
              <tr>
                <th scope="col">Piece</th>
                <th scope="col">State</th>
                <th scope="col">Readers</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <h3>{row.title}</h3>
                    <span className="muted small">{articleMeta(row)}</span>
                  </td>
                  <td>
                    {row.status === "published" ? (
                      <>
                        Published
                        <br />
                        <span className="muted small">{articleDate(row.published_at)}</span>
                      </>
                    ) : row.status === "removed" ? (
                      <span className="removed">Removed by an administrator</span>
                    ) : (
                      "Draft"
                    )}
                  </td>
                  <td className="muted small">
                    {row.status === "published" ? (
                      <>
                        {readerCount(row)}
                        {(row.total_reads ?? 0) > (row.unique_readers ?? 0) ? (
                          <>
                            <br />
                            {row.total_reads} openings
                          </>
                        ) : null}
                      </>
                    ) : (
                      <span className="muted">Not yet</span>
                    )}
                  </td>
                  <td>
                    {row.status === "removed" ? (
                      <span className="muted small">Nothing to do here</span>
                    ) : (
                      <>
                        <Link href={`/write/${row.id}`}>Edit</Link>
                        {row.status === "published" ? (
                          <>
                            <span className="dot"> / </span>
                            <Link href={`/library/${row.slug}`}>Read</Link>
                          </>
                        ) : null}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer clubName={tenant.name} />
    </>
  );
}
