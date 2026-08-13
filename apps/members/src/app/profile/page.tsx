import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { prefillFromJoinAnswers, profileCompleteness, type Profile } from "@/lib/profile";
import { Nav } from "../nav";
import { ProfileForm } from "./form";

/**
 * Editing your own profile, and the first thing a new member is sent to.
 *
 * The brief: "Once a member, the first prompt is to create a profile", because
 * the profile is where engagement starts and it is what an article is published
 * under.
 *
 * A member with no profile yet sees one prefilled from their join answers, so
 * their first sight of it is half filled rather than blank. An invited member
 * answered no questions, so theirs is empty, which is the honest result.
 */
export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
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

  const member = await getSignedInMember(tenant.siteId);
  if (!member) redirect("/sign-in");
  if (!member.memberId) redirect("/join");
  if (member.status !== "active") redirect("/");

  const { welcome } = await searchParams;
  const stored = (member.profile ?? {}) as Profile;
  const completeness = profileCompleteness(stored);

  // Prefill only when there is nothing to overwrite. Filling an edited profile
  // with answers given months ago would be worse than an empty form.
  const initial: Profile =
    completeness.filled === 0 ? prefillFromJoinAnswers(member.joinAnswers) : stored;

  const first = welcome === "1" || completeness.filled === 0;

  return (
    <main>
      <Nav member={member} current="/profile" />

      <h1>{first ? "Welcome. Tell the club who you are." : "Your profile"}</h1>

      {first ? (
        <p>
          This is what other members see, and it is what anything you publish
          appears under. None of it is required, and you can change any of it
          later.
        </p>
      ) : (
        <p className="muted">
          Visible to other members of {tenant.name}. Nothing here is public.
        </p>
      )}

      {initial.employer || initial.title ? (
        <p className="notice">
          We have filled in what you told us when you joined. Change anything
          that is not right.
        </p>
      ) : null}

      <ProfileForm
        initial={initial}
        displayName={member.displayName ?? ""}
        memberId={member.memberId}
      />
    </main>
  );
}
