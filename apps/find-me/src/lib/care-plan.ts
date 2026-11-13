import type { AgeGroup, Species } from "./types";

/**
 * The care plan a new owner gets when they scan their shelter's QR code.
 *
 * General guidance, not medical advice: every vet item points the owner to
 * their own vet, who sets the real schedule. Feeding is in the plan as
 * guidance; daily feeding reminders are opt-in (build plan section 7, item 6)
 * because they get muted within a week. Vet, vaccine, and prevention
 * reminders are on by default.
 */

export type CareKind = "vet" | "vaccine" | "prevention" | "admin" | "grooming" | "training" | "feeding";

export interface CareTask {
  key: string;
  kind: CareKind;
  title: string;
  details: string;
  /** Days after the adoption date the first reminder is due. */
  dueInDays: number;
  /** Repeat interval in days, or null for one time. */
  repeatDays: number | null;
  /** On by default. Opt-in tasks are offered, not scheduled. */
  defaultOn: boolean;
}

export interface CarePlanInput {
  species: Species;
  ageGroup: AgeGroup;
}

export interface CareGuide {
  heading: string;
  body: string;
}

export function buildCarePlan({ species, ageGroup }: CarePlanInput): CareTask[] {
  const dog = species === "dog";
  const young = ageGroup === "baby";
  const pet = dog ? (young ? "puppy" : "dog") : young ? "kitten" : "cat";
  const tasks: CareTask[] = [
    {
      key: "microchip",
      kind: "admin",
      title: "Register the microchip in your name",
      details:
        "Ask the shelter for the microchip number and the registry it uses, then put your phone number and address on it. A chip only helps if the contact details are yours.",
      dueInDays: 2,
      repeatDays: null,
      defaultOn: true,
    },
    {
      key: "first-vet",
      kind: "vet",
      title: "First vet visit",
      details: `Bring the shelter's medical records. Your vet will set your ${pet}'s vaccine and prevention schedule, which replaces the general dates in this plan.`,
      dueInDays: 7,
      repeatDays: null,
      defaultOn: true,
    },
    {
      key: "flea-tick",
      kind: "prevention",
      title: "Flea and tick prevention",
      details: "Monthly, using the product your vet recommends for your pet's weight.",
      dueInDays: 30,
      repeatDays: 30,
      defaultOn: true,
    },
  ];

  if (dog) {
    tasks.push({
      key: "heartworm",
      kind: "prevention",
      title: "Heartworm prevention",
      details: "Monthly, year round in most of the US. Your vet may test first.",
      dueInDays: 30,
      repeatDays: 30,
      defaultOn: true,
    });
  }

  if (young) {
    tasks.push(
      {
        key: "booster",
        kind: "vaccine",
        title: dog ? "Puppy vaccine booster" : "Kitten vaccine booster",
        details: `Young animals get a series of boosters a few weeks apart until about 16 weeks old. Confirm the next one with your vet.`,
        dueInDays: 21,
        repeatDays: 21,
        defaultOn: true,
      },
      {
        key: "spay-neuter",
        kind: "vet",
        title: "Ask about spay or neuter timing",
        details: "Many shelter animals are already fixed. If not, your vet will recommend the right age.",
        dueInDays: 60,
        repeatDays: null,
        defaultOn: true,
      },
      {
        key: "socialize",
        kind: "training",
        title: dog ? "Puppy class and socialization" : "Handling and play every day",
        details: dog
          ? "Sign up for a puppy class once your vet says vaccines allow it. Gentle new people, sounds, and places now prevent fear later."
          : "Short daily sessions of gentle handling, brushing, and play build a confident cat.",
        dueInDays: 14,
        repeatDays: null,
        defaultOn: true,
      },
    );
  } else {
    tasks.push({
      key: "wellness",
      kind: "vet",
      title: ageGroup === "senior" ? "Senior wellness exam" : "Yearly wellness exam and vaccines",
      details:
        ageGroup === "senior"
          ? "Twice a year is common for seniors. Bloodwork catches problems early."
          : "Yearly exam and the vaccines your vet recommends.",
      dueInDays: ageGroup === "senior" ? 180 : 365,
      repeatDays: ageGroup === "senior" ? 180 : 365,
      defaultOn: true,
    });
  }

  tasks.push(
    {
      key: "nails",
      kind: "grooming",
      title: "Trim nails",
      details: "About every month. Your vet or a groomer can show you how.",
      dueInDays: 30,
      repeatDays: 30,
      defaultOn: false,
    },
    {
      key: dog ? "settle-in" : "litter",
      kind: "training",
      title: dog ? "Decompress week" : "Litter box check",
      details: dog
        ? "Keep the first week quiet: short walks, a predictable routine, and a safe space. Most new dogs take three weeks to settle and three months to feel at home."
        : "One box per cat plus one, scooped daily. A cat avoiding the box is a reason to call the vet.",
      dueInDays: dog ? 1 : 3,
      repeatDays: null,
      defaultOn: true,
    },
    {
      key: "feeding",
      kind: "feeding",
      title: "Daily feeding and fresh water",
      details: "A daily reminder at the times you choose. Off by default; switch it on if it helps.",
      dueInDays: 1,
      repeatDays: 1,
      defaultOn: false,
    },
  );

  return tasks.sort((a, b) => a.dueInDays - b.dueInDays);
}

