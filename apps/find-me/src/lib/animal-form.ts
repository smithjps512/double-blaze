import { AGE_GROUPS, SIZES, type Animal, type AnimalStatus, type Level, type Tri } from "./types";

/**
 * The shelter staff "add a pet" form. Built to take under two minutes on a
 * phone: only name, species, sex, age, and size are required; everything
 * else has a sensible default ("unknown" for good-with, medium for levels).
 */

export type AnimalInput = Omit<Animal, "id" | "shelterId" | "intakeDate" | "photoUrl">;

const TRI: Tri[] = ["yes", "no", "unknown"];
const STATUS: AnimalStatus[] = ["available", "on_hold", "adopted"];

function str(form: FormData, k: string, max: number): string {
  return String(form.get(k) ?? "").trim().slice(0, max);
}
function level(form: FormData, k: string, fallback: Level): Level {
  const n = Number(form.get(k));
  return n === 1 || n === 2 || n === 3 ? n : fallback;
}
function oneOf<T extends string>(form: FormData, k: string, allowed: readonly T[]): T | null {
  const v = String(form.get(k) ?? "");
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

export function parseAnimalForm(form: FormData): { value?: AnimalInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = str(form, "name", 60);
  if (!name) errors.name = "Every pet needs a name.";
  const species = oneOf(form, "species", ["dog", "cat"] as const);
  if (!species) errors.species = "Choose dog or cat.";
  const sex = oneOf(form, "sex", ["male", "female"] as const);
  if (!sex) errors.sex = "Choose male or female.";
  const ageGroup = oneOf(form, "ageGroup", AGE_GROUPS);
  if (!ageGroup) errors.ageGroup = "Choose an age group.";
  const size = oneOf(form, "size", SIZES) ?? (species === "cat" ? "small" : null);
  if (!size) errors.size = "Choose a size.";

  const feeRaw = str(form, "fee", 6);
  const fee = feeRaw === "" ? null : Number(feeRaw);
  if (fee !== null && (!Number.isInteger(fee) || fee < 0 || fee > 10000)) errors.fee = "Fee is a whole dollar amount.";

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    value: {
      name,
      species: species!,
      sex: sex!,
      ageGroup: ageGroup!,
      ageLabel: str(form, "ageLabel", 40),
      size: size!,
      breed: str(form, "breed", 80),
      energy: level(form, "energy", 2),
      coatCare: level(form, "coatCare", 1),
      trainingNeeds: level(form, "trainingNeeds", 1),
      goodWithKids: oneOf(form, "goodWithKids", TRI) ?? "unknown",
      goodWithDogs: oneOf(form, "goodWithDogs", TRI) ?? "unknown",
      goodWithCats: oneOf(form, "goodWithCats", TRI) ?? "unknown",
      needsYard: form.get("needsYard") === "on",
      aloneOk: level(form, "aloneOk", 2),
      specialNeeds: str(form, "specialNeeds", 500),
      bio: str(form, "bio", 2000),
      fee,
      status: oneOf(form, "status", STATUS) ?? "available",
    },
  };
}

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_MAX_BYTES = 8 * 1024 * 1024;

export function photoProblem(file: { size: number; type: string }): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return "Photos must be JPG, PNG, or WebP.";
  if (file.size > PHOTO_MAX_BYTES) return "That photo is over 8 MB. Try a smaller one.";
  return null;
}
