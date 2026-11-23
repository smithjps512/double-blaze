"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { play, type PlayStep } from "@/lib/sandwich-bot/engine";
import { duration, viewAt } from "@/lib/sandwich-bot/timeline";
import type { Script } from "@/lib/sandwich-bot/types";
import Stage from "./Stage";

/**
 * The scene player.
 *
 * Made for a projector: the step text is big, and "Next step" plays exactly
 * one step and stops, so the class can read the step, guess what Chef Byte
 * will do, then watch. Play runs the rest straight through.
 *
 * Game mode (after the scene ends): students swap or add fix cards and run it
 * again. Attempts are counted on screen only; nothing is saved anywhere.
 * No em dashes in any on-screen text.
 */

type Entry = { kind: "orig"; index: number; removed?: boolean } | { kind: "fix"; id: string; swappedFrom?: number; key: number };

const SPEEDS = [0.5, 1, 1.5, 2];
const GAP_MS = 900;

function toSteps(script: Script, entries: Entry[]): PlayStep[] {
  const out: PlayStep[] = [];
  for (const e of entries) {
    if (e.kind === "orig") {
      if (!e.removed) out.push(script.steps[e.index]);
    } else {
      const f = script.fixes.find((x) => x.id === e.id);
      if (f) out.push({ text: f.text, actions: f.actions, added: true });
    }
  }
  return out;
}

const originalEntries = (script: Script): Entry[] => script.steps.map((_, index) => ({ kind: "orig", index }));

