/**
 * Dragster Lab physics: a CO2 dragster down a 20 m line, one millisecond at
 * a time.
 *
 * Pure and dependency free. The browser runs it to race a car, and the server
 * runs the same code on the car a student submits, so a time on the class
 * board is always the time that car actually makes. Nobody can post a number
 * the physics did not produce.
 *
 * The model is deliberately the one a seventh grader can say out loud:
 *
 *   push from the cartridge  minus  air pushing back  minus  wheels rubbing
 *   ------------------------------------------------------------------------
 *                     everything the cartridge has to move
 *
 * That is Newton's second law, a = F / m, and every slider in the Lab moves
 * exactly one of those four things.
 */

import { RULES, TRACK_M, type Range } from "./rules";

export type Profile = "block" | "wedge" | "rail" | "shell" | "bullet";
export type Wheels = "standard" | "thin" | "wide";

export type ModId =
  | "sand_nose"
  | "weight_holes"
  | "fenders"
  | "polish"
  | "graphite"
  | "straws"
  | "thin_wheels"
  | "stretch"
  | "tail_fin";

/** A car, as a student describes it from their blueprint. Millimetres and grams. */
export interface CarSpec {
  lengthMm: number;
  heightMm: number;
  noseMm: number;
  axleWidthMm: number;
  minWidthMm: number;
  co2WallMm: number;
  eyeGapMm: number;
  massG: number;
  frontAxleMm: number;
  rearAxleMm: number;
  profile: Profile;
  wheels: Wheels;
  mods: ModId[];
}

export const PROFILES: Record<Profile, { label: string; cd: number; fill: number; blurb: string }> = {
  block: { label: "Block", cd: 0.95, fill: 1.0, blurb: "Barely cut. Square front, square back." },
  wedge: { label: "Wedge", cd: 0.58, fill: 0.72, blurb: "Low pointed nose rising to the cartridge." },
  shell: { label: "Shell car", cd: 0.52, fill: 0.68, blurb: "A thin shell body over the wheels." },
  rail: { label: "Rail", cd: 0.46, fill: 0.5, blurb: "A thin beam with a pod around the cartridge." },
  bullet: { label: "Bullet", cd: 0.42, fill: 0.58, blurb: "Round, smooth, pointed. Hardest to cut." },
};

export const WHEELS: Record<Wheels, { label: string; mu: number; spinG: number; areaMm2: number; blurb: string }> = {
  standard: { label: "Standard kit wheels", mu: 0.07, spinG: 3, areaMm2: 860, blurb: "What comes in the kit." },
  thin: { label: "Thin wheels", mu: 0.066, spinG: 1.5, areaMm2: 500, blurb: "Less air to push, less to spin up." },
  wide: { label: "Wide wheels", mu: 0.08, spinG: 5, areaMm2: 1450, blurb: "Steady, but heavy and draggy." },
};

export interface ModInfo {
  id: ModId;
  label: string;
  what: string;
  tradeOff: string;
}

/** The mod shop. Every mod helps one thing and costs another, like the real car. */
export const MODS: ModInfo[] = [
  { id: "sand_nose", label: "Sand the nose down", what: "Nose 30% lower, air slides over it.", tradeOff: "Less wood at the front, so the thinnest width can get too thin." },
  { id: "weight_holes", label: "Drill weight holes", what: "Takes 5 g off the car.", tradeOff: "Go under 40 g and the car is illegal." },
  { id: "fenders", label: "Add front fenders", what: "Covers the front wheels so they stop catching air.", tradeOff: "Adds 2 g." },
  { id: "polish", label: "Sand, paint and wax", what: "A smooth skin, about 10% less drag.", tradeOff: "Paint adds 1.5 g." },
  { id: "graphite", label: "Graphite on the axles", what: "Wheels rub 20% less.", tradeOff: "Free, but you only get it once." },
  { id: "straws", label: "Straw axle bushings", what: "Axles spin in straws, not wood: 15% less rubbing.", tradeOff: "Adds 0.5 g." },
  { id: "thin_wheels", label: "Swap to thin wheels", what: "Less to spin up, less air to push.", tradeOff: "Only if you are not already on them." },
  { id: "stretch", label: "Stretch the wheelbase", what: "Axles closer to the ends: the car runs straighter.", tradeOff: "Moves your axle holes on the blueprint." },
  { id: "tail_fin", label: "Add a tail fin", what: "Cleaner air off the back, about 8% less drag.", tradeOff: "Adds 1 g and the fin counts toward height." },
];

