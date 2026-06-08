import { getCurrentRole } from "@/lib/server-auth";

export const metadata = { title: "Client portal" };

// Client portal (spec section 1, surface 2). Built out in Sprints 3 and 5.
// Middleware protects this route when Clerk is configured.
export default async function PortalPage() {
  const role = await getCurrentRole();
  return (
    <section className="bg-stone-white">
      <div className="container-page py-20">
        <p className="eyebrow">Client portal</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">Coming soon</h1>
        <p className="mt-3 max-w-xl text-ink/70">
          Your project dashboard, Spark intake, brief acceptance, and
          deliverable approvals will live here. We are building it now.
        </p>
        {role && (
          <p className="mt-6 text-sm text-ink/50">Signed in as: {role}</p>
        )}
      </div>
    </section>
  );
}
