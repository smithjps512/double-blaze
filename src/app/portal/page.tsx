import { redirect } from "next/navigation";
import { getPortalContext } from "@/lib/portal";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getOfferingByKey } from "@/lib/catalog-db";
import { getQuestionSet } from "@/lib/intake-questions";
import { isAnthropicConfigured } from "@/lib/spark";
import { SparkIntake } from "@/components/SparkIntake";
import { BriefReview } from "@/components/BriefReview";

export const metadata = { title: "Client portal" };
export const dynamic = "force-dynamic";

// Client portal (spec section 1, surface 2). Routes the signed-in client into
// Spark intake, brief acceptance, or their accepted-project view depending on
// where their project is in the workflow (spec section 5, steps 3-4).
export default async function PortalPage() {
  const ctx = await getPortalContext();

  // Not configured (no Clerk/Supabase) or not resolvable: keep a calm message
  // so the build and public site are unaffected.
  if (!ctx) {
    return (
      <Shell>
        <p className="eyebrow">Client portal</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">Your portal</h1>
        <p className="mt-3 max-w-xl text-ink/70">
          Sign in to complete your Spark intake, review your project brief, and
          track your deliverables.
        </p>
      </Shell>
    );
  }

  // Staff use the execution portal.
  if (ctx.appUser.is_staff) {
    redirect("/execution");
  }

  // No project yet (account still being provisioned).
  if (!ctx.project) {
    return (
      <Shell>
        <p className="eyebrow">Client portal</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">You are all set up</h1>
        <p className="mt-3 max-w-xl text-ink/70">
          We do not see an active project on your account yet. If you just
          purchased, give it a moment and refresh. Otherwise, reach out and we
          will get you started.
        </p>
      </Shell>
    );
  }

  const offeringName =
    (ctx.project.catalog_key
      ? (await getOfferingByKey(ctx.project.catalog_key))?.name ??
        getQuestionSet(ctx.project.catalog_key)?.offeringName
      : null) ?? "your project";

  const brief = ctx.brief;

  // Accepted: show the accepted-project view with deliverables and kickoff.
  if (brief?.status === "accepted" || ctx.project.status === "accepted") {
    return (
      <Shell>
        <AcceptedView projectId={ctx.project.id} offeringName={offeringName} />
      </Shell>
    );
  }

  // Brief ready for review (or revised after a change request).
  if (
    brief &&
    (brief.status === "submitted_for_acceptance" ||
      brief.status === "changes_requested")
  ) {
    return (
      <Shell>
        <BriefReview
          projectId={ctx.project.id}
          offeringName={offeringName}
          renderedSummary={brief.rendered_summary ?? "Your brief is being prepared."}
          revision={brief.revision}
          status={brief.status}
        />
      </Shell>
    );
  }

  // No brief yet: route into intake for projects that are new or in account
  // setup (spec section 4 routing requirement).
  if (
    !brief &&
    (ctx.project.status === "new" ||
      ctx.project.status === "account_setup" ||
      ctx.project.status === "brief_ready")
  ) {
    if (!isAnthropicConfigured()) {
      return (
        <Shell>
          <p className="eyebrow">Spark intake</p>
          <h1 className="mt-3 text-3xl font-bold text-ink">Intake is almost ready</h1>
          <p className="mt-3 max-w-xl text-ink/70">
            We are getting your {offeringName} intake ready. Please check back
            shortly.
          </p>
        </Shell>
      );
    }
    return (
      <Shell>
        <SparkIntake
          projectId={ctx.project.id}
          offeringName={offeringName}
          initialMessages={ctx.intakeTranscript}
        />
      </Shell>
    );
  }

  // Fallback (e.g. in_delivery without an accepted brief flag): generic status.
  return (
    <Shell>
      <p className="eyebrow">Client portal</p>
      <h1 className="mt-3 text-3xl font-bold text-ink">Your project</h1>
      <p className="mt-3 max-w-xl text-ink/70">
        Your {offeringName} project is underway. Your project lead will keep you
        posted here.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-stone-white">
      <div className="container-page py-16 md:py-20">{children}</div>
    </section>
  );
}

// Accepted-project view: the deliverable schedule and kickoff status generated
// on acceptance.
async function AcceptedView({
  projectId,
  offeringName,
}: {
  projectId: string;
  offeringName: string;
}) {
  const db = getSupabaseServiceClient();
  let deliverables: Array<{ title: string; description: string | null; due_date: string | null }> = [];
  let hasKickoff = false;

  if (db) {
    const [{ data: dels }, { data: kickoff }] = await Promise.all([
      db
        .from("deliverables")
        .select("title, description, due_date")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true }),
      db
        .from("meetings")
        .select("id")
        .eq("project_id", projectId)
        .eq("type", "kickoff")
        .maybeSingle(),
    ]);
    deliverables = dels ?? [];
    hasKickoff = !!kickoff;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Project accepted</p>
      <h1 className="mt-3 text-3xl font-bold text-ink">Your {offeringName} is underway</h1>
      <p className="mt-3 text-ink/70">
        Thanks for accepting your brief. Here is your deliverable schedule.
        {hasKickoff && " Your project lead will reach out to schedule the kickoff call."}
      </p>

      <div className="mt-8 space-y-3">
        {deliverables.length === 0 && (
          <p className="text-sm text-ink/50">
            Your deliverables are being prepared.
          </p>
        )}
        {deliverables.map((d, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-4 rounded-xl border border-ink/10 bg-white p-4"
          >
            <div>
              <p className="font-semibold text-ink">{d.title}</p>
              {d.description && (
                <p className="mt-1 text-sm text-ink/65">{d.description}</p>
              )}
            </div>
            {d.due_date && (
              <span className="flex-none rounded-full bg-ink/[0.04] px-3 py-1 text-xs text-ink/60">
                Due {d.due_date}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
