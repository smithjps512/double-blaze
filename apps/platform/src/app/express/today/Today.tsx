"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Today's games. For the substitute it is the completion list: one row per
 * Chromebook, with initials and studio, to match against the roster. For
 * students it is the arcade of everyone else's games. Refreshes itself.
 * No em dashes in any copy here.
 */

interface Game {
  slug: string;
  initials: string;
  studio: string;
  title: string;
  genre: string;
  heroEmoji: string;
  builtBy: string;
  builds: number;
  createdAt: string;
}

const GENRE: Record<string, string> = { platformer: "Platformer", topdown: "Top-down quest", dodge: "Sky dodge" };

export default function Today() {
  const [period, setPeriod] = useState(3);
  const [games, setGames] = useState<Game[] | null>(null);
  const [off, setOff] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/express/today?period=${period}`, { cache: "no-store" });
      if (!res.ok) return setOff(true);
      setOff(false);
      setGames((await res.json()).games);
      setUpdated(new Date());
    } catch {
      setOff(true);
    }
  }, [period]);

  useEffect(() => {
    setGames(null);
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="bg-stone-white">
      <div className="container-page py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Studio Express</p>
            <h1 className="text-3xl font-bold">Today&rsquo;s games</h1>
            <p className="mt-1 text-ink/70">Every game built today. Play a classmate&rsquo;s game, or find your own.</p>
          </div>
          <label className="text-sm">
            <span className="block font-semibold">Period</span>
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="mt-1 rounded-lg border border-ink/20 bg-white px-3 py-2">
              {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-ink/10 bg-white p-4 text-sm">
          <b>For the substitute:</b> each row is one student&rsquo;s finished game. Match the initials to your roster for the completion grade. This list updates by itself.
          {games && <span className="ml-1 font-semibold text-blaze-maroon">{games.length} games so far.</span>}
          {updated && <span className="ml-1 text-ink/50">Updated {updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.</span>}
        </div>

        {off ? (
          <p className="mt-6 text-ink/70">The games list is not available right now. Students can show you their game on their screen instead.</p>
        ) : !games ? (
          <p className="mt-6 text-ink/60">Loading...</p>
        ) : games.length === 0 ? (
          <p className="mt-6 text-ink/60">No games yet today. They will appear here as students press Build.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/15 text-xs uppercase tracking-wide text-ink/50">
                  <th className="py-2 pr-3">Initials</th>
                  <th className="py-2 pr-3">Studio</th>
                  <th className="py-2 pr-3">Game</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Finished</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.slug} className="border-b border-ink/10">
                    <td className="py-3 pr-3 font-mono text-lg font-bold">{g.initials}</td>
                    <td className="py-3 pr-3">{g.studio}</td>
                    <td className="py-3 pr-3 font-semibold">
                      {g.heroEmoji} {g.title}
                    </td>
                    <td className="py-3 pr-3 text-sm text-ink/70">{GENRE[g.genre] ?? g.genre}</td>
                    <td className="py-3 pr-3 text-sm text-ink/70">
                      {new Date(g.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      {g.builds > 1 ? ` (built ${g.builds} times)` : ""}
                    </td>
                    <td className="py-3">
                      <a href={`/express/play/${g.slug}`} target="_blank" rel="noopener" className="btn-primary px-4 py-1.5 text-sm">
                        ▶ Play
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
