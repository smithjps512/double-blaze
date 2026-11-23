import type { Compiled, Robot, World } from "./types";
import { layout, type Pos } from "./world";

/**
 * Where everything is at a moment in playback. Positions slide smoothly from
 * one keyframe to the next; everything else (faces, lids, words) is taken
 * from the keyframe being moved toward.
 */

export interface View {
  world: World;
  pos: Map<string, Pos>;
  robot: Robot;
}

const cache = new WeakMap<World, Map<string, Pos>>();
function layoutOf(w: World): Map<string, Pos> {
  let l = cache.get(w);
  if (!l) {
    l = layout(w);
    cache.set(w, l);
  }
  return l;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function duration(c: Compiled, step: number): number {
  return c.steps[step]?.frames.reduce((s, f) => s + f.ms, 0) ?? 0;
}

/** The world just before a step starts. */
export function before(c: Compiled, step: number): World {
  for (let i = step - 1; i >= 0; i--) {
    const f = c.steps[i].frames;
    if (f.length) return f[f.length - 1].world;
  }
  return c.start;
}

function still(w: World): View {
  return { world: w, pos: layoutOf(w), robot: w.robot };
}

/** step -1 is the starting kitchen. t is in ms from the start of the step. */
export function viewAt(c: Compiled, step: number, t: number): View {
  if (step < 0) return still(c.start);
  const s = c.steps[step];
  if (!s) return still(c.end);
  let prev = before(c, step);
  let elapsed = 0;
  for (const f of s.frames) {
    if (t < elapsed + f.ms) {
      const a = f.ms > 0 ? ease((t - elapsed) / f.ms) : 1;
      return between(prev, f.world, a);
    }
    elapsed += f.ms;
    prev = f.world;
  }
  return still(prev);
}

export function between(A: World, B: World, a: number): View {
  const la = layoutOf(A);
  const lb = layoutOf(B);
  const pos = new Map<string, Pos>();
  for (const [id, pb] of lb) {
    const pa = la.get(id) ?? pb;
    pos.set(id, { ...pb, x: mix(pa.x, pb.x, a), y: mix(pa.y, pb.y, a), rot: mix(pa.rot, pb.rot, a), scale: mix(pa.scale, pb.scale, a) });
  }
  const ra = A.robot;
  const rb = B.robot;
  const robot: Robot = {
    ...rb,
    x: mix(ra.x, rb.x, a),
    bob: mix(ra.bob, rb.bob, a),
    handL: { x: mix(ra.handL.x, rb.handL.x, a), y: mix(ra.handL.y, rb.handL.y, a) },
    handR: { x: mix(ra.handR.x, rb.handR.x, a), y: mix(ra.handR.y, rb.handR.y, a) },
  };
  return { world: B, pos, robot };
}
