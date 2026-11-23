import { KINDS } from "@/lib/sandwich-bot/catalog";
import type { Kind, Obj } from "@/lib/sandwich-bot/types";
import { ObjectArt } from "../Art";

/** Every object, closed and open where that matters, plus the action list. */

const MOVES: [string, string][] = [
  ["pickUp / get / take", "Picks something up. If it is inside a closed bag or box, it takes the whole bag or box."],
  ["putDown", "Puts what it is holding on the counter, the floor, or on top of something."],
  ["place", "Picks something up and puts it on something: \"put the peanut butter on the bread\" with a closed jar."],
  ["putOn", "\"Put peanut butter on the bread.\" Closed jar: the jar goes on the bread. Open jar: it spreads."],
  ["open / close", "Twist ties, jar lids, box flaps, the milk cap, the fridge door."],
  ["twist", "Opens a closed jar, closes an open one, and spins anything else around."],
  ["scoop", "Takes some from a jar. With a knife's sharp side it gets a tiny line. No tool: its hand."],
  ["spread / draw", "Spreads with the tool in hand, the tool named, or its hand. \"Face\" draws a smiley face."],
  ["cut", "With a knife: cuts. No knife: a robot chop that squishes it."],
  ["together / stack", "Puts the second thing on the first, exactly as they are (no flipping)."],
  ["pour", "Into a bowl, or onto the counter if nothing is named. A closed carton pours nothing."],
  ["flip", "Turns something upside down."],
  ["turnOn / turnOff", "Toaster and stove."],
  ["wait", "Waits. Toast toasts and eggs cook while it waits."],
  ["putIn / takeOut", "Toaster, bowl, pan, fridge, bag. A closed one goes bonk."],
  ["crack", "Cracks an egg into something, or onto the counter if nothing is named."],
  ["fold", "Folds something in half, even a bag of bread."],
  ["drop", "Drops it on the floor. Messes are fine; nobody gets hurt."],
  ["walkTo", "Walks along the counter (it also walks on its own to reach things)."],
  ["present", "Ta-da pose."],
  ["confused", "Shrug and a question mark, for steps it can't do as written."],
  ["say", "Says something."],
  ["Hands full", "Two hands only. A third thing goes on its chef hat, then on the counter."],
];

function obj(kind: Kind, open = false, extra: Partial<Obj> = {}): Obj {
  return { id: kind, kind, x: 0, place: { type: "counter" }, rot: 0, open, flipped: false, spreads: [], s: { level: 1, tie: open ? "off" : "on", contents: [] }, ...extra };
}

const SHOW: { label: string; o: Obj }[] = [];
for (const kind of Object.keys(KINDS) as Kind[]) {
  if (kind === "fridge") continue;
  SHOW.push({ label: KINDS[kind].name, o: obj(kind) });
  if (KINDS[kind].opens) SHOW.push({ label: `${KINDS[kind].name}, open`, o: obj(kind, true) });
}
SHOW.push({ label: "slice with peanut butter", o: obj("bread-slice", false, { spreads: [{ sub: "pb", tool: "knife" }] }) });
SHOW.push({ label: "slice with a jelly face", o: obj("bread-slice", false, { spreads: [{ sub: "jelly", tool: "hand", face: true }] }) });
SHOW.push({ label: "toast", o: obj("bread-slice", false, { s: { toasted: 1 } }) });
SHOW.push({ label: "bowl of cereal and milk", o: obj("bowl", false, { s: { contents: ["cereal", "milk"] } }) });
SHOW.push({ label: "cracked egg", o: obj("egg", false, { s: { cracked: true } }) });
SHOW.push({ label: "toaster, on", o: obj("toaster", false, { s: { on: true } }) });
SHOW.push({ label: "stove, on", o: obj("stove", false, { s: { on: true } }) });
SHOW.push({ label: "folded bag with faces", o: obj("bread-bag", false, { s: { folded: true, tie: "on" }, spreads: [{ sub: "pb", tool: "knife", face: true }, { sub: "jelly", tool: "hand", face: true }] }) });

export default function Library() {
  return (
    <>
      <h2 className="mt-8 text-2xl font-black">Objects</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SHOW.map(({ label, o }) => (
          <li key={label} className="rounded-xl border-4 border-[#2B2321] bg-white p-2 text-center">
            <svg viewBox="-170 -230 340 250" className="h-28 w-full" role="img" aria-label={label}>
              <rect x={-170} y={0} width={340} height={20} fill="#3AA79C" />
              <ObjectArt o={o} />
            </svg>
            <p className="text-lg font-bold leading-tight">{label}</p>
          </li>
        ))}
        <li className="rounded-xl border-4 border-[#2B2321] bg-white p-2 text-center">
          <p className="py-10 text-lg font-bold">fridge (shown in scenes that use it)</p>
        </li>
      </ul>
      <h2 className="mt-10 text-2xl font-black">Moves</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {MOVES.map(([k, v]) => (
          <div key={k} className="rounded-xl border-2 border-[#2B2321]/30 bg-white p-3">
            <dt className="text-lg font-black">{k}</dt>
            <dd className="text-lg">{v}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
