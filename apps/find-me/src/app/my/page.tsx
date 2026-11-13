import type { Metadata } from "next";
import Link from "next/link";
import { AnimalCard } from "@/components/AnimalCard";
import { ReportCard } from "@/components/ReportCard";
import { reportFromRow, type ReportRow } from "@/lib/reports-data";
import { isFinished, todayIso } from "@/lib/care-plan";
import { isDemo } from "@/lib/data";
import { listMyAdoptions, listTasks } from "@/lib/my";
import { animalFromRow, type AnimalRow } from "@/lib/rows";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "My pets", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { new: "Sent", contacted: "Shelter replied", closed: "Closed" };

export default async function MyPage() {
  const { viewer, db } = await getViewer();
  if (!viewer || !db) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-extrabold">My pets</h1>
        <p className="mt-3 text-muted">
          {isDemo()
            ? "In the live app, this is where adopters see saved pets, their inquiries, and each pet's care plan. In demo mode, try the care plan preview from a shelter's QR code."
            : "Sign in to see your saved pets, the shelters you contacted, and your pet's care plan."}
        </p>
        {isDemo() ? (
          <Link href="/adopt/RIVERBEND" className="btn-primary mt-6">
            Try the adoption QR code
          </Link>
        ) : (
          <Link href="/sign-in?next=/my" className="btn-primary mt-6">
            Sign in
          </Link>
        )}
      </section>
    );
  }

  const today = todayIso();
  const [adoptions, tasks, favs, inquiries, mine] = await Promise.all([
    listMyAdoptions(db, viewer.id),
    listTasks(db, { userId: viewer.id }),
    db.from("fm_favorites").select("fm_animals(*)").eq("user_id", viewer.id),
    db
      .from("fm_inquiries")
      .select("id, status, created_at, animal_id, fm_animals(name)")
      .eq("user_id", viewer.id)
      .order("created_at", { ascending: false }),
    db.from("fm_reports").select("*").eq("user_id", viewer.id).neq("status", "closed").order("created_at", { ascending: false }),
  ]);
  const myReports = ((mine.data ?? []) as ReportRow[]).map(reportFromRow);
  const saved = ((favs.data ?? []) as unknown as { fm_animals: AnimalRow | null }[])
    .map((f) => f.fm_animals)
    .filter((a): a is AnimalRow => Boolean(a))
    .map(animalFromRow);
  const sent = (inquiries.data ?? []) as unknown as { id: string; status: string; created_at: string; animal_id: string; fm_animals: { name: string } | null }[];

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-4xl font-extrabold">My pets</h1>

      <section className="mt-8" aria-labelledby="mine">
        <h2 id="mine" className="font-display text-2xl font-extrabold">
          At home
        </h2>
        {adoptions.length === 0 ? (
          <p className="mt-2 text-muted">
            Just adopted? Scan the Find Me code at your shelter to add your pet and get a care plan.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {adoptions.map((a) => {
              const next = tasks
                .filter((t) => t.adoptionId === a.id && t.enabled && !isFinished(t))
                .sort((x, y) => x.dueOn.localeCompare(y.dueOn))[0];
              const overdue = tasks.filter((t) => t.adoptionId === a.id && t.enabled && !isFinished(t) && t.dueOn < today).length;
              return (
                <Link key={a.id} href={`/my/pets/${a.id}`} className="card focus-ring block p-5 transition hover:-translate-y-0.5">
                  <p className="font-display text-2xl font-extrabold">{a.petName}</p>
                  <p className="text-sm text-muted">
                    From {a.shelterName}
                    {a.status === "claimed" && " · waiting for the shelter to confirm"}
                  </p>
                  {next && (
                    <p className="mt-3 text-sm">
                      <span className="font-semibold">Next:</span> {next.title} ({next.dueOn})
                    </p>
                  )}
                  {overdue > 0 && <p className="mt-1 text-sm font-semibold text-ember-dark">{overdue} overdue</p>}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {myReports.length > 0 && (
        <section className="mt-12" aria-labelledby="posts">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="posts" className="font-display text-2xl font-extrabold">
              Your lost and found posts
            </h2>
            <Link href="/messages" className="btn-quiet">
              Messages
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {myReports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12" aria-labelledby="sent">
        <h2 id="sent" className="font-display text-2xl font-extrabold">
          Shelters you contacted
        </h2>
        {sent.length === 0 ? (
          <p className="mt-2 text-muted">
            None yet.{" "}
            <Link href="/matches" className="underline">
              See your matches
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
            {sent.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-5 py-3">
                <Link href={`/animals/${i.animal_id}`} className="font-semibold underline-offset-4 hover:underline">
                  {i.fm_animals?.name ?? "A pet"}
                </Link>
                <span className="text-sm text-muted">
                  {STATUS[i.status] ?? i.status} · {i.created_at.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="saved">
        <h2 id="saved" className="font-display text-2xl font-extrabold">
          Saved
        </h2>
        {saved.length === 0 ? (
          <p className="mt-2 text-muted">Tap &ldquo;Save for later&rdquo; on any pet to keep them here.</p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((a) => (
              <AnimalCard key={a.id} animal={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
