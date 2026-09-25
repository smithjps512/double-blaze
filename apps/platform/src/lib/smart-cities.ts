/**
 * Period 3 Smart Cities: the four living maps at /demo/period-3-smart-cities/,
 * built from a sixth grade class's drawings.
 *
 * This file is the server's copy of what each city asks and which games it
 * has, so an answer or a score can be checked before it is stored. The
 * questions must match the "Questions for the designer" list in each city's
 * index.html, in the same order.
 *
 * Pure and dependency free so it can be unit tested.
 */

export type GameMode = "hunt" | "power" | "safety" | "dispatch" | "storm" | "rush" | "shelter" | "rescue" | "design";

export interface SmartCity {
  slug: string;
  name: string;
  questions: string[];
  modes: GameMode[];
}

export const SMART_CITIES: SmartCity[] = [
  {
    slug: "connection-center-city",
    name: "Connection Center City",
    questions: [
      'The Connection Center is "powered by power plant." Is that the Energy Plant next to the windmills, or a different one?',
      "How do the Smart Houses move? Do they walk, roll, or fly, and where do they go?",
      "At night the Solar Stack gets no sun. Does the city run on wind then, or does it save sunlight like the streets do?",
      "Could the people on the gym machines make electricity for the city, instead of only using it?",
    ],
    modes: ["hunt", "power"],
  },
  {
    slug: "solar-city",
    name: "Solar City",
    questions: [
      "Which buildings get power from the solar field, and which from the wind turbines? (The demo guesses with the dotted lines.)",
      "At night there's no sun, and some nights there's no wind. Where does Solar City get power then? Could it store energy for later?",
      "Solar City has 43 billion people, but all of Earth has about 8 billion. Where do all those people live?",
      'How many drones can fly at the same time before it\'s "too many"? How does the city decide?',
      "If taxes stay low, who pays for all the drones and robots?",
      "If papers write themselves, what do students get to do in class while they write?",
    ],
    modes: ["hunt", "dispatch"],
  },
  {
    slug: "romanville",
    name: "Romanville",
    questions: [
      'Where does the power come from for the sensors, lights, sign and door? (Try the choices in "City power"!)',
      "What should a motion sensor do if someone is just walking past and doesn't want to cross?",
      "How does the Chipotle sign know the store is closed — a clock, or a worker pressing a button?",
      "What should the Shake Shack door do if a dog or a heavy box lands on the plate?",
      "Romanville has 20 people. Who works at Chipotle and Shake Shack, and who drives all the cars?",
      "Your motto comes from ancient Rome. What would a smart city in ancient Rome have used instead of sensors?",
    ],
    modes: ["hunt", "safety"],
  },
  {
    slug: "smithsburg",
    name: "Smithsburg",
    questions: [
      "Your train is electric — where does the city's electricity come from? Sun, wind, or something else?",
      "What jobs do the robots do around Smithsburg?",
      "When the sensor wall pops up, how does it know when it's safe to go back down so people can cross?",
      "How will Smithsburg stop the ocean from flooding the city?",
      "How would smart technology make gas cheaper?",
      "Smithsburg has 67 million people, more than most countries. Where do they all fit by the beach?",
    ],
    modes: ["hunt", "safety"],
  },
  {
    slug: "blueprint-city",
    name: "Blueprint City",
    questions: [
      "What should this city be called, and what is its motto?",
      "Where should it be — mountains, coast, desert, plains or a river? What is the weather like?",
      "What are three problems this city should solve?",
      "What is one smart idea for energy? Explain it with Sense, Think, Act.",
      "What is one smart idea for getting around, or for keeping people safe?",
    ],
    modes: ["design"],
  },
  {
    slug: "rowantopia",
    name: "Rowantopia",
    questions: [
      "The oil rig pays for the city, but burning oil makes air pollution, and clean air is one of your big goals. How could Rowantopia make money and still keep its air clean?",
      "Your solar panels aren't waterproof, and Rowantopia gets light rain. How could you make them waterproof, or keep them dry when it rains?",
      "Everyone's fingerprints are kept in a safe at the government building. Who is allowed to open the safe, and how will you keep the fingerprints safe from thieves and hackers?",
      "The robots use a lot of electricity, and that makes the bill expensive. How could the 1,000 robots use less power, or make some of their own?",
      "At night the solar panels make no power. Where does Rowantopia get electricity after dark? What do the backup generators run on?",
      "Your smart cars can take you anywhere in the world. How would one get across an ocean?",
    ],
    modes: ["hunt", "rescue"],
  },
  {
    slug: "gamersville",
    name: "Gamersville",
    questions: [
      "Nothing can carry food at the speed of light (light has no weight, and a pizza does!). What is the fastest real way you could get food to a gamer?",
      "Your deck says drones, doors and consoles run on batteries and plug-in power. Where does that power come from before the 300 backup generators are needed?",
      "To live here you have to pass an exam. What is on the exam, and what happens to a kid who hasn't learned it yet?",
      "Rent is high for the first week. After that, who pays for all the robots, drones and 300 generators?",
      "If nothing is private, someone could see your address or your game accounts. Is there anything you would want to keep private?",
      "When too many drones or robots are flying, some have to wait. How many can fly at once, and who goes first: food or emergencies?",
    ],
    modes: ["hunt", "rush"],
  },
  {
    slug: "roseville",
    name: "Roseville",
    questions: [
      "Your slides don't say where Roseville's power comes from. Sun, wind, a power plant, or water rushing down the mountain? (The demo lets you pick.)",
      "Landslides are your problem #1. Which smart idea keeps rocks off the mountain road, or warns drivers in time?",
      "How much rain is too much for the rain sensor? Who picks that number, and what should happen for a quick shower?",
      "How does the self-driving bus decide who can get on? And what if someone doesn't know the address to type?",
      "Your lamp posts could have cameras to watch for suspicious activity. Who gets to see the videos, and how do you keep people's privacy safe?",
      "Is the $100,000 for rent the cost of one home, or of all of Roseville's smart technology? Where does the money come from?",
    ],
    modes: ["hunt", "storm"],
  },
  {
    slug: "smart-yale-city",
    name: "Smart Yale City",
    questions: [
      "Your Big Goal slide is still blank. In one or two sentences, what makes SYC smart, and why would people want to live there?",
      "SYC has 15,564 to 15,657 people. How did you pick those numbers, and why is it a range instead of one number?",
      "Your solar panels also catch light reflected from the Moon. Moonlight is sunlight bouncing off the Moon, and it is very weak. Where does SYC get most of its power at night?",
      "The self-driving cars and motorcycles drive to your phone. What happens for someone who doesn't have a phone, or whose phone battery is dead?",
      "When a hurricane or tsunami is coming, how does everyone find out, and how many people can fit in the shelters?",
      "What new jobs will SYC create so more people have places to work and can pay the bills?",
    ],
    modes: ["hunt", "shelter"],
  },
  {
    slug: "thomasville",
    name: "Thomasville",
    questions: [
      "What should Thomasville have? Tap the pictures.",
      "What should the webs do in the city?",
      "What would you put in the Web Lab?",
    ],
    // Calm activities with stars on the device; no leaderboard game.
    modes: [],
  },
];

