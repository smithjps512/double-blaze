import type { Metadata } from "next";
import Link from "next/link";
import { InviteStaffForm, NewShelterForm } from "@/components/AdminForms";
import { isDemo, listShelters } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Double Blaze only (FM_ADMIN_EMAILS): onboard shelters and their staff. */
export default async function AdminPage() {
  const { viewer } = await getViewer();
  if (isDemo() || !viewer?.isAdmin) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-extrabold">Admin</h1>
        <p className="mt-3 text-muted">
          {isDemo() ? "Admin tools need the live database." : "This page is for the Find Me team."}
        </p>
      </section>
    );
  }
  const shelters = await listShelters();
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="font-display text-4xl font-extrabold">Admin</h1>
      <section className="mt-8">
        <h2 className="font-display text-2xl font-extrabold">Shelters</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
          {shelters.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <span className="font-semibold">{s.name}</span>
              <span className="text-sm text-muted">
                QR code {s.adoptionCode} ·{" "}
                <Link href={`/staff?shelter=${s.id}`} className="underline">
                  Dashboard
                </Link>
              </span>
            </li>
          ))}
          {shelters.length === 0 && <li className="px-5 py-3 text-muted">No shelters yet.</li>}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="mb-3 font-display text-2xl font-extrabold">Add a shelter</h2>
        <NewShelterForm />
      </section>
      <section className="mt-10">
        <h2 className="mb-3 font-display text-2xl font-extrabold">Invite shelter staff</h2>
        <InviteStaffForm shelters={shelters} />
      </section>
    </div>
  );
}
