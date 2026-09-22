"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CardTestingView } from "@/lib/trail-crew-testing-shape";

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
  /** What testing found on this card, or null when nobody has tested it. */
  testing: CardTestingView | null;
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

const VERDICT_STYLE: Record<CardTestingView["verdict"], string> = {
  untested: "border-ink/15 bg-white text-ink/50",
  passing: "border-ridge-green/50 bg-ridge-green/10 text-ridge-green",
  failing: "border-trail-orange/60 bg-trail-orange/10 text-trail-orange",
};

const VERDICT_LABEL: Record<CardTestingView["verdict"], string> = {
  untested: "Not tested yet",
  passing: "Tested: passing",
  failing: "Tested: failing",
};

/**
 * What a tester found, under the ticks.
 *
 * The ticks are the team's promise that a line is true. A test is somebody
 * else checking. When the two disagree the card says so in orange and names
 * the bug, and the way to clear it is on the test page: run the steps again
 * and have it pass. A card is not done while a tester says it is not.
 */
function TestingStrip({ team, testing }: { team: string; testing: CardTestingView | null }) {
  if (!testing || (testing.passes === 0 && testing.fails === 0 && testing.openBugs.length === 0 && testing.fixedBugs.length === 0)) {
    return null;
  }
  return (
    <div className="mt-4 border-t border-ink/10 pt-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${VERDICT_STYLE[testing.verdict]}`}>
          {VERDICT_LABEL[testing.verdict]}
        </span>
        <span className="text-xs text-hokie-gray">
          {testing.passes} pass, {testing.fails} fail
          {testing.fixedBugs.length > 0 && `, ${testing.fixedBugs.length} fixed`}
        </span>
      </div>
      {testing.openBugs.length > 0 && (
        <ul className="mt-2 space-y-1">
          {testing.openBugs.map((b) => (
            <li key={b.id} className="flex items-start gap-2 text-ink/80">
              <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-trail-orange" aria-hidden />
              <span>
                {b.title}
                {b.severity && <span className="text-hokie-gray"> (how bad: {b.severity})</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {testing.openBugs.length > 0 && (
        <p className="mt-2 text-xs text-hokie-gray">
          Fix it, then{" "}
          <Link href={`/trail-crew/${team}/test`} className="underline">
            re-test it on the test page
          </Link>
          . A bug leaves the card only when its steps are run again and pass.
        </p>
      )}
    </div>
  );
}

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

            {card.state === "done" && card.testing?.verdict === "failing" && (
              <p className="mt-2 rounded-md border border-trail-orange/40 bg-trail-orange/5 px-3 py-1.5 text-xs text-ink/80">
                Marked done, but a tester says it is not. It reads as failing until the bug below is re-tested and passes.
              </p>
            )}

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

            <TestingStrip team={team} testing={card.testing} />
          </li>
        ))}
      </ol>
    </div>
  );
}
