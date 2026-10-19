"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LIBRARY, type LibraryCar } from "@/lib/dragster/library";
import { checkRules } from "@/lib/dragster/sim";
import { playerKey } from "./parts";

/**
 * The Car Library: every class blueprint as a numbered car.
 *
 * Any class can drive any car, but inside one period a car belongs to one
 * Chromebook, so nobody in a class races the same blueprint as a classmate.
 * Students with their own blueprint find it by its drawing; cars drawn in
 * their own period are listed first. No student names, only numbers.
 * No em dashes in any copy here.
 */

type Claims = { taken: number[]; mine: number | null };

/**
 * The real blueprint outline: side view above, top view below. Drawn nose on
 * the left and tail (the CO2 end) on the right, the same way round as the
 * twin drawing, so a student can compare the two at a glance. The outline
 * data measures x from the back, so it is flipped here.
 */
export function BlueprintOutline({ car, className }: { car: LibraryCar; className?: string }) {
  const S = 20;
  const sy = 3.0 * S + 2;
  const ty = 4.9 * S;
  const X = (x: number) => 2 + (12 - x) * S;
  const side = car.outline.side.map(([x, y]) => `${X(x).toFixed(1)},${(sy - y * S).toFixed(1)}`).join(" ");
  const top = car.outline.top;
  const topPts = top.length
    ? [...top.map(([x, w]) => `${X(x).toFixed(1)},${(ty - w * S).toFixed(1)}`), ...[...top].reverse().map(([x, w]) => `${X(x).toFixed(1)},${(ty + w * S).toFixed(1)}`)].join(" ")
    : "";
  return (
    <svg viewBox={`0 0 ${12 * S + 4} ${6 * S}`} className={className} role="img" aria-label={`Drawing of car ${car.no}`}>
      <rect x={2} y={sy - 2.75 * S} width={12 * S} height={2.75 * S} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="3 3" />
      <rect x={2} y={ty - 0.875 * S} width={12 * S} height={1.75 * S} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="3 3" />
      <polygon points={side} fill="#E8D3B0" stroke="#7A5B33" strokeWidth="1.2" strokeLinejoin="round" />
      {topPts && <polygon points={topPts} fill="#E8D3B0" stroke="#7A5B33" strokeWidth="1.2" strokeLinejoin="round" />}
      {car.outline.axles.map(([x, r], i) => (
        <g key={i}>
          <circle cx={X(x)} cy={sy} r={Math.min(r, 0.6) * S} fill="#1C1A19" />
          <line x1={X(x)} x2={X(x)} y1={ty - 1.05 * S} y2={ty + 1.05 * S} stroke="#CF4420" strokeWidth="1" strokeDasharray="3 2" />
        </g>
      ))}
    </svg>
  );
}

export function carLabel(car: LibraryCar) {
  return car.nickname ? `Car #${car.no}, ${car.nickname}` : `Car #${car.no}`;
}

export default function CarLibrary({
  period,
  initials,
  currentNo,
  onPick,
}: {
  period: number | null;
  initials: string;
  currentNo: number | null;
  onPick: (car: LibraryCar) => void;
}) {
  const [claims, setClaims] = useState<Claims | null>({ taken: [], mine: null });
  const [online, setOnline] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const ready = !!period && /^[A-Za-z]{2,3}$/.test(initials);

  const refresh = useCallback(async () => {
    if (!period) return;
    try {
      const res = await fetch(`/api/dragster/claims?period=${period}&player=${playerKey()}`, { cache: "no-store" });
      if (!res.ok) {
        setOnline(false);
        return;
      }
      setOnline(true);
      setClaims(await res.json());
    } catch {
      setOnline(false);
    }
  }, [period]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const cars = useMemo(() => {
    const own = LIBRARY.filter((c) => c.homePeriod === period);
    const rest = LIBRARY.filter((c) => c.homePeriod !== period);
    return scope === "mine" && own.length ? own : [...own, ...rest];
  }, [period, scope]);

  async function pick(car: LibraryCar) {
    if (!ready) return;
    setMsg(null);
    if (!online) {
      onPick(car);
      setMsg(`You are driving ${carLabel(car)}. The class list is not switched on here, so check nobody else picked it.`);
      return;
    }
    setBusy(car.no);
    try {
      const res = await fetch("/api/dragster/claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ period, car: car.no, initials, player: playerKey() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.taken) setClaims({ taken: data.taken, mine: data.mine ?? null });
      if (res.ok) {
        onPick(car);
        setMsg(`You are driving ${carLabel(car)}. Its blueprint numbers are loaded below.`);
      } else if (res.status === 503) {
        setOnline(false);
        onPick(car);
        setMsg(`You are driving ${carLabel(car)}.`);
      } else {
        setMsg(data.error ?? "Could not pick that car.");
      }
    } catch {
      setMsg("Could not reach the class list. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const ownCount = LIBRARY.filter((c) => c.homePeriod === period).length;
  const mine = claims?.mine ?? currentNo;

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Pick your car</h2>
          <p className="max-w-2xl text-sm text-ink/60">
            Every class blueprint is here. If you drew one, find yours by its picture. If not, pick any open car. Each car can be picked once per class.
          </p>
        </div>
        {period && ownCount > 0 && (
          <div className="flex overflow-hidden rounded-full border border-ink/15 text-sm">
            <button onClick={() => setScope("mine")} className={`px-3 py-1 ${scope === "mine" ? "bg-ink text-white" : "bg-white"}`}>
              Period {period} cars ({ownCount})
            </button>
            <button onClick={() => setScope("all")} className={`px-3 py-1 ${scope === "all" ? "bg-ink text-white" : "bg-white"}`}>
              All cars ({LIBRARY.length})
            </button>
          </div>
        )}
      </div>

      {!ready && (
        <p className="mt-3 rounded-lg bg-trail-orange/10 p-3 text-sm font-semibold text-impact-orange">
          Pick your period and type your initials at the top first. Then choose a car.
        </p>
      )}
      {msg && <p className="mt-3 rounded-lg bg-ridge-green/10 p-3 text-sm text-ridge-green">{msg}</p>}

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cars.map((car) => {
          const taken = claims?.taken.includes(car.no) ?? false;
          const isMine = mine === car.no;
          const fixes = checkRules(car.spec).filter((r) => !r.ok).length;
          return (
            <li key={car.no}>
              <button
                disabled={!ready || taken || busy !== null}
                onClick={() => pick(car)}
                aria-pressed={isMine}
                className={`flex h-full w-full flex-col gap-1.5 rounded-xl border p-2.5 text-left transition disabled:cursor-not-allowed ${
                  isMine ? "border-ridge-green bg-ridge-green/10" : taken ? "border-ink/10 bg-ink/5 opacity-50" : "border-ink/10 hover:border-trail-orange"
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">#{car.no}</span>
                  <span className="text-[11px] font-semibold uppercase text-ink/50">
                    {isMine ? "Yours" : taken ? "Taken" : busy === car.no ? "Saving" : car.homePeriod ? `Drawn in ${car.homePeriod}${["", "st", "nd", "rd"][car.homePeriod] ?? "th"}` : ""}
                  </span>
                </span>
                <BlueprintOutline car={car} className="w-full text-ink" />
                <span className="text-xs text-ink/60">
                  {car.nickname ?? " "}
                  {fixes > 0 && <span className="ml-1 text-impact-orange">· {fixes} rule{fixes > 1 ? "s" : ""} to fix</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!online && period && <p className="mt-3 text-xs text-ink/50">The class list is not switched on here, so cars are not locked to one student.</p>}
    </section>
  );
}
