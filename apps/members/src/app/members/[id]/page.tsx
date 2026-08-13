import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { profileHeadline, profileLinks, PROFILE_FIELDS, type Profile } from "@/lib/profile";
import { Nav } from "../../nav";

/**
 * One member's profile, as another member sees it.
 *
 * There is no visibility check in this file. The read runs under the viewer's
 * session, so `site_members_directory_read` decides: a hidden member, a member
 * of another club, or a row that is not active simply does not come back, and
 * the page 404s. Anything this file added would be a second opinion that could
 * disagree with the policy, which is worse than none.
 */
export const dynamic = "force-dynamic";

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data } = await db
    .from("site_members")
    .select("id, display_name, role, profile, approved_at, created_at")
    .eq("site_id", tenant.siteId)
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const profile = (data.profile ?? {}) as Profile;
  const name = (data.display_name as string | null) ?? "A member";
  const headline = profileHeadline(profile);
  const isSelf = data.id === viewer.memberId;

  // The long-form fields, rendered in the order the form asks them, and only
  // the ones that were answered. An empty profile shows as an empty profile
  // rather than a page of blank headings.
  const sections = PROFILE_FIELDS.filter(
    (field) => field.kind === "textarea" && field.key !== "links" && profile[field.key],
  );
  const links = profileLinks(profile.links);

  return (
    <main>
      <Nav member={viewer} current="/directory" />

      <p className="muted">
        <Link href="/directory">Back to members</Link>
      </p>

      <div className="profile-head">
        {profile.photo_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar large" src={`/api/media/${profile.photo_path}`} alt="" />
        ) : (
          <span className="avatar large placeholder" aria-hidden="true">
            {name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <h1>{name}</h1>
          {headline ? <p className="muted">{headline}</p> : null}
          {profile.location ? <p className="muted">{profile.location}</p> : null}
          {data.role === "guest" ? (
            <p className="muted">
              A guest of the club, here to contribute for a set period.
            </p>
          ) : null}
        </div>
      </div>

      {isSelf ? (
        <p className="notice">
          This is your profile as others see it. <Link href="/profile">Edit it</Link>.
        </p>
      ) : null}

      {sections.map((field) => (
        <section key={field.key}>
          <h2>{field.label}</h2>
          <p className="prose">{profile[field.key]}</p>
        </section>
      ))}

      {links.length > 0 ? (
        <section>
          <h2>Elsewhere</h2>
          <ul className="links">
            {links.map((link, i) => (
              <li key={i}>
                {link.href ? (
                  // Member-supplied, so it leaves no referrer and cannot reach
                  // back into this tab through window.opener.
                  <a href={link.href} rel="noopener noreferrer nofollow" target="_blank">
                    {link.text}
                  </a>
                ) : (
                  link.text
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {sections.length === 0 && links.length === 0 ? (
        <p className="notice">
          {isSelf
            ? "You have not written a profile yet. It is what other members see."
            : `${name} has not written a profile yet.`}
        </p>
      ) : null}
    </main>
  );
}
