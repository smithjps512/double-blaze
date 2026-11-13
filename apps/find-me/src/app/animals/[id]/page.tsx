import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimalPhoto } from "@/components/AnimalPhoto";
import { InquiryForm } from "@/components/InquiryForm";
import { MatchBadge, ReasonList } from "@/components/Match";
import { loadAnswers } from "@/lib/answers";
import { getAnimal, getShelter, isDemo } from "@/lib/data";
import { dealbreaker, scoreAnimal } from "@/lib/matching";
import { ageLabel, LEVEL_LABEL, SIZE_LABEL, type Tri } from "@/lib/types";
import { getViewer } from "@/lib/viewer";
import { toggleFavorite } from "./actions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const animal = await getAnimal((await params).id);
  return animal ? { title: `Meet ${animal.name}`, description: animal.bio.slice(0, 160) } : { title: "Not found" };
}

const tri = (v: Tri) => (v === "yes" ? "Yes" : v === "no" ? "No" : "Not sure yet");

export default async function AnimalPage({ params }: Props) {
  const { id } = await params;
  const animal = await getAnimal(id);
  if (!animal) notFound();
  const [shelter, answers, { viewer, db }] = await Promise.all([getShelter({ id: animal.shelterId }), loadAnswers(), getViewer()]);

  let favorite = false;
  if (viewer && db) {
    const { data } = await db.from("fm_favorites").select("animal_id").eq("user_id", viewer.id).eq("animal_id", animal.id).maybeSingle();
    favorite = Boolean(data);
  }

  const blocked = answers ? dealbreaker(animal, answers) : null;
  const match = answers && !blocked ? scoreAnimal(animal, answers) : null;

  const facts: [string, string][] = [
    ["Age", `${ageLabel(animal.species, animal.ageGroup)}${animal.ageLabel ? ` (${animal.ageLabel})` : ""}`],
    ["Sex", animal.sex === "male" ? "Male" : "Female"],
    ...(animal.species === "dog" ? ([["Size", SIZE_LABEL[animal.size]]] as [string, string][]) : []),
    ["Energy", LEVEL_LABEL[animal.energy]],
    ["Good with kids", tri(animal.goodWithKids)],
    ["Good with dogs", tri(animal.goodWithDogs)],
    ["Good with cats", tri(animal.goodWithCats)],
    ["Grooming", LEVEL_LABEL[animal.coatCare]],
    ["Time alone", animal.aloneOk === 3 ? "Fine for a workday" : animal.aloneOk === 2 ? "A few hours" : "Needs company"],
    ...(animal.needsYard ? ([["Home", "Needs a fenced yard"]] as [string, string][]) : []),
    ...(animal.fee !== null ? ([["Adoption fee", `$${animal.fee}`]] as [string, string][]) : []),
  ];

  return (
    <div className="container-page py-8">
      <Link href="/animals" className="btn-quiet -ml-3">
        ← All pets
      </Link>
      <div className="mt-2 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <AnimalPhoto
            name={animal.name}
            species={animal.species}
            photoUrl={animal.photoUrl}
            className="aspect-[4/3] w-full rounded-3xl"
            sizes="(min-width: 1024px) 55vw, 100vw"
          />
          <dl className="card mt-6 grid grid-cols-2 gap-x-6 gap-y-3 p-6 sm:grid-cols-3">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            {animal.status === "on_hold" && <span className="chip mb-3 bg-ink text-white">On hold: someone is meeting {animal.name}</span>}
            <h1 className="font-display text-5xl font-extrabold">{animal.name}</h1>
            <p className="mt-1 text-muted">
              {animal.breed || (animal.species === "dog" ? "Dog" : "Cat")} at {shelter?.name ?? "a local shelter"}
            </p>
            <p className="mt-4 text-lg leading-relaxed">{animal.bio}</p>
            {animal.specialNeeds && (
              <p className="mt-4 rounded-2xl bg-sun-light p-4">
                <strong>Special needs:</strong> {animal.specialNeeds}
              </p>
            )}
          </div>

          <section className="card p-6" aria-labelledby="fit">
            <h2 id="fit" className="font-display text-2xl font-extrabold">
              How {animal.name} fits you
            </h2>
            {match ? (
              <div className="mt-3 flex flex-col gap-3">
                <MatchBadge score={match.score} large />
                <ReasonList reasons={match.reasons} />
                <Link href="/match" className="btn-quiet -ml-3 self-start text-sm">
                  Update my answers
                </Link>
              </div>
            ) : blocked ? (
              <p className="mt-2 text-muted">
                Based on your answers, {animal.name} may not be the right fit: {blocked.toLowerCase()}. The shelter can tell
                you more.
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-muted">Answer ten quick questions to see how well {animal.name} fits your home.</p>
                <Link href={`/match?next=/animals/${animal.id}`} className="btn-secondary mt-3">
                  Take the match quiz
                </Link>
              </div>
            )}
          </section>

          {animal.status !== "adopted" && (
            <section className="card p-6" aria-labelledby="meet">
              <h2 id="meet" className="font-display text-2xl font-extrabold">
                Want to meet {animal.name}?
              </h2>
              <div className="mt-4">
                {isDemo() ? (
                  <p className="text-muted">In demo mode, inquiries are switched off. In the live app this sends your note straight to the shelter.</p>
                ) : viewer ? (
                  <InquiryForm animalId={animal.id} animalName={animal.name} defaultName={viewer.name} hasAnswers={Boolean(answers)} />
                ) : (
                  <Link href={`/sign-in?next=/animals/${animal.id}`} className="btn-primary">
                    Sign in to contact the shelter
                  </Link>
                )}
              </div>
              {viewer && (
                <form action={toggleFavorite} className="mt-3">
                  <input type="hidden" name="animalId" value={animal.id} />
                  <button className="btn-quiet -ml-3">{favorite ? "♥ Saved to My pets" : "♡ Save for later"}</button>
                </form>
              )}
            </section>
          )}

          {shelter && (
            <section className="text-sm text-muted">
              <p className="font-semibold text-ink">{shelter.name}</p>
              <p>{shelter.city}</p>
              <p>
                {shelter.phone && <a href={`tel:${shelter.phone}`} className="underline">{shelter.phone}</a>}
                {shelter.phone && shelter.website && " · "}
                {shelter.website && (
                  <a href={shelter.website} className="underline" rel="noopener noreferrer" target="_blank">
                    Website
                  </a>
                )}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
