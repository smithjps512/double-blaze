import type { Metadata } from "next";
import Link from "next/link";
import { AnimalPhoto } from "@/components/AnimalPhoto";
import { ShelterSwitcher, StaffGate } from "@/components/StaffGate";
import { listShelterAnimals } from "@/lib/data";
import { staffContext } from "@/lib/staff";
import { ageLabel } from "@/lib/types";
import { reviewClaim, setAnimalStatus, setInquiryStatus } from "./actions";

export const metadata: Metadata = { title: "Shelter dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

type Inquiry = {
  id: string;
  adopter_name: string;
  adopter_email: string;
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
  shared_answers: Record<string, unknown> | null;
  fm_animals: { id: string; name: string } | null;
};
type Claim = { id: string; pet_name: string; adopter_email: string; claimed_at: string; fm_animals: { name: string } | null };

const STATUS_LABEL = { available: "Available", on_hold: "On hold", adopted: "Adopted" } as const;

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ shelter?: string; saved?: string }> }) {
  const { shelter: requested, saved } = await searchParams;
  const ctx = await staffContext(requested);
  if (ctx.kind === "signed-out" || ctx.kind === "not-staff") return <StaffGate ctx={ctx} next="/staff" />;
  const shelter = ctx.shelter;
  const sid = shelter.id;

  const animals = await listShelterAnimals(sid);
  let inquiries: Inquiry[] = [];
  let claims: Claim[] = [];
  if (ctx.kind === "staff") {
    const [i, c] = await Promise.all([
      ctx.db
        .from("fm_inquiries")
        .select("id, adopter_name, adopter_email, message, status, created_at, shared_answers, fm_animals(id, name)")
        .eq("shelter_id", sid)
        .neq("status", "closed")
        .order("created_at", { ascending: false }),
      ctx.db
        .from("fm_adoptions")
        .select("id, pet_name, adopter_email, claimed_at, fm_animals(name)")
        .eq("shelter_id", sid)
        .eq("status", "claimed")
        .order("claimed_at", { ascending: false }),
    ]);
    inquiries = (i.data ?? []) as unknown as Inquiry[];
    claims = (c.data ?? []) as unknown as Claim[];
  }
  const hidden = <input type="hidden" name="shelterId" value={sid} />;
  const counts = {
    available: animals.filter((a) => a.status === "available").length,
    on_hold: animals.filter((a) => a.status === "on_hold").length,
  };

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pine">Shelter dashboard</p>
          <h1 className="font-display text-4xl font-extrabold">{shelter.name}</h1>
          <p className="text-muted">
            {counts.available} available · {counts.on_hold} on hold · {inquiries.filter((i) => i.status === "new").length} new inquiries
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/staff/animals/new?shelter=${sid}`} className="btn-primary">
            + Add a pet
          </Link>
          <Link href={`/staff/qr?shelter=${sid}`} className="btn-secondary">
            Adoption QR poster
          </Link>
        </div>
      </div>
      <div className="mt-4">
        <ShelterSwitcher ctx={ctx} path="/staff" />
      </div>
      {saved && (
        <p className="mt-4 rounded-2xl bg-pine-light p-4 text-pine" role="status">
          Saved {saved}. They are live on Find Me now.
        </p>
      )}
      {ctx.kind === "demo" && (
        <p className="mt-4 rounded-2xl bg-sun-light p-4 text-sm">
          This is the shelter view in demo mode. Inquiries and adoption claims appear here when the app is live.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="inq">
          <h2 id="inq" className="font-display text-2xl font-extrabold">
            Inquiries
          </h2>
          {inquiries.length === 0 ? (
            <p className="mt-2 text-muted">No open inquiries.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {inquiries.map((i) => (
                <li key={i.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {i.adopter_name} → {i.fm_animals?.name ?? "a pet"}
                    </p>
                    {i.status === "new" ? <span className="chip bg-ember text-white">New</span> : <span className="chip bg-cream-dim">Contacted</span>}
                  </div>
                  <p className="text-sm">
                    <a href={`mailto:${i.adopter_email}`} className="text-pine underline">
                      {i.adopter_email}
                    </a>{" "}
                    · {i.created_at.slice(0, 10)}
                  </p>
                  {i.message && <p className="mt-2 rounded-xl bg-cream p-3 text-sm">{i.message}</p>}
                  {i.shared_answers && <p className="mt-2 text-xs text-muted">Shared their match quiz answers.</p>}
                  <div className="mt-3 flex gap-2">
                    {i.status === "new" && (
                      <form action={setInquiryStatus}>
                        {hidden}
                        <input type="hidden" name="inquiryId" value={i.id} />
                        <input type="hidden" name="status" value="contacted" />
                        <button className="btn-secondary px-4 py-2 text-sm">Mark contacted</button>
                      </form>
                    )}
                    <form action={setInquiryStatus}>
                      {hidden}
                      <input type="hidden" name="inquiryId" value={i.id} />
                      <input type="hidden" name="status" value="closed" />
                      <button className="btn-quiet text-sm">Close</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="claims">
          <h2 id="claims" className="font-display text-2xl font-extrabold">
            Adoption check-ins
          </h2>
          <p className="text-sm text-muted">New owners who scanned your QR code. Confirming takes the pet off your listings.</p>
          {claims.length === 0 ? (
            <p className="mt-2 text-muted">Nothing to confirm.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {claims.map((c) => (
                <li key={c.id} className="card p-5">
                  <p className="font-semibold">
                    {c.fm_animals?.name ?? "A pet"}
                    {c.pet_name !== c.fm_animals?.name ? ` (now "${c.pet_name}")` : ""}
                  </p>
                  <p className="text-sm text-muted">
                    {c.adopter_email} · {c.claimed_at.slice(0, 10)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <form action={reviewClaim}>
                      {hidden}
                      <input type="hidden" name="adoptionId" value={c.id} />
                      <input type="hidden" name="decision" value="confirmed" />
                      <button className="btn-primary px-4 py-2 text-sm">Confirm adoption</button>
                    </form>
                    <form action={reviewClaim}>
                      {hidden}
                      <input type="hidden" name="adoptionId" value={c.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <button className="btn-quiet text-sm">Not ours</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-12" aria-labelledby="pets">
        <h2 id="pets" className="font-display text-2xl font-extrabold">
          Your pets
        </h2>
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
          {animals.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-4 p-4">
              <AnimalPhoto name={a.name} species={a.species} photoUrl={a.photoUrl} className="h-14 w-14 shrink-0 rounded-2xl" sizes="56px" />
              <div className="min-w-0 flex-1">
                <Link href={`/staff/animals/${a.id}?shelter=${sid}`} className="font-semibold underline-offset-4 hover:underline">
                  {a.name}
                </Link>
                <p className="text-sm text-muted">
                  {ageLabel(a.species, a.ageGroup)} {a.species} · in since {a.intakeDate}
                  {!a.photoUrl && " · needs a photo"}
                </p>
              </div>
              <form action={setAnimalStatus} className="flex items-center gap-2">
                {hidden}
                <input type="hidden" name="animalId" value={a.id} />
                <label className="sr-only" htmlFor={`status-${a.id}`}>
                  Status for {a.name}
                </label>
                <select id={`status-${a.id}`} name="status" defaultValue={a.status} className="field w-auto py-2 text-sm">
                  {Object.entries(STATUS_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <button className="btn-quiet text-sm">Update</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
