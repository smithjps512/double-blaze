import type { Animal, Shelter } from "./types";

/**
 * Database rows (snake_case, fm_ tables) to app shapes and back. Pure, so it
 * is tested without a database.
 */

export type AnimalRow = {
  id: string;
  shelter_id: string;
  species: Animal["species"];
  name: string;
  sex: Animal["sex"];
  age_group: Animal["ageGroup"];
  age_label: string;
  size: Animal["size"];
  breed: string;
  energy: number;
  coat_care: number;
  training_needs: number;
  good_with_kids: Animal["goodWithKids"];
  good_with_dogs: Animal["goodWithDogs"];
  good_with_cats: Animal["goodWithCats"];
  needs_yard: boolean;
  alone_ok: number;
  special_needs: string;
  bio: string;
  photo_url: string | null;
  fee: number | null;
  status: Animal["status"];
  intake_date: string;
};

export type ShelterRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  email: string;
  phone: string;
  website: string;
  adoption_code: string;
};

const lvl = (n: number) => (n === 1 || n === 3 ? n : 2) as 1 | 2 | 3;

export function animalFromRow(r: AnimalRow): Animal {
  return {
    id: r.id,
    shelterId: r.shelter_id,
    species: r.species,
    name: r.name,
    sex: r.sex,
    ageGroup: r.age_group,
    ageLabel: r.age_label ?? "",
    size: r.size,
    breed: r.breed ?? "",
    energy: lvl(r.energy),
    coatCare: lvl(r.coat_care),
    trainingNeeds: lvl(r.training_needs),
    goodWithKids: r.good_with_kids,
    goodWithDogs: r.good_with_dogs,
    goodWithCats: r.good_with_cats,
    needsYard: Boolean(r.needs_yard),
    aloneOk: lvl(r.alone_ok),
    specialNeeds: r.special_needs ?? "",
    bio: r.bio ?? "",
    photoUrl: r.photo_url,
    fee: r.fee,
    status: r.status,
    intakeDate: String(r.intake_date).slice(0, 10),
  };
}

/** The editable columns, for insert and update. */
export function animalToRow(a: Omit<Animal, "id" | "shelterId" | "intakeDate">) {
  return {
    species: a.species,
    name: a.name,
    sex: a.sex,
    age_group: a.ageGroup,
    age_label: a.ageLabel,
    size: a.size,
    breed: a.breed,
    energy: a.energy,
    coat_care: a.coatCare,
    training_needs: a.trainingNeeds,
    good_with_kids: a.goodWithKids,
    good_with_dogs: a.goodWithDogs,
    good_with_cats: a.goodWithCats,
    needs_yard: a.needsYard,
    alone_ok: a.aloneOk,
    special_needs: a.specialNeeds,
    bio: a.bio,
    photo_url: a.photoUrl,
    fee: a.fee,
    status: a.status,
  };
}

export function shelterFromRow(r: ShelterRow): Shelter {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    city: r.city ?? "",
    email: r.email ?? "",
    phone: r.phone ?? "",
    website: r.website ?? "",
    adoptionCode: r.adoption_code,
  };
}
