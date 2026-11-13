import Link from "next/link";
import { ageLabel, SIZE_LABEL, type Animal } from "@/lib/types";
import type { Match } from "@/lib/matching";
import { AnimalPhoto } from "./AnimalPhoto";
import { MatchBadge, ReasonList } from "./Match";

export function AnimalCard({ animal, match, shelterName }: { animal: Animal; match?: Match; shelterName?: string }) {
  return (
    <article className="card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5">
      <div className="relative">
        <AnimalPhoto name={animal.name} species={animal.species} photoUrl={animal.photoUrl} className="aspect-[4/3] w-full" />
        {match && (
          <div className="absolute left-3 top-3">
            <MatchBadge score={match.score} />
          </div>
        )}
        {animal.status === "on_hold" && (
          <span className="chip absolute right-3 top-3 bg-ink/80 text-white">On hold</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-2xl font-extrabold">
          <Link href={`/animals/${animal.id}`} className="focus-ring rounded after:absolute after:inset-0">
            {animal.name}
          </Link>
        </h3>
        <p className="text-sm text-muted">
          {ageLabel(animal.species, animal.ageGroup)} · {animal.sex === "male" ? "Male" : "Female"}
          {animal.species === "dog" ? ` · ${SIZE_LABEL[animal.size]}` : ""}
          {animal.breed ? ` · ${animal.breed}` : ""}
        </p>
        {match ? (
          <ReasonList reasons={match.reasons.slice(0, 3)} compact />
        ) : (
          <p className="line-clamp-2 text-sm">{animal.bio}</p>
        )}
        {shelterName && <p className="mt-auto pt-2 text-xs font-semibold uppercase tracking-wide text-pine">{shelterName}</p>}
      </div>
    </article>
  );
}