export const MOD_IDS = MODS.map((m) => m.id);

/** A sensible starting car: a wedge cut from the blank, roughly to the rules. */
export const STARTER: CarSpec = {
  lengthMm: 285,
  heightMm: 63,
  noseMm: 20,
  axleWidthMm: 38,
  minWidthMm: 16,
  co2WallMm: 4,
  eyeGapMm: 220,
  massG: 50,
  frontAxleMm: 40,
  rearAxleMm: 30,
  profile: "wedge",
  wheels: "standard",
  mods: [],
};

// ---------------------------------------------------------------------------
// Mods applied
// ---------------------------------------------------------------------------

export interface Effective {
  spec: CarSpec;
  cd: number;
  areaM2: number;
  mu: number;
  spinG: number;
}

/** The car as it actually runs: the blueprint with every mod applied. */
export function effective(car: CarSpec): Effective {
  const s: CarSpec = { ...car, mods: [...car.mods] };
  const has = (m: ModId) => car.mods.includes(m);

  if (has("sand_nose")) {
    s.noseMm = Math.max(8, s.noseMm * 0.7);
    s.minWidthMm = s.minWidthMm - 2;
  }
  if (has("weight_holes")) s.massG -= 5;
  if (has("fenders")) s.massG += 2;
  if (has("polish")) s.massG += 1.5;
  if (has("straws")) s.massG += 0.5;
  if (has("thin_wheels")) s.wheels = "thin";
  if (has("stretch")) {
    s.frontAxleMm = Math.min(s.frontAxleMm, 22);
    s.rearAxleMm = Math.min(s.rearAxleMm, 18);
  }
  if (has("tail_fin")) {
    s.massG += 1;
    s.heightMm += 6;
  }

  const p = PROFILES[s.profile];
  const w = WHEELS[s.wheels];

  // A low nose meets the air gently. Nose at full height: no help. Nose at
  // nothing: about 35% less drag than the profile alone.
  const noseRatio = clamp(s.noseMm / Math.max(1, s.heightMm), 0, 1);
  let cd = p.cd * (0.65 + 0.35 * noseRatio);
  if (has("polish")) cd *= 0.9;
  if (has("tail_fin")) cd *= 0.92;

  // What the air sees head on: the body, filled in by its profile, plus four wheels.
  const bodyHeight = Math.max(10, s.heightMm - 10);
  const bodyArea = bodyHeight * s.axleWidthMm * p.fill;
  const wheelArea = w.areaMm2 * (has("fenders") ? 0.55 : 1);
  const areaM2 = (bodyArea + wheelArea) / 1e6;

  let mu = w.mu;
  if (has("graphite")) mu *= 0.8;
  if (has("straws")) mu *= 0.85;

  return { spec: s, cd, areaM2, mu, spinG: w.spinG };
}

// ---------------------------------------------------------------------------
// The rules check
// ---------------------------------------------------------------------------

export interface RuleResult {
  id: string;
  label: string;
  ok: boolean;
  /** What the car has, in millimetres or grams. */
  value: number;
  /** The rule, in millimetres or grams. */
  min?: number;
  max?: number;
  unit: "mm" | "g";
  safety: boolean;
}

function inRange(r: Range, v: number) {
  return v >= r.min - 1e-6 && v <= r.max + 1e-6;
}

