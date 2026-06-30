import { auth } from "@clerk/nextjs/server";
import { getCurrentRole } from "@/lib/server-auth";
import { isClerkEnabled } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getAppUserOrg, loadPortalState, type PortalState } from "@/lib/trail-run-build";
import { SparkIntake } from "@/components/SparkIntake";

export const metadata = { title: "Client portal" };
export const dynamic = "force-dynamic";

// Client portal (spec section 1, surface 2). Trail Run clients run Spark intake
// here; the build workspace and lifecycle views arrive in later sprints.
export default async function PortalPage() {
  const role = await getCurrentRole();

  let state: PortalState | null = null;
  if (isClerkEnabled) {
    const { userId } = await auth();
    const db = getSupabaseServiceClient();
    if (userId && db) {
      const appUser = await getAppUserOrg(db, userId);
      if (appUser?.organizationId) {
        state = await loadPortalState(db, appUser.organizationId);
      }
    }
  }

  if (state?.phase === "intake") {
    return (
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <p className="eyebrow">Trail Run intake</p>
          <h1 className="mt-3 text-3xl font-bold text-ink">Let us get you set up</h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Spark, our intake assistant, will ask a few questions so we can build
            your Blue Trail solution. It takes a few minutes, and you can come
            back anytime, your answers are saved.
          </p>
          <div className="mt-8 max-w-2xl">
            <SparkIntake initialMessages={state.transcript} initialReady={state.ready} />
          </div>
        </div>
      </section>
    );
  }

  if (state?.phase === "building") {
    return (
      <section className="bg-stone-white">
        <div className="container-page py-20">
          <p className="eyebrow">Trail Run</p>
          <h1 className="mt-3 text-3xl font-bold text-ink">We are building your solution</h1>
          <p className="mt-3 max-w-xl text-ink/70">
            Thanks for completing intake. Our team has your build brief and is
            putting your Blue Trail solution together. Your 30-day window starts
            the day it goes live, and we will keep you posted along the way.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-stone-white">
      <div className="container-page py-20">
        <p className="eyebrow">Client portal</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">Coming soon</h1>
        <p className="mt-3 max-w-xl text-ink/70">
          Your project dashboard, results, and account controls will live here.
        </p>
        {role && <p className="mt-6 text-sm text-ink/50">Signed in as: {role}</p>}
      </div>
    </section>
  );
}
