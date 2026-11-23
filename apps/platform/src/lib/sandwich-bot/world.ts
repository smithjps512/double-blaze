import { KINDS, STAGE, WALL } from "./catalog";
import type { Kind, Obj, Place, SetupItem, World } from "./types";

/**
 * The kitchen at one moment: building it from a setup list, finding things in
 * it by name, and working out where everything is drawn.
 */

export const REST = { dxL: -112, dxR: 112, y: 540 };

export function clone(w: World): World {
  return structuredClone(w);
}

function makeObj(kind: Kind, id: string, place: Place, x = 0, open = false): Obj {
  return { id, kind, x, place, rot: 0, open, flipped: false, spreads: [], s: {} };
}

/**
 * Builds the starting kitchen. Counter items are spread left to right in the
 * order listed unless they give an x. "fridge" and "in:<id>" start inside.
 */
export function createWorld(setup: SetupItem[]): World {
  const objects: Obj[] = [];
  const used = new Map<string, number>();
  const nextId = (base: string) => {
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };

  const needsFridge = setup.some((i) => i.kind === "fridge" || i.where === "fridge" || i.where === "in:fridge");
  if (needsFridge) objects.push(makeObj("fridge", nextId("fridge"), { type: "counter" }, STAGE.FRIDGE_X));
  // Storage named by "in:pantry" etc. appears on its own, closed.
  for (const store of ["pantry", "cupboard", "drawer"] as Kind[]) {
    if (setup.some((i) => i.kind === store || i.where === `in:${store}`)) {
      objects.push(makeObj(store, nextId(store), { type: "counter" }, KINDS[store].homeX ?? 0));
    }
  }

  for (const item of setup) {
    if (item.kind === "fridge" || item.kind === "pantry" || item.kind === "cupboard" || item.kind === "drawer") continue;
    const count = item.count ?? 1;
    for (let i = 0; i < count; i++) {
      const base = item.kind === "bread-slice" ? "slice" : item.kind;
      const id = item.id && count === 1 ? item.id : item.kind === "bread-slice" ? `slice-${(used.get("slice") ?? 0) + 1}` : nextId(base);
      if (item.kind === "bread-slice") used.set("slice", (used.get("slice") ?? 0) + 1);
      const where = item.where ?? "counter";
      let place: Place = { type: "counter" };
      if (where === "fridge") place = { type: "in", ref: "fridge", slot: -1 };
      else if (where === "floor") place = { type: "floor" };
      else if (where.startsWith("in:")) place = { type: "in", ref: where.slice(3), slot: -1 };
      else if (where.startsWith("on:")) place = { type: "on", ref: where.slice(3), dx: 0 };
      const o = makeObj(item.kind, id, place, item.x ?? KINDS[item.kind].homeX ?? -1, item.open ?? false);
      if (KINDS[item.kind].holds && item.kind !== "cereal-box") o.s.level = 1;
      if (item.kind === "cereal-box") o.s.level = 1;
      if (item.kind === "bowl") o.s.contents = [];
      if (item.kind === "pan") o.s.contents = [];
      if (item.kind === "pot") o.s.fill = 0;
      if (item.kind === "bread-bag") o.s.tie = item.open ? "off" : "on";
      objects.push(o);
    }
  }

  // Slots for everything that starts inside something.
  const slotCount = new Map<string, number>();
  for (const o of objects) {
    if (o.place.type === "in") {
      const n = slotCount.get(o.place.ref) ?? 0;
      o.place.slot = n;
      slotCount.set(o.place.ref, n + 1);
    }
  }

  // Lay counter items out left to right where no x was given.
  const free = objects.filter((o) => o.place.type === "counter" && !WALL.has(o.kind) && o.x < 0);
  const fixedX = objects.filter((o) => o.place.type === "counter" && !WALL.has(o.kind) && o.x >= 0);
  const left = (needsFridge ? STAGE.COUNTER_LEFT : 0) + 70;
  const sink = objects.find((o) => o.kind === "sink" && o.place.type === "counter");
  const right = sink ? sink.x - KINDS.sink.w / 2 - 30 : STAGE.COUNTER_RIGHT - 60;
  const total = free.reduce((sum, o) => sum + KINDS[o.kind].w, 0);
  const gap = free.length > 1 ? Math.max(24, (right - left - total) / (free.length - 1)) : 0;
  let cursor = free.length === 1 ? (left + right) / 2 - KINDS[free[0].kind].w / 2 : left;
  for (const o of free) {
    const w = KINDS[o.kind].w;
    o.x = Math.round(cursor + w / 2);
    cursor += w + gap;
  }
  void fixedX;

  return {
    objects,
    robot: {
      x: 800,
      handL: { x: 800 + REST.dxL, y: REST.y },
      handR: { x: 800 + REST.dxR, y: REST.y },
      face: "happy",
      say: null,
      bob: 0,
      question: false,
    },
    messes: [],
    clock: 0,
  };
}

