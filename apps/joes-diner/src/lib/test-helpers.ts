import { emptyFloor } from "./defaults";
import { apply, type Action, type Context } from "./floor";
import type { FloorState } from "./types";

/** A tiny harness: a floor, a clock, and a way to run actions in order. */
export function harness(start = Date.UTC(2026, 10, 25, 13, 0)) {
  let n = 0;
  const clock = { now: start };
  let state: FloorState = emptyFloor("shift-1", "2026-11-25");
  const ctx = (): Context => ({ now: clock.now, newId: () => `id${++n}`, newToken: () => `tok${n}` });
  const run = (action: Action) => {
    const r = apply(state, action, ctx());
    state = r.state;
    return r;
  };
  const minutes = (m: number) => {
    clock.now += m * 60_000;
  };
  return {
    clock,
    run,
    minutes,
    get state() {
      return state;
    },
  };
}
