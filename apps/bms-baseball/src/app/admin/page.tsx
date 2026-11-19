import type { Metadata } from "next";
import Link from "next/link";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { GRADES, POSITIONS, playedWhereLabel, positionShort, yearsLabel } from "@/lib/signup";
import { applyFilters, summarize, type SignupRow } from "@/lib/summary";
import { getServiceClient, TABLE } from "@/lib/supabase";
import { deleteSignup, logout } from "./actions";
import { DeleteButton, LoginForm } from "./AdminWidgets";

export const metadata: Metadata = { title: "Coaches" };
export const dynamic = "force-dynamic";

type Search = Promise<{ grade?: string; position?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: Search }) {
  if (!adminConfigured()) {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-extrabold text-bms-deep">Coach page</h1>
        <p className="mt-3 text-muted">
          The coach page is not switched on yet. Set <code>ADMIN_PASSWORD</code> (8 characters or more) in Vercel and
          redeploy.
        </p>
      </Shell>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Shell narrow>
        <h1 className="font-display text-3xl font-extrabold text-bms-deep">Coaches only ⚾</h1>
        <p className="mt-2 text-muted">Enter the coach password to see who signed up.</p>
        <LoginForm />
      </Shell>
    );
  }

  const db = getServiceClient();
  let rows: SignupRow[] = [];
  let loadError: string | null = null;
  if (!db) loadError = "The database is not connected. Check the Supabase env vars in Vercel.";
  else {
    const { data, error } = await db.from(TABLE).select("*").order("created_at", { ascending: false });
    if (error) loadError = `Could not load sign ups: ${error.message}`;
    else rows = (data ?? []) as SignupRow[];
  }

  const sp = await searchParams;
  const grade = GRADES.includes(Number(sp.grade) as 6) ? Number(sp.grade) : undefined;
  const position = POSITIONS.some((p) => p.id === sp.position) ? sp.position : undefined;
  const filtered = applyFilters(rows, { grade, position });
  const summary = summarize(rows);
  const query = new URLSearchParams();
  if (grade) query.set("grade", String(grade));
  if (position) query.set("position", position);
  const exportHref = `/admin/export${query.size ? `?${query}` : ""}`;

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold text-bms-deep">Tryout sign ups</h1>
        <div className="flex gap-2">
          <Link href="/" className="focus-ring rounded-full border-2 border-bms/30 px-4 py-2 text-sm font-semibold">
            View sign up page
          </Link>
          <form action={logout}>
            <button className="focus-ring rounded-full border-2 border-bms/30 px-4 py-2 text-sm font-semibold">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {loadError && (
        <p role="alert" className="mt-4 rounded-xl bg-stitch/10 p-4 font-semibold text-stitch">
          {loadError}
        </p>
      )}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Totals">
        <Stat label="Total" value={summary.total} strong />
        {summary.byGrade.map((g) => (
          <Stat key={g.grade} label={`${g.grade}th grade`} value={g.count} />
        ))}
        <Stat label="First-timers 🌱" value={summary.firstTimers} />
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4 shadow-card" aria-label="By position">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Interest by position</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {summary.byPosition.map((p) => (
            <li key={p.id} className="rounded-full bg-bms-light px-3 py-1 text-sm">
              <strong>{p.id === "not_sure" ? "Not sure" : p.label}</strong> {p.count}
            </li>
          ))}
        </ul>
      </section>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <label className="text-sm font-semibold">
          Grade
          <select name="grade" defaultValue={grade ?? ""} className="mt-1 block rounded-lg border-2 border-bms/20 bg-white px-3 py-2">
            <option value="">All</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}th
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Position
          <select
            name="position"
            defaultValue={position ?? ""}
            className="mt-1 block rounded-lg border-2 border-bms/20 bg-white px-3 py-2"
          >
            <option value="">All</option>
            {POSITIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === "not_sure" ? "Not sure yet" : p.label}
              </option>
            ))}
          </select>
        </label>
        <button className="focus-ring rounded-full bg-bms px-5 py-2 font-semibold text-white">Filter</button>
        {(grade || position) && (
          <Link href="/admin" className="py-2 text-sm font-semibold text-bms underline">
            Clear
          </Link>
        )}
        <a
          href={exportHref}
          className="focus-ring ml-auto rounded-full bg-gold px-5 py-2 font-bold text-ink hover:bg-gold-dark"
        >
          Download CSV ({filtered.length})
        </a>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-bms text-white">
            <tr>
              <Th>Name</Th>
              <Th>Grade</Th>
              <Th>Positions</Th>
              <Th>Experience</Th>
              <Th>Played where</Th>
              <Th>Notes</Th>
              <Th>Signed up</Th>
              <Th>
                <span className="sr-only">Delete</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted">
                  {rows.length === 0 ? "No sign ups yet. Share the link!" : "Nobody matches that filter."}
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const name = `${r.first_name} ${r.last_name}`;
              return (
                <tr key={r.id} className="border-t border-bms/10 align-top">
                  <td className="p-3 font-semibold">{name}</td>
                  <td className="p-3">{r.grade}</td>
                  <td className="p-3">{r.positions.map(positionShort).join(", ")}</td>
                  <td className="p-3 whitespace-nowrap">{yearsLabel(r.years_played)}</td>
                  <td className="p-3">
                    {r.played_where.map(playedWhereLabel).join(", ")}
                    {r.team_names && <div className="text-muted">{r.team_names}</div>}
                  </td>
                  <td className="max-w-xs p-3 whitespace-pre-wrap">{r.notes}</td>
                  <td className="p-3 whitespace-nowrap text-muted">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })}
                  </td>
                  <td className="p-3">
                    <form action={deleteSignup}>
                      <input type="hidden" name="id" value={r.id} />
                      <DeleteButton name={name} />
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">
        Anyone with the link can sign up, so delete duplicates or joke entries here.
      </p>
    </Shell>
  );
}

function Shell({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return <main className={`mx-auto px-4 py-10 ${narrow ? "max-w-md" : "max-w-6xl"}`}>{children}</main>;
}

function Stat({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-card ${strong ? "bg-bms text-white" : "bg-white"}`}>
      <div className="text-3xl font-extrabold">{value}</div>
      <div className={`text-sm ${strong ? "text-white/80" : "text-muted"}`}>{label}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-3 font-semibold">{children}</th>;
}
