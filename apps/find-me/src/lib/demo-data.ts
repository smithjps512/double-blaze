import type { Animal, Shelter } from "./types";

/**
 * Sample data for demos and local development, used whenever Supabase is not
 * configured. Every shelter and animal here is invented. The app labels demo
 * mode on every page so nobody mistakes these for real adoptable pets.
 */

export const DEMO_SHELTERS: Shelter[] = [
  {
    id: "demo-shelter-1",
    slug: "riverbend",
    name: "Riverbend Animal Shelter (sample)",
    city: "Your town",
    email: "adopt@example.org",
    phone: "(555) 010-0101",
    website: "https://example.org",
    adoptionCode: "RIVERBEND",
  },
  {
    id: "demo-shelter-2",
    slug: "hilltop",
    name: "Hilltop Humane Society (sample)",
    city: "Next town over",
    email: "hello@example.org",
    phone: "(555) 010-0202",
    website: "https://example.org",
    adoptionCode: "HILLTOP",
  },
];

type Seed = Omit<Animal, "shelterId" | "status" | "photoUrl" | "fee" | "specialNeeds"> &
  Partial<Pick<Animal, "status" | "fee" | "specialNeeds">> & { shelter: 1 | 2 };

const seeds: Seed[] = [
  {
    id: "demo-biscuit", shelter: 1, species: "dog", name: "Biscuit", sex: "male", ageGroup: "adult",
    ageLabel: "about 4 years", size: "medium", breed: "Hound mix", energy: 2, coatCare: 1, trainingNeeds: 1,
    goodWithKids: "yes", goodWithDogs: "yes", goodWithCats: "unknown", needsYard: false, aloneOk: 3,
    bio: "Biscuit has never met a person he did not like. He walks nicely on a leash, knows sit and shake, and snores a little.",
    intakeDate: "2026-08-02", fee: 150,
  },
  {
    id: "demo-juniper", shelter: 1, species: "dog", name: "Juniper", sex: "female", ageGroup: "young",
    ageLabel: "about 1 year", size: "large", breed: "Shepherd mix", energy: 3, coatCare: 2, trainingNeeds: 3,
    goodWithKids: "unknown", goodWithDogs: "yes", goodWithCats: "no", needsYard: true, aloneOk: 2,
    bio: "Juniper is smart, fast, and wants a job. She would love an experienced owner who runs or hikes and keeps training going.",
    intakeDate: "2026-09-18", fee: 175,
  },
  {
    id: "demo-pip", shelter: 1, species: "dog", name: "Pip", sex: "male", ageGroup: "baby",
    ageLabel: "10 weeks", size: "small", breed: "Terrier mix", energy: 3, coatCare: 2, trainingNeeds: 2,
    goodWithKids: "yes", goodWithDogs: "yes", goodWithCats: "yes", needsYard: false, aloneOk: 1,
    bio: "Pip is a tiny tornado who falls asleep mid-play. He needs a home where someone is around for potty training.",
    intakeDate: "2026-10-30", fee: 250,
  },
  {
    id: "demo-mabel", shelter: 2, species: "dog", name: "Mabel", sex: "female", ageGroup: "senior",
    ageLabel: "about 10 years", size: "small", breed: "Beagle mix", energy: 1, coatCare: 1, trainingNeeds: 1,
    goodWithKids: "yes", goodWithDogs: "unknown", goodWithCats: "yes", needsYard: false, aloneOk: 3,
    bio: "Mabel came in when her owner moved to assisted living. She is house trained, quiet, and wants a lap and a sunny window.",
    intakeDate: "2026-06-11", fee: 50, specialNeeds: "Takes a daily thyroid pill, hidden in cheese.",
  },
  {
    id: "demo-tank", shelter: 2, species: "dog", name: "Tank", sex: "male", ageGroup: "adult",
    ageLabel: "about 6 years", size: "xlarge", breed: "Mastiff mix", energy: 1, coatCare: 1, trainingNeeds: 2,
    goodWithKids: "yes", goodWithDogs: "no", goodWithCats: "unknown", needsYard: false, aloneOk: 3,
    bio: "Tank is 110 pounds of couch potato. Gentle with kids, prefers to be the only dog.",
    intakeDate: "2026-05-20", fee: 100,
  },
  {
    id: "demo-rosie", shelter: 1, species: "dog", name: "Rosie", sex: "female", ageGroup: "adult",
    ageLabel: "about 3 years", size: "large", breed: "Retriever mix", energy: 2, coatCare: 3, trainingNeeds: 1,
    goodWithKids: "yes", goodWithDogs: "yes", goodWithCats: "yes", needsYard: false, aloneOk: 2,
    bio: "Rosie loves everyone and everything, especially tennis balls. She sheds like it is her job.",
    intakeDate: "2026-10-01", fee: 175,
  },
  {
    id: "demo-ziggy", shelter: 2, species: "dog", name: "Ziggy", sex: "male", ageGroup: "young",
    ageLabel: "about 2 years", size: "medium", breed: "Cattle dog mix", energy: 3, coatCare: 1, trainingNeeds: 2,
    goodWithKids: "no", goodWithDogs: "yes", goodWithCats: "unknown", needsYard: true, aloneOk: 2,
    bio: "Ziggy herds anything that moves, including small kids. An adult home with a yard and a frisbee is his dream.",
    intakeDate: "2026-09-02", fee: 150,
  },
  {
    id: "demo-clementine", shelter: 1, species: "cat", name: "Clementine", sex: "female", ageGroup: "adult",
    ageLabel: "about 5 years", size: "medium", breed: "Domestic shorthair", energy: 1, coatCare: 1, trainingNeeds: 1,
    goodWithKids: "yes", goodWithDogs: "yes", goodWithCats: "yes", needsYard: false, aloneOk: 3,
    bio: "Clementine is an orange cat with one brain cell, and it is devoted to you. Lived with a dog before.",
    intakeDate: "2026-07-15", fee: 75,
  },
  {
    id: "demo-pepper-salt", shelter: 2, species: "cat", name: "Pepper", sex: "male", ageGroup: "baby",
    ageLabel: "12 weeks", size: "small", breed: "Domestic shorthair", energy: 3, coatCare: 1, trainingNeeds: 1,
    goodWithKids: "yes", goodWithDogs: "unknown", goodWithCats: "yes", needsYard: false, aloneOk: 2,
    bio: "Pepper climbs curtains and then cries until rescued. Would love to go home with a kitten friend.",
    intakeDate: "2026-10-22", fee: 100,
  },
  {
    id: "demo-duchess", shelter: 1, species: "cat", name: "Duchess", sex: "female", ageGroup: "senior",
    ageLabel: "about 12 years", size: "medium", breed: "Persian mix", energy: 1, coatCare: 3, trainingNeeds: 1,
    goodWithKids: "no", goodWithDogs: "no", goodWithCats: "unknown", needsYard: false, aloneOk: 3,
    bio: "Duchess wants a calm, adult-only home and daily brushing, in that order. Royalty, but affectionate royalty.",
    intakeDate: "2026-04-28", fee: 25,
  },
  {
    id: "demo-milo", shelter: 2, species: "cat", name: "Milo", sex: "male", ageGroup: "young",
    ageLabel: "about 1 year", size: "medium", breed: "Tabby", energy: 2, coatCare: 1, trainingNeeds: 2,
    goodWithKids: "yes", goodWithDogs: "yes", goodWithCats: "no", needsYard: false, aloneOk: 3,
    bio: "Milo plays fetch with hair ties and gets along with dogs, but wants to be the only cat.",
    intakeDate: "2026-08-25", fee: 75,
  },
  {
    id: "demo-olive", shelter: 1, species: "dog", name: "Olive", sex: "female", ageGroup: "adult",
    ageLabel: "about 5 years", size: "small", breed: "Chihuahua mix", energy: 2, coatCare: 1, trainingNeeds: 3,
    goodWithKids: "no", goodWithDogs: "unknown", goodWithCats: "unknown", needsYard: false, aloneOk: 2,
    bio: "Olive is shy with new people and needs a patient owner. Once she trusts you, she is your shadow.",
    intakeDate: "2026-03-14", fee: 75, status: "on_hold",
  },
];

export const DEMO_ANIMALS: Animal[] = seeds.map(({ shelter, ...s }) => ({
  ...s,
  shelterId: shelter === 1 ? DEMO_SHELTERS[0].id : DEMO_SHELTERS[1].id,
  status: s.status ?? "available",
  photoUrl: null,
  fee: s.fee ?? null,
  specialNeeds: s.specialNeeds ?? "",
}));
