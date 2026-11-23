import type { Kind, Substance } from "./types";

/**
 * The object library: what each thing is called and how big it is.
 *
 * Sizes are in stage units (the stage is 1600 by 900). `h` is how tall the
 * thing stands, which is also where anything stacked on it sits. To add an
 * object: add its kind to types.ts, a row here, and a drawing in Art.tsx.
 */

export interface KindInfo {
  /** Plain name for result cards: "peanut butter jar". */
  name: string;
  w: number;
  h: number;
  /** Has a lid, flap, door or tie that opens. */
  opens?: boolean;
  /** Holds a substance you can scoop or pour. */
  holds?: Substance;
  /** Other objects can go inside it ("in"). */
  container?: boolean;
  /** Stays put: the robot will not pick it up. */
  fixed?: boolean;
  /** Starts in the fridge unless the setup says otherwise. */
  cold?: boolean;
}

export const KINDS: Record<Kind, KindInfo> = {
  "bread-bag": { name: "bag of bread", w: 280, h: 110, opens: true, container: true },
  "bread-slice": { name: "slice of bread", w: 140, h: 26 },
  "pb-jar": { name: "peanut butter jar", w: 92, h: 112, opens: true, holds: "pb" },
  "jelly-jar": { name: "jelly jar", w: 92, h: 112, opens: true, holds: "jelly", cold: false },
  "mayo-jar": { name: "mayo jar", w: 92, h: 112, opens: true, holds: "mayo", cold: true },
  "butter-knife": { name: "butter knife", w: 150, h: 12 },
  plate: { name: "plate", w: 220, h: 16 },
  cheese: { name: "slice of cheese", w: 120, h: 10, cold: true },
  ham: { name: "slice of ham", w: 130, h: 10, cold: true },
  lettuce: { name: "lettuce leaf", w: 130, h: 16, cold: true },
  tomato: { name: "tomato", w: 72, h: 62, cold: true },
  toaster: { name: "toaster", w: 190, h: 130, container: true, fixed: true },
  bowl: { name: "bowl", w: 160, h: 64, container: true },
  "cereal-box": { name: "cereal box", w: 120, h: 180, opens: true, holds: "cereal" },
  milk: { name: "milk carton", w: 84, h: 160, opens: true, holds: "milk", cold: true },
  spoon: { name: "spoon", w: 110, h: 12 },
  pan: { name: "frying pan", w: 230, h: 30, container: true },
  stove: { name: "stove", w: 320, h: 34, fixed: true },
  egg: { name: "egg", w: 44, h: 56, cold: true },
  "egg-carton": { name: "egg carton", w: 180, h: 50, opens: true, container: true, cold: true },
  fridge: { name: "fridge", w: 230, h: 640, opens: true, container: true, fixed: true },
};

export const SUBSTANCE_NAME: Record<Substance, string> = {
  pb: "peanut butter",
  jelly: "jelly",
  mayo: "mayo",
  milk: "milk",
  cereal: "cereal",
  egg: "egg",
  crumbs: "crumbs",
};

export const SUBSTANCE_COLOR: Record<Substance, string> = {
  pb: "#B9772F",
  jelly: "#8E2B8A",
  mayo: "#FFF6D6",
  milk: "#FFFFFF",
  cereal: "#E7B24A",
  egg: "#FFD43B",
  crumbs: "#D9A35B",
};

/** Stage geometry shared by the engine and the art. */
export const STAGE = {
  W: 1600,
  H: 900,
  COUNTER_Y: 610,
  FLOOR_Y: 880,
  COUNTER_LEFT: 280,
  COUNTER_RIGHT: 1580,
  FRIDGE_X: 150,
  HAT_Y: 118,
  SHOULDER_Y: 400,
  SHOULDER_DX: 72,
} as const;
