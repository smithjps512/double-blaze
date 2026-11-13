import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarePlanView } from "@/components/CarePlanView";
import { buildCarePlan, careGuide, schedulePlan, todayIso } from "@/lib/care-plan";
import { getAnimal, isDemo } from "@/lib/data";

export const metadata: Metadata = { title: "Care plan preview", robots: { index: false } };

/** Demo mode only: the care plan a new owner would get, without saving it. */
export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ animal?: string; name?: string }> }) {
  if (!isDemo()) notFound();
  const { animal: id, name } = await searchParams;
  const animal = id ? await getAnimal(id) : null;
  if (!animal) notFound();
  const today = todayIso();
  const petName = name?.trim() || animal.name;
  const tasks = schedulePlan(buildCarePlan(animal), today).map((t) => ({ ...t, id: t.key }));
  return (
    <div className="container-page py-10">
      <p className="chip bg-sun-light">Demo preview: not saved</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold">Welcome home, {petName}!</h1>
      <p className="mt-2 text-muted">In the live app, this plan is saved to My pets and the reminders arrive by email.</p>
      <div className="mt-8">
        <CarePlanView petName={petName} guide={careGuide(animal)} tasks={tasks} today={today} />
      </div>
    </div>
  );
}
