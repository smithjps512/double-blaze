import { KINDS, SUBSTANCE_NAME } from "./catalog";
import type { GoalSpec, Obj, Spread, Substance, World } from "./types";
import { childrenIn, childrenOn, get, isLoose } from "./world";

/**
 * Did the robot make the thing? A goal is a short checklist written as steps a
 * student could add, so an unchecked item reads as a hint, not a grade.
 */

export interface Check {
  label: string;
  done: boolean;
  /** Optional items are shown but do not stop it counting as a real one. */
  optional?: boolean;
}

const JAR: Partial<Record<Substance, string>> = { pb: "pb-jar", jelly: "jelly-jar", mayo: "mayo-jar" };

function slices(w: World): Obj[] {
  return w.objects.filter((o) => o.kind === "bread-slice");
}

function goodSpread(s: Spread, sub: Substance): boolean {
  return s.sub === sub && s.tool === "knife" && !s.thin;
}

/** Everything stacked above an object, nearest first. */
function above(w: World, o: Obj): Obj[] {
  const out: Obj[] = [];
  for (const c of childrenOn(w, o.id)) out.push(c, ...above(w, c));
  return out;
}

/** The best two slice sandwich in the kitchen: what is inside and what is on the outside. */
export function sandwichOf(w: World): { bottom: Obj; top: Obj; inner: Substance[]; outer: Substance[]; layers: Obj[] } | null {
  let best: ReturnType<typeof sandwichOf> = null;
  for (const bottom of slices(w).filter((s) => isLoose(w, s))) {
    const up = above(w, bottom);
    const top = up.find((o) => o.kind === "bread-slice");
    if (!top) continue;
    const layers = up.slice(0, up.indexOf(top));
    const inner = [...(bottom.flipped ? [] : bottom.spreads), ...(top.flipped ? top.spreads : [])].map((s) => s.sub);
    const outer = [...(bottom.flipped ? bottom.spreads : []), ...(top.flipped ? [] : top.spreads)].map((s) => s.sub);
    const cand = { bottom, top, inner, outer, layers };
    if (!best || inner.length + layers.length > best.inner.length + best.layers.length) best = cand;
  }
  return best;
}

