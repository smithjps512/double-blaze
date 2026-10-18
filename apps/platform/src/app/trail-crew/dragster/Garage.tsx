"use client";

import { useState } from "react";
import { PROFILES, WHEELS, isLegal, mph, run, type CarSpec, type Profile, type RunResult, type Wheels } from "@/lib/dragster/sim";
import { CarSide, ForceBars, RulesList, Track, fmtTime, type Units } from "./parts";

/**
 * The Garage: build a virtual twin of the car on your blueprint, check it
 * against the class rules, and race it. No em dashes in any copy here.
 */

type NumKey = "lengthMm" | "heightMm" | "noseMm" | "axleWidthMm" | "minWidthMm" | "co2WallMm" | "eyeGapMm" | "frontAxleMm" | "rearAxleMm";

const FIELDS: Array<{ key: NumKey; label: string; hint: string }> = [
  { key: "lengthMm", label: "Body length", hint: "Nose to tail." },
  { key: "heightMm", label: "Tallest point", hint: "The highest part of the car." },
  { key: "noseMm", label: "Nose height", hint: "How tall the very front is." },
  { key: "axleWidthMm", label: "Width at the axles", hint: "Where the axle holes go through." },
  { key: "minWidthMm", label: "Thinnest width", hint: "The skinniest spot that is not at the axles." },
  { key: "co2WallMm", label: "Wood around the CO2 hole", hint: "The thinnest wall next to the cartridge." },
  { key: "eyeGapMm", label: "Screw eye separation", hint: "From one screw eye to the other." },
  { key: "frontAxleMm", label: "Front axle from the nose", hint: "Nose to the center of the front axle hole." },
  { key: "rearAxleMm", label: "Rear axle from the tail", hint: "Tail to the center of the rear axle hole." },
];

/** How much of the blank each shape keeps, for the mass estimate. */
const KEPT: Record<Profile, number> = { block: 0.95, wedge: 0.42, shell: 0.35, rail: 0.3, bullet: 0.38 };

/** A rough mass for a car not cut yet: the wood kept plus about 10 g of wheels and axles. */
export function estimateMass(car: CarSpec): number {
  const g = 10 + 100 * KEPT[car.profile] * (car.lengthMm / 305) * (car.heightMm / 70);
  return Math.round(g * 2) / 2;
}

