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

// ---------------------------------------------------------------------------
// Batch 2: each scene plays as written, and fix cards can reach the goal.

const s = (id: string) => findScript(id)!;

test("sub-002: wrapped cheese stacks on the closed turkey package on the bag", () => {
  const out = play(s("sub-002"));
  assert.equal(out.success, false);
  const w = out.compiled.end;
  const pack = w.objects.find((o) => o.id === "turkey-pack")!;
  assert.deepEqual(pack.place, { type: "on", ref: "bread-bag", dx: 0 });
  assert.ok(w.objects.filter((o) => o.kind === "cheese").every((c) => !c.open));
});

test("sub-002: with fix cards it becomes a turkey and cheese sandwich", () => {
  const steps = withFixes(s("sub-002"), [{ id: "open-bag", at: 1 }, { id: "two-slices", at: 1 }, { id: "open-turkey", at: 1 }, { id: "turkey-out", at: 1 }, { id: "unwrap", at: 1 }]);
  const out = play(s("sub-002"), steps);
  assert.equal(out.success, true, `${out.result}\n${JSON.stringify(out.checks, null, 1)}`);
});

test("sub-003: air in the pot, never boils, crunchy dry noodles in the bowl", () => {
  const out = play(s("sub-003"));
  assert.equal(out.success, false);
  const noodles = out.compiled.end.objects.find((o) => o.kind === "noodles")!;
  assert.equal(noodles.s.cooked, undefined);
  assert.equal(out.checks.find((c) => c.label === "Put the ramen in a bowl")?.done, true);
  assert.ok(said(out.compiled.steps).some((t) => t.includes("CRUNCH")));
});

test("sub-003: with water and an opened seasoning packet it is real ramen", () => {
  const out = play(s("sub-003"), withFixes(s("sub-003"), [{ id: "water" }, { id: "open-seasoning" }]));
  assert.equal(out.success, true, `${out.result}\n${JSON.stringify(out.checks, null, 1)}`);
});

test("sub-004: a real PB&J as written, with a bite out of it", () => {
  const out = play(s("sub-004"));
  assert.equal(out.success, true, `${out.result}\n${JSON.stringify(out.checks, null, 1)}`);
  assert.ok(out.compiled.end.objects.some((o) => o.s.bitten));
  const pb = out.compiled.end.objects.find((o) => o.id === "pb-jar")!;
  assert.deepEqual(pb.place.type === "in" && pb.place.ref, "cupboard");
  assert.notEqual(pb.place.type, "on", "next to the plate, not on it");
});

test("sub-005: safety stop keeps plastic out of the hot pan", () => {
  const out = play(s("sub-005"));
  assert.equal(out.success, false);
  const w = out.compiled.end;
  assert.ok(w.objects.every((o) => !(o.place.type === "in" && o.place.ref === "pan")));
  assert.ok(said(out.compiled.steps).some((t) => t.includes("Safety rule")));
  assert.ok(w.objects.find((o) => o.kind === "stove")!.s.on);
});

test("sub-005: with fix cards it becomes a fried ham and cheese sandwich", () => {
  const steps = withFixes(s("sub-005"), [{ id: "open-bag", at: 1 }, { id: "two-slices", at: 1 }, { id: "open-oil", at: 1 }, { id: "open-ham", at: 1 }, { id: "unwrap", at: 1 }, { id: "top-bread", at: 11 }, { id: "stove-off", at: 12 }]);
  const out = play(s("sub-005"), steps);
  assert.equal(out.success, true, `${out.result}\n${JSON.stringify(out.checks, null, 1)}`);
});

test("sub-006: bag on the hat, nothing spread, won't bite plastic", () => {
  const out = play(s("sub-006"));
  assert.equal(out.success, false);
  assert.equal(out.compiled.end.objects.find((o) => o.id === "bread-bag")!.place.type, "hat");
  assert.ok(said(out.compiled.steps).some((t) => t.includes("plastic bag")));
});

test("sub-006: with fix cards it becomes a PB&J", () => {
  const steps = withFixes(s("sub-006"), [{ id: "open-bag", at: 1 }, { id: "two-slices", at: 1 }, { id: "open-pb", at: 1 }, { id: "open-jelly", at: 1 }, { id: "knife-jelly" }]);
  const out = play(s("sub-006"), steps);
  assert.equal(out.success, true, `${out.result}\n${JSON.stringify(out.checks, null, 1)}`);
});