export default function Player({ script, madeBy }: { script: Script; madeBy: string | null }) {
  // What is playing, and what students are editing for the next run.
  const [runEntries, setRunEntries] = useState<Entry[]>(() => originalEntries(script));
  const [draft, setDraft] = useState<Entry[]>(() => originalEntries(script));
  const [attempts, setAttempts] = useState(1);
  const [solvedOn, setSolvedOn] = useState<number | null>(null);
  const [gameOpen, setGameOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const keyRef = useRef(1);

  const isOriginal = runEntries.every((e) => e.kind === "orig" && !e.removed);
  const steps = useMemo(() => toSteps(script, runEntries), [script, runEntries]);
  const outcome = useMemo(() => play(script, isOriginal ? undefined : steps), [script, steps, isOriginal]);
  const { compiled } = outcome;
  const total = compiled.steps.length;

  // Playback: `cur` is the step on screen, `t` the ms into it.
  const [cur, setCur] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState<"all" | "one" | null>(null);
  const [speed, setSpeed] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const finished = cur >= total;
  const view = useMemo(() => (finished ? viewAt(compiled, total - 1, Number.MAX_SAFE_INTEGER) : viewAt(compiled, cur, Math.max(0, t))), [compiled, cur, t, finished, total]);

  // The clock. Refs keep the loop simple; React state is the source of truth for drawing.
  const state = useRef({ cur, t, playing, speed, total });
  state.current = { cur, t, playing, speed, total };
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const s = state.current;
      const dt = Math.min(100, now - last) * s.speed;
      last = now;
      let nt = s.t + dt;
      const dur = duration(compiled, s.cur);
      if (nt >= dur) {
        const next = s.cur + 1;
        if (next >= s.total) {
          setCur(next);
          setT(0);
          setPlaying(null);
          setShowResult(true);
          return;
        }
        if (s.playing === "one") {
          setCur(next);
          setT(0);
          setPlaying(null);
          return;
        }
        setCur(next);
        nt = -GAP_MS;
      }
      setT(nt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, compiled]);

  // Success bookkeeping once a run reaches the end.
  useEffect(() => {
    if (finished && outcome.success && solvedOn === null) setSolvedOn(attempts);
  }, [finished, outcome.success, solvedOn, attempts]);

  const replay = useCallback(() => {
    setPlaying(null);
    setCur(0);
    setT(0);
    setShowResult(false);
  }, []);

  const nextStep = useCallback(() => {
    if (finished) return;
    if (playing) {
      // Skip to the end of this step.
      setPlaying(null);
      if (cur + 1 >= total) {
        setCur(total);
        setShowResult(true);
      } else setCur(cur + 1);
      setT(0);
      return;
    }
    setPlaying("one");
  }, [finished, playing, cur, total]);

  const back = useCallback(() => {
    setPlaying(null);
    setShowResult(false);
    if (t > 300 && !finished) setT(0);
    else {
      setCur((c) => Math.max(0, Math.min(c, total) - 1));
      setT(0);
    }
  }, [t, finished, total]);

  const toggle = useCallback(() => {
    if (finished) {
      replay();
      setPlaying("all");
      return;
    }
    setPlaying((p) => (p === "all" ? null : "all"));
  }, [finished, replay]);

  const fullscreen = useCallback(() => {
    const el = stageRef.current?.closest("[data-player]") as HTMLElement | null;
    if (!document.fullscreenElement) el?.requestFullscreen?.().catch(() => undefined);
    else document.exitFullscreen?.().catch(() => undefined);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || (tag === "BUTTON" && e.key === " ")) return;
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight" || e.key === "n") nextStep();
      else if (e.key === "ArrowLeft") back();
      else if (e.key === "r") replay();
      else if (e.key === "f") fullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, nextStep, back, replay, fullscreen]);

  // -- game mode -----------------------------------------------------------

  const runIt = () => {
    setRunEntries(draft);
    setAttempts((a) => a + 1);
    setPending(null);
    setShowResult(false);
    setCur(0);
    setT(0);
    setPlaying(null);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyFix = (id: string) => {
    const f = script.fixes.find((x) => x.id === id);
    if (!f) return;
    if (f.replaces) {
      setDraft((d) => d.map((e) => (e.kind === "orig" && e.index === f.replaces! - 1 ? { kind: "fix", id, swappedFrom: e.index, key: keyRef.current++ } : e)));
      return;
    }
    setPending((p) => (p === id ? null : id));
  };

  const insertAt = (pos: number) => {
    if (!pending) return;
    setDraft((d) => [...d.slice(0, pos), { kind: "fix", id: pending, key: keyRef.current++ }, ...d.slice(pos)]);
    setPending(null);
  };

  const removeEntry = (i: number) => {
    setDraft((d) =>
      d.flatMap((e, j): Entry[] => {
        if (j !== i) return [e];
        if (e.kind === "orig") return [{ ...e, removed: !e.removed }];
        return e.swappedFrom !== undefined ? [{ kind: "orig", index: e.swappedFrom }] : [];
      }),
    );
  };

  const usedFixes = new Set(draft.filter((e): e is Extract<Entry, { kind: "fix" }> => e.kind === "fix").map((e) => e.id));
  const draftChanged = JSON.stringify(draft) !== JSON.stringify(runEntries);

  const step = compiled.steps[Math.min(cur, total - 1)];
  const notYet = !playing && t <= 0 && !finished;
  const missing = isOriginal ? script.missing : outcome.checks.filter((c) => !c.done && !c.optional).map((c) => c.label + ".");

  return (
    <div data-player className="sb-player flex min-h-screen flex-col overflow-auto bg-[#FFF8E7] text-ink">
      {/* Title bar */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 pt-3 md:px-6">
        <h1 className="text-2xl font-black md:text-3xl">{script.title}</h1>
        <p className="text-lg text-ink/70">
          Goal: <strong>{script.goal.name}</strong>
          {madeBy && <> · Made by <strong>{madeBy}</strong></>}
        </p>
        {attempts > 1 && (
          <p className="ml-auto rounded-full bg-[#2BB3C0] px-4 py-1 text-lg font-bold text-white">
            Attempt {attempts}
            {solvedOn ? `: real sandwich on attempt ${solvedOn}!` : ""}
          </p>
        )}
      </div>

      {/* Stage */}
      <div ref={stageRef} className="relative mx-auto mt-2 w-full max-w-[min(100%,calc((100vh-25rem)*16/9))] px-2 md:px-6">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border-4 border-ink bg-white">
          <Stage view={view} title={script.title} />
        </div>
      </div>

      {/* Step text */}
      <div className="mx-auto w-full max-w-[min(100%,calc((100vh-25rem)*16/9))] px-2 md:px-6">
        <div className="mt-3 rounded-2xl border-4 border-ink bg-white px-5 py-3" aria-live="polite">
          {finished ? (
            <ResultCard
              goal={script.goal.name}
              result={outcome.result}
              success={outcome.success}
              missing={missing}
              onReplay={replay}
              onFix={() => {
                setGameOpen(true);
                setTimeout(() => document.getElementById("game-mode")?.scrollIntoView({ behavior: "smooth" }), 50);
              }}
            />
          ) : (
            <>
              <p className="text-lg font-bold uppercase tracking-wider text-[#B23A18]">
                Step {cur + 1} of {total}
                {step?.added && <span className="ml-3 rounded bg-[#6CC24A] px-2 py-0.5 text-white">Fix card</span>}
                {notYet && <span className="ml-3 text-ink/70 normal-case tracking-normal">What will Chef Byte do? Guess, then press Next step.</span>}
              </p>
              <p className="font-black leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 56px)" }}>
                {step?.text}
              </p>
            </>
          )}
        </div>

        {/* Step dots */}
        <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
          {compiled.steps.map((s, i) => (
            <span key={i} className={`h-3 flex-1 rounded-full border-2 border-ink ${i < cur ? "bg-[#2BB3C0]" : i === cur && !finished ? "bg-[#FFD43B]" : "bg-white"} ${s.added ? "outline outline-2 outline-[#6CC24A]" : ""}`} />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-3 flex flex-wrap items-center gap-2 pb-4">
          <Btn onClick={back} label="Back (Left arrow)">◀ Back</Btn>
          <Btn onClick={nextStep} big label="Next step (Right arrow)" disabled={finished}>
            {playing ? "Skip ▶▶" : "Next step ▶"}
          </Btn>
          <Btn onClick={toggle} label="Play or pause (Space)">{playing === "all" ? "❚❚ Pause" : finished ? "▶ Play again" : "▶ Play all"}</Btn>
          <Btn onClick={replay} label="Replay from step 1 (R)">↺ Replay</Btn>
          <label className="ml-1 flex items-center gap-2 text-lg font-bold">
            Speed
            <select value={speed} onChange={(e) => {
                setSpeed(Number(e.target.value));
                e.target.blur();
              }} className="rounded-lg border-2 border-ink bg-white px-2 py-2 text-lg">
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </label>
          <Btn onClick={fullscreen} label="Full screen (F)">⛶ Full screen</Btn>
          <button type="button" className="ml-auto text-lg font-bold underline underline-offset-4" onClick={() => setShowOriginal((v) => !v)}>
            {showOriginal ? "Hide" : "Show"} the original instructions
          </button>
          <button type="button" className="text-lg font-bold underline underline-offset-4" onClick={() => setGameOpen((v) => !v)}>
            {gameOpen ? "Hide" : "Fix it"} (game mode)
          </button>
        </div>

        {showOriginal && (
          <div className="mb-4 rounded-2xl border-4 border-dashed border-ink/50 bg-white p-4">
            <p className="text-sm font-bold uppercase tracking-wider text-ink/60">Exactly as written</p>
            <p className="whitespace-pre-wrap text-2xl leading-snug">{script.original}</p>
          </div>
        )}

        {gameOpen && (
          <section id="game-mode" className="mb-8 rounded-2xl border-4 border-ink bg-white p-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-2xl font-black">Fix it: help Chef Byte make a real {script.goal.name}</h2>
              <p className="text-lg text-ink/70">Swap or add fix cards, then run it again. Attempts so far: {attempts}.</p>
            </div>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-lg font-bold">The steps</h3>
                {pending && <p className="mt-1 rounded bg-[#FFD43B] px-2 py-1 font-bold">Now tap a green + to choose where the card goes.</p>}
                <ol className="mt-2 space-y-1">
                  {draft.map((e, i) => {
                    const text = e.kind === "orig" ? script.steps[e.index].text : script.fixes.find((f) => f.id === e.id)?.text;
                    const fix = e.kind === "fix";
                    const removed = e.kind === "orig" && e.removed;
                    return (
                      <li key={e.kind === "orig" ? `o${e.index}` : `f${e.key}`}>
                        {pending && <InsertSlot onClick={() => insertAt(i)} />}
                        <div className={`flex items-start gap-2 rounded-lg border-2 px-3 py-2 text-lg ${fix ? "border-[#3F8F2F] bg-[#EAF8E2]" : "border-ink/20"}`}>
                          <span className={`flex-1 ${removed ? "text-ink/40 line-through" : ""}`}>{text}</span>
                          <button type="button" onClick={() => removeEntry(i)} className="shrink-0 rounded border-2 border-ink/30 px-2 text-base font-bold hover:bg-ink/5">
                            {fix ? (e.swappedFrom !== undefined ? "Undo swap" : "Remove") : removed ? "Put back" : "Cross out"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                  {pending && (
                    <li>
                      <InsertSlot onClick={() => insertAt(draft.length)} />
                    </li>
                  )}
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-bold">Fix cards</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {script.fixes.map((f) => {
                    const used = usedFixes.has(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        disabled={used && !!f.replaces}
                        onClick={() => applyFix(f.id)}
                        className={`rounded-xl border-4 p-3 text-left text-lg font-bold transition ${pending === f.id ? "border-[#B23A18] bg-[#FFD43B]" : used ? "border-ink/20 bg-ink/5 text-ink/50" : "border-ink bg-[#FFF8E7] hover:bg-[#FFE9B8]"}`}
                      >
                        <span className="block text-sm uppercase tracking-wider text-[#B23A18]">{f.replaces ? `Swap for step ${f.replaces}` : "Add a step"}</span>
                        {f.text}
                      </button>
                    );
                  })}
                </div>
                <h3 className="mt-5 text-lg font-bold">Last run</h3>
                <ul className="mt-1 space-y-1 text-lg">
                  {outcome.checks.map((c) => (
                    <li key={c.label} className="flex gap-2">
                      <span aria-hidden className={c.done ? "text-[#3F8F2F]" : "text-ink/40"}>
                        {c.done ? "✔" : "○"}
                      </span>
                      <span>
                        {c.label}
                        {c.optional ? " (bonus)" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Btn onClick={runIt} big disabled={!draftChanged}>
                ▶ Run it again (attempt {attempts + 1})
              </Btn>
              <Btn
                onClick={() => {
                  setDraft(originalEntries(script));
                  setPending(null);
                }}
              >
                Start over with the original
              </Btn>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function InsertSlot({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="my-1 w-full rounded-lg border-2 border-dashed border-[#3F8F2F] bg-[#EAF8E2] py-1 text-lg font-black text-[#3F8F2F]">
      + put it here
    </button>
  );
}

function Btn({ children, onClick, big, label, disabled }: { children: React.ReactNode; onClick: () => void; big?: boolean; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`rounded-xl border-4 border-ink font-black shadow-[0_4px_0_#2B2321] transition active:translate-y-1 active:shadow-none disabled:opacity-40 ${big ? "bg-[#FFD43B] px-6 py-3 text-2xl" : "bg-white px-4 py-2 text-lg"}`}
    >
      {children}
    </button>
  );
}

function ResultCard({ goal, result, success, missing, onReplay, onFix }: { goal: string; result: string; success: boolean; missing: string[]; onReplay: () => void; onFix: () => void }) {
  return (
    <div>
      <p className="text-xl font-bold lg:text-2xl">
        <span className="text-[#B23A18]">Goal:</span> {goal}.
      </p>
      <p className="mt-1 font-black leading-tight" style={{ fontSize: "clamp(28px, 2.8vw, 48px)" }}>
        <span className="text-[#B23A18]">Result:</span> {result}
      </p>
      {success ? (
        <p className="mt-3 text-2xl font-black text-[#3F8F2F]">Chef Byte did it! Every step was there.</p>
      ) : (
        missing.length > 0 && (
          <>
            <p className="mt-3 text-xl font-bold lg:text-2xl">Steps Chef Byte needed but didn&apos;t get:</p>
            <ul className="mt-1 grid list-disc gap-x-10 gap-y-1 pl-7 text-xl lg:grid-cols-2 lg:text-2xl">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </>
        )
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Btn onClick={onReplay}>↺ Watch again</Btn>
        {!success && (
          <Btn onClick={onFix} big>
            Fix it
          </Btn>
        )}
      </div>
    </div>
  );
}