/** Checks the car as it runs, mods and all, against the class rules. */
export function checkRules(car: CarSpec): RuleResult[] {
  const s = effective(car).spec;
  return [
    { id: "length", label: "Body length", ok: inRange(RULES.length, s.lengthMm), value: s.lengthMm, ...RULES.length, unit: "mm", safety: false },
    { id: "height", label: "Height", ok: inRange(RULES.height, s.heightMm), value: s.heightMm, ...RULES.height, unit: "mm", safety: false },
    { id: "axleWidth", label: "Width at axles", ok: inRange(RULES.axleWidth, s.axleWidthMm), value: s.axleWidthMm, ...RULES.axleWidth, unit: "mm", safety: false },
    { id: "minWidth", label: "Thinnest width anywhere else", ok: s.minWidthMm >= RULES.minWidth - 1e-6, value: s.minWidthMm, min: RULES.minWidth, unit: "mm", safety: false },
    { id: "co2Wall", label: "Wood around the CO2 hole", ok: s.co2WallMm >= RULES.co2Wall - 1e-6, value: s.co2WallMm, min: RULES.co2Wall, unit: "mm", safety: true },
    { id: "eyeGap", label: "Screw eye separation", ok: inRange(RULES.eyeGap, s.eyeGapMm), value: s.eyeGapMm, ...RULES.eyeGap, unit: "mm", safety: true },
    { id: "mass", label: "Mass (no cartridge)", ok: inRange(RULES.mass, s.massG), value: s.massG, ...RULES.mass, unit: "g", safety: false },
  ];
}

export function isLegal(car: CarSpec): boolean {
  return checkRules(car).every((r) => r.ok);
}

// ---------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------

const G = 9.81;
const RHO = 1.2;
const CARTRIDGE_EMPTY_G = 22;
const CO2_G = 8;
const DT = 0.0005;
/**
 * Real cars feel more air than a smooth-shape formula says: the line, the
 * screw eyes and the ground all stir it up. Tuned so class times land where
 * real CO2 races do, about 1.0 to 1.6 seconds.
 */
const AIR_BOOST = 2.2;
/** Axles rub harder the faster the wheels turn (newtons per metre per second). */
const AXLE_SPIN = 0.01;
const MAX_T = 6;

/** Cartridge push in newtons at time t: a fast spike, then a long fade. */
export function thrust(t: number): number {
  const RISE = 0.03;
  const PEAK = 11;
  const FADE = 0.15;
  const CUTOFF = 0.75;
  if (t <= 0 || t >= CUTOFF) return 0;
  if (t < RISE) return (PEAK * t) / RISE;
  return PEAK * Math.exp(-(t - RISE) / FADE);
}

/** Total push the cartridge gives, so gas can be used up in proportion. */
const TOTAL_IMPULSE = (() => {
  let sum = 0;
  for (let t = 0; t < 1; t += DT) sum += thrust(t) * DT;
  return sum;
})();

export interface RunResult {
  /** Seconds to the 20 m line. Infinity if it never got there. */
  time: number;
  timeMs: number;
  /** Fastest it went, metres per second. */
  topSpeed: number;
  /** Where the car was every 20 ms, for the animation. */
  trace: number[];
  /** Forces at top speed, for the "why" panel. */
  atTop: { push: number; air: number; rub: number };
  /** True if the short wheelbase made the car wobble. */
  wobble: boolean;
}

export interface RunOptions {
  /** Cartridges are not identical: 1.0 is a perfect one. Race Night varies it. */
  cartridge?: number;
}

