/**
 * Shared shapes for Find Me. Species-neutral on purpose: dogs and cats launch
 * first, and another species needs new quiz copy, not a new schema.
 */

export type Species = "dog" | "cat";
export const SPECIES: Species[] = ["dog", "cat"];

export type Size = "small" | "medium" | "large" | "xlarge";
export const SIZES: Size[] = ["small", "medium", "large", "xlarge"];

export type AgeGroup = "baby" | "young" | "adult" | "senior";
export const AGE_GROUPS: AgeGroup[] = ["baby", "young", "adult", "senior"];

/** 1 low, 2 medium, 3 high. */
export type Level = 1 | 2 | 3;

/** What the shelter has observed. "unknown" never filters an animal out. */
export type Tri = "yes" | "no" | "unknown";

export type AnimalStatus = "available" | "on_hold" | "adopted";

export interface Animal {
  id: string;
  shelterId: string;
  species: Species;
  name: string;
  sex: "male" | "female";
  ageGroup: AgeGroup;
  /** Free text the shelter writes, like "about 2 years". */
  ageLabel: string;
  size: Size;
  /** The shelter's best guess. Shown, never scored. */
  breed: string;
  energy: Level;
  /** How much brushing and grooming the coat needs. */
  coatCare: Level;
  /** 1 easy for anyone, 3 needs an experienced owner. */
  trainingNeeds: Level;
  goodWithKids: Tri;
  goodWithDogs: Tri;
  goodWithCats: Tri;
  needsYard: boolean;
  /** 1 needs someone home most of the day, 3 fine alone for a workday. */
  aloneOk: Level;
  specialNeeds: string;
  bio: string;
  photoUrl: string | null;
  fee: number | null;
  status: AnimalStatus;
  intakeDate: string;
}

export interface Shelter {
  id: string;
  slug: string;
  name: string;
  city: string;
  email: string;
  phone: string;
  website: string;
  /** The code printed in the shelter's QR code. */
  adoptionCode: string;
}

export const SPECIES_LABEL: Record<Species, string> = { dog: "Dog", cat: "Cat" };
export const SIZE_LABEL: Record<Size, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  xlarge: "Extra large",
};

export function ageLabel(species: Species, age: AgeGroup): string {
  if (age === "baby") return species === "dog" ? "Puppy" : "Kitten";
  return { young: "Young", adult: "Adult", senior: "Senior" }[age];
}

export const LEVEL_LABEL: Record<Level, string> = { 1: "Low", 2: "Medium", 3: "High" };
