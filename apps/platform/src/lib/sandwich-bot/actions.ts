import { KINDS, STAGE, SUBSTANCE_NAME, WALL } from "./catalog";
import type { Action, Face, Hand, Keyframe, Obj, Substance, World } from "./types";
import { childrenIn, childrenOn, clone, get, gripPoint, heightOf, heldIn, layout, resolve, REST, rootOf, topOf, topPoint } from "./world";

/**
 * The action library.
 *
 * Each action reads the kitchen as it is right now and does exactly what the
 * words say, no more. Nothing here fills in a missing step: a closed jar stays
 * closed, bread in a bag stays in the bag. When a step leaves out a tool, the
 * robot uses the silliest reasonable thing (usually its hand). When a step
 * cannot be done, the robot shrugs and moves on.
 *
 * Every move is recorded as a keyframe: the player animates positions from one
 * keyframe to the next, and everything else (faces, lids, words) switches at
 * the start of the move. On-screen words: no em dashes.
 */

type Pt = { x: number; y: number };

const SPEED = {
  reach: 420,
  lift: 320,
  snap: 120,
  wiggle: 150,
};

export class Run {
  w: World;
  frames: Keyframe[] = [];
  /** Slower than 1 for "gently". */
  pace = 1;
  private t = 0;

  constructor(w: World) {
    this.w = clone(w);
    this.t = Math.max(0, ...this.w.objects.map((o) => Number(o.s.t ?? 0)));
  }

  frame(ms: number) {
    this.frames.push({ ms: Math.round(ms * this.pace), world: clone(this.w) });
  }

  // -- robot basics --------------------------------------------------------

  say(text: string | null, face?: Face) {
    if (text === "") return;
    const r = this.w.robot;
    r.say = text;
    if (face) r.face = face;
    // Reading time does not slow down for "gently".
    const ms = text ? Math.min(2600, 700 + text.length * 32) : 150;
    this.frame(ms / this.pace);
  }

  face(f: Face) {
    this.w.robot.face = f;
  }

  hand(h: Hand): Pt {
    return h === "L" ? this.w.robot.handL : this.w.robot.handR;
  }

  moveHand(h: Hand, to: Pt, ms = SPEED.reach) {
    const p = this.hand(h);
    // Stay on stage, even when reaching for something stacked on the hat.
    p.x = Math.round(Math.max(30, Math.min(STAGE.W - 30, to.x)));
    p.y = Math.round(Math.max(40, Math.min(STAGE.H - 20, to.y)));
    this.frame(ms);
  }

  moveBoth(l: Pt, r: Pt, ms = SPEED.reach) {
    Object.assign(this.w.robot.handL, { x: Math.round(l.x), y: Math.round(l.y) });
    Object.assign(this.w.robot.handR, { x: Math.round(r.x), y: Math.round(r.y) });
    this.frame(ms);
  }

  rest(h?: Hand) {
    const r = this.w.robot;
    if (!h || h === "L") Object.assign(r.handL, { x: r.x + REST.dxL, y: REST.y });
    if (!h || h === "R") Object.assign(r.handR, { x: r.x + REST.dxR, y: REST.y });
    this.frame(SPEED.reach);
  }

  /** Walks so that x is within easy reach. Hands come along. */
  near(x: number) {
    const r = this.w.robot;
    const target = Math.max(470, Math.min(1400, x));
    const dist = Math.abs(target - r.x);
    if (dist < 240) return;
    const dx = target - r.x;
    const hop = (part: number, bob: number) => {
      r.x += dx * part;
      r.handL.x += dx * part;
      r.handR.x += dx * part;
      r.bob = bob;
      this.frame(180 + dist * 0.55 * part);
    };
    hop(0.5, 1);
    hop(0.5, 0);
  }

  /** A hand that is free, putting something on the hat or the counter if both are full. */
  freeHand(keep?: Obj, prefer: Hand = "R"): Hand {
    const other: Hand = prefer === "R" ? "L" : "R";
    if (!heldIn(this.w, prefer)) return prefer;
    if (!heldIn(this.w, other)) return other;
    const held = [heldIn(this.w, "L")!, heldIn(this.w, "R")!].filter((o) => o.id !== keep?.id);
    held.sort((a, b) => Number(a.s.t ?? 0) - Number(b.s.t ?? 0));
    const h = (held[0].place as { hand: Hand }).hand;
    this.clearHand(h);
    this.rest(h);
    return h;
  }

  /** Empties one hand: the thing goes on the hat if the hat is free, else on the counter. */
  clearHand(h: Hand) {
    const o = heldIn(this.w, h);
    if (!o) return;
    const hatEmpty = !this.w.objects.some((x) => x.place.type === "hat");
    if (hatEmpty) {
      this.say(`My hands are full! The ${KINDS[o.kind].name} goes on my hat.`, "oops");
      this.moveHand(h, { x: this.w.robot.x, y: STAGE.HAT_Y - KINDS[o.kind].h / 2 });
      o.place = { type: "hat" };
      o.rot = 0;
      this.frame(SPEED.snap);
    } else {
      this.say(`My hands are full. Putting the ${KINDS[o.kind].name} down.`, "oops");
      this.release(o, this.counterSpot(KINDS[o.kind].w));
    }
    this.rest(h);
  }

  /** A clear x on the counter near the robot. */
  counterSpot(width: number, avoid?: number): number {
    const roots = this.w.objects.filter((o) => o.place.type === "counter" && o.kind !== "fridge");
    const clear = (x: number) =>
      x - width / 2 > STAGE.COUNTER_LEFT + 10 &&
      x + width / 2 < STAGE.COUNTER_RIGHT &&
      (avoid === undefined || Math.abs(x - avoid) > width) &&
      roots.every((o) => Math.abs(o.x - x) > (KINDS[o.kind].w + width) / 2 + 10);
    const start = this.w.robot.x;
    for (let d = 0; d < 1400; d += 20) {
      if (clear(start + d)) return start + d;
      if (clear(start - d)) return start - d;
    }
    return start;
  }

  // -- holding -------------------------------------------------------------

  isHeld(o: Obj): Hand | null {
    return o.place.type === "hand" ? o.place.hand : null;
  }

  /** Picks an object up into a hand and lifts it. */
  grab(o: Obj, prefer: Hand = "R"): Hand {
    const already = this.isHeld(o);
    if (already) return already;
    const h = this.freeHand(o, prefer);
    const store = this.storageOf(o);
    if (store) this.door(store, true, h);
    if (o.place.type === "hat") {
      this.moveHand(h, { x: this.w.robot.x, y: STAGE.HAT_Y - heightOf(o) / 2 });
    } else {
      const g = gripPoint(this.w, o);
      this.near(g.x);
      this.face("work");
      this.moveHand(h, g);
    }
    o.place = { type: "hand", hand: h };
    o.rot = 0;
    o.s.t = ++this.t;
    this.frame(SPEED.snap);
    const p = this.hand(h);
    this.moveHand(h, { x: p.x, y: Math.min(p.y, 470) }, SPEED.lift);
    if (store) this.door(store, false);
    return h;
  }

  /** The kitchen storage (pantry, cupboard, drawer, fridge) an object is in, if it is closed. */
  storageOf(o: Obj): Obj | undefined {
    if (o.place.type !== "in") return undefined;
    const c = get(this.w, o.place.ref);
    if (!c) return undefined;
    if (KINDS[c.kind].storage) return c.open ? undefined : c;
    return this.storageOf(c);
  }

  /** Something to put things in or on is still in the cupboard: take it out and set it down first. */
  fetch(o: Obj) {
    if (!this.storageOf(o)) return;
    this.say(`Getting the ${KINDS[o.kind].name} out of the ${KINDS[get(this.w, (o.place as { ref: string }).ref)!.kind].name}.`, "work");
    this.grab(o, "L");
    this.release(o, this.counterSpot(KINDS[o.kind].w));
  }

