import { test } from "node:test";
import assert from "node:assert/strict";
import { compile, lint, play } from "./engine";
import { SCRIPTS, findScript } from "./submissions";
import type { Fix, Script } from "./types";
import type { PlayStep } from "./engine";
import { resolve, createWorld } from "./world";

const sample = findScript("sample-pbj")!;
const sub001 = findScript("sub-001")!;

function said(steps: ReturnType<typeof compile>["steps"]): string[] {
  const out: string[] = [];
  for (const s of steps) for (const f of s.frames) if (f.world.robot.say && out[out.length - 1] !== f.world.robot.say) out.push(f.world.robot.say);
  return out;
}

/** Applies fix cards the way game mode does: `replaces` swaps, others insert before step `at` (1-based). */
function withFixes(script: Script, picks: { id: string; at?: number }[]): PlayStep[] {
  const steps: PlayStep[] = script.steps.map((s) => ({ ...s }));
  const byId = new Map<string, Fix>(script.fixes.map((f) => [f.id, f]));
  const inserts: { at: number; step: PlayStep }[] = [];
  for (const p of picks) {
    const f = byId.get(p.id)!;
    const step = { text: f.text, actions: f.actions, added: true };
    if (f.replaces) steps[f.replaces - 1] = step;
    else inserts.push({ at: p.at ?? 1, step });
  }
  const out: PlayStep[] = [];
  steps.forEach((s, i) => {
    for (const ins of inserts.filter((x) => x.at === i + 1)) out.push(ins.step);
    out.push(s);
  });
  for (const ins of inserts.filter((x) => x.at > steps.length)) out.push(ins.step);
  return out;
}

test("every script lints clean and has no em dashes", () => {
  for (const s of SCRIPTS) assert.deepEqual(lint(s), [], s.id);
});

test("bread means the bag while the bag is closed", () => {
  const w = createWorld(sample.setup);
  assert.equal(resolve(w, "bread")?.id, "bread-bag");
  assert.equal(resolve(w, "other-bread")?.id, "bread-bag");
});

test("sample: closed jars end up stacked on the closed bag", () => {
  const { compiled, success } = play(sample);
  const end = compiled.end;
  const pb = end.objects.find((o) => o.id === "pb-jar")!;
  const jelly = end.objects.find((o) => o.id === "jelly-jar")!;
  assert.deepEqual(pb.place, { type: "on", ref: "bread-bag", dx: 0 });
  assert.deepEqual(jelly.place, { type: "on", ref: "pb-jar", dx: 0 });
  assert.equal(pb.open, false);
  assert.equal(success, false);
  assert.ok(said(compiled.steps).some((t) => t.includes("only one")), "step 3 is confused");
});

test("sample: the result describes the jars on the bag when generated", () => {
  const { result } = play(sample, sample.steps);
  assert.match(result, /jelly jar sitting on a closed peanut butter jar sitting on a .*bag of bread/);
});

test("sample: fix cards can get to a real sandwich", () => {
  const steps = withFixes(sample, [
    { id: "open-bag", at: 1 },
    { id: "two-slices", at: 1 },
    { id: "open-pb", at: 1 },
    { id: "open-jelly", at: 1 },
    { id: "knife", at: 1 },
    { id: "flip", at: 3 },
  ]);
  const out = play(sample, steps);
  assert.equal(out.success, true, `${out.result}\n${JSON.stringify(out.checks, null, 1)}`);
  assert.match(out.result, /A real PB&J sandwich/);
});

test("sample: without the flip, the jelly ends up on the outside", () => {
  const steps = withFixes(sample, [
    { id: "open-bag", at: 1 },
    { id: "two-slices", at: 1 },
    { id: "open-pb", at: 1 },
    { id: "open-jelly", at: 1 },
    { id: "knife", at: 1 },
  ]);
  const out = play(sample, steps);
  assert.equal(out.success, false);
  assert.equal(out.checks.find((c) => c.label.startsWith("Put the slices together"))?.done, false);
});

test("sub-001: the bag rides on the hat, gets two faces, and is folded", () => {
  const { compiled, success } = play(sub001);
  const bag = compiled.end.objects.find((o) => o.id === "bread-bag")!;
  assert.equal(bag.place.type, "hat");
  assert.equal(bag.open, false);
  assert.equal(bag.s.folded, true);
  assert.deepEqual(bag.spreads.map((s) => [s.sub, s.face, s.tool]), [["pb", true, "knife"], ["jelly", true, "hand"]]);
  assert.equal(bag.spreads[0].thin, true, "sharp side gives a thin face");
  assert.equal(success, false);
  const auto = play(sub001, sub001.steps).result;
  assert.match(auto, /folded bag of bread with a peanut butter face and a jelly face/);
  assert.match(auto, /hat/);
});

test("sub-001: with every fix card it becomes a real sandwich", () => {
  const steps = withFixes(sub001, [{ id: "open-bag", at: 1 }, { id: "flat-side" }, { id: "spread-pb" }, { id: "spread-jelly" }, { id: "flip-on" }]);
  const out = play(sub001, steps);
  assert.equal(out.success, true, `${out.result}\n${JSON.stringify(out.checks, null, 1)}`);
});

test("every frame has a sane duration and the robot stays on stage", () => {
  for (const s of SCRIPTS) {
    for (const step of compile(s).steps) {
      for (const f of step.frames) {
        assert.ok(f.ms >= 0 && f.ms < 4000, `${s.id}: ${f.ms}ms`);
        const r = f.world.robot;
        for (const p of [r.handL, r.handR]) {
          assert.ok(p.x > 0 && p.x < 1600 && p.y > 0 && p.y < 900, `${s.id} "${step.text}": hand at ${p.x},${p.y}`);
        }
      }
    }
  }
});
