import { ACTIONS, Run } from "./actions";
import { checklist, describe, isSuccess, type Check } from "./goals";
import type { Compiled, CompiledStep, Script, Step, World } from "./types";
import { createWorld } from "./world";

/**
 * Runs a script's steps in order against a fresh kitchen and records every
 * move. Each step starts from wherever the last one left things.
 */

export interface PlayStep extends Step {
  added?: boolean;
}

export interface Outcome {
  compiled: Compiled;
  checks: Check[];
  success: boolean;
  result: string;
}

export function compile(script: Script, steps: PlayStep[] = script.steps): Compiled {
  const start = createWorld(script.setup);
  let world: World = start;
  const out: CompiledStep[] = [];
  for (const step of steps) {
    const run = new Run(world);
    run.w.robot.say = null;
    run.w.robot.question = false;
    run.w.robot.face = "think";
    run.frame(350);
    for (const action of step.actions) {
      const handler = ACTIONS[action.do];
      if (!handler) run.confused(`I don't know how to "${action.do}".`);
      else handler(run, action);
    }
    run.w.robot.face = "happy";
    run.frame(250);
    out.push({ text: step.text, added: step.added, frames: run.frames });
    world = run.w;
  }
  return { start, steps: out, end: world };
}

/** Compiles and scores. `original` uses the hand written result sentence if the script has one. */
export function play(script: Script, steps?: PlayStep[]): Outcome {
  const compiled = compile(script, steps);
  const checks = checklist(compiled.end, script.goal);
  const success = isSuccess(checks);
  const original = !steps || steps === script.steps;
  const result = original && script.result ? script.result : describe(compiled.start, compiled.end, script.goal);
  return { compiled, checks, success, result };
}

export function stepDuration(step: CompiledStep): number {
  return step.frames.reduce((sum, f) => sum + f.ms, 0);
}

/** Checks a script for things that would break or confuse playback. Returns problems, or none. */
export function lint(script: Script): string[] {
  const problems: string[] = [];
  if (!script.steps.length) problems.push("No steps.");
  script.steps.forEach((s, i) => {
    if (!s.text.trim()) problems.push(`Step ${i + 1} has no text.`);
    for (const a of s.actions) if (!ACTIONS[a.do]) problems.push(`Step ${i + 1}: unknown action "${a.do}".`);
  });
  for (const f of script.fixes) for (const a of f.actions) if (!ACTIONS[a.do]) problems.push(`Fix "${f.id}": unknown action "${a.do}".`);
  const text = JSON.stringify(script);
  if (text.includes("—")) problems.push("Contains an em dash. Use a comma, colon or period.");
  return problems;
}
