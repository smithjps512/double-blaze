import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnimalCard } from "@/components/AnimalCard";
import { loadAnswers } from "@/lib/answers";
import { listAnimals, listShelters } from "@/lib/data";
import { rankAnimals } from "@/lib/matching";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Your matches" };

export default async function MatchesPage() {
  const answers = await loadAnswers();
  if (!answers) redirect("/match");
  const [animals, shelters, { viewer }] = await Promise.all([listAnimals(), listShelters(), getViewer()]);
  const shelterName = new Map(shelters.map((s) => [s.id, s.name]));
  const { matches, excluded } = rankAnimals(animals, answers);

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Your matches</h1>
          <p className="text-muted">
            {matches.length} {matches.length === 1 ? "pet fits" : "pets fit"} your home, best first. Tap one to see why.
          </p>
        </div>
        <Link href="/match" className="btn-secondary">
          Change my answers
        </Link>
      </div>

      {!viewer && (
        <p className="mt-6 rounded-2xl bg-sun-light p-4 text-sm">
          Your answers are saved on this device.{" "}
          <Link href="/sign-in?next=/matches" className="font-semibold underline underline-offset-4">
            Sign in
          </Link>{" "}
          to keep them everywhere and contact shelters.
        </p>
      )}

      {matches.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="font-display text-2xl font-extrabold">No matches right now</p>
          <p className="mt-2 text-muted">New pets arrive every week. Try loosening a preference, or browse everyone.</p>
          <Link href="/animals" className="btn-primary mt-4">
            Browse every pet
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <AnimalCard key={m.animal.id} animal={m.animal} match={m} shelterName={shelterName.get(m.animal.shelterId)} />
          ))}
        </div>
      )}

      {excluded.filter((e) => e.why !== "Different species" && e.why !== "Not available").length > 0 && (
        <details className="mt-10 text-sm text-muted">
          <summary className="cursor-pointer font-semibold text-ink">Why some pets are not shown</summary>
          <ul className="mt-3 grid gap-1">
            {excluded
              .filter((e) => e.why !== "Different species" && e.why !== "Not available")
              .map((e) => (
                <li key={e.animal.id}>
                  <Link href={`/animals/${e.animal.id}`} className="underline">
                    {e.animal.name}
                  </Link>
                  : {e.why.toLowerCase()}
                </li>
              ))}
          </ul>
        </details>
      )}
    </div>
  );
}