/** Plain guidance shown above the reminders. */
export function careGuide({ species, ageGroup }: CarePlanInput): CareGuide[] {
  const dog = species === "dog";
  const young = ageGroup === "baby";
  return [
    {
      heading: "Feeding",
      body: young
        ? `${dog ? "Puppies" : "Kittens"} eat three to four small meals a day. Start with the food the shelter used and switch slowly over a week.`
        : `Most adult ${dog ? "dogs" : "cats"} do well on two measured meals a day. Start with the food the shelter used and switch slowly over a week.`,
    },
    {
      heading: "Water",
      body: "Fresh water every day, in a clean bowl. Refill it when you feed.",
    },
    {
      heading: "The first weeks",
      body: dog
        ? "Expect some nerves, accidents, or a small appetite at first. Keep a routine, and call your vet if they stop eating for more than a day."
        : "Start in one quiet room with litter, food, water, and a hiding spot, then open up the house over a week or two.",
    },
    {
      heading: "When to call a vet now",
      body: "Trouble breathing, collapse, a swollen belly, repeated vomiting, eating something toxic, or no urine in a day. Go to an emergency vet; do not wait for an appointment.",
    },
  ];
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The next due date on or after `today` for a task that started at `startIso`. */
export function nextDue(task: Pick<CareTask, "dueInDays" | "repeatDays">, startIso: string, today: string): string {
  let due = addDays(startIso, task.dueInDays);
  if (!task.repeatDays) return due;
  while (due < today) due = addDays(due, task.repeatDays);
  return due;
}

export interface ScheduledTask {
  id: string;
  key: string;
  kind: CareKind;
  title: string;
  details: string;
  dueOn: string;
  repeatDays: number | null;
  enabled: boolean;
  lastDoneOn: string | null;
}

/** Schedules a fresh plan from the adoption date. */
export function schedulePlan(plan: CareTask[], adoptedOn: string): Omit<ScheduledTask, "id">[] {
  return plan.map((t) => ({
    key: t.key,
    kind: t.kind,
    title: t.title,
    details: t.details,
    dueOn: addDays(adoptedOn, t.dueInDays),
    repeatDays: t.repeatDays,
    enabled: t.defaultOn,
    lastDoneOn: null,
  }));
}

/**
 * Marking a task done. A repeating task moves to one interval after today (a
 * booster given late resets the clock); a one-time task just records the day.
 */
export function completeTask(task: Pick<ScheduledTask, "dueOn" | "repeatDays">, today: string): { dueOn: string; lastDoneOn: string } {
  return { dueOn: task.repeatDays ? addDays(today, task.repeatDays) : task.dueOn, lastDoneOn: today };
}

/** A one-time task is finished once it has been done; a repeating one never is. */
export function isFinished(task: Pick<ScheduledTask, "repeatDays" | "lastDoneOn">): boolean {
  return !task.repeatDays && Boolean(task.lastDoneOn);
}

export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