export function get(w: World, id: string): Obj | undefined {
  return w.objects.find((o) => o.id === id);
}

const ALIASES: Record<string, Kind> = {
  "peanut butter": "pb-jar",
  "peanut butter jar": "pb-jar",
  pb: "pb-jar",
  jelly: "jelly-jar",
  "jelly jar": "jelly-jar",
  jam: "jelly-jar",
  mayo: "mayo-jar",
  mayonnaise: "mayo-jar",
  knife: "butter-knife",
  "bread bag": "bread-bag",
  bag: "bread-bag",
  cereal: "cereal-box",
  eggs: "egg-carton",
  carton: "egg-carton",
  "american cheese": "cheese",
  oil: "olive-oil",
  "olive oil": "olive-oil",
  "ramen packet": "ramen",
  "seasoning packet": "seasoning",
  "frying pan": "pan",
};

/** True when the slice is still in the bag (or in anything else). */
export function isLoose(w: World, o: Obj): boolean {
  if (o.place.type === "in") return false;
  if (o.place.type === "on") {
    const parent = get(w, o.place.ref);
    return parent ? isLoose(w, parent) : true;
  }
  return true;
}

/**
 * Finds what a step means by a name, as literally as possible.
 *
 * "bread" is the first slice that is out of the bag, then the first one in an
 * open bag. If the bag is closed, "bread" is the bag: nobody said to open it. "bread:2" and
 * "other-bread" mean the second loose slice, and also fall back to the bag.
 */
export function resolve(w: World, ref: string | undefined): Obj | undefined {
  if (!ref) return undefined;
  const exact = get(w, ref);
  if (exact) return exact;
  const key = ref.toLowerCase().trim();
  const breadMatch = /^(bread|other-bread)(?::(\d+))?$/.exec(key);
  if (breadMatch) {
    const n = breadMatch[1] === "other-bread" ? 2 : Number(breadMatch[2] ?? 1);
    const slices = w.objects.filter((o) => o.kind === "bread-slice");
    // In an open bag, or in something with no lid at all (a pan, a toaster).
    const inOpenBag = (o: Obj) => {
      if (o.place.type !== "in") return false;
      const c = get(w, o.place.ref);
      return !!c && (c.open || !KINDS[c.kind].opens);
    };
    // Kept in a fixed order, so "bread:2" stays the same slice as things move around.
    const loose = slices.filter((o) => isLoose(w, o) || inOpenBag(o));
    if (loose[n - 1]) return loose[n - 1];
    return w.objects.find((o) => o.kind === "bread-bag") ?? w.objects.find((o) => o.kind === "bread-slice");
  }
  // "cheese:2" is the second slice of cheese.
  const nth = /^(.+):(\d+)$/.exec(key);
  const word = nth ? nth[1] : key;
  const kind = (ALIASES[word] ?? word) as Kind;
  return w.objects.filter((o) => o.kind === kind)[nth ? Number(nth[2]) - 1 : 0];
}

/** What is directly on top of an object, bottom first. */
export function childrenOn(w: World, id: string): Obj[] {
  return w.objects.filter((o) => o.place.type === "on" && o.place.ref === id);
}

export function childrenIn(w: World, id: string): Obj[] {
  return w.objects
    .filter((o) => o.place.type === "in" && o.place.ref === id)
    .sort((a, b) => (a.place as { slot: number }).slot - (b.place as { slot: number }).slot);
}

/** The thing at the very top of a stack. */
export function topOf(w: World, o: Obj): Obj {
  const kids = childrenOn(w, o.id);
  return kids.length ? topOf(w, kids[kids.length - 1]) : o;
}

