import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimalForm } from "@/components/AnimalForm";
import { StaffGate } from "@/components/StaffGate";
import { getAnimal } from "@/lib/data";
import { staffContext } from "@/lib/staff";

export const metadata: Metadata = { title: "Edit pet", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditAnimalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ shelter?: string }> }) {
  const { id } = await params;
  const animal = await getAnimal(id);
  const ctx = await staffContext(animal?.shelterId ?? (await searchParams).shelter);
  if (ctx.kind === "signed-out" || ctx.kind === "not-staff") return <StaffGate ctx={ctx} next={`/staff/animals/${id}`} />;
  if (!animal || animal.shelterId !== ctx.shelter.id) notFound();
  return (
    <div className="container-page max-w-2xl py-10">
      <Link href={`/staff?shelter=${ctx.shelter.id}`} className="btn-quiet -ml-3">
        ← Dashboard
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-4xl font-extrabold">Edit {animal.name}</h1>
        <Link href={`/animals/${animal.id}`} className="btn-quiet">
          View listing
        </Link>
      </div>
      <AnimalForm shelterId={ctx.shelter.id} animal={animal} demo={ctx.kind === "demo"} />
    </div>
  );
}
