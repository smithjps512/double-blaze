import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/SettingsForm";
import { loadResponses, requireAdmin } from "@/lib/admin";
import { loadSettings } from "@/lib/data";
import { applyFilters, summarize, type Tally } from "@/lib/summary";
import {
  INTEREST_LEVELS,
  INTERESTS,
  KEEP_YEARLY,
  LOTS,
  PAINTERS,
  PRICE_COMFORT,
  ROLES,
  labelFor,
} from "@/lib/survey";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false } };

type Search = { level?: string; lot?: string; interest?: string };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border-2 border-asphalt/10 bg-white p-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl font-extrabold">{value}</p>
    </div>
  );
}

function Breakdown({ title, tallies, total }: { title: string; tallies: Tally[]; total: number }) {
  const max = Math.max(1, ...tallies.map((t) => t.count));
  return (
    <div className="rounded-2xl border-2 border-asphalt/10 bg-white p-5">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {tallies.map((t) => (
          <li key={t.value} title={`${t.label}: ${t.count} of ${total}`}>
            <div className="flex justify-between gap-2 text-sm">
              <span>{t.label}</span>
              <span className="font-semibold tabular-nums">{t.count}</span>
            </div>
            <div className="mt-1 h-2 rounded bg-chalk-dim">
              <div className="h-2 rounded bg-bms" style={{ width: `${(t.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Select({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
  value?: string;
}) {
  return (
    <label className="text-sm">
      <span className="block font-semibold">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="mt-1 rounded-lg border-2 border-asphalt/20 bg-white px-3 py-2 focus:border-asphalt focus:outline-none"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const [filters, { rows, error }, settings] = await Promise.all([
    searchParams,
    loadResponses(admin.db),
    loadSettings(),
  ]);
  // The boss rule holds even for an admin who is also the boss.
  const hideBoss = admin.viewer.isBoss;
  const summary = summarize(rows);
  const filtered = applyFilters(rows, filters);
  const interestOptions = hideBoss ? INTERESTS.filter((i) => i.value !== "boss") : INTERESTS;
  const byTier = hideBoss ? summary.byInterest.filter((t) => t.value !== "boss") : summary.byInterest;
  const query = new URLSearchParams(
    Object.entries(filters).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""),
  ).toString();

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <p className="font-stencil text-lg uppercase tracking-widest text-bms">Back office</p>
      <h1 className="mt-1 font-display text-4xl font-extrabold">Admin</h1>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-sold px-4 py-3 font-semibold text-chalk">
          Could not read responses: {error}
        </p>
      )}

      <section className="mt-8">
        <h2 className="sr-only">Summary</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Responses" value={summary.total} />
          <Stat label="Interested (in or probably)" value={summary.interested} />
          <Stat label="Art student requests" value={summary.artStudentRequests} />
          {!hideBoss && <Stat label="Paint the Boss interest" value={summary.bossInterest} />}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Breakdown title="Interest level" tallies={summary.byLevel} total={summary.total} />
          <Breakdown title="By tier" tallies={byTier} total={summary.total} />
          <Breakdown title="By lot" tallies={summary.byLot} total={summary.total} />
          <Breakdown title="Price comfort" tallies={summary.byPrice} total={summary.total} />
          <Breakdown title="Who paints" tallies={summary.byPainter} total={summary.total} />
          <Breakdown title="Keep year to year" tallies={summary.byKeep} total={summary.total} />
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold">
            Responses <span className="text-muted">({filtered.length} of {rows.length})</span>
          </h2>
          <a
            href={`/admin/export${query ? `?${query}` : ""}`}
            className="focus-ring rounded-full bg-tape px-5 py-2 font-bold text-ink hover:bg-tape-dark"
          >
            Download CSV
          </a>
        </div>
        <form method="get" className="mt-4 flex flex-wrap items-end gap-4 rounded-2xl bg-chalk-dim/60 p-4">
          <Select name="level" label="Interest level" options={INTEREST_LEVELS} value={filters.level} />
          <Select name="lot" label="Lot" options={LOTS} value={filters.lot} />
          <Select name="interest" label="Interested in" options={interestOptions} value={filters.interest} />
          <button className="focus-ring rounded-lg bg-bms px-4 py-2 font-semibold text-tape">Filter</button>
          {query && (
            <Link href="/admin" className="py-2 text-sm font-semibold underline">
              Clear
            </Link>
          )}
        </form>
        <div className="mt-4 overflow-x-auto rounded-2xl border-2 border-asphalt/10 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-bms text-white">
              <tr>
                {["Name", "Role", "Level", "Interested in", "Lot", "Who paints", "Keep", "Price", "Comments", "Updated"].map(
                  (h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted">
                    No responses {query ? "match these filters" : "yet"}.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.user_id} className="border-t border-asphalt/10 align-top">
                  <td className="px-4 py-3">
                    <span className="font-semibold">{r.name}</span>
                    <span className="block text-xs text-muted">{r.email}</span>
                  </td>
                  <td className="px-4 py-3">{labelFor(ROLES, r.role)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{labelFor(INTEREST_LEVELS, r.interest_level)}</td>
                  <td className="px-4 py-3">{r.interests
                      .filter((i) => !(hideBoss && i === "boss"))
                      .map((i) => labelFor(INTERESTS, i))
                      .join(", ") || "None"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{labelFor(LOTS, r.preferred_lot)}</td>
                  <td className="px-4 py-3">{labelFor(PAINTERS, r.painter)}</td>
                  <td className="px-4 py-3">{labelFor(KEEP_YEARLY, r.keep_yearly)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{labelFor(PRICE_COMFORT, r.price_comfort)}</td>
                  <td className="max-w-xs px-4 py-3">{r.comments}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {new Date(r.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border-2 border-bms bg-white p-6 shadow-sign">
        <h2 className="font-display text-2xl font-extrabold">Settings</h2>
        <p className="mt-1 text-sm text-muted">
          Fill these in as decisions land. Blank prices show Coming soon on the landing page.
        </p>
        <div className="mt-6">
          <SettingsForm values={settings} />
        </div>
      </section>
    </div>
  );
}