  /** Opens or closes a storage door. Students say "get it from the pantry", so this is not a missing step. */
  door(c: Obj, open: boolean, h: Hand = "L") {
    if (c.open === open) return;
    const pos = layout(this.w).get(c.id)!;
    const k = KINDS[c.kind];
    const at = c.kind === "fridge" ? { x: pos.x + 90, y: 470 } : { x: pos.x + (c.kind === "drawer" ? 0 : k.w / 2 - 30), y: pos.y - k.h / 2 };
    this.near(at.x);
    const free: Hand = heldIn(this.w, h) ? (h === "L" ? "R" : "L") : h;
    const hand = heldIn(this.w, free) && heldIn(this.w, h) ? h : free;
    const back = { ...this.hand(hand) };
    this.moveHand(hand, at, 320);
    c.open = open;
    this.frame(220);
    this.moveHand(hand, back, 260);
  }

  /** Lets go of a held object onto the counter (x), the floor, or on top of another object. */
  release(o: Obj, dest: number | Obj | "floor") {
    const h = this.isHeld(o);
    if (!h) return;
    const k = KINDS[o.kind];
    if (dest === "floor") {
      o.place = { type: "floor" };
      o.x = this.hand(h).x;
      o.rot = 12;
      this.frame(380);
      return;
    }
    if (typeof dest === "number") {
      this.near(dest);
      this.moveHand(h, { x: dest, y: STAGE.COUNTER_Y - k.h / 2 });
      o.place = { type: "counter" };
      o.x = Math.round(dest);
      o.rot = 0;
      this.frame(SPEED.snap);
      this.rest(h);
      return;
    }
    if (isPlastic(o) && isHot(this.w, dest)) {
      this.say("Safety rule: no plastic in a hot pan! I will set it next to the stove.", "oops");
      this.release(o, this.counterSpot(k.w));
      return;
    }
    const base = rootOf(this.w, dest);
    if (base.place.type === "hat") this.unhat(base, h);
    const top = topOf(this.w, dest);
    const tp = topPoint(this.w, top);
    if (dest.place.type !== "hat") this.near(tp.x);
    const tp2 = topPoint(this.w, top);
    this.moveHand(h, { x: tp2.x, y: tp2.y - k.h / 2 });
    o.place = { type: "on", ref: top.id, dx: 0 };
    o.rot = 0;
    this.frame(SPEED.snap);
    this.rest(h);
  }

  /** Takes a stack off the hat before stacking more on it (stacking on a robot head is not safe). */
  unhat(base: Obj, keep: Hand) {
    const other: Hand = keep === "L" ? "R" : "L";
    this.say(`Stacking on my head is wobbly. The ${KINDS[base.kind].name} comes down first.`, "think");
    if (heldIn(this.w, other)) {
      const busy = heldIn(this.w, other)!;
      this.release(busy, this.counterSpot(KINDS[busy.kind].w));
    }
    this.moveHand(other, { x: this.w.robot.x, y: STAGE.HAT_Y - heightOf(base) / 2 });
    base.place = { type: "hand", hand: other };
    this.frame(SPEED.snap);
    this.release(base, this.counterSpot(KINDS[base.kind].w));
  }

  // -- reactions -----------------------------------------------------------

  confused(why: string) {
    const r = this.w.robot;
    r.question = true;
    r.face = "confused";
    r.say = why;
    const l = { ...r.handL };
    const rr = { ...r.handR };
    const lift = (dy: number, bob: number, ms: number) => {
      r.handL = { x: l.x, y: l.y - dy };
      r.handR = { x: rr.x, y: rr.y - dy };
      r.bob = bob;
      this.frame(ms);
    };
    lift(40, -1, 300);
    lift(0, 0, 300);
    lift(40, -1, 300);
    lift(0, 0, 300);
    this.frame(Math.min(2400, 600 + why.length * 30));
    r.question = false;
  }

  /** Small back and forth on an object, for twisting and rubbing. */
  wiggle(o: Obj, times = 3, deg = 10) {
    for (let i = 0; i < times; i++) {
      o.rot = deg;
      this.frame(SPEED.wiggle);
      o.rot = -deg;
      this.frame(SPEED.wiggle);
    }
    o.rot = 0;
    this.frame(SPEED.wiggle);
  }

  /** Moves a hand across a point a few times, like spreading. */
  scrub(h: Hand, at: Pt, width = 50, times = 3) {
    for (let i = 0; i < times; i++) {
      this.moveHand(h, { x: at.x - width, y: at.y }, 170);
      this.moveHand(h, { x: at.x + width, y: at.y }, 170);
    }
  }

  mess(sub: Substance, x: number, y: number, r = 26) {
    this.w.messes.push({ sub, x: Math.round(x), y: Math.round(y), r });
  }

  handMess(h: Hand, sub: Substance) {
    const key = h === "L" ? "handL" : "handR";
    if (!this.w.messes.some((m) => m.onRobot === key && m.sub === sub)) {
      this.w.messes.push({ sub, x: 0, y: 0, r: 16, onRobot: key });
    }
  }
}

// ---------------------------------------------------------------------------

function name(o: Obj): string {
  if (o.kind === "cheese" && !o.open) return "wrapped slice of cheese";
  return KINDS[o.kind].name;
}

/** Packaging that must not go in a hot pan, and that Chef Byte will not bite. */
export function isPlastic(o: Obj): boolean {
  return o.kind === "bread-bag" || !!KINDS[o.kind].plastic || (o.kind === "cheese" && !o.open);
}

/** Is this spot on a stove that is on? */
export function isHot(w: World, dest: Obj): boolean {
  let cur: Obj | undefined = dest;
  while (cur) {
    if (cur.kind === "stove") return !!cur.s.on;
    if (cur.place.type !== "on" && cur.place.type !== "in") return false;
    cur = get(w, cur.place.ref);
  }
  return false;
}

function find(run: Run, ref: string | undefined, label?: string): Obj | null {
  const o = resolve(run.w, ref);
  if (!o) {
    run.confused(`I can't find ${label ?? `the ${ref ?? "thing"}`}.`);
    return null;
  }
  return o;
}

/** Inside a closed container? Then the robot only gets the container. */
function reachable(run: Run, o: Obj): Obj {
  if (o.place.type === "in") {
    const c = get(run.w, o.place.ref);
    if (c && KINDS[c.kind].opens && !c.open && !KINDS[c.kind].storage) return reachable(run, c);
  }
  return o;
}

/** Is `low` somewhere underneath `high` in a stack? */
function isUnder(w: World, low: Obj, high: Obj): boolean {
  let cur: Obj | undefined = high;
  while (cur && (cur.place.type === "on" || cur.place.type === "in")) {
    cur = get(w, cur.place.ref);
    if (cur?.id === low.id) return true;
  }
  return false;
}

function substanceOf(o: Obj): Substance | undefined {
  return KINDS[o.kind].holds;
}

/** The jar or carton a substance word means. */
function sourceFor(run: Run, ref: string | undefined): Obj | undefined {
  if (!ref) return undefined;
  return resolve(run.w, ref);
}

function coated(o: Obj | undefined): Substance | undefined {
  const c = o?.s.coated;
  return typeof c === "string" ? (c as Substance) : undefined;
}

// ---------------------------------------------------------------------------
// The actions. Each takes the run and the action's arguments.
// ---------------------------------------------------------------------------

type Handler = (run: Run, a: Action) => void;

const pickUp: Handler = (run, a) => {
  const wanted = find(run, a.what);
  if (!wanted) return;
  if (KINDS[wanted.kind].fixed) {
    run.confused(`The ${name(wanted)} is too big to pick up.`);
    return;
  }
  const o = reachable(run, wanted);
  if (run.isHeld(o)) {
    run.say(a.say ?? `I am already holding the ${name(o)}.`, "happy");
    return;
  }
  if (o !== wanted) run.say(a.say ?? `The ${name(wanted)} is inside the closed ${name(o)}. I will take the ${name(o)}!`, "think");
  else run.say(a.say ?? `Getting the ${name(o)}.`, "happy");
  run.grab(o, a.hand);
};

