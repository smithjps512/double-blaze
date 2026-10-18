"use client";

import { useEffect, useRef, useState } from "react";
import { PROFILES, effective, checkRules, type CarSpec, type RuleResult } from "@/lib/dragster/sim";
import { TRACK_M } from "@/lib/dragster/rules";

/**
 * Shared pieces of the Dragster Lab: units, the car drawing, the track, the
 * rules checklist and the class board. No em dashes in any copy here.
 */

export type Units = "in" | "mm";

export function fmtLen(mm: number, units: Units): string {
  return units === "in" ? `${(mm / 25.4).toFixed(2)} in` : `${Math.round(mm)} mm`;
}

export function fmtRule(r: RuleResult, units: Units): string {
  const f = (v: number) => (r.unit === "g" ? `${v} g` : fmtLen(v, units));
  if (r.min !== undefined && r.max !== undefined) return `${f(r.min)} to ${f(r.max)}`;
  if (r.min !== undefined) return `at least ${f(r.min)}`;
  return `at most ${f(r.max!)}`;
}

export function fmtTime(ms: number): string {
  return `${(ms / 1000).toFixed(3)} s`;
}

// ---------------------------------------------------------------------------
// Device token and saved state
// ---------------------------------------------------------------------------

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private window: the Lab still works, it just forgets */
  }
}

export function playerKey(): string {
  try {
    const k = localStorage.getItem("dragster.player");
    if (k && /^[A-Za-z0-9_-]{16,64}$/.test(k)) return k;
  } catch {
    /* fall through */
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const k = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  try {
    localStorage.setItem("dragster.player", k);
  } catch {
    /* fine */
  }
  return k;
}

// ---------------------------------------------------------------------------
// The car, side on
// ---------------------------------------------------------------------------

/** A side view drawn from the student's own numbers, to scale. */
export function CarSide({ car, className }: { car: CarSpec; className?: string }) {
  const s = effective(car).spec;
  const L = s.lengthMm;
  const H = Math.max(15, s.heightMm - 10);
  const nose = Math.min(H, Math.max(6, s.noseMm));
  const wheelR = 15;
  const ground = 110;
  const bottom = ground - 8;
  const top = bottom - H;
  const x0 = 20;
  const scale = 1;
  const X = (mm: number) => x0 + mm * scale;
  const tail = X(L);

  let body: string;
  switch (s.profile) {
    case "block":
      body = `M${X(0)},${bottom} L${X(0)},${top} L${tail},${top} L${tail},${bottom} Z`;
      break;
    case "rail": {
      const pod = Math.min(90, L * 0.32);
      body = `M${X(0)},${bottom} L${X(0)},${bottom - nose} L${tail - pod},${bottom - nose} Q${tail - pod + 20},${top} ${tail - pod / 2},${top} L${tail},${top} L${tail},${bottom} Z`;
      break;
    }
    case "shell":
      body = `M${X(0)},${bottom} Q${X(0)},${bottom - nose} ${X(L * 0.18)},${bottom - nose - 4} Q${X(L * 0.6)},${top - 2} ${tail},${top} L${tail},${bottom} Z`;
      break;
    case "bullet":
      body = `M${X(0)},${bottom - nose / 2} Q${X(L * 0.12)},${top} ${X(L * 0.45)},${top} L${tail},${top} L${tail},${bottom} L${X(L * 0.12)},${bottom} Q${X(0)},${bottom} ${X(0)},${bottom - nose / 2} Z`;
      break;
    default:
      body = `M${X(0)},${bottom} L${X(0)},${bottom - nose} L${tail},${top} L${tail},${bottom} Z`;
  }

  const fin = s.mods.includes("tail_fin");
  const fenders = s.mods.includes("fenders");
  const holes = s.mods.includes("weight_holes");
  const front = X(s.frontAxleMm);
  const rear = tail - s.rearAxleMm * scale;
  const eyeRear = tail - 20;
  const eyeFront = eyeRear - s.eyeGapMm * scale;

  return (
    <svg viewBox={`0 0 ${L + 50} 135`} className={className} role="img" aria-label={`Side view of a ${PROFILES[s.profile].label} car`}>
      <line x1="0" x2={L + 50} y1={ground + wheelR - 8} y2={ground + wheelR - 8} stroke="currentColor" strokeOpacity="0.25" strokeDasharray="4 4" />
      {fin && <path d={`M${tail - 40},${top} L${tail - 4},${top - 16} L${tail},${top} Z`} fill="#CF4420" />}
      <path d={body} fill="#E8D3B0" stroke="#7A5B33" strokeWidth="1.5" />
      {s.mods.includes("polish") && <path d={body} fill="#CF4420" fillOpacity="0.25" />}
      {holes &&
        [0.3, 0.45, 0.6].map((f) => <circle key={f} cx={X(L * f)} cy={bottom - Math.min(nose, H) / 2 - 2} r="4" fill="#fff" stroke="#7A5B33" />)}
      {/* CO2 hole and cartridge */}
      <rect x={tail - 50} y={top + (H - 19) / 2} width="50" height="19" rx="3" fill="#B8BCC2" stroke="#55595E" />
      <text x={tail - 25} y={top + H / 2 + 3} textAnchor="middle" fontSize="8" fill="#33363A">CO2</text>
      {/* Wheels */}
      {[front, rear].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ground} r={wheelR} fill="#1C1A19" />
          <circle cx={x} cy={ground} r={wheelR * 0.45} fill="#9CA0A6" />
          {fenders && i === 0 && <path d={`M${x - wheelR - 3},${ground} A${wheelR + 3},${wheelR + 3} 0 0 1 ${x + wheelR + 3},${ground}`} fill="none" stroke="#CF4420" strokeWidth="4" />}
        </g>
      ))}
      {/* Screw eyes, drawn last so the wheels never hide them */}
      {[eyeFront, eyeRear].map((x, i) => (
        <circle key={i} cx={x} cy={bottom + 3} r="3.5" fill="#fff" stroke="#2E4A3B" strokeWidth="2" />
      ))}
      <text x={X(0)} y="10" fontSize="9" fill="currentColor" opacity="0.6">nose</text>
      <text x={tail} y="10" fontSize="9" textAnchor="end" fill="currentColor" opacity="0.6">tail</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The track
