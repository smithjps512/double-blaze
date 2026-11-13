import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimalPhoto } from "@/components/AnimalPhoto";
import { getShelter, isDemo, listClaimable } from "@/lib/data";
import { ageLabel } from "@/lib/types";
import { getViewer } from "@/lib/viewer";
import { claimAdoption } from "./actions";

export const metadata: Metadata = { title: "Welcome home", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  pick: "Choose the pet you adopted.",
  claim: "That did not save. Try again, or ask the shelter staff for help.",
};

/** Where the shelter's QR code points. */
export default async function AdoptPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { code } = await params;
  const { error } = await searchParams;
  const shelter = await getShelter({ code });
  if (!shelter) notFound();
  const { viewer } = await getViewer();
  const animals = await listClaimable(code);
  const needsSignIn = !isDemo() && !viewer;

  return (
    <div className="container-page max-w-2xl py-10">
      <p className="chip bg-sun-light">From {shelter.name}</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">Congratulations on your new pet!</h1>
      <p className="mt-3 text-lg text-muted">
        Pick who came home with you, and we will build a care plan for their first year: vet visits, vaccines, prevention,
        and settling in, with reminders.
      </p>

      {needsSignIn ? (
        <div className="card mt-8 p-6">
          <p className="font-semibold">First, sign in so we can keep your plan and send reminders.</p>
          <Link href={`/sign-in?next=/adopt/${shelter.adoptionCode}`} className="btn-primary mt-4">
            Sign in with email
          </Link>
        </div>
      ) : (
        <form action={claimAdoption} className="mt-8 flex flex-col gap-6">
          <input type="hidden" name="code" value={shelter.adoptionCode} />
          {error && ERRORS[error] && (
            <p className="rounded-xl bg-ember-light px-4 py-3 text-ember-dark" role="alert">
              {ERRORS[error]}
            </p>
          )}
          <fieldset>
            <legend className="font-display text-2xl font-extrabold">Who did you adopt?</legend>
            {animals.length === 0 ? (
              <p className="mt-3 text-muted">This shelter has no pets listed yet. Ask a staff member to add yours.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {animals.map((a) => (
                  <label
                    key={a.id}
                    className="card flex cursor-pointer items-center gap-4 p-3 focus-within:ring-4 focus-within:ring-sun has-[:checked]:border-ember has-[:checked]:bg-ember-light"
                  >
                    <input type="radio" name="animalId" value={a.id} required className="sr-only" />
                    <AnimalPhoto name={a.name} species={a.species} photoUrl={a.photoUrl} className="h-16 w-16 shrink-0 rounded-2xl" sizes="64px" />
                    <span>
                      <span className="block text-lg font-semibold">{a.name}</span>
                      <span className="text-sm text-muted">
                        {ageLabel(a.species, a.ageGroup)}
                        {a.breed ? ` · ${a.breed}` : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <label>
            <span className="label">New name? (optional)</span>
            <input name="petName" maxLength={60} className="field" placeholder="Leave blank to keep their shelter name" />
          </label>
          <button className="btn-primary self-start text-lg" disabled={animals.length === 0}>
            Build my care plan
          </button>
        </form>
      )}
    </div>
  );
}