const putDown: Handler = (run, a) => {
  let o = a.what ? resolve(run.w, a.what) : heldIn(run.w, "R") ?? heldIn(run.w, "L");
  if (!o) {
    run.confused(a.what ? `I can't find the ${a.what}.` : "I am not holding anything.");
    return;
  }
  o = reachable(run, o);
  // `to` means "next to", never "on top of".
  const dest = a.onto ?? a.into;
  if (dest === "floor") {
    if (!run.isHeld(o)) run.grab(o);
    run.say(a.say ?? `Putting the ${name(o)} on the floor.`, "happy");
    run.release(o, "floor");
    return;
  }
  const rawTarget = dest && dest !== "counter" ? resolve(run.w, dest) : undefined;
  if (dest && dest !== "counter" && !rawTarget) {
    run.confused(`I can't find the ${dest}.`);
    return;
  }
  const target = rawTarget ? reachable(run, rawTarget) : undefined;
  if (target) run.fetch(target);
  if (target && target.id === o.id) {
    run.confused(`I can't put the ${name(o)} on itself.`);
    return;
  }
  if (target && isUnder(run.w, o, target)) {
    run.confused(`The ${name(o)} is already under the ${name(target)}!`);
    return;
  }
  if (!run.isHeld(o)) run.grab(o);
  if (target && a.how === "side") {
    // Side by side on a plate: on the target itself, shifted left or right.
    run.say(a.say ?? `The ${name(o)} goes on the ${name(target)}, side by side.`, "work");
    const used = childrenOn(run.w, target.id).filter((c) => c.id !== o.id).length;
    const dx = used % 2 === 0 ? -62 : 62;
    const tp = topPoint(run.w, target);
    const hh = run.isHeld(o)!;
    run.near(tp.x);
    run.moveHand(hh, { x: tp.x + dx, y: tp.y - KINDS[o.kind].h / 2 });
    o.place = { type: "on", ref: target.id, dx };
    o.rot = 0;
    run.frame(SPEED.snap);
    run.rest(hh);
  } else if (target) {
    run.say(a.say ?? `The ${name(o)} goes on the ${name(target)}.`, "work");
    run.release(o, target);
  } else if (a.to) {
    const near = resolve(run.w, a.to);
    run.say(a.say ?? `Putting the ${name(o)} next to the ${near ? name(near) : a.to}.`, "work");
    const nx = near ? layout(run.w).get(near.id)!.x : run.w.robot.x;
    const k = KINDS[o.kind];
    const nw = near ? KINDS[near.kind].w : 0;
    const roots = run.w.objects.filter((x) => x.place.type === "counter" && !WALL.has(x.kind) && x.id !== o.id);
    const clear = (x: number) => x - k.w / 2 > 10 && x + k.w / 2 < STAGE.COUNTER_RIGHT && roots.every((r) => Math.abs(r.x - x) > (KINDS[r.kind].w + k.w) / 2 + 8);
    let spot = nx + nw / 2 + k.w / 2 + 16;
    for (let d = 0; d < 900; d += 20) {
      if (clear(nx + nw / 2 + k.w / 2 + 16 + d)) { spot = nx + nw / 2 + k.w / 2 + 16 + d; break; }
      if (clear(nx - nw / 2 - k.w / 2 - 16 - d)) { spot = nx - nw / 2 - k.w / 2 - 16 - d; break; }
    }
    run.release(o, spot);
  } else {
    run.say(a.say ?? `Putting down the ${name(o)}.`, "work");
    run.release(o, run.counterSpot(KINDS[o.kind].w));
  }
  run.face("happy");
};

/** Pick something up and put it on something: "put the peanut butter on the bread". */
const place: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  const target = a.onto ?? a.into;
  const t0 = target === "floor" || target === "counter" ? undefined : resolve(run.w, target);
  const t = t0 ? reachable(run, t0) : undefined;
  const thing = reachable(run, o);
  run.say(a.say ?? (t ? `${cap(name(thing))} on the ${name(t)}. Okay!` : `Moving the ${name(thing)}.`), "happy");
  putDown(run, { do: "putDown", what: thing.id, onto: target, say: "" });
};

function twistOpen(run: Run, o: Obj, opening: boolean) {
  const held = run.isHeld(o);
  if (held) {
    const other: Hand = held === "L" ? "R" : "L";
    run.clearHand(other);
    const p = run.hand(held);
    run.moveHand(other, { x: p.x, y: p.y - 8 });
    run.wiggle(o, 3, 14);
    o.open = opening;
    run.frame(SPEED.snap);
    run.rest(other);
    return;
  }
  const g = topPoint(run.w, o);
  run.near(g.x);
  const h = run.freeHand(undefined, "R");
  run.moveHand(h, { x: g.x, y: g.y - 6 });
  run.wiggle(o, 3, 10);
  o.open = opening;
  run.frame(SPEED.snap);
  run.rest(h);
}

const open: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  const k = KINDS[o.kind];
  if (!k.opens) {
    run.confused(`I don't know how to open a ${name(o)}.`);
    return;
  }
  if (o.open) {
    run.say(a.say ?? `The ${name(o)} is already open.`, "happy");
    return;
  }
  run.say(a.say ?? (o.kind === "cheese" ? "Unwrapping the cheese." : `Opening the ${name(o)}.`), "work");
  if (o.kind === "bread-bag") {
    const pos = layout(run.w).get(o.id)!;
    const tie = { x: pos.x + (k.w / 2 - 20) * pos.scale, y: pos.y - (k.h / 2) * pos.scale };
    run.near(tie.x);
    const h = run.freeHand(undefined, "R");
    run.moveHand(h, tie);
    for (let i = 0; i < 3; i++) {
      run.moveHand(h, { x: tie.x + 14, y: tie.y - 14 }, 140);
      run.moveHand(h, { x: tie.x, y: tie.y }, 140);
    }
    o.s.tie = "off";
    o.open = true;
    run.frame(SPEED.snap);
    run.rest(h);
  } else if (KINDS[o.kind].storage && o.kind !== "fridge") {
    run.door(o, true);
  } else if (o.kind === "cheese" || o.kind.endsWith("-pack") || o.kind === "ramen" || o.kind === "seasoning") {
    const g = gripPoint(run.w, o);
    run.near(g.x);
    const h = run.isHeld(o) ? (run.isHeld(o) === "L" ? "R" : "L") : run.freeHand(undefined, "R");
    if (run.isHeld(o) && heldIn(run.w, h)) run.clearHand(h);
    run.moveHand(h, { x: g.x - 30, y: g.y - 10 });
    run.moveHand(h, { x: g.x + 40, y: g.y - 40 }, 300);
    o.open = true;
    run.frame(SPEED.snap);
    run.rest(h);
  } else if (o.kind === "fridge" || o.kind === "cereal-box" || o.kind === "egg-carton") {
    const g = gripPoint(run.w, o);
    run.near(g.x + 120);
    const h = run.freeHand(undefined, "L");
    run.moveHand(h, { x: g.x + (o.kind === "fridge" ? 90 : 0), y: o.kind === "fridge" ? 470 : topPoint(run.w, o).y });
    o.open = true;
    run.frame(300);
    run.rest(h);
  } else {
    twistOpen(run, o, true);
  }
  run.face("happy");
};

const close: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  if (!KINDS[o.kind].opens) {
    run.confused(`I don't know how to close a ${name(o)}.`);
    return;
  }
  if (!o.open) {
    run.say(a.say ?? `The ${name(o)} is already closed.`, "happy");
    return;
  }
  run.say(a.say ?? `Closing the ${name(o)}.`, "work");
  if (o.kind === "bread-bag" || o.kind === "fridge" || o.kind === "cereal-box" || o.kind === "egg-carton") {
    const g = gripPoint(run.w, o);
    run.near(g.x);
    const h = run.freeHand(undefined, "R");
    run.moveHand(h, g);
    o.open = false;
    if (o.kind === "bread-bag") o.s.tie = "on";
    run.frame(SPEED.snap);
    run.rest(h);
  } else {
    twistOpen(run, o, false);
  }
};

/** "Twist": opens a closed jar, closes an open one, and spins anything else. */
const twist: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  if (o.kind.endsWith("-jar") || o.kind === "milk") {
    run.say(a.say ?? `Twisting the ${name(o)}.`, "work");
    twistOpen(run, o, !o.open);
    return;
  }
  run.say(a.say ?? `Twisting the ${name(o)}!`, "work");
  if (o.kind === "bread-bag") {
    o.s.twisted = Number(o.s.twisted ?? 0) + 1;
  }
  const h = run.isHeld(o) ?? run.grab(o);
  void h;
  for (const deg of [90, 180, 270, 360]) {
    o.rot = deg;
    run.frame(160);
  }
  o.rot = 0;
  run.frame(0);
};