export default function Garage({
  car,
  setCar,
  units,
  setUnits,
  canPost,
  onPost,
  posting,
  board,
}: {
  car: CarSpec;
  setCar: (c: CarSpec) => void;
  units: Units;
  setUnits: (u: Units) => void;
  canPost: boolean;
  onPost: () => void;
  posting: string | null;
  board: React.ReactNode;
}) {
  const [result, setResult] = useState<RunResult | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [shown, setShown] = useState(false);
  const twin = { ...car, mods: [] };
  const legal = isLegal(twin);

  function setNum(key: NumKey, raw: string) {
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    setCar({ ...car, [key]: units === "in" ? v * 25.4 : v });
    setShown(false);
  }

  function race() {
    setResult(run(twin));
    setShown(false);
    setRunKey((k) => k + 1);
  }

  const display = (mm: number) => (units === "in" ? Number((mm / 25.4).toFixed(3)) : Math.round(mm * 10) / 10);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-ink/10 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Your twin</h2>
              <p className="text-sm text-ink/60">Copy the numbers off your blueprint. This car should match the one you are going to cut.</p>
            </div>
            <div className="flex overflow-hidden rounded-full border border-ink/15 text-sm">
              {(["in", "mm"] as Units[]).map((u) => (
                <button key={u} onClick={() => setUnits(u)} className={`px-3 py-1 ${units === u ? "bg-ink text-white" : "bg-white"}`}>
                  {u === "in" ? "inches" : "millimetres"}
                </button>
              ))}
            </div>
          </div>

          <CarSide car={twin} className="mt-4 w-full text-ink" />

          <h3 className="mt-5 font-semibold">Body shape</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
            {(Object.keys(PROFILES) as Profile[]).map((p) => (
              <button
                key={p}
                onClick={() => setCar({ ...car, profile: p })}
                className={`rounded-xl border p-3 text-left text-sm transition ${car.profile === p ? "border-trail-orange bg-trail-orange/5" : "border-ink/10 hover:border-ink/30"}`}
              >
                <span className="block font-semibold">{PROFILES[p].label}</span>
                <span className="text-xs text-ink/60">{PROFILES[p].blurb}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="block text-sm">
                <span className="font-medium">{f.label}</span>
                <span className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={units === "in" ? 0.0625 : 1}
                    value={display(car[f.key])}
                    onChange={(e) => setNum(f.key, e.target.value)}
                    className="w-full rounded-lg border border-ink/20 px-3 py-2 tabular-nums"
                  />
                  <span className="text-ink/50">{units}</span>
                </span>
                <span className="mt-0.5 block text-xs text-ink/50">{f.hint}</span>
              </label>
            ))}
            <label className="block text-sm">
              <span className="font-medium">Mass, no cartridge</span>
              <span className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.5}
                  value={car.massG}
                  onChange={(e) => Number.isFinite(Number(e.target.value)) && setCar({ ...car, massG: Number(e.target.value) })}
                  className="w-full rounded-lg border border-ink/20 px-3 py-2 tabular-nums"
                />
                <span className="text-ink/50">g</span>
              </span>
              <button className="mt-0.5 text-xs font-semibold text-trail-orange underline" onClick={() => setCar({ ...car, massG: estimateMass(car) })}>
                Not cut yet? Estimate it from the shape
              </button>
            </label>
          </div>

          <h3 className="mt-5 font-semibold">Wheels</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {(Object.keys(WHEELS) as Wheels[]).map((w) => (
              <button
                key={w}
                onClick={() => setCar({ ...car, wheels: w })}
                className={`rounded-xl border p-3 text-left text-sm transition ${car.wheels === w ? "border-trail-orange bg-trail-orange/5" : "border-ink/10 hover:border-ink/30"}`}
              >
                <span className="block font-semibold">{WHEELS[w].label}</span>
                <span className="text-xs text-ink/60">{WHEELS[w].blurb}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Time trial</h2>
            <button onClick={race} className="rounded-full bg-trail-orange px-6 py-2.5 font-semibold text-white hover:bg-impact-orange">
              Race my twin
            </button>
          </div>
          <div className="mt-4">
            <Track lanes={[{ label: "YOU", trace: result?.trace ?? [0], timeMs: result?.timeMs ?? 0, color: "#CF4420" }]} runKey={runKey} onDone={() => setShown(true)} />
          </div>
          {result && shown && (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-ink/60">20 metres in</p>
                <p className="text-4xl font-bold tabular-nums text-blaze-maroon">{Number.isFinite(result.time) ? fmtTime(result.timeMs) : "Did not finish"}</p>
                <p className="mt-1 text-sm">Top speed {result.topSpeed.toFixed(1)} m/s, about {Math.round(mph(result.topSpeed))} mph</p>
                {result.wobble && (
                  <p className="mt-2 rounded-lg bg-trail-orange/10 p-2 text-sm text-impact-orange">
                    Your axles are close together, so the car wobbles and rubs the line. Try moving them toward the ends.
                  </p>
                )}
                <div className="mt-4">
                  {!legal ? (
                    <p className="text-sm font-semibold text-impact-orange">Fix the red rules before this car can go on the class board.</p>
                  ) : !canPost ? (
                    <p className="text-sm text-ink/60">Pick your period and type your initials at the top to post this time.</p>
                  ) : (
                    <button onClick={onPost} className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white">
                      Post my twin to the class board
                    </button>
                  )}
                  {posting && <p className="mt-2 text-sm text-ink/70">{posting}</p>}
                </div>
              </div>
              <ForceBars atTop={result.atTop} />
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-6">
        <RulesList car={twin} units={units} />
        {board}
      </aside>
    </div>
  );
}
