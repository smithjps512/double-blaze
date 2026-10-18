"use client";

import { useEffect, useState } from "react";
import { STARTER, run, type CarSpec, type RunResult } from "@/lib/dragster/sim";
import { Track, fmtTime, type BoardRow } from "./parts";

/**
 * Race Night: the period's bracket, on the big screen.
 *
 * Built for a substitute: pick the period, press Start, then press "Race the
 * next heat" until there is a champion. Seeds come from the class board, best
 * modded car first, with twin times filling in for anyone who did not reach
 * the mod shop. Each heat gives both cars a slightly different cartridge, as
 * real cartridges are, so a top seed can lose. No em dashes in any copy here.
 */

interface Entrant {
  initials: string;
  car: CarSpec;
  seedMs: number;
}

interface Heat {
  a: Entrant | null;
  b: Entrant | null;
  winner?: Entrant;
  result?: { a: RunResult; b: RunResult; luckA: number; luckB: number };
}

const SEED_ORDER: Record<number, number[]> = {
  2: [0, 1],
  4: [0, 3, 1, 2],
  8: [0, 7, 3, 4, 1, 6, 2, 5],
};

const SAMPLE: Entrant[] = [
  ["AJ", { ...STARTER, massG: 43, profile: "rail" as const, noseMm: 12 }],
  ["MK", { ...STARTER, massG: 46, mods: ["graphite" as const] }],
  ["TR", { ...STARTER }],
  ["BL", { ...STARTER, profile: "bullet" as const, massG: 48 }],
  ["CS", { ...STARTER, massG: 53, profile: "shell" as const }],
  ["DW", { ...STARTER, massG: 55, profile: "block" as const, noseMm: 60 }],
  ["EV", { ...STARTER, massG: 41, mods: ["straws" as const, "polish" as const] }],
  ["GH", { ...STARTER, frontAxleMm: 70, rearAxleMm: 60 }],
].map(([initials, car]) => ({ initials: initials as string, car: car as CarSpec, seedMs: run(car as CarSpec).timeMs }));

function buildBracket(field: Entrant[]): Heat[][] {
  const sorted = [...field].sort((x, y) => x.seedMs - y.seedMs);
  const size = sorted.length >= 8 ? 8 : sorted.length >= 4 ? 4 : 2;
  const seeds = sorted.slice(0, size);
  const order = SEED_ORDER[size].map((i) => seeds[i] ?? null);
  const rounds: Heat[][] = [];
  const first: Heat[] = [];
  for (let i = 0; i < order.length; i += 2) first.push({ a: order[i], b: order[i + 1] });
  rounds.push(first);
  for (let n = first.length / 2; n >= 1; n /= 2) rounds.push(Array.from({ length: n }, () => ({ a: null, b: null })));
  return rounds;
}

const luck = () => 0.97 + Math.random() * 0.06;