/** "Take some peanut butter (with the knife)". `how: "sharp"` scoops with the edge: just a tiny bit. */
const scoop: Handler = (run, a) => {
  const src = sourceFor(run, a.what ?? a.from);
  if (!src) {
    run.confused(`I can't find the ${a.what ?? "food"}.`);
    return;
  }
  const sub = substanceOf(src);
  if (!sub) {
    run.confused(`There is nothing to scoop in the ${name(src)}.`);
    return;
  }
  const tool = a.with ? resolve(run.w, a.with) : undefined;
  if (a.with && !tool) {
    run.confused(`I can't find the ${a.with}.`);
    return;
  }
  if (!src.open) {
    run.say(a.say ?? `The ${name(src)} is closed. I will scoop the lid!`, "think");
    const h = tool ? run.isHeld(tool) ?? run.grab(tool) : run.freeHand(src);
    const tp = topPoint(run.w, src);
    run.moveHand(h, { x: tp.x, y: tp.y - 4 });
    run.scrub(h, { x: tp.x, y: tp.y - 4 }, 22, 2);
    run.rest(h);
    run.say("Hmm. Nothing came out.", "confused");
    return;
  }
  run.say(a.say ?? (tool ? `Scooping ${SUBSTANCE_NAME[sub]} with the ${name(tool)}${a.how === "sharp" ? ", sharp side" : ""}.` : `Scooping ${SUBSTANCE_NAME[sub]} with my hand!`), "work");
  const h = tool ? run.isHeld(tool) ?? run.grab(tool) : run.freeHand(src, run.isHeld(src) === "R" ? "L" : "R");
  const tp = topPoint(run.w, src);
  run.moveHand(h, { x: tp.x, y: tp.y + 10 });
  run.moveHand(h, { x: tp.x + 10, y: tp.y + 30 }, 220);
  if (tool) {
    tool.s.coated = sub;
    tool.s.thin = a.how === "sharp";
    if (a.how === "big") tool.s.big = true;
  } else {
    run.handMess(h, sub);
  }
  src.s.level = Math.max(0.15, Number(src.s.level ?? 1) - 0.15);
  run.moveHand(h, { x: tp.x, y: tp.y - 60 }, 260);
  run.face("happy");
};

/**
 * "Spread / put some X on Y". Uses the tool in hand if it has X on it, else
 * the tool named, else a hand. A closed jar gets rubbed on Y. `how: "face"`
 * draws a smiley face instead of a layer.
 */
const spread: Handler = (run, a) => {
  const target = resolve(run.w, a.onto);
  if (!target) {
    run.confused(`I can't find the ${a.onto ?? "thing to spread on"}.`);
    return;
  }
  const src = sourceFor(run, a.what);
  const named = a.with ? resolve(run.w, a.with) : undefined;
  if (a.with && a.with !== "hand" && !named) {
    run.confused(`I can't find the ${a.with}.`);
    return;
  }
  const heldTools = (["R", "L"] as Hand[]).map((h) => heldIn(run.w, h)).filter((o): o is Obj => !!o && (o.kind === "butter-knife" || o.kind === "spoon"));
  let sub: Substance | undefined = src ? substanceOf(src) : undefined;
  let tool: Obj | undefined = named;
  if (!tool && a.with !== "hand") {
    // A tool in hand that already has this on it; else, when the jar is open, any tool in hand.
    tool = heldTools.find((t) => coated(t) && (!sub || coated(t) === sub)) ?? (src?.open && !a.how?.includes("hand") ? heldTools[0] : undefined);
  }
  if (!sub && tool) sub = coated(tool);
  const handHas = (h: Hand) => run.w.messes.some((m) => m.onRobot === (h === "L" ? "handL" : "handR") && (!sub || m.sub === sub));
  if (!sub) {
    const messyHand = (["R", "L"] as Hand[]).find((h) => handHas(h));
    const m = messyHand ? run.w.messes.find((x) => x.onRobot === (messyHand === "L" ? "handL" : "handR")) : undefined;
    sub = m?.sub;
  }
  if (!sub) {
    run.confused(`Put some... what? I don't know what to spread.`);
    return;
  }
  const subName = SUBSTANCE_NAME[sub];

  // Closed jar with a tool named: the tool scrapes the lid and spreads nothing.
  if (src && !src.open && tool && coated(tool) !== sub) {
    scoop(run, { do: "scoop", what: src.id, with: tool.id });
    const th = run.isHeld(tool)!;
    const tp0 = topPoint(run.w, target);
    run.say(a.say ?? `Spreading... nothing on the ${name(target)}.`, "work");
    run.scrub(th, { x: tp0.x, y: tp0.y - 4 }, 40, 2);
    run.rest(th);
    return;
  }
  // Closed jar named and nothing on the tool: rub the jar itself on the target.
  if (src && !src.open && !(tool && coated(tool) === sub)) {
    run.say(a.say ?? `${cap(subName)} on the ${name(target)}! The jar is closed, so I will rub the jar on it.`, "work");
    const h = run.isHeld(src) ?? run.grab(src);
    const tp = topPoint(run.w, target);
    run.moveHand(h, { x: tp.x, y: tp.y - KINDS[src.kind].h / 2 });
    run.scrub(h, { x: tp.x, y: tp.y - KINDS[src.kind].h / 2 }, 40, 2);
    run.rest(h);
    run.say("Hmm. The bread looks the same.", "confused");
    return;
  }

  let h: Hand;
  let toolName: string;
  let thin = false;
  if (tool) {
    h = run.isHeld(tool) ?? run.grab(tool);
    toolName = tool.kind === "spoon" ? "spoon" : "knife";
    if (coated(tool) !== sub) {
      if (!src || !src.open) {
        run.confused(`The ${name(tool)} has no ${subName} on it.`);
        return;
      }
      scoop(run, { do: "scoop", what: src.id, with: tool.id, say: `Getting ${subName} with the ${name(tool)}.` });
    }
    thin = !!tool.s.thin;
  } else {
    // No tool: a hand. Scoop with it first if it is clean.
    const messy = (["R", "L"] as Hand[]).find((x) => handHas(x) && !heldIn(run.w, x));
    if (messy) h = messy;
    else {
      if (!src) {
        run.confused(`I have no ${subName} to put on.`);
        return;
      }
      scoop(run, { do: "scoop", what: src.id });
      h = (["R", "L"] as Hand[]).find((x) => handHas(x)) ?? "R";
    }
    toolName = "hand";
  }

  const face = a.how === "face";
  run.say(a.say ?? (face ? `${cap(subName)} on the face of the ${name(target)}. I will draw a face!` : `Putting ${subName} on the ${name(target)}${toolName === "hand" ? " with my hand" : ""}.`), "work");
  const tp = topPoint(run.w, target);
  const pos = layout(run.w).get(target.id)!;
  const onBag = target.kind === "bread-bag";
  // On a bag the face goes on the front of the plastic, left half first.
  const half = onBag ? (target.spreads.length % 2 === 0 ? -1 : 1) : 0;
  const at = onBag ? { x: pos.x + half * 70 * pos.scale, y: pos.y - (KINDS[target.kind].h / 2) * pos.scale } : { x: tp.x, y: tp.y - 4 };
  if (!onBag && target.place.type !== "hat") run.near(at.x);
  if (face) {
    run.moveHand(h, { x: at.x - 18, y: at.y - 14 }, 300);
    run.moveHand(h, { x: at.x - 18, y: at.y - 10 }, 120);
    run.moveHand(h, { x: at.x + 18, y: at.y - 14 }, 300);
    run.moveHand(h, { x: at.x + 18, y: at.y - 10 }, 120);
    run.moveHand(h, { x: at.x - 26, y: at.y + 8 }, 260);
    run.moveHand(h, { x: at.x, y: at.y + 20 }, 200);
    run.moveHand(h, { x: at.x + 26, y: at.y + 8 }, 200);
  } else {
    run.scrub(h, at, onBag ? 40 : 46, 3);
  }
  target.spreads.push({ sub, tool: toolName, thin: thin || undefined, face: face || undefined });
  if (tool) delete tool.s.coated;
  run.frame(SPEED.snap);
  run.rest(h);
  run.face("happy");
};

