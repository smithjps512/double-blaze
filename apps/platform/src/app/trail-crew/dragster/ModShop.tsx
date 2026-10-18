"use client";

import { useState } from "react";
import { MODS, isLegal, run, type CarSpec, type ModId, type RunResult } from "@/lib/dragster/sim";
import { CarSide, RulesList, Track, fmtTime, type Units } from "./parts";

/**
 * The Mod Shop: start from the twin, bolt things on, guess, then race the
 * modded car against the twin side by side. After the race, every mod is
 * tested on its own so students can see which ones actually helped. Some do
 * not, and that is the lesson. No em dashes in any copy here.
 */

type Guess = "faster" | "slower" | "same";

export default function ModShop({
  car,
  setCar,
  units,
  canPost,
  onPost,
  posting,
  board,
}: {
  car: CarSpec;
  setCar: (c: CarSpec) => void;
  units: Units;
  canPost: boolean;
  onPost: () => void;
  posting: string | null;
  board: React.ReactNode;
}) {
  const [guess, setGuess] = useState<Guess | null>(null);
  const [race, setRace] = useState<{ twin: RunResult; mod: RunResult; guess: Guess } | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [shown, setShown] = useState(false);
  const twin = { ...car, mods: [] };
  const legal = isLegal(car);

  function toggle(id: ModId) {
    const mods = car.mods.includes(id) ? car.mods.filter((m) => m !== id) : [...car.mods, id];
    setCar({ ...car, mods });
    setGuess(null);
    setShown(false);
  }

  function go() {
    if (!guess) return;
    setRace({ twin: run(twin), mod: run(car), guess });
    setShown(false);
    setRunKey((k) => k + 1);
  }

  const delta = race ? race.mod.timeMs - race.twin.timeMs : 0;
  const actual: Guess = delta < -2 ? "faster" : delta > 2 ? "slower" : "same";
  const base = run(twin).timeMs;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-ink/10 bg-white p-5 md:p-6">
          <h2 className="text-xl font-semibold">Mod shop</h2>
          <p className="text-sm text-ink/60">
            Your twin runs <span className="font-semibold tabular-nums">{fmtTime(base)}</span>. Every mod helps one thing and costs another. Pick some, guess, then race.
          </p>
          <CarSide car={car} className="mt-4 w-full text-ink" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {MODS.map((m) => {
              const on = car.mods.includes(m.id);
              const pointless = m.id === "thin_wheels" && car.wheels === "thin";
              return (
                <button
                  key={m.id}
                  disabled={pointless}
                  onClick={() => toggle(m.id)}
                  className={`rounded-xl border p-3 text-left text-sm transition disabled:opacity-40 ${on ? "border-trail-orange bg-trail-orange/5" : "border-ink/10 hover:border-ink/30"}`}
                >
                  <span className="flex items-center justify-between font-semibold">
                    {m.label}
                    <span className={`ml-2 h-4 w-4 shrink-0 rounded border ${on ? "border-trail-orange bg-trail-orange" : "border-ink/30"}`} />
                  </span>
                  <span className="mt-1 block text-xs text-ridge-green">{m.what}</span>
                  <span className="block text-xs text-impact-orange">{m.tradeOff}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5 md:p-6">
          <h2 className="text-xl font-semibold">Twin vs modded</h2>
          <p className="mt-1 text-sm">Guess first: will the modded car beat your twin?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["faster", "slower", "same"] as Guess[]).map((g) => (
              <button
                key={g}
                onClick={() => setGuess(g)}
                className={`rounded-full border px-4 py-1.5 text-sm ${guess === g ? "border-ink bg-ink text-white" : "border-ink/20"}`}
              >
                {g === "same" ? "About the same" : g === "faster" ? "Faster" : "Slower"}
              </button>
            ))}
            <button
              disabled={!guess || car.mods.length === 0}
              onClick={go}
              className="ml-auto rounded-full bg-trail-orange px-6 py-2 font-semibold text-white disabled:opacity-40"
            >
              Race them
            </button>
          </div>
          {car.mods.length === 0 && <p className="mt-2 text-xs text-ink/50">Pick at least one mod first.</p>}

          <div className="mt-4">
            <Track
              lanes={[
                { label: "TWIN", trace: race?.twin.trace ?? [0], timeMs: race?.twin.timeMs ?? 0, color: "#75787B" },
                { label: "MOD", trace: race?.mod.trace ?? [0], timeMs: race?.mod.timeMs ?? 0, color: "#CF4420" },
              ]}
              runKey={runKey}
              onDone={() => setShown(true)}
            />
          </div>

          {race && shown && (
            <div className="mt-5 space-y-4">
              <p className="text-lg">
                Modded car: <span className="font-bold tabular-nums">{fmtTime(race.mod.timeMs)}</span>,{" "}
                <span className={delta <= 0 ? "font-semibold text-ridge-green" : "font-semibold text-impact-orange"}>
                  {delta === 0 ? "no change" : `${Math.abs(delta)} ms ${delta < 0 ? "faster" : "slower"}`}
                </span>{" "}
                than your twin. You guessed <span className="font-semibold">{race.guess}</span>
                {race.guess === actual ? ", and you were right." : `, but it came out ${actual}.`}
              </p>
              <div className="rounded-xl bg-stone-white p-4">
                <p className="text-sm font-semibold">What each mod did on its own</p>
                <ul className="mt-2 grid gap-x-10 gap-y-1 text-sm md:grid-cols-2">
                  {car.mods.map((id) => {
                    const alone = run({ ...twin, mods: [id] }).timeMs - base;
                    const m = MODS.find((x) => x.id === id)!;
                    return (
                      <li key={id} className="flex justify-between gap-2">
                        <span>{m.label}</span>
                        <span className={`tabular-nums ${alone < 0 ? "text-ridge-green" : alone > 0 ? "text-impact-orange" : "text-ink/50"}`}>
                          {alone === 0 ? "no change" : `${alone > 0 ? "+" : ""}${alone} ms`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-ink/55">Minus is faster. If a mod made you slower, ask why: what did it cost?</p>
              </div>
              <div>
                {!legal ? (
                  <p className="text-sm font-semibold text-impact-orange">This build breaks a rule (check the list). Illegal cars cannot race.</p>
                ) : !canPost ? (
                  <p className="text-sm text-ink/60">Pick your period and type your initials at the top to post this car.</p>
                ) : (
                  <button onClick={onPost} className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white">
                    Enter this car for Race Night
                  </button>
                )}
                {posting && <p className="mt-2 text-sm text-ink/70">{posting}</p>}
              </div>
            </div>
          )}
        </section>
      </div>
      <aside className="space-y-6">
        <RulesList car={car} units={units} />
        {board}
      </aside>
    </div>
  );
}