export function checklist(w: World, goal: GoalSpec): Check[] {
  const has = (kind: string) => w.objects.some((o) => o.kind === kind);
  const bagOpenOrOut = () => {
    const bag = w.objects.find((o) => o.kind === "bread-bag");
    return !bag || bag.open || slices(w).some((s) => isLoose(w, s));
  };
  switch (goal.type) {
    case "sandwich": {
      const loose = slices(w).filter((s) => isLoose(w, s));
      const out: Check[] = [];
      if (has("bread-bag")) out.push({ label: "Open the bread bag", done: bagOpenOrOut() });
      out.push({ label: "Take two slices of bread out", done: loose.length >= 2 });
      for (const pack of ["turkey-pack", "ham-pack"] as const) {
        const p = w.objects.find((o) => o.kind === pack);
        if (p) out.push({ label: `Open the ${KINDS[pack].name}`, done: p.open });
      }
      if ((goal.layers ?? []).includes("cheese") && w.objects.some((o) => o.kind === "cheese")) {
        out.push({ label: "Unwrap the cheese", done: w.objects.some((o) => o.kind === "cheese" && o.open) });
      }
      for (const sub of goal.fillings) {
        const jarKind = JAR[sub];
        const jar = jarKind ? w.objects.find((o) => o.kind === jarKind) : undefined;
        if (jar) out.push({ label: `Open the ${KINDS[jar.kind].name}`, done: jar.open || loose.some((s) => s.spreads.some((x) => x.sub === sub)) });
        out.push({
          label: `Spread ${SUBSTANCE_NAME[sub]} on a slice with the flat of a knife`,
          done: loose.some((s) => s.spreads.some((x) => goodSpread(x, sub))),
        });
      }
      const sw = sandwichOf(w);
      for (const kind of goal.layers ?? []) {
        out.push({ label: `Put the ${KINDS[kind].name} on the bread`, done: !!sw && sw.layers.some((o) => o.kind === kind && (kind !== "cheese" || o.open)) });
      }
      out.push({
        label: "Put the slices together, spread sides facing in",
        done: !!sw && sw.outer.length === 0 && goal.fillings.every((f) => sw.inner.includes(f)),
      });
      if (goal.fried) {
        out.push({ label: "Fry the bread in the pan", done: !!sw && Number(sw.bottom.s.toasted ?? 0) + Number(sw.top.s.toasted ?? 0) > 0 });
        out.push({ label: "Turn the stove off when you're done", done: !w.objects.some((o) => o.kind === "stove" && o.s.on), optional: true });
      }
      if (goal.plate ?? has("plate")) {
        const plate = w.objects.find((o) => o.kind === "plate");
        out.push({ label: "Put the sandwich on the plate", done: !!sw && !!plate && sw.bottom.place.type === "on" && sw.bottom.place.ref === plate.id, optional: true });
      }
      return out;
    }
    case "cereal": {
      const bowl = w.objects.find((o) => o.kind === "bowl");
      const contents = (bowl?.s.contents as string[] | undefined) ?? [];
      const box = w.objects.find((o) => o.kind === "cereal-box");
      const milk = w.objects.find((o) => o.kind === "milk");
      return [
        { label: "Open the cereal box", done: !!box?.open },
        { label: "Pour cereal into the bowl", done: contents.includes("cereal") },
        { label: "Open the milk", done: !!milk?.open },
        { label: "Pour milk into the bowl", done: contents.includes("milk") },
        { label: "Put the spoon in the bowl", done: !!bowl && childrenIn(w, bowl.id).some((o) => o.kind === "spoon"), optional: true },
      ];
    }
    case "toast": {
      const toast = slices(w).find((s) => Number(s.s.toasted ?? 0) > 0);
      const out: Check[] = [
        { label: "Open the bread bag", done: bagOpenOrOut() },
        { label: "Put a slice in the toaster", done: slices(w).some((s) => s.place.type === "in" && get(w, s.place.ref)?.kind === "toaster") || !!toast },
        { label: "Turn the toaster on and wait", done: !!toast },
        { label: "Take the toast out", done: !!toast && isLoose(w, toast) },
      ];
      if (goal.spread) out.push({ label: `Spread ${SUBSTANCE_NAME[goal.spread]} on the toast with a knife`, done: !!toast && toast.spreads.some((x) => goodSpread(x, goal.spread!)) });
      return out;
    }
    case "ramen": {
      const pot = w.objects.find((o) => o.kind === "pot");
      const noodles = w.objects.find((o) => o.kind === "noodles");
      const seasoning = w.objects.find((o) => o.kind === "seasoning");
      const inBowl = (o?: Obj) => !!o && o.place.type === "in" && get(w, o.place.ref)?.kind === "bowl";
      return [
        { label: "Fill the pot with water from the sink", done: pot?.s.fillWith === "water" || !!noodles?.s.cooked },
        { label: "Boil the water", done: !!pot?.s.boiling || !!noodles?.s.cooked },
        { label: "Cook the noodles in the boiling water", done: !!noodles?.s.cooked },
        { label: "Open the seasoning packet and sprinkle it in", done: !!seasoning?.open && (inBowl(seasoning) || seasoning.place.type === "in") },
        { label: "Put the ramen in a bowl", done: inBowl(noodles) },
      ];
    }
    case "fried-egg": {
      const stove = w.objects.find((o) => o.kind === "stove");
      const pan = w.objects.find((o) => o.kind === "pan");
      const eggs = pan ? childrenIn(w, pan.id).filter((o) => o.kind === "egg") : [];
      return [
        { label: "Put the pan on the stove", done: !!pan && pan.place.type === "on" && pan.place.ref === stove?.id },
        { label: "Turn the stove on", done: !!stove?.s.on || eggs.some((e) => e.s.cooked) },
        { label: "Crack an egg into the pan", done: eggs.some((e) => e.s.cracked) },
        { label: "Wait for it to cook", done: eggs.some((e) => e.s.cooked) },
        { label: "Turn the stove off", done: !stove?.s.on, optional: true },
      ];
    }
  }
}

export function isSuccess(checks: Check[]): boolean {
  return checks.filter((c) => !c.optional).every((c) => c.done);
}

// ---------------------------------------------------------------------------
// Describing the result in one or two plain sentences.
// ---------------------------------------------------------------------------