export default function RaceNight({ fetchBoard }: { fetchBoard: (period: number) => Promise<{ mod: BoardRow[] | null; twin: BoardRow[] | null }> }) {
  const [period, setPeriod] = useState<number | null>(null);
  const [field, setField] = useState<Entrant[] | null>(null);
  const [note, setNote] = useState<string>("");
  const [rounds, setRounds] = useState<Heat[][] | null>(null);
  const [current, setCurrent] = useState<{ r: number; h: number } | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!period) return;
    setField(null);
    setRounds(null);
    setNote("Loading the class board...");
    fetchBoard(period).then(({ mod, twin }) => {
      if (!mod && !twin) {
        setNote("The class board is not switched on here, so this is a practice bracket with sample cars.");
        setField(SAMPLE);
        return;
      }
      const seen = new Set<string>();
      const out: Entrant[] = [];
      for (const r of mod ?? []) {
        seen.add(r.initials);
        out.push({ initials: r.initials, car: r.car, seedMs: r.timeMs });
      }
      for (const r of twin ?? []) {
        if (seen.has(r.initials)) continue;
        seen.add(r.initials);
        out.push({ initials: r.initials, car: r.car, seedMs: r.timeMs });
      }
      setNote(out.length < 2 ? "Fewer than two cars posted for this period yet. Students post from the Garage or the Mod Shop." : `${out.length} cars posted. The fastest ${out.length >= 8 ? 8 : out.length >= 4 ? 4 : 2} make the bracket.`);
      setField(out);
    });
  }, [period, fetchBoard]);

  function start() {
    if (!field || field.length < 2) return;
    const b = buildBracket(field);
    setRounds(b);
    setCurrent(nextHeat(b));
    setRevealed(false);
  }

  function nextHeat(b: Heat[][]): { r: number; h: number } | null {
    for (let r = 0; r < b.length; r++)
      for (let h = 0; h < b[r].length; h++) {
        const heat = b[r][h];
        if (!heat.winner && heat.a && heat.b) return { r, h };
        if (!heat.winner && r === 0 && (heat.a || heat.b) && !(heat.a && heat.b)) {
          // A bye: the lone car goes through.
          heat.winner = (heat.a ?? heat.b)!;
          advance(b, r, h, heat.winner);
        }
      }
    return null;
  }

  function advance(b: Heat[][], r: number, h: number, w: Entrant) {
    if (r + 1 >= b.length) return;
    const next = b[r + 1][Math.floor(h / 2)];
    if (h % 2 === 0) next.a = w;
    else next.b = w;
  }

  function raceHeat() {
    if (!rounds || !current) return;
    const heat = rounds[current.r][current.h];
    if (!heat.a || !heat.b || heat.result) return;
    const luckA = luck();
    const luckB = luck();
    heat.result = { a: run(heat.a.car, { cartridge: luckA }), b: run(heat.b.car, { cartridge: luckB }), luckA, luckB };
    setRounds([...rounds]);
    setRevealed(false);
    setRunKey((k) => k + 1);
  }

  function finishHeat() {
    if (!rounds || !current) return;
    const heat = rounds[current.r][current.h];
    if (!heat.result || !heat.a || !heat.b) return;
    heat.winner = heat.result.a.time <= heat.result.b.time ? heat.a : heat.b;
    advance(rounds, current.r, current.h, heat.winner);
    setRevealed(true);
    setRounds([...rounds]);
  }

  function goNext() {
    if (!rounds) return;
    setCurrent(nextHeat(rounds));
    setRevealed(false);
  }

  const heat = rounds && current ? rounds[current.r][current.h] : null;
  const champion = rounds && rounds[rounds.length - 1][0].winner;
  const roundName = (r: number, total: number) => (r === total - 1 ? "Final" : r === total - 2 ? "Semifinals" : "Quarterfinals");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-ink p-6 text-white md:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Race Night</p>
        <h2 className="mt-1 text-3xl font-bold md:text-5xl">Which period is racing?</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {[1, 2, 4, 7].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`rounded-xl px-6 py-3 text-2xl font-bold ${period === p ? "bg-trail-orange" : "bg-white/10 hover:bg-white/20"}`}>
              Period {p}
            </button>
          ))}
        </div>
        {note && <p className="mt-4 text-white/75">{note}</p>}
        {field && field.length >= 2 && !rounds && (
          <button onClick={start} className="mt-5 rounded-full bg-white px-8 py-3 text-xl font-bold text-ink">
            Start Race Night
          </button>
        )}
      </section>

      {rounds && (
        <section className="rounded-2xl border border-ink/10 bg-white p-5 md:p-8">
          {heat && heat.a && heat.b ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-3xl font-bold">
                  {roundName(current!.r, rounds.length)}: {heat.a.initials} vs {heat.b.initials}
                </h3>
                {!heat.result ? (
                  <button onClick={raceHeat} className="rounded-full bg-trail-orange px-8 py-3 text-xl font-bold text-white">
                    Race this heat
                  </button>
                ) : revealed ? (
                  <button onClick={goNext} className="rounded-full bg-ink px-8 py-3 text-xl font-bold text-white">
                    {champion ? "See the champion" : "Next heat"}
                  </button>
                ) : null}
              </div>
              <div className="mt-5">
                <Track
                  big
                  runKey={runKey}
                  lanes={[
                    { label: heat.a.initials, trace: heat.result?.a.trace ?? [0], timeMs: heat.result?.a.timeMs ?? 0, color: "#CF4420" },
                    { label: heat.b.initials, trace: heat.result?.b.trace ?? [0], timeMs: heat.result?.b.timeMs ?? 0, color: "#4F7CAC" },
                  ]}
                  onDone={finishHeat}
                />
              </div>
              {revealed && heat.winner && heat.result && (
                <p className="mt-4 text-2xl">
                  <span className="font-bold text-ridge-green">{heat.winner.initials} wins</span> by {Math.abs(heat.result.a.timeMs - heat.result.b.timeMs)} ms.{" "}
                  <span className="text-base text-ink/60">
                    Cartridge luck: {heat.a.initials} {Math.round((heat.result.luckA - 1) * 100)}%, {heat.b.initials} {Math.round((heat.result.luckB - 1) * 100)}%. Real cartridges are never identical either.
                  </span>
                </p>
              )}
            </>
          ) : champion ? (
            <div className="py-10 text-center">
              <p className="text-xl font-semibold uppercase tracking-widest text-trail-orange">Period {period} champion</p>
              <p className="mt-2 text-7xl font-black md:text-9xl">{champion.initials}</p>
              <p className="mt-3 text-lg text-ink/60">Seed time {fmtTime(champion.seedMs)}</p>
            </div>
          ) : null}

          <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))` }}>
            {rounds.map((round, r) => (
              <div key={r} className="flex flex-col justify-around gap-3">
                <p className="text-center text-sm font-semibold uppercase text-ink/50">{roundName(r, rounds.length)}</p>
                {round.map((h, i) => (
                  <div key={i} className={`rounded-lg border text-sm ${current && current.r === r && current.h === i ? "border-trail-orange" : "border-ink/10"}`}>
                    {[h.a, h.b].map((e, j) => (
                      <div key={j} className={`flex justify-between px-3 py-1.5 ${j === 0 ? "border-b border-ink/10" : ""} ${h.winner && e && h.winner === e ? "bg-ridge-green/10 font-bold" : ""}`}>
                        <span>{e?.initials ?? "..."}</span>
                        <span className="tabular-nums text-ink/50">{e ? fmtTime(e.seedMs) : ""}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
