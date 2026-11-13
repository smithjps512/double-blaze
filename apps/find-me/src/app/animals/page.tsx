import type { Metadata } from "next";
import Link from "next/link";
import { AnimalCard } from "@/components/AnimalCard";
import { applyBrowse, parseBrowse } from "@/lib/browse";
import { listAnimals, listShelters } from "@/lib/data";

export const metadata: Metadata = { title: "Adoptable pets" };

export default async function AnimalsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filter = parseBrowse(await searchParams);
  const [all, shelters] = await Promise.all([listAnimals({ includeOnHold: true }), listShelters()]);
  const animals = applyBrowse(all, filter);
  const shelterName = new Map(shelters.map((s) => [s.id, s.name]));

  const select = (name: string, label: string, value: string | undefined, options: [string, string][]) => (
    <label className="text-sm">
      <span className="label">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="field py-2">
        <option value="">Any</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
  const check = (name: string, label: string, on: boolean | undefined) => (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" name={name} value="1" defaultChecked={on} className="h-5 w-5 accent-ember" />
      {label}
    </label>
  );

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Adoptable pets</h1>
          <p className="text-muted">
            {animals.length} of {all.length} pets. Want them ranked for you?{" "}
            <Link href="/match" className="font-semibold text-ember underline underline-offset-4">
              Take the match quiz
            </Link>
            .
          </p>
        </div>
      </div>

      <form className="card mt-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_auto]" method="get">
        {select("species", "Species", filter.species, [
          ["dog", "Dogs"],
          ["cat", "Cats"],
        ])}
        {select("size", "Size", filter.size, [
          ["small", "Small"],
          ["medium", "Medium"],
          ["large", "Large"],
          ["xlarge", "Extra large"],
        ])}
        {select("age", "Age", filter.age, [
          ["baby", "Puppy or kitten"],
          ["young", "Young"],
          ["adult", "Adult"],
          ["senior", "Senior"],
        ])}
        {select(
          "shelter",
          "Shelter",
          filter.shelter,
          shelters.map((s) => [s.id, s.name]),
        )}
        <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-1 lg:row-span-2">
          <button className="btn-primary">Show pets</button>
          <Link href="/animals" className="btn-quiet justify-center">
            Clear
          </Link>
        </div>
        <fieldset className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2 lg:col-span-4">
          <legend className="sr-only">Good with</legend>
          {check("kids", "Good with kids", filter.kids)}
          {check("dogs", "Good with dogs", filter.dogs)}
          {check("cats", "Good with cats", filter.cats)}
        </fieldset>
      </form>

      {animals.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="font-display text-2xl font-extrabold">No pets match those filters</p>
          <p className="mt-2 text-muted">Try fewer filters, or check back soon. New pets arrive every week.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => (
            <AnimalCard key={a.id} animal={a} shelterName={shelterName.get(a.shelterId)} />
          ))}
        </div>
      )}
    </div>
  );
}
