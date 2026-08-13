import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { profileHeadline, type Profile } from "@/lib/profile";
import { Nav } from "../nav";

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
    <main className="wide">
      <Nav member={viewer} current="/directory" />

      <h1>Members</h1>
      <p className="muted">
        {members.length === 1
          ? "You are the first member. The directory fills up as people join."
          : `${members.length} people, visible only to each other.`}
      </p>

      <ul className="directory">
        {members.map((row) => {
          const profile = row.profile ?? {};
          const headline = profileHeadline(profile);
          const name = row.display_name ?? "A member";
          return (
            <li key={row.id}>
              <Link href={`/members/${row.id}`}>
                {profile.photo_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="avatar" src={`/api/media/${profile.photo_path}`} alt="" />
                ) : (
                  <span className="avatar placeholder" aria-hidden="true">
                    {name.trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="who">
                  <strong>
                    {name}
                    {row.id === viewer.memberId ? <span className="you">you</span> : null}
                    {row.role === "guest" ? <span className="you">guest</span> : null}
                  </strong>
                  {headline ? <span className="muted">{headline}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