const cut: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  const named = a.with ? resolve(run.w, a.with) : undefined;
  const knife = named ?? (["R", "L"] as Hand[]).map((h) => heldIn(run.w, h)).find((x) => x?.kind === "butter-knife");
  const tp = topPoint(run.w, o);
  run.near(tp.x);
  if (knife) {
    run.say(a.say ?? `Cutting the ${name(o)} with the ${name(knife)}.`, "work");
    const h = run.isHeld(knife) ?? run.grab(knife);
    run.moveHand(h, { x: tp.x - 50, y: tp.y - 30 });
    run.moveHand(h, { x: tp.x + 50, y: tp.y + 4 }, 500);
    o.s.cut = true;
  } else {
    run.say(a.say ?? `Cut the ${name(o)}? I have no knife. Robot chop!`, "work");
    const h = run.freeHand(undefined, "R");
    run.moveHand(h, { x: tp.x, y: tp.y - 120 });
    run.moveHand(h, { x: tp.x, y: tp.y - 4 }, 160);
    o.s.squished = true;
    run.frame(SPEED.snap);
  }
  run.rest();
  run.face("happy");
};

const stack: Handler = (run, a) => {
  const items = a.items ?? [];
  let base = a.onto ? resolve(run.w, a.onto) : undefined;
  for (const ref of items) {
    const o = resolve(run.w, ref);
    if (!o) {
      run.confused(`I can't find the ${ref}.`);
      continue;
    }
    if (!base) {
      base = o;
      continue;
    }
    putDown(run, { do: "putDown", what: o.id, onto: base.id });
  }
};

const pour: Handler = (run, a) => {
  const src = find(run, a.what);
  if (!src) return;
  const into = a.into ? resolve(run.w, a.into) : undefined;
  if (into) run.fetch(into);
  const sub = substanceOf(src);
  const inside = childrenIn(run.w, src.id).filter((c) => c.kind !== "spoon");
  if (!sub && inside.length && into) {
    run.say(a.say ?? `Pouring the ${name(src)} into the ${name(into)}.`, "work");
    const h = run.isHeld(src) ?? run.grab(src);
    const tp = topPoint(run.w, into);
    run.near(tp.x);
    run.moveHand(h, { x: tp.x - 60, y: tp.y - 160 });
    src.rot = 100;
    run.frame(400);
    let slot = childrenIn(run.w, into.id).length;
    for (const c of inside) c.place = { type: "in", ref: into.id, slot: slot++ };
    run.frame(500);
    src.rot = 0;
    run.frame(300);
    run.release(src, run.counterSpot(KINDS[src.kind].w, tp.x));
    run.face("happy");
    return;
  }
  if (!sub) {
    run.confused(`The ${name(src)} has nothing to pour.`);
    return;
  }
  const h = run.isHeld(src) ?? run.grab(src);
  const dest = into ? topPoint(run.w, into) : { x: run.w.robot.x + 160, y: STAGE.COUNTER_Y };
  if (into) run.near(dest.x);
  run.say(a.say ?? (into ? `Pouring the ${SUBSTANCE_NAME[sub]} into the ${name(into)}.` : `Pouring the ${SUBSTANCE_NAME[sub]}!`), "work");
  run.moveHand(h, { x: dest.x - 40, y: dest.y - 140 });
  src.rot = 110;
  run.frame(400);
  if (KINDS[src.kind].opens && !src.open) {
    run.frame(600);
    src.rot = 0;
    run.frame(300);
    run.say("Nothing is coming out.", "confused");
    run.rest(h);
    return;
  }
  if (src.kind === "measuring-cup") src.s.fill = 0;
  if (into && into.kind === "pot" && sub === "water") {
    into.s.fill = Math.min(1, Number(into.s.fill ?? 0) + 0.4);
    into.s.fillWith = "water";
  } else if (into && into.kind === "pan") {
    into.s.oiled = true;
  } else if (into && into.kind === "bowl") {
    const contents = (into.s.contents as string[]) ?? [];
    if (!contents.includes(sub)) contents.push(sub);
    into.s.contents = contents;
  } else if (into) {
    run.mess(sub, dest.x, dest.y, 34);
  } else {
    run.mess(sub, dest.x, STAGE.COUNTER_Y, 50);
  }
  src.s.level = Math.max(0.1, Number(src.s.level ?? 1) - 0.4);
  run.frame(800);
  src.rot = 0;
  run.frame(300);
  run.rest(h);
  run.face("happy");
};

const flip: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  run.say(a.say ?? `Flipping the ${name(o)}!`, "work");
  const wasHeld = !!run.isHeld(o);
  const before = { place: structuredClone(o.place), x: o.x };
  const h = run.isHeld(o) ?? run.grab(o);
  const p = run.hand(h);
  run.moveHand(h, { x: p.x, y: p.y - 60 }, 200);
  o.rot = 90;
  run.frame(150);
  o.rot = 180;
  run.frame(150);
  o.rot = 0;
  o.flipped = !o.flipped;
  run.frame(0);
  run.moveHand(h, { x: p.x, y: p.y }, 200);
  if (!wasHeld) {
    // Back where it was, now upside down.
    o.place = before.place;
    o.x = before.x;
    run.frame(300);
    run.rest(h);
  }
  run.face("happy");
};

function switchTo(on: boolean): Handler {
  return (run, a) => {
    const o = find(run, a.what);
    if (!o) return;
    if (o.kind !== "toaster" && o.kind !== "stove") {
      run.confused(`The ${name(o)} does not turn ${on ? "on" : "off"}.`);
      return;
    }
    run.say(a.say ?? (on && a.how ? `Setting the ${name(o)} to ${a.how}.` : `Turning ${on ? "on" : "off"} the ${name(o)}.`), "work");
    const pos = layout(run.w).get(o.id)!;
    run.near(pos.x);
    const h = run.freeHand(undefined, "R");
    const knob = { x: pos.x + KINDS[o.kind].w / 2 - 24, y: pos.y - KINDS[o.kind].h / 2 };
    run.moveHand(h, knob);
    o.s.on = on;
    if (on && a.how) o.s.heat = a.how;
    run.moveHand(h, { x: knob.x, y: knob.y + 12 }, 200);
    run.rest(h);
    run.face("happy");
  };
}

const wait: Handler = (run, a) => {
  if (a.until) {
    waitUntil(run, a);
    return;
  }
  const secs = a.seconds ?? a.amount ?? 5;
  run.say(a.say ?? (secs >= 60 && secs % 60 === 0 ? `Waiting ${secs / 60} minute${secs === 60 ? "" : "s"}...` : `Waiting ${secs} seconds...`), "wait");
  run.w.robot.bob = 1;
  run.frame(400);
  run.w.robot.bob = 0;
  run.frame(400);
  run.w.clock += secs;
  for (const o of run.w.objects) {
    if (o.kind === "toaster" && o.s.on) {
      for (const slice of childrenIn(run.w, o.id)) slice.s.toasted = Math.min(3, Number(slice.s.toasted ?? 0) + Math.ceil(secs / 4));
      if (secs >= 4) o.s.on = false;
    }
    if (o.kind === "stove" && o.s.on) {
      for (const pan of run.w.objects.filter((x) => (x.kind === "pan" || x.kind === "pot") && x.place.type === "on" && x.place.ref === o.id)) {
        for (const e of childrenIn(run.w, pan.id)) {
          if (e.s.cracked) e.s.cooked = true;
          if (e.kind === "bread-slice") e.s.toasted = Math.min(3, Number(e.s.toasted ?? 0) + (secs >= 60 ? 1 : 0));
          if (e.kind === "noodles" && pan.s.fillWith === "water") e.s.cooked = true;
        }
        if (pan.kind === "pot" && pan.s.fillWith === "water" && Number(pan.s.fill) > 0) pan.s.boiling = true;
      }
    }
  }
  run.frame(300);
  run.face("happy");
};

const drop: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  const thing = reachable(run, o);
  if (!run.isHeld(thing)) run.grab(thing);
  run.say(a.say ?? `Dropping the ${name(thing)}. Oops!`, "oops");
  if (thing.open && substanceOf(thing)) run.mess(substanceOf(thing)!, run.hand(run.isHeld(thing)!).x, STAGE.FLOOR_Y, 40);
  run.release(thing, "floor");
  run.rest();
};

