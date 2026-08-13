import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import type { Profile } from "@/lib/profile";
import { Masthead, Footer } from "../masthead";
import { titleFor } from "@/lib/metadata";

/**
 * The member directory.
 *
 * "Connect with members" is one of the brief's core features, and this is the
 * front of it. Session 7 adds the connections themselves; this is the page that
 * makes them possible by letting one member find another.
 *
 * The query does almost nothing, and that is deliberate. `site_members_directory_read`
 * from 0013 already restricts this to active members of the reader's own club
 * who have not hidden themselves, so a hidden member is absent from the result
 * set rather than filtered out of it afterwards. Adding a status filter here
 * would suggest the filtering happens in this file, which is exactly the
 * misunderstanding that leads somebody to remove it later.
 */
export const dynamic = "force-dynamic";

export function generateMetadata() {
  return titleFor("Members");
}

interface DirectoryRow {
  id: string;
  display_name: string | null;
  role: string;
  profile: Profile | null;
}

export default async function DirectoryPage() {
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
    .from("site_members")
    .select("id, display_name, role, profile")
    .eq("site_id", tenant.siteId)
    .order("display_name", { ascending: true });

  const members = (data ?? []) as DirectoryRow[];

  return (
    <>
      <Masthead member={viewer} clubName={tenant.name} current="/directory" />

      <main className="wide">
        <h1>Members</h1>
        <p className="muted">
          {members.length === 1
            ? "You are the first member. The directory fills up as people join."
            : `${members.length} people, visible only to each other.`}
        </p>

        {/* Cards rather than rows. A directory is the page where somebody
            decides whether to reach out, so each person gets enough room to be
            a person: a face, a role, an employer, and where they are. */}
        <ul className="directory">
          {members.map((row) => {
            const profile = row.profile ?? {};
            const name = row.display_name ?? "A member";
            return (
              <li key={row.id}>
                <Link href={`/members/${row.id}`}>
                  {profile.photo_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="avatar lg" src={`/api/media/${profile.photo_path}`} alt="" />
                  ) : (
                    <span className="avatar lg" aria-hidden="true">
                      {name.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="person-name">
                    {name}
                    {row.id === viewer.memberId ? <span className="you">you</span> : null}
                    {row.role === "guest" ? <span className="you">guest</span> : null}
                  </span>
                  {profile.title ? <span className="person-role">{profile.title}</span> : null}
                  {profile.employer ? <span className="muted small">{profile.employer}</span> : null}
                  {profile.location ? (
                    <span className="muted small place">{profile.location}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
      <Footer clubName={tenant.name} />
    </>
  );
}
