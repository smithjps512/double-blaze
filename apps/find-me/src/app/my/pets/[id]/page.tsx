import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CarePlanView } from "@/components/CarePlanView";
import { careGuide, todayIso } from "@/lib/care-plan";
import { getAnimal } from "@/lib/data";
import { listMyAdoptions, listTasks } from "@/lib/my";
import { getViewer } from "@/lib/viewer";
import { completeCareTask, toggleCareTask } from "../../actions";

export const metadata: Metadata = { title: "Care plan", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { id } = await params;
  const { welcome } = await searchParams;
  const { viewer, db } = await getViewer();
  if (!viewer || !db) redirect(`/sign-in?next=/my/pets/${id}`);

  const adoption = (await listMyAdoptions(db, viewer.id)).find((a) => a.id === id);
  if (!adoption) notFound();
  const [animal, tasks] = await Promise.all([getAnimal(adoption.animalId), listTasks(db, { adoptionId: id })]);

  return (
    <div className="container-page py-10">
      <Link href="/my" className="btn-quiet -ml-3">
        ← My pets
      </Link>
      {welcome && (
        <p className="mt-2 rounded-2xl bg-pine-light p-4 text-pine" role="status">
          <strong>Welcome home, {adoption.petName}!</strong> Your care plan is ready, and we will email you before each item
          is due. {adoption.shelterName} will confirm the adoption on their end.
        </p>
      )}
      <h1 className="mt-4 font-display text-4xl font-extrabold">{adoption.petName}&apos;s care plan</h1>
      <p className="text-muted">Adopted from {adoption.shelterName} on {adoption.claimedAt.slice(0, 10)}</p>
      <div className="mt-8">
        <CarePlanView
          petName={adoption.petName}
          guide={animal ? careGuide(animal) : []}
          tasks={tasks}
          today={todayIso()}
          actions={{ complete: completeCareTask, toggle: toggleCareTask }}
        />
      </div>
    </div>
  );
}