const crack: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  const egg = o.kind === "egg-carton" ? childrenIn(run.w, o.id)[0] : o;
  if (!egg) {
    run.confused("There are no eggs left.");
    return;
  }
  const into = a.into ? resolve(run.w, a.into) : undefined;
  run.say(a.say ?? (into ? `Cracking the egg into the ${name(into)}.` : "Cracking the egg!"), "work");
  const h = run.grab(reachable(run, egg));
  if (into) {
    const tp = topPoint(run.w, into);
    run.near(tp.x);
    run.moveHand(h, { x: tp.x, y: tp.y - 40 });
    egg.s.cracked = true;
    const slot = childrenIn(run.w, into.id).length;
    egg.place = { type: "in", ref: into.id, slot };
    run.frame(SPEED.snap);
  } else {
    const x = run.hand(h).x;
    run.moveHand(h, { x, y: STAGE.COUNTER_Y - 30 }, 200);
    egg.s.cracked = true;
    egg.place = { type: "counter" };
    egg.x = x;
    run.mess("egg", x, STAGE.COUNTER_Y, 40);
    run.frame(SPEED.snap);
  }
  run.rest(h);
};

/** Put something inside a container: bread in the toaster, cereal in the bowl. */
const putIn: Handler = (run, a) => {
  if (a.items) {
    const seen = new Set<string>();
    for (const ref of a.items) {
      const r = resolve(run.w, ref);
      const thing = r ? reachable(run, r) : undefined;
      if (thing && seen.has(thing.id)) continue;
      if (thing) seen.add(thing.id);
      putIn(run, { ...a, items: undefined, what: ref, say: seen.size > 1 ? "" : a.say });
    }
    return;
  }
  const o = find(run, a.what);
  if (!o) return;
  const c = find(run, a.into);
  if (!c) return;
  if (!KINDS[c.kind].storage) run.fetch(c);
  if (!KINDS[c.kind].container) {
    putDown(run, { do: "putDown", what: o.id, onto: c.id });
    return;
  }
  if (KINDS[c.kind].storage && !c.open) {
    const thing = reachable(run, o);
    run.say(a.say ?? `Putting the ${name(thing)} in the ${name(c)}.`, "work");
    const h = run.isHeld(thing) ?? run.grab(thing);
    run.door(c, true, h === "L" ? "R" : "L");
    const g = gripPoint(run.w, c);
    run.moveHand(h, g);
    thing.place = { type: "in", ref: c.id, slot: childrenIn(run.w, c.id).length };
    run.frame(SPEED.snap);
    run.rest(h);
    run.door(c, false, h);
    return;
  }
  if (KINDS[c.kind].opens && !c.open) {
    const thing = reachable(run, o);
    run.say(a.say ?? `Putting the ${name(thing)} in the ${name(c)}.`, "work");
    const h = run.isHeld(thing) ?? run.grab(thing);
    const g = gripPoint(run.w, c);
    run.near(g.x);
    run.moveHand(h, g);
    run.say(`Bonk. The ${name(c)} is closed.`, "confused");
    run.rest(h);
    return;
  }
  const thing = reachable(run, o);
  if (isPlastic(thing) && isHot(run.w, c)) {
    run.say(a.say ?? `Putting the ${name(thing)} in the ${name(c)}.`, "work");
    const hh = run.isHeld(thing) ?? run.grab(thing);
    const tp0 = topPoint(run.w, c);
    run.near(tp0.x);
    run.moveHand(hh, { x: tp0.x, y: tp0.y - 120 });
    run.say(thing.kind === "bread-bag" ? "Wait! That's a plastic bag. Safety rule: no plastic in a hot pan." : `Wait! The ${name(thing)} is plastic. Safety rule: no plastic in a hot pan.`, "oops");
    run.release(thing, run.counterSpot(KINDS[thing.kind].w, tp0.x));
    return;
  }
  run.say(a.say ?? `Putting the ${name(thing)} in the ${name(c)}.`, "work");
  const h = run.isHeld(thing) ?? run.grab(thing);
  const tp = topPoint(run.w, c);
  run.near(tp.x);
  run.moveHand(h, { x: tp.x, y: tp.y - 40 });
  thing.place = { type: "in", ref: c.id, slot: childrenIn(run.w, c.id).length };
  thing.rot = 0;
  if (thing.kind === "noodles" && c.kind === "pot" && c.s.boiling) thing.s.cooked = true;
  run.frame(SPEED.snap);
  run.rest(h);
};

/** "After the water boils" / "once the oil heats up": checks, says so, and keeps going either way. */
const check: Handler = (run, a) => {
  const pot = run.w.objects.find((o) => o.kind === "pot");
  const pan = run.w.objects.find((o) => o.kind === "pan");
  const ok = a.until === "boil" ? !!pot?.s.boiling : a.until === "oil" ? !!pan?.s.oiled : false;
  if (ok) run.say(a.say ?? (a.until === "boil" ? "The water is boiling. Good!" : "The oil is hot. Good!"), "happy");
  else run.say(a.why ?? (a.until === "boil" ? "The water never boiled. I will keep going anyway." : "There is no oil in the pan. I will keep going anyway."), "think");
};

/** Take something out of a container and hold it. */
const takeOut: Handler = (run, a) => {
  const from = a.from ? resolve(run.w, a.from) : undefined;
  let o = a.what ? resolve(run.w, a.what) : undefined;
  if (o && from && o.id === from.id) o = undefined;
  if (!o && from) o = childrenIn(run.w, from.id).find((x) => !run.isHeld(x));
  if (o && o.kind === "bread-bag") o = childrenIn(run.w, o.id)[0];
  if (!o) {
    run.confused(`There is nothing to take out.`);
    return;
  }
  const c = o.place.type === "in" ? get(run.w, o.place.ref) : undefined;
  if (c && KINDS[c.kind].opens && !c.open && a.how === "rip") {
    // The step named the bag to take it out of, so opening it is part of the step.
    open(run, { do: "open", what: c.id, say: a.say ?? `Out of the ${name(c)}. Rip!` });
    run.say(`Taking out the ${name(o)}.`, "work");
    run.grab(o);
    return;
  }
  if (c && KINDS[c.kind].opens && !c.open) {
    run.say(a.say ?? `Taking the ${name(o)} out of the ${name(c)}.`, "work");
    const g = gripPoint(run.w, c);
    run.near(g.x);
    const h = run.freeHand(undefined, "R");
    run.moveHand(h, g);
    run.wiggle(c, 2, 6);
    run.rest(h);
    run.confused(`The ${name(c)} is closed. I can't get the ${name(o)} out.`);
    return;
  }
  run.say(a.say ?? `Taking out the ${name(o)}.`, "work");
  const h = run.grab(o);
  run.release(o, run.counterSpot(KINDS[o.kind].w));
  void h;
};

const fold: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  if (o.s.folded) {
    run.say(`The ${name(o)} is already folded.`, "happy");
    return;
  }
  run.say(a.say ?? `Folding the ${name(o)} in half!`, "work");
  const pos = layout(run.w).get(o.id)!;
  const w = KINDS[o.kind].w * pos.scale;
  const y = pos.y - (heightOf(o) / 2) * pos.scale;
  if (o.place.type !== "hat" && o.place.type !== "hand") run.near(pos.x);
  run.moveBoth({ x: pos.x - w / 2, y }, { x: pos.x + w / 2, y });
  run.moveBoth({ x: pos.x - 20, y: y - 30 }, { x: pos.x + w / 2, y }, 500);
  o.s.folded = true;
  run.frame(SPEED.snap);
  run.moveBoth({ x: pos.x - 10, y }, { x: pos.x + 30, y }, 250);
  run.rest();
  run.face("happy");
};

/**
 * "Put peanut butter on the bread." A closed jar goes on the bread, jar and
 * all. An open one gets spread with whatever tool is in hand, else a hand.
 */
const putOn: Handler = (run, a) => {
  const src = sourceFor(run, a.what);
  if (src && KINDS[src.kind].holds && !src.open) {
    place(run, { do: "place", what: src.id, onto: a.onto, say: a.say });
    return;
  }
  spread(run, a);
};