// ---------------------------------------------------------------------------

export interface Lane {
  label: string;
  trace: number[];
  timeMs: number;
  color: string;
}

/**
 * One or more lanes racing down 20 m. Traces are positions every 20 ms; the
 * race plays at half speed so you can actually watch it.
 */
export function Track({ lanes, runKey, slow = 2, big = false, onDone }: { lanes: Lane[]; runKey: number; slow?: number; big?: boolean; onDone?: () => void }) {
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!runKey) return;
    const longest = Math.max(...lanes.map((l) => l.trace.length)) * 0.02;
    const start = performance.now();
    let fired = false;
    const tick = (now: number) => {
      const sim = (now - start) / 1000 / slow;
      setT(sim);
      if (sim < longest + 0.05) raf.current = requestAnimationFrame(tick);
      else if (!fired) {
        fired = true;
        done.current?.();
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // runKey starts a new race; lanes are fixed for that race.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  const W = 1000;
  const laneH = big ? 70 : 46;
  const H = lanes.length * laneH + 30;
  const pos = (trace: number[]) => {
    if (!runKey) return 0;
    const i = t / 0.02;
    const a = trace[Math.min(trace.length - 1, Math.floor(i))] ?? 0;
    const b = trace[Math.min(trace.length - 1, Math.floor(i) + 1)] ?? a;
    return a + (b - a) * (i - Math.floor(i));
  };
  const xOf = (m: number) => 60 + (m / TRACK_M) * (W - 190);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-[#2B2D30]" role="img" aria-label="Race track">
      {[0, 5, 10, 15, 20].map((m) => (
        <g key={m}>
          <line x1={xOf(m)} x2={xOf(m)} y1="18" y2={H - 4} stroke="#fff" strokeOpacity={m === 0 || m === 20 ? 0.9 : 0.15} strokeWidth={m === 20 ? 0 : 2} />
          <text x={xOf(m)} y="13" fill="#fff" fillOpacity="0.6" fontSize="11" textAnchor="middle">{m} m</text>
        </g>
      ))}
      {/* checkered finish */}
      {Array.from({ length: Math.ceil((H - 22) / 8) }).map((_, r) =>
        [0, 1].map((c) => <rect key={`${r}-${c}`} x={xOf(20) + c * 8 - 8} y={18 + r * 8} width="8" height="8" fill={(r + c) % 2 ? "#fff" : "#111"} />),
      )}
      {lanes.map((l, i) => {
        const y = 22 + i * laneH + laneH / 2;
        const x = xOf(pos(l.trace));
        const finished = runKey > 0 && t * 1000 >= l.timeMs && l.timeMs > 0;
        return (
          <g key={i}>
            <line x1={xOf(0)} x2={xOf(20)} y1={y} y2={y} stroke="#fff" strokeOpacity="0.35" strokeDasharray="2 6" />
            <text x="8" y={y + 4} fill="#fff" fontSize={big ? 18 : 13} fontWeight="700">{l.label}</text>
            <g transform={`translate(${x - 34},${y - 10})`}>
              <path d="M0,16 L0,9 L44,2 L44,16 Z" fill={l.color} />
              <rect x="36" y="6" width="12" height="6" rx="2" fill="#B8BCC2" />
              <circle cx="8" cy="17" r="4" fill="#111" />
              <circle cx="38" cy="17" r="4" fill="#111" />
              {runKey > 0 && t < 0.4 && <path d="M48,9 L62,6 L60,9 L62,12 Z" fill="#fff" fillOpacity={0.8 - t} />}
            </g>
            {finished && (
              <text x={W - 8} y={y + 5} fill="#F6C343" fontSize={big ? 20 : 14} fontWeight="700" textAnchor="end">
                {fmtTime(l.timeMs)}
              </text>
            )}
          </g>
        );
      })}
      <text x={W - 8} y={H - 6} fill="#fff" fillOpacity="0.5" fontSize="11" textAnchor="end">
        {runKey ? `${Math.min(t, 9.99).toFixed(2)} s` : "Ready"} {slow > 1 ? `(slow motion x${slow})` : ""}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The rules checklist
// ---------------------------------------------------------------------------

export function RulesList({ car, units }: { car: CarSpec; units: Units }) {
  const rules = checkRules(car);
  const broken = rules.filter((r) => !r.ok).length;
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">Rules check</h3>
        <span className={`text-sm font-semibold ${broken ? "text-trail-orange" : "text-ridge-green"}`}>
          {broken ? `${broken} to fix` : "Race legal"}
        </span>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {rules.map((r) => (
          <li key={r.id} className="flex items-start gap-2">
            <span aria-hidden className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full text-center text-[11px] font-bold leading-4 text-white ${r.ok ? "bg-ridge-green" : "bg-trail-orange"}`}>
              {r.ok ? "✓" : "!"}
            </span>
            <span className="flex-1">
              {r.label}
              {r.safety && <span className="ml-1 rounded bg-blaze-maroon/10 px-1 text-[10px] font-bold uppercase text-blaze-maroon">safety</span>}
              <span className="block text-xs text-ink/55">
                yours: {r.unit === "g" ? `${r.value} g` : fmtLen(r.value, units)} &middot; rule: {fmtRule(r, units)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Why it went that fast
// ---------------------------------------------------------------------------

export function ForceBars({ atTop }: { atTop: { push: number; air: number; rub: number } }) {
  const max = Math.max(atTop.push, atTop.air, atTop.rub, 0.01);
  const rows: Array<[string, number, string, string]> = [
    ["Cartridge push", atTop.push, "#2E4A3B", "Pushes you forward"],
    ["Air pushing back", atTop.air, "#CF4420", "Drag: shape and size"],
    ["Wheels rubbing", atTop.rub, "#630031", "Friction: mass, wheels, axles"],
  ];
  return (
    <div className="space-y-2">
      <p className="text-xs text-ink/60">At top speed the push and the pull-back are nearly even. That is why it stops speeding up.</p>
      {rows.map(([label, v, color, note]) => (
        <div key={label}>
          <div className="flex justify-between text-xs">
            <span className="font-medium">{label}</span>
            <span className="text-ink/55">{v.toFixed(2)} N &middot; {note}</span>
          </div>
          <div className="mt-1 h-2.5 rounded-full bg-ink/10">
            <div className="h-2.5 rounded-full" style={{ width: `${(v / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The class board
// ---------------------------------------------------------------------------

export interface BoardRow {
  initials: string;
  timeMs: number;
  car: CarSpec;
  mine: boolean;
}

export function Board({ rows, title, empty }: { rows: BoardRow[] | null; title: string; empty: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <h3 className="font-semibold">{title}</h3>
      {rows === null ? (
        <p className="mt-2 text-sm text-ink/60">The class board is not switched on here. Your times still work on this Chromebook.</p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-sm text-ink/60">{empty}</p>
      ) : (
        <ol className="mt-2 space-y-1 text-sm">
          {rows.map((r, i) => (
            <li key={i} className={`flex justify-between rounded px-2 py-1 ${r.mine ? "bg-trail-orange/10 font-semibold" : ""}`}>
              <span>
                <span className="inline-block w-6 text-ink/45">{i + 1}.</span>
                {r.initials} <span className="text-xs text-ink/45">{PROFILES[r.car.profile]?.label}</span>
              </span>
              <span className="tabular-nums">{fmtTime(r.timeMs)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
