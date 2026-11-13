import type { Answers } from "./quiz";
import { SIZES, type Animal, type Level, type Size } from "./types";

/**
 * Matching, in two layers (see docs/clients/find-me/build-plan.md section 4):
 *
 *  1. Dealbreakers remove an animal entirely. "unknown" never removes one;
 *     it becomes an "ask the shelter" note instead.
 *  2. A weighted fit score from 0 to 100, with plain-language reasons.
 *
 * Breed is never scored. The weights are here so shelter staff feedback can
 * tune them in one place.
 */

export const WEIGHTS = {
  energy: 3,
  experience: 3,
  timeAlone: 2.5,
  home: 2,
  size: 2,
  age: 1.5,
  grooming: 1,
} as const;

/** Points added (out of 100) when the shelter confirms a fit with the household. */
export const CONFIRMED_BONUS = 4;

export interface Reason {
  tone: "good" | "ok" | "ask";
  text: string;
}

export interface Match {
  animal: Animal;
  score: number;
  reasons: Reason[];
}

export interface Excluded {
  animal: Animal;
  why: string;
}

const sizeRank = (s: Size) => SIZES.indexOf(s);

const hoursLevel: Record<Answers["hoursAway"], Level> = { short: 1, workday: 2, long: 3 };

/** 1 when equal, 0.5 one step apart, 0 two steps apart. */
function closeness(a: Level, b: Level): number {
  return 1 - Math.abs(a - b) / 2;
}

/** The first dealbreaker an animal hits, or null if none. */
export function dealbreaker(animal: Animal, a: Answers): string | null {
  if (animal.status !== "available") return "Not available";
  if (a.species !== "either" && animal.species !== a.species) return "Different species";
  if (animal.species === "dog" && a.maxSize && sizeRank(animal.size) > sizeRank(a.maxSize)) {
    return "Over your housing size limit";
  }
  if (a.kids === "under10" && animal.goodWithKids === "no") return "Not suited to young kids";
  if (a.hasDogs && animal.goodWithDogs === "no") return "Not suited to living with dogs";
  if (a.hasCats && animal.goodWithCats === "no") return "Not suited to living with cats";
  if (a.hoursAway === "long" && animal.aloneOk === 1) return "Needs someone home most of the day";
  return null;
}

/** Scores one animal that passed the dealbreakers. */
export function scoreAnimal(animal: Animal, a: Answers): Match {
  const parts: { weight: number; value: number }[] = [];
  const reasons: Reason[] = [];
  const add = (weight: number, value: number) => parts.push({ weight, value });

  // Energy vs activity.
  const energy = closeness(animal.energy, a.activity);
  add(WEIGHTS.energy, energy);
  if (energy === 1) {
    reasons.push({
      tone: "good",
      text:
        animal.energy === 1
          ? "Laid back, matches your relaxed pace"
          : animal.energy === 3
            ? "High energy, ready for your active life"
            : "Moderate energy, matches your routine",
    });
  } else if (energy === 0) {
    reasons.push({
      tone: "ok",
      text: animal.energy > a.activity ? "More energy than your routine suggests" : "Calmer than your routine suggests",
    });
  }

  // Training and behavior needs vs experience. Only a gap upward costs points.
  const gap = animal.trainingNeeds - a.experience;
  const experience = gap <= 0 ? 1 : gap === 1 ? 0.4 : 0;
  add(WEIGHTS.experience, experience);
  if (animal.trainingNeeds === 1) reasons.push({ tone: "good", text: "Easy for any owner" });
  else if (gap > 0) reasons.push({ tone: "ok", text: "Needs an owner with training experience" });
  else if (animal.trainingNeeds === 3) reasons.push({ tone: "good", text: "Your experience is a good fit for their needs" });

  // Time alone.
  const away = hoursLevel[a.hoursAway];
  const alone = animal.aloneOk >= away ? 1 : animal.aloneOk === away - 1 ? 0.4 : 0;
  add(WEIGHTS.timeAlone, alone);
  if (alone < 1) reasons.push({ tone: "ok", text: "Prefers more company than your schedule allows" });

  // Home.
  let home = 1;
  if (animal.needsYard && a.home !== "house_yard") {
    home = 0.2;
    reasons.push({ tone: "ok", text: "Would do best with a fenced yard" });
  } else if (animal.species === "dog" && a.home === "apartment" && animal.energy === 3) {
    home = 0.5;
  } else if (a.home === "apartment" && animal.species === "dog" && animal.energy === 1) {
    reasons.push({ tone: "good", text: "Apartment friendly" });
  }
  add(WEIGHTS.home, home);

  // Size preference (dogs only).
  if (animal.species === "dog" && a.sizes.length > 0) {
    const nearest = Math.min(...a.sizes.map((s) => Math.abs(sizeRank(s) - sizeRank(animal.size))));
    const size = nearest === 0 ? 1 : nearest === 1 ? 0.4 : 0;
    add(WEIGHTS.size, size);
    if (size === 1) reasons.push({ tone: "good", text: "The size you are looking for" });
  }

  // Age preference.
  if (a.ages.length > 0) {
    const age = a.ages.includes(animal.ageGroup) ? 1 : 0.2;
    add(WEIGHTS.age, age);
  }

  // Grooming.
  const grooming = animal.coatCare <= a.grooming ? 1 : animal.coatCare - a.grooming === 1 ? 0.4 : 0;
  add(WEIGHTS.grooming, grooming);
  if (grooming < 1) reasons.push({ tone: "ok", text: "Coat needs more grooming than you planned" });

  // Household compatibility: confirmed is a bonus, unknown is a question.
  let bonus = 0;
  const household: [boolean, Animal["goodWithKids"], string, string][] = [
    [a.kids !== "none", animal.goodWithKids, "Good with kids", "kids"],
    [a.hasDogs, animal.goodWithDogs, "Good with dogs", "dogs"],
    [a.hasCats, animal.goodWithCats, "Good with cats", "cats"],
  ];
  for (const [applies, value, good, noun] of household) {
    if (!applies) continue;
    if (value === "yes") {
      bonus += CONFIRMED_BONUS;
      reasons.push({ tone: "good", text: good });
    } else if (value === "unknown") {
      reasons.push({ tone: "ask", text: `Ask the shelter how they do with ${noun}` });
    }
  }

  if (animal.specialNeeds.trim()) reasons.push({ tone: "ask", text: "Has special needs, ask the shelter" });

  const total = parts.reduce((s, p) => s + p.weight, 0);
  const got = parts.reduce((s, p) => s + p.weight * p.value, 0);
  const score = Math.min(100, Math.round((got / total) * 100 + bonus));

  // Good news first, then trade-offs, then questions.
  const order = { good: 0, ok: 1, ask: 2 } as const;
  reasons.sort((x, y) => order[x.tone] - order[y.tone]);
  return { animal, score, reasons };
}

/** Ranks every animal for an adopter, best first. Ties go to the longest stay. */
export function rankAnimals(animals: Animal[], answers: Answers): { matches: Match[]; excluded: Excluded[] } {
  const matches: Match[] = [];
  const excluded: Excluded[] = [];
  for (const animal of animals) {
    const why = dealbreaker(animal, answers);
    if (why) excluded.push({ animal, why });
    else matches.push(scoreAnimal(animal, answers));
  }
  matches.sort((x, y) => y.score - x.score || x.animal.intakeDate.localeCompare(y.animal.intakeDate));
  return { matches, excluded };
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Great match";
  if (score >= 70) return "Good match";
  if (score >= 50) return "Worth a look";
  return "Possible match";
}