function list(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

function article(phrase: string): string {
  return /^[aeiou]/i.test(phrase) ? `an ${phrase}` : `a ${phrase}`;
}

function spreadWords(o: Obj): string {
  if (!o.spreads.length) return "";
  const faces = o.spreads.filter((s) => s.face).map((s) => `${article(`${SUBSTANCE_NAME[s.sub]} face`)}`);
  const layers = [...new Set(o.spreads.filter((s) => !s.face).map((s) => SUBSTANCE_NAME[s.sub]))];
  const parts: string[] = [];
  if (faces.length) parts.push(`with ${list(faces)}`);
  if (layers.length) parts.push(`${o.kind === "bread-bag" ? "smeared with" : "with"} ${list(layers)}`);
  const down = o.kind === "bread-slice" && o.flipped ? " (that side down)" : "";
  return ` ${parts.join(" and ")}${down}`;
}

export function nameOf(o: Obj): string {
  const k = KINDS[o.kind];
  const adj: string[] = [];
  if (o.kind === "cheese") adj.push(o.open ? "unwrapped" : "wrapped");
  else if (k.opens && !k.storage) adj.push(o.open ? "open" : "closed");
  if (o.kind === "noodles") adj.push(...(o.s.crushed ? ["crushed"] : []), o.s.cooked ? "cooked" : "dry");
  if (o.s.pressed) adj.push("pressed");
  if (o.s.folded) adj.push("folded");
  if (o.s.squished) adj.push("squished");
  if (o.s.cut) adj.push("cut");
  if (o.kind === "bread-slice" && Number(o.s.toasted ?? 0) > 0) adj.push(Number(o.s.toasted) >= 3 ? "very dark" : "toasted");
  if (o.kind === "egg" && o.s.cracked) adj.push(o.s.cooked ? "cooked" : "cracked");
  const base = adj.length ? `${adj.join(", ")} ${k.name}` : k.name;
  let extra = spreadWords(o);
  if (o.kind === "pot" && Number(o.s.fill) > 0) extra += ` full of ${o.s.fillWith ?? "something"}`;
  if (o.s.bitten) extra += " with a bite out of it";
  if (o.kind === "bowl") {
    const c = (o.s.contents as string[]) ?? [];
    if (c.length) extra += ` of ${list(c.map((x) => SUBSTANCE_NAME[x as Substance]))}`;
  }
  return article(base) + extra;
}

/** "a bowl with dry noodles and a closed seasoning packet in it" */
function withInside(w: World, o: Obj): string {
  const inside = childrenIn(w, o.id).filter((c) => !KINDS[o.kind].storage);
  if (!inside.length || o.kind === "bread-bag" || o.kind.endsWith("-pack") || o.kind === "ramen") return nameOf(o);
  return `${nameOf(o)} with ${list(inside.map(nameOf))} in it`;
}

function changed(a: Obj | undefined, b: Obj): boolean {
  if (!a) return true;
  return JSON.stringify({ ...a, rot: 0, s: { ...a.s, t: 0 } }) !== JSON.stringify({ ...b, rot: 0, s: { ...b.s, t: 0 } });
}

function stackPhrase(w: World, root: Obj): string {
  const chain: Obj[] = [root];
  let cur = root;
  for (;;) {
    const kids = childrenOn(w, cur.id);
    if (!kids.length) break;
    cur = kids[kids.length - 1];
    chain.push(cur);
  }
  return chain
    .reverse()
    .map((o) => withInside(w, o))
    .join(" sitting on ");
}

/** "A closed peanut butter jar sitting on a closed bag of bread." */
export function describe(start: World, end: World, goal: GoalSpec): string {
  if (isSuccess(checklist(end, goal))) {
    const sw = goal.type === "sandwich" ? sandwichOf(end) : null;
    const bite = end.objects.some((o) => o.s.bitten) ? " Chef Byte took a bite." : "";
    return `A real ${goal.name}!${sw && sw.bottom.place.type === "on" ? " On a plate, even." : ""}${bite}`;
  }
  const before = new Map(start.objects.map((o) => [o.id, o]));
  const moved = new Set(end.objects.filter((o) => changed(before.get(o.id), o)).map((o) => o.id));
  const rootOfObj = (o: Obj): Obj => (o.place.type === "on" || o.place.type === "in" ? rootOfObj(get(end, o.place.ref) ?? o) : o);
  const touchedRoots = new Map<string, Obj>();
  for (const id of moved) {
    const o = get(end, id)!;
    const r = rootOfObj(o);
    if (KINDS[r.kind].storage || KINDS[o.kind].storage) continue;
    touchedRoots.set(r.id, r);
  }

  const sentences: string[] = [];
  const where = (r: Obj): string => {
    switch (r.place.type) {
      case "floor":
        return " on the floor";
      case "hat":
        return " on Chef Byte's hat";
      case "hand":
        return " in Chef Byte's hand";
      default:
        return "";
    }
  };
  const roots = [...touchedRoots.values()].sort((a, b) => childrenOn(end, b.id).length - childrenOn(end, a.id).length);
  for (const r of roots.slice(0, 3)) sentences.push(`${stackPhrase(end, r)}${where(r)}`);

  const hands = end.messes.filter((m) => m.onRobot).map((m) => SUBSTANCE_NAME[m.sub]);
  if (hands.length) sentences.push(`${list([...new Set(hands)])} on Chef Byte's hand`);
  const spills = end.messes.filter((m) => !m.onRobot).map((m) => SUBSTANCE_NAME[m.sub]);
  if (spills.length) sentences.push(`${list([...new Set(spills)])} spilled`);

  if (end.objects.some((o) => o.kind === "stove" && o.s.on)) sentences.push("the stove is still on");
  if (!sentences.length) return "Nothing. Everything is right where it started.";
  return sentences.map((s) => s.charAt(0).toUpperCase() + s.slice(1) + ".").join(" ");
}
