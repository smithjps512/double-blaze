/**
 * Sandwich Bot: the shapes everything else agrees on.
 *
 * A submission is a Script: the student's steps, word for word, each with the
 * robot actions that step turns into. The engine runs the actions against a
 * World and records a Keyframe after every move, and the player draws the
 * keyframes. Nothing here touches the network or knows who wrote a script.
 */

export type Kind =
  | "bread-bag"
  | "bread-slice"
  | "pb-jar"
  | "jelly-jar"
  | "mayo-jar"
  | "butter-knife"
  | "plate"
  | "cheese"
  | "ham"
  | "lettuce"
  | "tomato"
  | "toaster"
  | "bowl"
  | "cereal-box"
  | "milk"
  | "spoon"
  | "pan"
  | "stove"
  | "egg"
  | "egg-carton"
  | "fridge";

/** Something that can be spread, poured or smeared. */
export type Substance = "pb" | "jelly" | "mayo" | "milk" | "cereal" | "egg" | "crumbs";

/** Where an object is. Positions of "on", "in" and "hand" follow the parent. */
export type Place =
  | { type: "counter" }
  | { type: "floor" }
  | { type: "on"; ref: string; dx: number }
  | { type: "in"; ref: string; slot: number }
  | { type: "hand"; hand: Hand }
  | { type: "hat" };

export type Hand = "L" | "R";

export interface Spread {
  sub: Substance;
  /** What put it there: "knife", "hand", "spoon", "jar" (rubbed a closed jar on it). */
  tool: string;
  /** Tiny amount, e.g. scooped with the sharp edge of a knife. */
  thin?: boolean;
  /** Drawn as a smiley face rather than a layer. */
  face?: boolean;
}

export interface Obj {
  id: string;
  kind: Kind;
  /** Free objects: center x of the base. Ignored when the place has a parent. */
  x: number;
  place: Place;
  rot: number;
  /** Open lids, flaps, doors and bags. */
  open: boolean;
  /** Upside down (bread spread side down). */
  flipped: boolean;
  /** Spreads on the top face (or bottom when flipped). On a bag: on the plastic. */
  spreads: Spread[];
  /** Kind specific: toasted, cut, cracked, cooked, folded, on (appliances), level (jars, milk), contents (bowl). */
  s: Record<string, string | number | boolean | string[]>;
}

export interface Mess {
  sub: Substance;
  x: number;
  y: number;
  r: number;
  /** Drawn on the robot instead of the kitchen. */
  onRobot?: "handL" | "handR";
}

export type Face = "happy" | "think" | "confused" | "proud" | "oops" | "wait" | "work";

export interface Robot {
  x: number;
  handL: { x: number; y: number };
  handR: { x: number; y: number };
  face: Face;
  say: string | null;
  /** -1, 0 or 1: the shrug and the little hops. */
  bob: number;
  question: boolean;
}

export interface World {
  objects: Obj[];
  robot: Robot;
  messes: Mess[];
  /** Simulated seconds that have passed (for toasters and stoves). */
  clock: number;
}

/** One robot action. `do` names the move, the rest are its arguments. */
export interface Action {
  do: string;
  what?: string;
  onto?: string;
  into?: string;
  from?: string;
  with?: string;
  to?: string;
  items?: string[];
  seconds?: number;
  why?: string;
  text?: string;
  hand?: Hand;
  /** Free form extras an action understands, e.g. { edge: "sharp" }. */
  how?: string;
  /** Override what the robot says while doing this. */
  say?: string;
}

export interface Step {
  /** The student's words, exactly. */
  text: string;
  actions: Action[];
  /** How this step was read, for the interpretation log and the teacher. */
  note?: string;
}

export interface Fix {
  id: string;
  /** Shown on the card, written like a student step. */
  text: string;
  actions: Action[];
  /** 1-based step this card swaps out. Without it, students choose where it goes. */
  replaces?: number;
}

export type GoalSpec =
  | { type: "sandwich"; name: string; fillings: Substance[]; layers?: Kind[]; plate?: boolean }
  | { type: "cereal"; name: string }
  | { type: "toast"; name: string; spread?: Substance }
  | { type: "fried-egg"; name: string };

export interface SetupItem {
  kind: Kind;
  id?: string;
  /** "counter" (default), "fridge", or "in:<id>" to start inside something. */
  where?: string;
  x?: number;
  open?: boolean;
  count?: number;
}

export interface Script {
  id: string;
  /** Scene title shown on the card. */
  title: string;
  goal: GoalSpec;
  /** The student's instructions exactly as written, before splitting into steps. */
  original: string;
  setup: SetupItem[];
  steps: Step[];
  /** Gentle "steps the robot needed but did not get" for the result card. */
  missing: string[];
  /** Fix cards for game mode. */
  fixes: Fix[];
  /** Optional hand written result sentence for the original run. */
  result?: string;
}

/** A recorded moment. The player animates from the previous keyframe to this one over `ms`. */
export interface Keyframe {
  ms: number;
  world: World;
}

export interface CompiledStep {
  text: string;
  /** True when a fix card added this step in game mode. */
  added?: boolean;
  frames: Keyframe[];
}

export interface Compiled {
  start: World;
  steps: CompiledStep[];
  end: World;
}