/** "Put the bread together." Needs two separate things; puts the second on the first, as is. */
const together: Handler = (run, a) => {
  const refs = a.items ?? ["bread:1", "bread:2"];
  const objs = refs.map((r) => resolve(run.w, r)).filter((o): o is Obj => !!o);
  const distinct = [...new Map(objs.map((o) => [o.id, o])).values()];
  if (distinct.length < 2) {
    const only = distinct[0];
    run.confused(a.why ?? (only ? `Together with what? There is only one ${name(only)}.` : "Together? I can't find them."));
    return;
  }
  run.say(a.say ?? `Putting the ${name(distinct[1])} on the ${name(distinct[0])}.`, "work");
  for (let i = 1; i < distinct.length; i++) {
    if (a.how === "facing" && distinct[i].spreads.length && !distinct[i].flipped) flip(run, { do: "flip", what: distinct[i].id, say: "Flipping it so the sides touch." });
    putDown(run, { do: "putDown", what: distinct[i].id, onto: distinct[0].id, say: "" });
  }
};

/** Dances for a number of seconds. The count is real; the playback is short. */
const dance: Handler = (run, a) => {
  const secs = a.seconds ?? a.amount ?? 8;
  const r = run.w.robot;
  run.say(a.say ?? `Dancing for ${secs} seconds!`, "dance");
  const beats = Math.min(10, Math.max(4, Math.round(secs / 2)));
  for (let i = 0; i < beats; i++) {
    const up = i % 2 === 0;
    r.bob = up ? 1 : 0;
    r.handL = { x: r.x - 150, y: up ? 300 : 470 };
    r.handR = { x: r.x + 150, y: up ? 470 : 300 };
    r.say = `${Math.round(((i + 1) * secs) / beats)}...`;
    run.frame(300);
  }
  r.bob = 0;
  run.say(`${secs}! Done dancing.`, "proud");
  run.rest();
};

/**
 * Eating. Chef Byte lifts the food to its screen, shows an open mouth, and
 * chomps: a bite disappears. It will not bite plastic. how "lift" only lifts
 * and opens; how "bite" only bites what is already at its face.
 */
const eat: Handler = (run, a) => {
  const r = run.w.robot;
  const held = (["R", "L"] as Hand[]).map((h) => heldIn(run.w, h)).find((o) => !!o && o.kind !== "butter-knife" && o.kind !== "spoon");
  const target = a.what ? resolve(run.w, a.what) : held ?? resolve(run.w, "bread");
  if (!target) {
    run.confused("Eat what? I can't find any food.");
    return;
  }
  const root = rootOf(run.w, target);
  const food = root.kind === "bowl" || root.kind === "pot" ? childrenIn(run.w, root.id).find((c) => c.kind === "noodles") : topOf(run.w, root);
  const wrapper = food && isPlastic(food) ? food : isPlastic(root) ? root : undefined;
  if (wrapper) {
    run.confused(`I can't bite through a plastic ${wrapper.kind === "bread-bag" ? "bag" : name(wrapper)}!`);
    return;
  }
  if (a.how !== "bite") {
    if (root.kind !== "bowl" && root.kind !== "pot") {
      const h = run.isHeld(root) ?? run.grab(root);
      run.moveHand(h, { x: r.x, y: 330 }, 500);
    }
    run.say(a.how === "lift" ? (a.say ?? "Up to my face. Opening my mouth!") : (a.say ?? "Open wide!"), "mouth");
    if (a.how === "lift") return;
  }
  run.face("mouth");
  run.frame(250);
  if (food) food.s.bitten = true;
  run.say(
    a.how === "bite" && a.say
      ? a.say
      : food?.kind === "noodles" && !food.s.cooked
        ? "CRUNCH! Dry noodles. Robots can't taste, but that was loud."
        : food?.kind === "noodles"
          ? "SLURP! I can't taste, but that sounded great."
          : "CHOMP! I can't taste, but it looks great.",
    "proud",
  );
};

/** Fills something. With water at the sink, or with whatever the step says. `amount` is how full. */
const fill: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  const amount = a.amount ?? 1;
  const withWhat = a.with ?? "water";
  const h = run.isHeld(o) ?? run.grab(o);
  if (withWhat === "water") {
    const sink = run.w.objects.find((x) => x.kind === "sink");
    if (!sink) {
      run.confused("Fill it with water? I can't find a sink.");
      return;
    }
    run.say(a.say ?? `Filling the ${name(o)} with water.`, "work");
    run.near(sink.x);
    run.moveHand(h, { x: sink.x - 20, y: STAGE.COUNTER_Y - 70 });
    o.s.fill = amount;
    o.s.fillWith = "water";
    run.frame(900);
  } else {
    run.say(a.say ?? `Filling the ${name(o)} with ${withWhat}.`, "work");
    const p = run.hand(h);
    run.moveHand(h, { x: p.x - 60, y: p.y - 80 }, 350);
    run.moveHand(h, { x: p.x + 60, y: p.y - 80 }, 350);
    run.moveHand(h, { x: p.x, y: p.y }, 350);
    o.s.fill = amount;
    o.s.fillWith = withWhat;
    run.frame(200);
  }
  run.face("happy");
};

/** Waits for something to happen. If it can't happen, a time-lapse wait, then gives up. */
function waitUntil(run: Run, a: Action) {
  const pot = run.w.objects.find((o) => o.kind === "pot");
  const stove = run.w.objects.find((o) => o.kind === "stove");
  const timer = run.w.objects.find((o) => o.kind === "timer");
  if (a.until === "timer" && timer?.s.running) {
    run.say(a.say ?? "Waiting for the timer...", "wait");
    for (const t of ["2:00", "1:00", "0:00"]) {
      timer.s.display = t;
      run.frame(600);
    }
    timer.s.running = false;
    timer.s.rang = true;
    run.w.clock += Number(timer.s.minutes ?? 3) * 60;
    run.say("BRRRING! Time's up.", "happy");
    timer.s.rang = false;
    return;
  }
  const canBoil = a.until === "boil" && !!pot && pot.s.fillWith === "water" && Number(pot.s.fill) > 0 && pot.place.type === "on" && pot.place.ref === stove?.id && !!stove?.s.on;
  run.say(a.say ?? "Waiting...", "wait");
  if (canBoil) {
    pot!.s.boiling = true;
    run.w.clock += 300;
    run.say("Bubbles! It's boiling.", "happy");
    return;
  }
  const r = run.w.robot;
  for (const line of ["Still waiting...", "1 hour later...", "3 hours later...", "Day 2..."]) {
    r.say = line;
    r.bob = r.bob ? 0 : 1;
    run.frame(650);
  }
  r.bob = 0;
  run.w.clock += 86400;
  run.confused(a.why ?? "It never happened. I will stop waiting and keep going.");
}

/** Breaks or crushes something, with a tool in hand or a fist. */
const crush: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  const tool = a.with ? resolve(run.w, a.with) : undefined;
  run.say(a.say ?? `Crushing the ${name(o)}${tool ? ` with the ${name(tool)}` : ""}.`, "work");
  const h = tool ? run.isHeld(tool) ?? run.grab(tool) : run.freeHand(undefined, "R");
  const g = gripPoint(run.w, o);
  if (o.place.type !== "hat" && o.place.type !== "hand") run.near(g.x);
  for (let i = 0; i < 3; i++) {
    run.moveHand(h, { x: g.x, y: g.y - 60 }, 160);
    run.moveHand(h, { x: g.x, y: g.y }, 140);
  }
  const target = o.kind === "ramen" ? childrenIn(run.w, o.id).find((c) => c.kind === "noodles") ?? o : o;
  target.s.crushed = Math.min(3, Number(target.s.crushed ?? 0) + 1);
  run.frame(SPEED.snap);
  run.rest(h);
};

const stir: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  const tool = a.with ? resolve(run.w, a.with) : (["R", "L"] as Hand[]).map((h) => heldIn(run.w, h)).find((x) => x?.kind === "spoon");
  if (!tool && (o.s.boiling || isHot(run.w, o))) {
    run.confused(a.why ?? "Stir with what? Not my hand. Safety rule: no hands in boiling water!");
    return;
  }
  run.say(a.say ?? `Stirring${tool ? ` with the ${name(tool)}` : " with my finger"}!`, "work");
  const h = tool ? run.isHeld(tool) ?? run.grab(tool) : run.freeHand(undefined, "R");
  const tp = topPoint(run.w, o);
  run.near(tp.x);
  for (let i = 0; i < 6; i++) run.moveHand(h, { x: tp.x + Math.cos(i * 1.4) * 40, y: tp.y - 30 + Math.sin(i * 1.4) * 12 }, 150);
  o.s.stirred = true;
  run.rest(h);
};

