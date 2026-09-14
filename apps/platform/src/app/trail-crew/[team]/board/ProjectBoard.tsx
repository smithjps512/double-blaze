"use client";

import { useEffect, useState } from "react";

/**
 * The board itself.
 *
 * Optimistic: a tick shows the moment it is clicked and is put back if the
 * server refuses it, because a checkbox that takes a second to respond gets
 * clicked twice. The whole board is re-read from the server's answer after
 * every write, and every half minute, so two teammates on two Chromebooks see
 * each other's ticks without anybody refreshing.
 */
export interface BoardCard {
  slug: string;
  number: number;
  title: string;
  story: string | null;
  buildIt: string | null;
  criteria: string[];
  done: boolean[];
  state: "not_started" | "building" | "done";
}

export interface BoardState {
  doneCards: number;
  totalCards: number;
  doneCriteria: number;
  totalCriteria: number;
  cards: BoardCard[];
}

const STATE_LABEL: Record<BoardCard["state"], string> = {
  not_started: "Not started",
  building: "Building",
  done: "Done",
};

const STATE_STYLE: Record<BoardCard["state"], string> = {
  not_started: "border-ink/20 bg-white text-ink/60",
  building: "border-trail-orange/50 bg-trail-orange/10 text-trail-orange",
  done: "border-ridge-green/50 bg-ridge-green/10 text-ridge-green",
};

export function ProjectBoard({ team, initial }: { team: string; initial: BoardState }) {
  const [board, setBoard] = useState<BoardState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/trail-crew/progress?team=${encodeURIComponent(team)}`, { cache: "no-store" });
        if (res.ok) setBoard(await res.json());
      } catch {
        // A missed refresh is nothing. The next one is in thirty seconds.
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [team]);

  async function write(payload: Record<string, unknown>, optimistic: (b: BoardState) => BoardState) {
    const before = board;
    setBoard(optimistic(board));
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/trail-crew/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ team, ...payload }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setBoard(before);
        setError(data.error ?? "Could not save that.");
      } else {
        setBoard(data);
      }
    } catch {
      setBoard(before);
      setError("Could not reach the server. Check you are online.");
    } finally {
      setBusy(false);
    }
  }

  function tick(card: BoardCard, index: number, done: boolean) {
    void write({ card: card.slug, criterion: card.criteria[index], done }, (b) => ({
      ...b,
      cards: b.cards.map((c) =>
        c.slug === card.slug ? { ...c, done: c.done.map((d, i) => (i === index ? done : d)) } : c,
      ),
    }));
  }

  function setState(card: BoardCard, state: BoardCard["state"]) {
    void write({ card: card.slug, state }, (b) => ({
      ...b,
      cards: b.cards.map((c) => (c.slug === card.slug ? { ...c, state } : c)),
    }));
  }

  const pct = board.totalCriteria > 0 ? Math.round((board.doneCriteria / board.totalCriteria) * 100) : 0;

  return (
    <div>
      <div className="max-w-2xl">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-ink">
            {board.doneCards} of {board.totalCards} cards done
          </span>
          <span className="text-hokie-gray">
            {board.doneCriteria} of {board.totalCriteria} lines ticked
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-ridge-green transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {error && (
        <p className="mt-4 max-w-2xl rounded-md border border-trail-orange/40 bg-trail-orange/5 px-4 py-2 text-sm text-ink/80">
          {error}
        </p>
      )}

      <ol className="mt-8 grid gap-5 md:grid-cols-2">
        {board.cards.map((card) => (
          <li key={card.slug} className="flex flex-col rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-blaze-maroon">
                <span className="text-hokie-gray">Card {card.number}:</span> {card.title}
              </h2>
              <div className="flex gap-1" role="radiogroup" aria-label={`Status of card ${card.number}`}>
                {(["not_started", "building", "done"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={card.state === s}
                    disabled={busy}
                    onClick={() => setState(card, s)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      card.state === s ? STATE_STYLE[s] : "border-ink/10 bg-white text-ink/40 hover:text-ink/70"
                    }`}
                  >
                    {STATE_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            {card.story && <p className="mt-2 text-sm leading-relaxed text-ink/75">{card.story}</p>}

            <ul className="mt-4 space-y-2">
              {card.criteria.map((criterion, i) => (
                <li key={criterion}>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-ridge-green"
                      checked={card.done[i] ?? false}
                      disabled={busy}
                      onChange={(e) => tick(card, i, e.target.checked)}
                    />
                    <span className={card.done[i] ? "text-ink/50 line-through" : "text-ink"}>{criterion}</span>
                  </label>
                </li>
              ))}
              {card.criteria.length === 0 && (
                <li className="text-sm text-ink/60">
                  This card has no finish line yet. Add acceptance criteria to its story and the boxes appear.
                </li>
              )}
            </ul>

            {card.buildIt && (
              <p className="mt-4 border-t border-ink/10 pt-3 text-xs text-hokie-gray">
                <span className="font-semibold">Build it:</span> {card.buildIt}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
