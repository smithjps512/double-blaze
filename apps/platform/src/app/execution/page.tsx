import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentRole } from "@/lib/server-auth";
import { isStaffRole, isClerkEnabled } from "@/lib/auth";
import { getLeadScope, type LeadScope } from "@/lib/regions-db";

export const metadata = { title: "Execution portal" };

// Execution portal (spec section 1, surface 3). Staff only. Built in Sprint 4.
// A project lead's board is scoped to their region's clients and projects;
// leads without an active region see the central inbox (task item 4).
export default async function ExecutionPage() {
  const role = await getCurrentRole();
  // When Clerk is on, a signed-in non-staff user is sent to the client portal.
  if (role && !isStaffRole(role)) {
    redirect("/portal");
  }

  let scope: LeadScope | null = null;
  if (isClerkEnabled && role === "project_lead") {
    const { userId } = await auth();
    if (userId) scope = await getLeadScope(userId);
  }

  return (
    <section className="bg-stone-white">
      <div className="container-page py-20">
        <p className="eyebrow">Execution portal</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">Coming soon</h1>
        <p className="mt-3 max-w-xl text-ink/70">
          Incoming briefs, the project board, deliverable management, and the
          project-lead calendar will live here.
        </p>

        {scope && <LeadScopeCard scope={scope} />}

        {role && (
          <p className="mt-6 text-sm text-ink/50">Signed in as: {role}</p>
        )}
      </div>
    </section>
  );
}

function LeadScopeCard({ scope }: { scope: LeadScope }) {
  return (
    <div className="mt-8 max-w-xl rounded-xl border border-ink/10 bg-ink/[0.02] p-6">
      {scope.isCentralInbox ? (
        <>
          <h2 className="text-lg font-bold text-ink">Central inbox</h2>
          <p className="mt-1 text-sm text-ink/70">
            You are not assigned to an active region, so you see unassigned work
            in the central inbox.
          </p>
          <dl className="mt-4 text-sm">
            <div className="flex justify-between border-t border-ink/10 py-2">
              <dt className="text-ink/60">Unassigned projects</dt>
              <dd className="font-semibold text-ink">{scope.projectCount}</dd>
            </div>
          </dl>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold text-ink">Your region</h2>
          <p className="mt-1 text-sm text-ink/70">
            Your board is scoped to{" "}
            {scope.regions.map((r) => r.name).join(", ")}.
          </p>
          <dl className="mt-4 text-sm">
            <div className="flex justify-between border-t border-ink/10 py-2">
              <dt className="text-ink/60">Clients</dt>
              <dd className="font-semibold text-ink">{scope.clientCount}</dd>
            </div>
            <div className="flex justify-between border-t border-ink/10 py-2">
              <dt className="text-ink/60">Projects</dt>
              <dd className="font-semibold text-ink">{scope.projectCount}</dd>
            </div>
          </dl>
        </>
      )}
    </div>
  );
}
