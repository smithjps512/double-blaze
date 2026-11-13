import { AGE_GROUPS, SIZES, type AgeGroup, type Animal, type Size, type Species } from "./types";

/** The browse page's filters, read from the URL. Pure, so it is tested. */
export interface BrowseFilter {
  species?: Species;
  size?: Size;
  age?: AgeGroup;
  kids?: boolean;
  dogs?: boolean;
  cats?: boolean;
  shelter?: string;
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseBrowse(p: Params): BrowseFilter {
  const species = one(p.species);
  const size = one(p.size);
  const age = one(p.age);
  return {
    species: species === "dog" || species === "cat" ? species : undefined,
    size: (SIZES as string[]).includes(size ?? "") ? (size as Size) : undefined,
    age: (AGE_GROUPS as string[]).includes(age ?? "") ? (age as AgeGroup) : undefined,
    kids: one(p.kids) === "1" || undefined,
    dogs: one(p.dogs) === "1" || undefined,
    cats: one(p.cats) === "1" || undefined,
    shelter: one(p.shelter) || undefined,
  };
}

/** "Good with" filters keep "yes" only; browsing is where people ask for certainty. */
export function applyBrowse(animals: Animal[], f: BrowseFilter): Animal[] {
  return animals.filter(
    (a) =>
      (!f.species || a.species === f.species) &&
      (!f.size || a.size === f.size) &&
      (!f.age || a.ageGroup === f.age) &&
      (!f.kids || a.goodWithKids === "yes") &&
      (!f.dogs || a.goodWithDogs === "yes") &&
      (!f.cats || a.goodWithCats === "yes") &&
      (!f.shelter || a.shelterId === f.shelter),
  );
}
