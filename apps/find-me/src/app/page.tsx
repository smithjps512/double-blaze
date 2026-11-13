import Link from "next/link";
import { AnimalCard } from "@/components/AnimalCard";
import { listAnimals, listShelters } from "@/lib/data";

export default async function Home() {
  const [animals, shelters] = await Promise.all([listAnimals(), listShelters()]);
  const shelterName = new Map(shelters.map((s) => [s.id, s.name]));
  // Longest stays first: the animals who most need to be seen.
  const spotlight = [...animals].sort((a, b) => a.intakeDate.localeCompare(b.intakeDate)).slice(0, 3);

  return (
    <>
      <section className="paws border-b border-line">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="chip bg-sun-light text-ink">
              {animals.length} pets waiting at {shelters.length} local {shelters.length === 1 ? "shelter" : "shelters"}
            </p>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Your next best friend is <span className="text-ember">already nearby.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Tell us about your home and your life. We match you with dogs and cats at local shelters, and explain why
              each one fits.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/match" className="btn-primary text-lg">
                Find my match
              </Link>
              <Link href="/animals" className="btn-secondary text-lg">
                Browse every pet
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">Ten quick questions. No account needed to see your matches.</p>
          </div>
          <ol className="grid gap-3">
            {[
              ["1", "Answer ten questions", "Home, schedule, energy, kids, other pets."],
              ["2", "Meet your matches", "Ranked by fit, with the reasons spelled out."],
              ["3", "Say hello to the shelter", "One tap sends your interest straight to them."],
              ["4", "Adopt and scan", "Scan the shelter's code for a care plan built for your new pet."],
            ].map(([n, t, d]) => (
              <li key={n} className="card flex items-start gap-4 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ember font-display text-lg font-extrabold text-white">
                  {n}
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="text-sm text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {spotlight.length > 0 && (
        <section className="container-page py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-extrabold">Waiting the longest</h2>
              <p className="text-muted">These friends have been at the shelter the longest. Give them a look.</p>
            </div>
            <Link href="/animals" className="btn-quiet">
              See all pets
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {spotlight.map((a) => (
              <AnimalCard key={a.id} animal={a} shelterName={shelterName.get(a.shelterId)} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-pine text-white">
        <div className="container-page grid gap-8 py-14 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-extrabold">Just adopted?</h2>
            <p className="mt-3 text-white/85">
              Scan the Find Me code at your shelter. You will get a care plan for your new pet, with reminders for the
              vet, vaccines, and everything else in the first year.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold">Work at a shelter?</h2>
            <p className="mt-3 text-white/85">
              Add a pet from your phone in under two minutes, and get inquiries from people who already fit.
            </p>
            <Link href="/for-shelters" className="btn mt-4 bg-white text-pine hover:bg-cream">
              How it works for shelters
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
