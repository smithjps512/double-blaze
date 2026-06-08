import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/server-auth";
import { isStaffRole } from "@/lib/auth";

export const metadata = { title: "Execution portal" };

// Execution portal (spec section 1, surface 3). Staff only. Built in Sprint 4.
export default async function ExecutionPage() {
  const role = await getCurrentRole();
  // When Clerk is on, a signed-in non-staff user is sent to the client portal.
  if (role && !isStaffRole(role)) {
    redirect("/portal");
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
        {role && (
          <p className="mt-6 text-sm text-ink/50">Signed in as: {role}</p>
        )}
      </div>
    </section>
  );
}
