import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { JoinForm } from "./form";
import { titleFor } from "@/lib/metadata";

/**
 * The join questionnaire.
 *
 * Reached only by someone who has proved an email address and has no membership
 * row for this club. Anyone else is sent where they belong: a visitor with no
 * session to sign in, and a person who already has a row back to the front
 * door, which knows how to render pending, declined, suspended, and active.
 *
 * getSignedInMember is what decides that, and it claims a seeded or invited row
 * on the way past. So an invited member who follows their link never sees this
 * page, which is the brief's rule that an invitation needs no approval.
 */
export function generateMetadata() {
  return titleFor("Request to join");
}

export default async function JoinPage() {
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  if (!isAuthConfigured()) {
    return (
      <main className="reading">
        <h1>{tenant.name}</h1>
        <p className="notice">The member area is not configured yet.</p>
      </main>
    );
  }

  const member = await getSignedInMember(tenant.siteId);
  if (!member) redirect("/sign-in");
  if (member.memberId) redirect("/");

  return (
    <main>
      <h1>Request to join {tenant.name}</h1>
      <p>
        Membership is reviewed by a person, so these answers are what an
        administrator reads. Four questions, and none of them long.
      </p>
      <p className="muted">
        Signed in as <strong>{member.email}</strong>. Your profile, including a
        photo if you want one, comes after you are approved.
      </p>

      <JoinForm />
    </main>
  );
}
