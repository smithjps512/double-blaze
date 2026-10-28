"use client";

import { useEffect, useState } from "react";
import { POLL, type Tally } from "@/lib/launch/vote";

/**
 * The projector view: points per choice as big bars, live every 3 seconds.
 * Reasons are hidden until the teacher turns them on, because they are what
 * kids typed and the room reads them as they appear. No em dashes in any copy.
 */

interface Reason {
  first: string;
  why: string;
  team: string;
}

export default function Results() {
  const [tally, setTally] = useState<Tally | null>(null);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/launch/vote?poll=${POLL.id}${show ? "&reasons=1" : ""}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) return setError(data.error ?? "Could not load the results.");
        setError(null);
        setTally(data.tally);
        setReasons(data.reasons ?? []);
      } catch {
        if (alive) setError("Could not reach the server.");
      }
    }
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [show]);

  const max = Math.max(1, ...(tally?.results.map((r) => r.points) ?? [1]));
  const optionsById = Object.fromEntries(POLL.options.map((o) => [o.id, o]));

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="container-page py-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Live results</p>
            <h1 className="mt-1 text-3xl font-bold md:text-5xl">{POLL.question}</h1>
            <p className="mt-2 text-white/70">
              Vote at <span className="font-mono font-semibold text-white">doubleblaze.solutions/vote</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold">{tally?.voters ?? 0}</p>
            <p className="text-white/60">{tally?.voters === 1 ? "vote" : "votes"} so far</p>
          </div>
        </div>

        {error && <p className="mt-6 rounded-xl bg-white/10 px-4 py-3 text-white/80">{error}</p>}

        <div className="mt-10 space-y-6">
          {(tally?.results ?? POLL.options.map((o) => ({ id: o.id, label: o.label, emoji: o.emoji, points: 0, firsts: 0 }))).map((r) => {
            const lead = tally?.leader === r.id;
            return (
              <div key={r.id} className={`rounded-2xl p-5 transition ${lead ? "bg-trail-orange/20 ring-2 ring-trail-orange" : "bg-white/5"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="text-2xl font-bold md:text-3xl">
                    <span aria-hidden>{r.emoji}</span> {r.label}
                    {lead && <span className="ml-3 rounded-full bg-trail-orange px-3 py-1 align-middle text-sm font-semibold uppercase tracking-wide">Winning right now</span>}
                  </p>
                  <p className="text-white/70">
                    <span className="text-2xl font-bold text-white">{r.points}</span> points &middot; {r.firsts} first {r.firsts === 1 ? "choice" : "choices"}
                  </p>
                </div>
                <div className="mt-3 h-6 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full transition-all duration-700 ${lead ? "bg-trail-orange" : "bg-white/60"}`} style={{ width: `${(r.points / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-white/50">A #1 is worth 3 points, a #2 is worth 2, a #3 is worth 1. So everyone&rsquo;s whole ranking counts.</p>

        <div className="mt-10">
          <button onClick={() => setShow((s) => !s)} className="rounded-full border border-white/30 px-5 py-2 font-semibold hover:bg-white/10">
            {show ? "Hide reasons" : "Show reasons"}
          </button>
          {show && (
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {POLL.options.map((o) => {
                const list = reasons.filter((r) => r.first === o.id);
                return (
                  <div key={o.id} className="rounded-2xl bg-white/5 p-5">
                    <p className="font-bold">
                      {o.emoji} {o.label} as #1 ({list.length})
                    </p>
                    <ul className="mt-3 space-y-2 text-sm">
                      {list.length === 0 && <li className="text-white/50">No reasons yet.</li>}
                      {list.map((r, i) => (
                        <li key={i} className="rounded-lg bg-white/5 px-3 py-2">
                          &ldquo;{r.why}&rdquo; <span className="text-white/40">{r.team}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {reasons.some((r) => !optionsById[r.first]) && <p className="text-sm text-white/50">Some reasons are for choices no longer on the ballot.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
