import type { Metadata } from "next";
import Link from "next/link";
import { AnimalForm } from "@/components/AnimalForm";
import { StaffGate } from "@/components/StaffGate";
import { staffContext } from "@/lib/staff";

export const metadata: Metadata = { title: "Add a pet", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewAnimalPage({ searchParams }: { searchParams: Promise<{ shelter?: string }> }) {
  const ctx = await staffContext((await searchParams).shelter);
  if (ctx.kind === "signed-out" || ctx.kind === "not-staff") return <StaffGate ctx={ctx} next="/staff/animals/new" />;
  return (
    <div className="container-page max-w-2xl py-10">
      <Link href={`/staff?shelter=${ctx.shelter.id}`} className="btn-quiet -ml-3">
        ← Dashboard
      </Link>
      <h1 className="mt-2 font-display text-4xl font-extrabold">Add a pet</h1>
      <p className="mb-6 text-muted">Only the first section is required. You can fill in the rest any time.</p>
      <AnimalForm shelterId={ctx.shelter.id} demo={ctx.kind === "demo"} />
    </div>
  );
}