export const MODE_LABELS: Record<GameMode, string> = {
  hunt: "Scavenger hunt",
  power: "Keep the power on",
  safety: "Safety missions",
  dispatch: "City Dispatcher",
  storm: "Storm Watch",
  rush: "Drone Rush",
  shelter: "Storm Shelter",
  rescue: "Rescue Bells",
  design: "Sense-Think-Act Challenge",
};

export const MAX_ANSWER_LENGTH = 500;
export const MIN_ANSWER_LENGTH = 3;
export const MAX_SCORE = 1000;

export function findCity(slug: unknown): SmartCity | null {
  if (typeof slug !== "string") return null;
  return SMART_CITIES.find((c) => c.slug === slug) ?? null;
}

export function isMode(city: SmartCity, mode: unknown): mode is GameMode {
  return typeof mode === "string" && (city.modes as string[]).includes(mode);
}

/**
 * Three-letter words that should not sit on a leaderboard a sixth grade class
 * looks at together. Deliberately short and blunt; the teacher can clear a
 * board from the Smart Cities page if something slips through.
 */
const BLOCKED_INITIALS = new Set([
  "ASS", "FUK", "FUC", "FCK", "FKU", "FU", "SEX", "DIE", "KKK", "NAZ", "FAG",
  "GAY", "CUM", "DIK", "DIC", "COK", "TIT", "WTF", "STD", "PEE", "POO", "PIS",
  "HOE", "SUK", "SUX", "NIG", "JIZ", "KYS", "FAT", "BUM", "VAG", "XXX",
  "SHT", "SHI", "CUK", "PUS", "MF", "BS",
]);

export type InitialsCheck = { ok: true; initials: string } | { ok: false; error: string };

export function checkInitials(raw: unknown): InitialsCheck {
  if (typeof raw !== "string") return { ok: false, error: "Type your initials." };
  const initials = raw.trim().toUpperCase();
  if (!/^[A-Z]{2,3}$/.test(initials)) {
    return { ok: false, error: "Use 2 or 3 letters, like ABC." };
  }
  if (BLOCKED_INITIALS.has(initials)) {
    return { ok: false, error: "Pick different letters." };
  }
  return { ok: true, initials };
}

export type ScoreCheck = { ok: true; score: number } | { ok: false; error: string };

export function checkScore(raw: unknown): ScoreCheck {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return { ok: false, error: "No score." };
  const score = Math.round(raw);
  if (score < 0 || score > MAX_SCORE) return { ok: false, error: "That score is not possible." };
  return { ok: true, score };
}

/** A random device token: 16 to 64 URL-safe characters. */
export function checkPlayerKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  return /^[A-Za-z0-9_-]{16,64}$/.test(raw) ? raw : null;
}

export type AnswerCheck =
  | { ok: true; city: SmartCity; questionIndex: number; answer: string; writer: "designer" | "classmate" }
  | { ok: false; error: string };

export function checkAnswer(body: Record<string, unknown>): AnswerCheck {
  const city = findCity(body.city);
  if (!city) return { ok: false, error: "No such city." };
  const q = body.question;
  if (typeof q !== "number" || !Number.isInteger(q) || q < 0 || q >= city.questions.length) {
    return { ok: false, error: "Pick a question." };
  }
  const answer = typeof body.answer === "string" ? body.answer.trim().replace(/\s+\n/g, "\n") : "";
  if (answer.length < MIN_ANSWER_LENGTH) return { ok: false, error: "Write an answer first." };
  if (answer.length > MAX_ANSWER_LENGTH) {
    return { ok: false, error: `Keep it under ${MAX_ANSWER_LENGTH} characters.` };
  }
  const writer = body.writer === "designer" ? "designer" : "classmate";
  return { ok: true, city, questionIndex: q, answer, writer };
}