/** The root of the stack an object sits in. */
export function rootOf(w: World, o: Obj): Obj {
  if (o.place.type === "on" || o.place.type === "in") {
    const parent = get(w, o.place.ref);
    if (parent) return rootOf(w, parent);
  }
  return o;
}

export function heldIn(w: World, hand: "L" | "R"): Obj | undefined {
  return w.objects.find((o) => o.place.type === "hand" && o.place.hand === hand);
}

/** How tall an object stands right now, which is where the next thing stacks. */
export function heightOf(o: Obj): number {
  const k = KINDS[o.kind];
  if (o.kind === "bread-bag" && o.s.folded) return 70;
  if (o.kind === "tomato" && o.s.cut) return 14;
  if (o.kind === "egg" && o.s.cracked) return 10;
  return k.h;
}

// ---------------------------------------------------------------------------
// Layout: absolute positions for drawing.
// ---------------------------------------------------------------------------

export interface Pos {
  x: number;
  /** Base (bottom center) y. */
  y: number;
  rot: number;
  scale: number;
  /** Drawing layer: 0 fridge, 1 counter, 2 held and hat, 3 floor. */
  layer: number;
  order: number;
  /** Hidden behind a closed door or box. */
  hidden: boolean;
}

function slotPos(w: World, container: Obj, cp: Pos, slot: number, o: Obj): { x: number; y: number; rot: number; scale: number; hidden: boolean } {
  switch (container.kind) {
    case "bread-bag": {
      const folded = !!container.s.folded;
      // Drawn as loaf segments side by side (see Art.tsx), so no rotation.
      return { x: cp.x + (-66 + slot * 44) * (folded ? 0.5 : 1), y: cp.y - 8, rot: 0, scale: folded ? 0.5 : 1, hidden: false };
    }
    case "toaster":
      return { x: cp.x - 34 + (slot % 2) * 68, y: cp.y - 60, rot: -90, scale: 0.6, hidden: false };
    case "fridge": {
      const shelf = Math.floor(slot / 2);
      const shelfY = [352, 520, 690, 820][Math.min(shelf, 3)];
      return { x: cp.x - 50 + (slot % 2) * 100, y: shelfY, rot: 0, scale: 0.7, hidden: !container.open };
    }
    case "egg-carton":
      return { x: cp.x - 60 + (slot % 4) * 40, y: cp.y - 20, rot: 0, scale: 0.6, hidden: !container.open };
    case "bowl":
      if (o.kind === "spoon") return { x: cp.x + 30, y: cp.y - 30, rot: -35, scale: 1, hidden: false };
      return { x: cp.x - 30 + slot * 40, y: cp.y - 40, rot: 0, scale: 0.7, hidden: false };
    case "pantry":
    case "cupboard": {
      const shelf = Math.floor(slot / 2);
      return { x: cp.x - 60 + (slot % 2) * 120, y: cp.y - 130 + shelf * 118, rot: 0, scale: 0.55, hidden: !container.open };
    }
    case "drawer":
      return { x: cp.x - 50 + slot * 60, y: cp.y - 14 + (container.open ? 40 : 0), rot: 0, scale: 0.7, hidden: !container.open };
    case "pot":
      if (o.kind === "spoon") return { x: cp.x + 40, y: cp.y - 70, rot: -50, scale: 1, hidden: false };
      return { x: cp.x - 25 + slot * 45, y: cp.y - 66, rot: 0, scale: 0.8, hidden: false };
    case "turkey-pack":
    case "ham-pack":
      return { x: cp.x - 14 + slot * 14, y: cp.y - 12 - slot * 6, rot: 0, scale: 1, hidden: false };
    case "ramen":
      return { x: cp.x + (o.kind === "seasoning" ? 36 : -14), y: cp.y - 22, rot: 0, scale: o.kind === "seasoning" ? 0.7 : 0.9, hidden: !container.open };
    case "pan":
      return { x: cp.x - 30 + slot * 30, y: cp.y - 16, rot: 0, scale: 1, hidden: false };
    default:
      return { x: cp.x, y: cp.y - 10, rot: 0, scale: 0.7, hidden: false };
  }
}

