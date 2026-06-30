import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentRole } from "@/lib/server-auth";
import { isStaffRole } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { BuildChecklist, type BuildTask } from "@/components/BuildChecklist";

export const metadata = { title: "Build workspace", robots: { index: false } };
export const dynamic = "force-dynamic";

// Internal Trail Run build workspace (Sprint T2). Staff only: shows the
// assembled build brief alongside the standardized Blue Trail checklist.
export default async function BuildWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const role = await getCurrentRole();
  if (role && !isStaffRole(role)) redirect("/portal");

  const db = getSupabaseServiceClient();
  if (!db) notFound();

  const { projectId } = await params;

  const { data: project } = await db
    .from("projects")
    .select("id, organization_id, status")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: org }, { data: brief }, { data: tasks }] = await Promise.all([
    db.from("organizations").select("name").eq("id", project.organization_id).maybeSingle(),
    db
      .from("project_briefs")
      .select("rendered_summary, feasibility_flags")
      .eq("project_id", projectId)
      .maybeSingle(),
    db
      .from("build_tasks")
      .select("id, title, status, notes")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
  ]);

  const flags: string[] = Array.isArray(brief?.feasibility_flags)
    ? (brief!.feasibility_flags as string[])
    : [];
  const buildTasks = (tasks ?? []) as BuildTask[];

  return (
    <section className="bg-stone-white">
      <div className="container-page py-16 md:py-20">
        <Link href="/execution" className="text-sm text-impact-orange">
          Back to execution
        </Link>
        <p className="eyebrow mt-4">Trail Run build</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          {(org?.name as string | null) ?? "Build workspace"}
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="text-xl font-bold text-ink">Build brief</h2>
            {brief?.rendered_summary ? (
              <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-ink/10 bg-ink/[0.02] p-5 text-sm text-ink/80">
                {brief.rendered_summary as string}
              </pre>
            ) : (
              <p className="mt-4 text-ink/60">
                No brief yet. It appears here once intake is complete.
              </p>
            )}

            {flags.length > 0 && (
              <div className="mt-6 rounded-xl border border-impact-orange/30 bg-impact-orange/[0.06] p-5">
                <h3 className="text-sm font-bold text-ink">Feasibility flags for review</h3>
                <ul className="mt-2 space-y-1 text-sm text-ink/75">
                  {flags.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-impact-orange" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <h2 className="text-xl font-bold text-ink">Blue Trail checklist</h2>
            {buildTasks.length > 0 ? (
              <div className="mt-4">
                <BuildChecklist tasks={buildTasks} />
              </div>
            ) : (
              <p className="mt-4 text-ink/60">The checklist seeds when the brief is generated.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