/** Drains a pot into the sink, holding the food back with a spoon. */
const drain: Handler = (run, a) => {
  const o = find(run, a.what ?? "pot");
  if (!o) return;
  const sink = run.w.objects.find((x) => x.kind === "sink");
  if (!sink) {
    run.confused("Drain it where? I can't find a sink.");
    return;
  }
  const h = run.isHeld(o) ?? run.grab(o);
  run.say(a.say ?? `Draining the ${name(o)} into the sink.`, "work");
  run.near(sink.x);
  run.moveHand(h, { x: sink.x - 40, y: STAGE.COUNTER_Y - 160 });
  o.rot = 60;
  run.frame(500);
  const was = String(o.s.fillWith ?? "");
  o.s.fill = 0;
  run.frame(500);
  o.rot = 0;
  run.frame(250);
  run.say(was === "water" ? "Whoosh. The water went down the sink." : was ? `Whoosh. The ${was} went down the sink. I think.` : "Nothing came out.", "happy");
  run.release(o, run.counterSpot(KINDS[o.kind].w, sink.x));
};

/** Presses down on something (or a stack). how "gently" pats. */
const press: Handler = (run, a) => {
  const o = find(run, a.what);
  if (!o) return;
  const top = topOf(run.w, rootOf(run.w, o));
  const tp = topPoint(run.w, top);
  run.say(a.say ?? (a.how === "gently" ? "Gentle pat, pat." : "Pressing down!"), "work");
  if (top.place.type !== "hat" && top.place.type !== "hand") run.near(tp.x);
  const h = run.freeHand(undefined, "R");
  for (let i = 0; i < 2; i++) {
    run.moveHand(h, { x: tp.x, y: tp.y - 50 }, 200);
    run.moveHand(h, { x: tp.x, y: tp.y - 4 }, a.how === "gently" ? 260 : 160);
  }
  if (a.how !== "gently") rootOf(run.w, o).s.pressed = true;
  run.frame(SPEED.snap);
  run.rest(h);
};

/** Moves what is in a hand: into something (how "in") or just above it. */
const reach: Handler = (run, a) => {
  const held = a.with ? resolve(run.w, a.with) : undefined;
  const h = held ? run.isHeld(held) : (["R", "L"] as Hand[]).find((x) => heldIn(run.w, x));
  const to = resolve(run.w, a.to);
  if (!h || !to) {
    run.confused(!h ? "I am not holding that." : `I can't find the ${a.to}.`);
    return;
  }
  const tp = topPoint(run.w, to);
  run.say(a.say ?? (a.how === "in" ? `Into the ${name(to)}.` : `Over to the ${name(to)}.`), "work");
  if (to.place.type !== "hat") run.near(tp.x);
  run.moveHand(h, { x: tp.x, y: a.how === "in" ? tp.y + 12 : tp.y - 70 }, 450);
};

const lift: Handler = (run, a) => {
  const held = a.with ? resolve(run.w, a.with) : undefined;
  const h = held ? run.isHeld(held) : (["R", "L"] as Hand[]).find((x) => heldIn(run.w, x));
  if (!h) {
    run.confused("Lift what? My hands are empty.");
    return;
  }
  run.say(a.say ?? "Up it comes.", "work");
  const p = run.hand(h);
  run.moveHand(h, { x: p.x, y: Math.min(p.y - 90, 420) }, 350);
};

/** Smooths what is already spread, for "get an even coating". */
const smooth: Handler = (run, a) => {
  const o = find(run, a.onto ?? a.what);
  if (!o) return;
  const held = a.with ? resolve(run.w, a.with) : undefined;
  const h = held ? run.isHeld(held) ?? run.grab(held) : (["R", "L"] as Hand[]).find((x) => heldIn(run.w, x)) ?? run.freeHand(undefined, "R");
  run.say(a.say ?? "Smooth, smooth. Nice and even.", "work");
  const tp = topPoint(run.w, o);
  run.scrub(h, { x: tp.x, y: tp.y - 4 }, 50, 2);
  if (o.spreads.length) o.spreads[o.spreads.length - 1].even = true;
  run.frame(SPEED.snap);
};

/** Sets a kitchen timer and starts it. */
const setTimer: Handler = (run, a) => {
  const t = find(run, a.what ?? "timer");
  if (!t) return;
  const mins = a.amount ?? 3;
  run.say(a.say ?? `Setting the timer for ${mins} minutes.`, "work");
  const g = gripPoint(run.w, t);
  run.near(g.x);
  const h = run.freeHand(undefined, "R");
  run.moveHand(h, g);
  t.s.minutes = mins;
  t.s.display = `${mins}:00`;
  t.s.running = true;
  run.frame(250);
  run.rest(h);
};

/** Carries a liquid in cupped robot hands, because the step said not to use the cup. Splashes, but some gets there. */
const carry: Handler = (run, a) => {
  const cup = find(run, a.what);
  const into = find(run, a.into);
  if (!cup || !into) return;
  const sub = (cup.s.fillWith as Substance) ?? substanceOf(cup) ?? "water";
  run.say(a.say ?? `Not with the measuring cup? Then I will carry the ${SUBSTANCE_NAME[sub]} in my hands!`, "think");
  const h = run.isHeld(cup) ?? run.grab(cup);
  const p = run.hand(h);
  cup.rot = 100;
  run.frame(350);
  cup.s.fill = 0;
  cup.rot = 0;
  run.release(cup, run.counterSpot(KINDS[cup.kind].w));
  run.handMess("L", sub);
  run.handMess("R", sub);
  const tp = topPoint(run.w, into);
  const r = run.w.robot;
  run.moveBoth({ x: p.x - 20, y: 500 }, { x: p.x + 20, y: 500 }, 300);
  run.mess(sub, p.x + 40, STAGE.COUNTER_Y, 30);
  run.near(tp.x);
  run.moveBoth({ x: tp.x - 20, y: tp.y - 40 }, { x: tp.x + 20, y: tp.y - 40 }, 400);
  run.mess(sub, tp.x + 110, STAGE.COUNTER_Y, 26);
  into.s.fill = 0.3;
  into.s.fillWith = sub;
  run.w.messes = run.w.messes.filter((m) => !m.onRobot);
  run.say("Splash! Some of it made it in.", "oops");
  void r;
  run.rest();
};

const walkTo: Handler = (run, a) => {
  const to = a.to ?? a.what;
  const n = Number(to);
  const x = Number.isFinite(n) ? n : resolve(run.w, to)?.x;
  if (x === undefined) {
    run.confused(`Walk to... where?`);
    return;
  }
  run.say(a.say ?? "Walking over.", "happy");
  run.near(x);
};

const present: Handler = (run, a) => {
  const r = run.w.robot;
  run.moveBoth({ x: r.x - 170, y: 300 }, { x: r.x + 170, y: 300 }, 400);
  run.say(a.say ?? "Ta-da!", "proud");
  run.rest();
};

const confusedAction: Handler = (run, a) => {
  run.confused(a.why ?? a.text ?? "I don't know how to do that.");
};

const sayAction: Handler = (run, a) => {
  run.say(a.text ?? a.say ?? "", (a.how as Face) ?? "happy");
};

export const ACTIONS: Record<string, Handler> = {
  pickUp,
  get: pickUp,
  take: pickUp,
  putDown,
  place,
  open,
  close,
  twist,
  scoop,
  spread,
  putOn,
  together,
  draw: (run, a) => spread(run, { ...a, how: "face" }),
  cut,
  stack,
  pour,
  flip,
  turnOn: switchTo(true),
  turnOff: switchTo(false),
  wait,
  drop,
  crack,
  putIn,
  takeOut,
  fold,
  walkTo,
  present,
  dance,
  eat,
  fill,
  crush,
  stir,
  drain,
  press,
  reach,
  lift,
  smooth,
  unwrap: open,
  setTimer,
  carry,
  check,
  confused: confusedAction,
  say: sayAction,
};

export const ACTION_NAMES = Object.keys(ACTIONS);

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
