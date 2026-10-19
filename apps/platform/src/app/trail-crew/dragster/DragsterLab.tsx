"use client";

import { useCallback, useEffect, useState } from "react";
import { STARTER, type CarSpec } from "@/lib/dragster/sim";
import PitPass from "./PitPass";
import Garage from "./Garage";
import ModShop from "./ModShop";
import RaceNight from "./RaceNight";
import { Board, load, playerKey, save, type BoardRow, type Units } from "./parts";

/**
 * The Dragster Lab shell: who you are (period and initials), which station
 * you are at, and the class board. Everything a student does is kept on the
 * Chromebook, so a second day picks up where the first one stopped.
 * No em dashes in any copy here.
 */

type Tab = "pit" | "garage" | "mods" | "race";

interface Saved {
  passed: boolean[];
  car: CarSpec;
  units: Units;
  period: number | null;
  initials: string;
  carNo: number | null;
}

const KEY = "dragster.v1";
const DEFAULTS: Saved = { passed: [false, false, false], car: STARTER, units: "in", period: null, initials: "", carNo: null };
const PERIODS = [1, 2, 4, 7];

export default function DragsterLab() {
  const [state, setState] = useState<Saved>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("pit");
  const [boards, setBoards] = useState<{ twin: BoardRow[] | null; mod: BoardRow[] | null }>({ twin: [], mod: [] });
  const [posting, setPosting] = useState<string | null>(null);

  useEffect(() => {
    const s = load(KEY, DEFAULTS);
    setState(s);
    setReady(true);
    if (s.passed.every(Boolean)) setTab("garage");
  }, []);

  useEffect(() => {
    if (ready) save(KEY, state);
  }, [state, ready]);

  const update = (patch: Partial<Saved>) => setState((s) => ({ ...s, ...patch }));
  const pitDone = state.passed.every(Boolean);
  const initialsOk = /^[A-Za-z]{2,3}$/.test(state.initials);
  const canPost = !!state.period && initialsOk;

  const fetchBoard = useCallback(async (period: number) => {
    const get = async (kind: "twin" | "mod") => {
      try {
        const res = await fetch(`/api/dragster/runs?period=${period}&kind=${kind}&player=${playerKey()}`, { cache: "no-store" });
        if (!res.ok) return null;
        return ((await res.json()).board as BoardRow[]) ?? [];
      } catch {
        return null;
      }
    };
    const [twin, mod] = await Promise.all([get("twin"), get("mod")]);
    return { twin, mod };
  }, []);

  useEffect(() => {
    if (state.period) fetchBoard(state.period).then(setBoards);
  }, [state.period, fetchBoard]);

  async function post(kind: "twin" | "mod") {
    if (!state.period) return;
    setPosting("Posting...");
    try {
      const res = await fetch("/api/dragster/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          period: state.period,
          kind,
          initials: state.initials,
          player: playerKey(),
          car: kind === "twin" ? { ...state.car, mods: [] } : state.car,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPosting(res.status === 503 || res.status === 404 ? "The class board is not switched on here. Write your time on your exit slip." : data.error ?? "Could not post.");
        return;
      }
      setPosting(data.best ? "Posted. That is your best time so far." : "Posted, but your earlier run was faster, so the board keeps that one.");
      setBoards((b) => ({ ...b, [kind]: data.board }));
    } catch {
      setPosting("Could not reach the class board. Write your time on your exit slip.");
    }
  }

  const tabs: Array<{ id: Tab; label: string; locked: boolean }> = [
    { id: "pit", label: "1. Pit Pass", locked: false },
    { id: "garage", label: "2. Garage", locked: !pitDone },
    { id: "mods", label: "3. Mod Shop", locked: !pitDone },
    { id: "race", label: "4. Race Night", locked: false },
  ];

  return (
    <div className="bg-stone-white">
      <div className="container-page py-6 md:py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Intro to Technology</p>
            <h1 className="text-3xl font-bold md:text-4xl">Dragster Lab</h1>
            <p className="mt-1 max-w-2xl text-ink/70">Build a virtual twin of the CO2 dragster on your blueprint, mod it, and race the class.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-ink/10 bg-white p-3">
            <label className="text-sm">
              <span className="block font-medium">Your period</span>
              <select
                value={state.period ?? ""}
                onChange={(e) => update({ period: e.target.value ? Number(e.target.value) : null })}
                className="mt-1 rounded-lg border border-ink/20 px-2 py-1.5"
              >
                <option value="">Pick one</option>
                {PERIODS.map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block font-medium">Initials</span>
              <input
                value={state.initials}
                maxLength={3}
                onChange={(e) => update({ initials: e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase() })}
                placeholder="ABC"
                className="mt-1 w-20 rounded-lg border border-ink/20 px-2 py-1.5 uppercase tracking-widest"
              />
            </label>
          </div>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Lab stations">
          {tabs.map((t) => (
            <button
              key={t.id}
              disabled={t.locked}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${tab === t.id ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}
              title={t.locked ? "Finish your Pit Pass first" : undefined}
            >
              {t.label}
              {t.locked ? " (locked)" : ""}
            </button>
          ))}
        </nav>

        <main className="mt-6">
          {tab === "pit" && <PitPass passed={state.passed} onPass={(i) => update({ passed: state.passed.map((p, j) => p || j === i) })} />}
          {tab === "garage" && (
            <Garage
              period={state.period}
              initials={state.initials}
              carNo={state.carNo}
              setCarNo={(carNo, spec) => update(spec ? { carNo, car: spec } : { carNo })}
              car={state.car}
              setCar={(car) => update({ car })}
              units={state.units}
              setUnits={(units) => update({ units })}
              canPost={canPost}
              onPost={() => post("twin")}
              posting={posting}
              board={<Board rows={boards.twin} title={state.period ? `Period ${state.period}: twins` : "Class board"} empty={state.period ? "No twins posted yet. Be first." : "Pick your period to see the board."} />}
            />
          )}
          {tab === "mods" && (
            <ModShop
              car={state.car}
              setCar={(car) => update({ car })}
              units={state.units}
              canPost={canPost}
              onPost={() => post("mod")}
              posting={posting}
              board={<Board rows={boards.mod} title={state.period ? `Period ${state.period}: Race Night entries` : "Race Night entries"} empty={state.period ? "No modded cars entered yet." : "Pick your period to see the board."} />}
            />
          )}
          {tab === "race" && <RaceNight fetchBoard={fetchBoard} />}
        </main>
      </div>
    </div>
  );
}