export function layout(w: World): Map<string, Pos> {
  const out = new Map<string, Pos>();
  const visiting = new Set<string>();
  let order = 0;
  const r = w.robot;

  function place(o: Obj): Pos {
    const done = out.get(o.id);
    if (done) return done;
    if (visiting.has(o.id)) return { x: o.x, y: STAGE.COUNTER_Y, rot: 0, scale: 1, layer: 1, order: 0, hidden: false };
    visiting.add(o.id);
    let pos: Pos;
    const p = o.place;
    if (p.type === "counter") {
      pos = { x: o.x, y: STAGE.COUNTER_Y, rot: o.rot, scale: 1, layer: o.kind === "fridge" ? 0 : 1, order: 0, hidden: false };
      if (o.kind === "fridge") pos.y = STAGE.FLOOR_Y - 40;
      if (o.kind === "pantry" || o.kind === "cupboard") Object.assign(pos, { y: 330, layer: 0 });
      if (o.kind === "drawer") Object.assign(pos, { y: 720, layer: 3 });
    } else if (p.type === "floor") {
      pos = { x: o.x, y: STAGE.FLOOR_Y, rot: o.rot, scale: 1, layer: 3, order: 0, hidden: false };
    } else if (p.type === "hand") {
      const h = p.hand === "L" ? r.handL : r.handR;
      const k = KINDS[o.kind];
      pos = { x: h.x, y: h.y + k.h / 2, rot: o.rot, scale: 1, layer: 2, order: 0, hidden: false };
    } else if (p.type === "hat") {
      const onHat = w.objects.filter((x) => x.place.type === "hat");
      const below = onHat.slice(0, onHat.indexOf(o)).reduce((s, x) => s + heightOf(x), 0);
      pos = { x: r.x, y: STAGE.HAT_Y - below, rot: o.rot, scale: 1, layer: 2, order: 0, hidden: false };
    } else if (p.type === "on") {
      const parent = get(w, p.ref);
      if (!parent) pos = { x: o.x, y: STAGE.COUNTER_Y, rot: o.rot, scale: 1, layer: 1, order: 0, hidden: false };
      else {
        const pp = place(parent);
        pos = { x: pp.x + p.dx * pp.scale, y: pp.y - heightOf(parent) * pp.scale, rot: pp.rot + o.rot, scale: pp.scale, layer: pp.layer, order: 0, hidden: pp.hidden };
      }
    } else {
      const parent = get(w, p.ref);
      if (!parent) pos = { x: o.x, y: STAGE.COUNTER_Y, rot: 0, scale: 1, layer: 1, order: 0, hidden: false };
      else {
        const pp = place(parent);
        const sp = slotPos(w, parent, pp, p.slot, o);
        pos = { x: sp.x, y: sp.y, rot: sp.rot + o.rot, scale: sp.scale * pp.scale, layer: pp.layer, order: 0, hidden: sp.hidden || pp.hidden };
      }
    }
    visiting.delete(o.id);
    out.set(o.id, pos);
    return pos;
  }

  for (const o of w.objects) place(o);

  // Draw order: inside things, then the thing, then what is stacked on it.
  const seen = new Set<string>();
  function visit(o: Obj) {
    if (seen.has(o.id)) return;
    seen.add(o.id);
    for (const c of childrenIn(w, o.id)) visit(c);
    const pos = out.get(o.id);
    if (pos) pos.order = order++;
    for (const c of childrenOn(w, o.id)) visit(c);
  }
  for (const o of w.objects) {
    if (o.place.type !== "on" && o.place.type !== "in") visit(o);
  }
  for (const o of w.objects) visit(o);
  return out;
}

/** Where the robot's hand goes to grab something: the middle of it. */
export function gripPoint(w: World, o: Obj): { x: number; y: number } {
  const pos = layout(w).get(o.id);
  if (!pos) return { x: o.x, y: STAGE.COUNTER_Y - 40 };
  return { x: pos.x, y: pos.y - (KINDS[o.kind].h / 2) * pos.scale };
}

/** The top surface of an object, where things get put or spread. */
export function topPoint(w: World, o: Obj): { x: number; y: number } {
  const pos = layout(w).get(o.id);
  if (!pos) return { x: o.x, y: STAGE.COUNTER_Y };
  return { x: pos.x, y: pos.y - heightOf(o) * pos.scale };
}
