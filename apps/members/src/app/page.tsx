import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSignedInMember, isAuthConfigured } from "@/lib/auth";

/**
 * The member area's front door. Its only job is to route by membership status,
 * because every state below is a real one someone will land in:
 *
 *   no session        -> sign in
 *   session, no row   -> the join questionnaire (stage 3c)
 *   pending           -> waiting on a human
 *   declined          -> a plain answer rather than a silent dead end
 *   suspended         -> told, and told who to contact
 *   active            -> the member area (stage 3c onward)
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

  if (!member.memberId) {
    // Authenticated but never applied. The questionnaire arrives in 3c; until
    // then, say so plainly rather than showing an empty member area.
    return (
      <main>
        <h1>One more step</h1>
        <p>
          You are signed in as <strong>{member.email}</strong>.
        </p>
        <p className="notice">
          The membership questionnaire is not built yet. It is the next piece of
          this session.
        </p>
      </main>
    );
  }

  if (member.status === "pending") {
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

  return (
    <main>
      <h1>Welcome{member.displayName ? `, ${member.displayName}` : ""}</h1>
      <p>
        You are an active member of {tenant.name}.
      </p>
      <p className="notice">
        The directory, articles, and events arrive in the sessions after this
        one. Sign-in is what this session proves.
      </p>
    </main>
  );
}