export function run(car: CarSpec, opts: RunOptions = {}): RunResult {
  const e = effective(car);
  const s = e.spec;
  const cartridge = opts.cartridge ?? 1;

  // A short wheelbase lets the car snake on the line, and screw eyes close
  // together let it twist. Both rub energy away.
  const wheelbase = s.lengthMm - s.frontAxleMm - s.rearAxleMm;
  const wobble = wheelbase < s.lengthMm * 0.62;
  const wobbleRub = wobble ? 0.06 : 0;
  const eyeRub = s.eyeGapMm < 7 * 25.4 ? 0.03 : 0;

  let t = 0;
  let x = 0;
  let v = 0;
  let pushed = 0;
  let topSpeed = 0;
  let atTop = { push: 0, air: 0, rub: 0 };
  const trace: number[] = [0];
  let nextTrace = 0.02;

  while (x < TRACK_M && t < MAX_T) {
    const push = thrust(t) * cartridge;
    pushed += push * DT;
    const gasLeft = CO2_G * Math.max(0, 1 - pushed / (TOTAL_IMPULSE * cartridge));
    const massKg = (s.massG + CARTRIDGE_EMPTY_G + gasLeft) / 1000;
    const movingKg = massKg + e.spinG / 1000;

    const air = AIR_BOOST * 0.5 * RHO * e.cd * e.areaM2 * v * v;
    const rub = v > 0 || push > 0 ? (e.mu + wobbleRub) * massKg * G + eyeRub + AXLE_SPIN * (e.mu / 0.07) * v : 0;

    let a = (push - air - rub) / movingKg;
    if (v <= 0 && a < 0) a = 0;
    v = Math.max(0, v + a * DT);
    x += v * DT;
    t += DT;

    if (v > topSpeed) {
      topSpeed = v;
      atTop = { push, air, rub };
    }
    if (t >= nextTrace) {
      trace.push(Math.min(x, TRACK_M));
      nextTrace += 0.02;
    }
    if (v === 0 && push === 0 && t > 0.1) break;
  }

  const finished = x >= TRACK_M;
  trace.push(Math.min(x, TRACK_M));
  return {
    time: finished ? t : Infinity,
    timeMs: finished ? Math.round(t * 1000) : 0,
    topSpeed,
    trace,
    atTop,
    wobble,
  };
}

/** Metres per second to miles per hour, because that is what they will ask. */
export function mph(ms: number): number {
  return ms * 2.23694;
}

// ---------------------------------------------------------------------------
// Checking a car sent to the server
// ---------------------------------------------------------------------------

export type SpecCheck = { ok: true; car: CarSpec } | { ok: false; error: string };

const NUMS: Array<[keyof CarSpec, number, number]> = [
  ["lengthMm", 100, 400],
  ["heightMm", 10, 150],
  ["noseMm", 3, 150],
  ["axleWidthMm", 10, 80],
  ["minWidthMm", 1, 80],
  ["co2WallMm", 0, 30],
  ["eyeGapMm", 20, 400],
  ["massG", 5, 150],
  ["frontAxleMm", 5, 150],
  ["rearAxleMm", 5, 150],
];

/** Parses a car from a request body. Shape only: legality is checkRules. */
export function parseSpec(raw: unknown): SpecCheck {
  if (!raw || typeof raw !== "object") return { ok: false, error: "No car." };
  const r = raw as Record<string, unknown>;
  const out: Partial<CarSpec> = {};
  for (const [k, lo, hi] of NUMS) {
    const v = r[k];
    if (typeof v !== "number" || !Number.isFinite(v) || v < lo || v > hi) {
      return { ok: false, error: `That car has an impossible ${String(k)}.` };
    }
    (out as Record<string, number>)[k] = Math.round(v * 10) / 10;
  }
  if (typeof r.profile !== "string" || !(r.profile in PROFILES)) return { ok: false, error: "Unknown body shape." };
  if (typeof r.wheels !== "string" || !(r.wheels in WHEELS)) return { ok: false, error: "Unknown wheels." };
  const mods = Array.isArray(r.mods) ? r.mods : [];
  if (!mods.every((m) => typeof m === "string" && (MOD_IDS as string[]).includes(m))) {
    return { ok: false, error: "Unknown mod." };
  }
  if (out.frontAxleMm! + out.rearAxleMm! >= out.lengthMm! - 40) {
    return { ok: false, error: "The axles are too close together." };
  }
  return {
    ok: true,
    car: {
      ...(out as CarSpec),
      profile: r.profile as Profile,
      wheels: r.wheels as Wheels,
      mods: Array.from(new Set(mods as ModId[])),
    },
  };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
