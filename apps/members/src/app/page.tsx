import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { summarizeJoinAnswers } from "@/lib/join";
import { profileCompleteness, type Profile } from "@/lib/profile";
import { Nav } from "./nav";

/**
 * The member area's front door. Its only job is to route by membership status,
 * because every state below is a real one someone will land in:
 *
 *   no session        -> sign in
 *   session, no row   -> the join questionnaire
 *   pending           -> waiting on a human
 *   declined          -> a plain answer rather than a silent dead end
 *   suspended         -> told, and told who to contact
 *   active            -> the member area (session 4 onward)
 *
 * Status is read from the database under the member's own session rather than
 * trusted from anything in the request, so an expired guest or a suspended
 * member cannot hold a stale view of their own access.
 */
export default async function MemberHome() {
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

  // Authenticated, and no membership row for this club. They have proved an
  // address and not applied yet, which is exactly what the questionnaire is
  // for.
  if (!member.memberId) redirect("/join");

  if (member.status === "pending") {
    const answers = summarizeJoinAnswers(member.joinAnswers);
    return (
      <main>
        <h1>Your request is with an administrator</h1>
        <p>
          Thank you for applying to {tenant.name}. A person reads every request,
          and most are answered within a few days.
        </p>
        <p className="muted">
          We will email <strong>{member.email}</strong> as soon as there is an
          answer.
        </p>

        {/* Read back what they sent. An applicant who cannot see their own
            answers has no way to tell a submitted form from a lost one, and
            the wait here is measured in days. */}
        {answers.length > 0 ? (
          <>
            <h2>What you told us</h2>
            <dl className="answers">
              {member.displayName ? (
                <div>
                  <dt>Your name</dt>
                  <dd>{member.displayName}</dd>
                </div>
              ) : null}
              {answers.map((answer) => (
                <div key={answer.key}>
                  <dt>{answer.label}</dt>
                  <dd>{answer.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}
      </main>
    );
  }

  if (member.status === "declined") {
    return (
      <main>
        <h1>Your request was not approved</h1>
        <p>
          Membership is limited to people working in or around the electric grid
          and the AI industry. If you believe this was a mistake, reply to the
          email we sent and an administrator will take another look.
        </p>
      </main>
    );
  }

  if (member.status === "suspended") {
    return (
      <main>
        <h1>Your membership is on hold</h1>
        <p>
          An administrator has suspended this account. Reply to any email from
          {" "}
          {tenant.name} and someone will explain why.
        </p>
      </main>
    );
  }

  // The brief: "Once a member, the first prompt is to create a profile." A
  // member with nothing written is sent there rather than shown a home page
  // they have no way to take part in yet.
  const completeness = profileCompleteness((member.profile ?? {}) as Profile);
  if (completeness.filled === 0) redirect("/profile?welcome=1");

  return (
    <main>
      <Nav member={member} current="/" />

      <h1>Welcome{member.displayName ? `, ${member.displayName}` : ""}</h1>
      <p>You are an active member of {tenant.name}.</p>

      {!completeness.enough ? (
        <p className="notice">
          Your profile is still thin. A photo or a few lines on what you work on
          is what makes other members reach out.{" "}
          <Link href="/profile">Finish it</Link>.
        </p>
      ) : null}

      <p>
        <Link href="/directory">See who else is here</Link>.
      </p>

      {member.role === "admin" ? (
        <p className="notice">
          You administer this club. <Link href="/admin">Membership requests</Link> are
          reviewed there, and you are emailed whenever one arrives.
        </p>
      ) : null}

      <p className="muted">
        Articles, events, and connections arrive in the sessions after this one.
      </p>
    </main>
  );
}
