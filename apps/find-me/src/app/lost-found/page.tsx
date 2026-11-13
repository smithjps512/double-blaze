import type { Metadata } from "next";
import Link from "next/link";
import { Map, type MapPoint } from "@/components/map/Map";
import { ReportCard } from "@/components/ReportCard";
import { PUBLIC_RADIUS_METERS } from "@/lib/geo";
import type { ReportKind } from "@/lib/reports";
import { listReports, mapCenter, reportTitle, reunionCount } from "@/lib/reports-data";
import type { Species } from "@/lib/types";

export const metadata: Metadata = {
  title: "Lost and found pets",
  description: "Lost and found dogs and cats near you. Post in a minute, talk safely in the app, and get local shelters looking too.",
};

type Params = { kind?: string; species?: string };

export default async function LostFoundPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const kind: ReportKind | undefined = p.kind === "lost" || p.kind === "found" ? p.kind : undefined;
  const species: Species | undefined = p.species === "dog" || p.species === "cat" ? p.species : undefined;
  const [reports, reunions] = await Promise.all([listReports({ kind, species, withReunited: true }), reunionCount()]);
  const open = reports.filter((r) => r.status === "open");
  const reunited = reports.filter((r) => r.status === "reunited").slice(0, 3);

  const points: MapPoint[] = reports.map((r) => ({
    id: r.id,
    point: r.publicPoint,
    kind: r.status === "reunited" ? "reunited" : r.kind,
    label: `${reportTitle(r)} · ${r.areaText}`,
    href: `/lost-found/${r.id}`,
  }));

  const tab = (label: string, params: Params) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    const active = (params.kind ?? "") === (kind ?? "") && (params.species ?? "") === (species ?? "");
    return (
      <Link
        key={label}
        href={`/lost-found${qs ? `?${qs}` : ""}`}
        className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line hover:bg-cream-dim"}`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Lost and found</h1>
          <p className="text-muted">
            {open.length} open {open.length === 1 ? "post" : "posts"} nearby
            {reunions > 0 && (
              <>
                {" · "}
                <strong className="text-pine">
                  {reunions} {reunions === 1 ? "pet" : "pets"} back home
                </strong>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/lost-found/new?kind=lost" className="btn-primary">
            I lost a pet
          </Link>
          <Link href="/lost-found/new?kind=found" className="btn-secondary">
            I found a pet
          </Link>
        </div>
      </div>

      <nav aria-label="Filter posts" className="mt-6 flex flex-wrap gap-2">
        {tab("All", { species })}
        {tab("Lost", { kind: "lost", species })}
        {tab("Found", { kind: "found", species })}
        <span className="mx-1 w-px self-stretch bg-line" aria-hidden="true" />
        {tab("Dogs", { kind, species: "dog" })}
        {tab("Cats", { kind, species: "cat" })}
      </nav>

      <div className="mt-6">
        <Map center={mapCenter()} zoom={12} points={points} radius={PUBLIC_RADIUS_METERS} className="h-72 sm:h-96" />
        <p className="mt-2 text-xs text-muted">Circles show the general area. Exact spots stay private.</p>
      </div>

      {open.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="font-display text-2xl font-extrabold">No open posts here right now</p>
          <p className="mt-2 text-muted">That is good news. If you lose or find a pet, post it and local shelters are alerted.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {open.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}

      {reunited.length > 0 && (
        <section className="mt-12" aria-labelledby="home">
          <h2 id="home" className="font-display text-2xl font-extrabold">
            Back home
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reunited.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 grid gap-4 rounded-3xl bg-pine p-8 text-white md:grid-cols-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Lost a pet?</h2>
          <p className="mt-1 text-sm text-white/85">Post here first, then share the link. Partner shelters are alerted the moment you post.</p>
        </div>
        <div>
          <h2 className="font-display text-xl font-extrabold">Found one?</h2>
          <p className="mt-1 text-sm text-white/85">Any vet or shelter can scan for a microchip for free. It is the fastest way home.</p>
        </div>
        <div>
          <h2 className="font-display text-xl font-extrabold">Stay safe</h2>
          <p className="mt-1 text-sm text-white/85">Talk in the app. Never pay anyone before you have your pet back.</p>
        </div>
      </section>
    </div>
  );
}
