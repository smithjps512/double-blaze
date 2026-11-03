"use client";

import { useEffect, useRef, useState } from "react";
import { ExpressGame, type EngineSnapshot, type Key } from "@/lib/express/engine";
import type { GameSpec } from "@/lib/express/spec";

/**
 * A Studio Express game on the page: the canvas, the keyboard, touch
 * buttons for touch screens, Sound (off by default: a room of Chromebooks
 * beeping is nobody's friend), Pause, and an X-ray of what the student wrote
 * next to what it became. All the game itself is in lib/express/engine.ts.
 * No em dashes in any copy here.
 */

const KEYMAP: Record<string, Key> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyA: "left",
  KeyD: "right",
  KeyW: "up",
  KeyS: "down",
  Space: "action",
};

function isFormField(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

export default function GamePlayer({ spec }: { spec: GameSpec }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<ExpressGame | null>(null);
  const [snap, setSnap] = useState<EngineSnapshot | null>(null);
  const [sound, setSound] = useState(false);
  const [xray, setXray] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0));
  }, []);

  // One engine per spec. The spec is data, so a new spec means a new game.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new ExpressGame(canvas, spec, { onChange: setSnap });
    gameRef.current = game;
    const onResize = () => game.resize(canvas);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    ro?.observe(canvas);
    window.addEventListener("resize", onResize);

    const down = (e: KeyboardEvent) => {
      if (isFormField(e.target)) return;
      if (e.code === "KeyP") return game.togglePause();
      const key = KEYMAP[e.code];
      if (!key) return;
      e.preventDefault();
      if (e.repeat) return;
      if (key === "action" && game.phase !== "play") return game.press();
      if (game.paused && key === "action") return game.togglePause();
      game.setKey(key, true);
    };
    const up = (e: KeyboardEvent) => {
      const key = KEYMAP[e.code];
      if (!key) return;
      if (!isFormField(e.target)) e.preventDefault();
      game.setKey(key, false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      game.destroy();
      gameRef.current = null;
    };
  }, [spec]);

  useEffect(() => {
    gameRef.current?.setSound(sound);
  }, [sound]);

  const playing = snap?.phase === "play";

  /** A held on-screen button: down on press, up on release or when the finger slides off. */
  const hold = (key: Key, label: string, className = "") => (
    <button
      type="button"
      aria-label={label}
      className={`select-none rounded-2xl bg-white/15 text-2xl font-bold text-white active:bg-white/35 ${className}`}
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        const g = gameRef.current;
        if (!g) return;
        if (key === "action" && g.phase !== "play") return g.press();
        g.setKey(key, true);
      }}
      onPointerUp={() => gameRef.current?.setKey(key, false)}
      onPointerCancel={() => gameRef.current?.setKey(key, false)}
      onLostPointerCapture={() => gameRef.current?.setKey(key, false)}
    >
      {label}
    </button>
  );

  const fourWay = spec.genre !== "platformer";

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-xl ring-1 ring-black/10">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label={`${spec.title}: a game. Arrow keys or WASD to move, Space to ${spec.genre === "platformer" ? "jump" : "use your power"}.`}
          className="block aspect-video w-full cursor-pointer outline-none"
          onPointerDown={() => {
            canvasRef.current?.focus();
            const g = gameRef.current;
            if (!g) return;
            if (g.paused) g.togglePause();
            else if (g.phase !== "play") g.press();
          }}
        />
      </div>

      {touch && (
        <div className="mt-3 flex items-end justify-between gap-3 rounded-2xl bg-ink p-3">
          {fourWay ? (
            <div className="grid grid-cols-3 gap-2">
              <span />
              {hold("up", "▲", "h-14 w-14")}
              <span />
              {hold("left", "◀", "h-14 w-14")}
              {hold("down", "▼", "h-14 w-14")}
              {hold("right", "▶", "h-14 w-14")}
            </div>
          ) : (
            <div className="flex gap-2">
              {hold("left", "◀", "h-16 w-20")}
              {hold("right", "▶", "h-16 w-20")}
            </div>
          )}
          {hold("action", spec.genre === "platformer" ? "Jump" : "Power", "h-16 w-24 bg-trail-orange/80 text-lg")}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button type="button" onClick={() => setSound((s) => !s)} className="rounded-full border border-ink/15 bg-white px-3 py-1.5 font-medium" aria-pressed={sound}>
          {sound ? "🔊 Sound on" : "🔇 Sound off"}
        </button>
        <button
          type="button"
          onClick={() => gameRef.current?.togglePause()}
          disabled={!playing}
          className="rounded-full border border-ink/15 bg-white px-3 py-1.5 font-medium disabled:opacity-40"
        >
          {snap?.paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button type="button" onClick={() => setXray((x) => !x)} className={`rounded-full px-3 py-1.5 font-semibold ${xray ? "bg-teal-600 text-white" : "border border-teal-600 bg-white text-teal-700"}`} aria-pressed={xray}>
          X-ray {xray ? "on" : "off"}
        </button>
        <span className="ml-auto text-ink/60">
          {spec.genre === "platformer" ? "Arrows or A/D to move, Space to jump. Jump on enemies!" : "Arrows or WASD to move. Space uses some powers."} P pauses.
        </span>
      </div>

      {xray && (
        <div className="mt-3 rounded-2xl border-2 border-dashed border-teal-500 bg-teal-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-700">X-ray: what you wrote, and what it became</p>
          <ul className="mt-2 divide-y divide-teal-200">
            {spec.xray.map((row, i) => (
              <li key={i} className="grid gap-1 py-2 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3">
                <span className="font-medium text-ink">{row.theyWrote}</span>
                <span aria-hidden className="hidden text-teal-600 sm:inline">→</span>
                <span className="text-ink/75">{row.weBuilt}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink/50">{spec.builtBy === "spark" ? "Spark read your design and chose the details." : "Built straight from your choices."}</p>
        </div>
      )}
    </div>
  );
}
