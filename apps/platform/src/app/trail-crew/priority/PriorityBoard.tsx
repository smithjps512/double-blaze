"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * The rows of the priority board, and the teacher's one control.
 *
 * Everybody sees the order and the reason for it. Staff see three buttons per
 * row (now, next, later) and a way to clear them. Moving a bug reloads the
 * order from the server, because the rule decides what the move did to the
 * other rows and the page should not guess.
 */
export interface PriorityRowView {
  rank: number;
  id: string;
  teamSlug: string;
  productName: string;
  cardNumber: number | null;
  cardTitle: string | null;
  title: string;
  steps: string | null;
  severity: 1 | 2 | 3 | null;
  teacherPriority: "now" | "next" | "later" | null;
  stillHappened: number;
  reportedAt: string;
  why: string;
}

const SEVERITY_STYLE: Record<"1" | "2" | "3" | "none", string> = {
  "3": "border-trail-orange/60 bg-trail-orange/10 text-trail-orange",
  "2": "border-blaze-maroon/40 bg-blaze-maroon/5 text-blaze-maroon",
  "1": "border-ink/20 bg-white text-ink/70",
  none: "border-ink/10 bg-white text-ink/40",
};

const PRIORITY_LABEL: Record<"now" | "next" | "later", string> = { now: "Now", next: "Next", later: "Later" };

export function PriorityBoard({ staff, rows: initial }: { staff: boolean; rows: PriorityRowView[] }) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function move(row: PriorityRowView, priority: "now" | "next" | "later" | null) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/trail-crew/test/priority", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ team: row.teamSlug, bug: row.id, priority }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Could not move that.");
      } else {
        // The rule decides the new order, so read it back rather than guess.
        window.location.reload();
        return;
      }
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
    setRows(rows);
  }

  return (
    <div className="max-w-3xl">
      {error && <p className="mb-4 rounded-md border border-trail-orange/40 bg-trail-orange/5 px-4 py-2 text-sm text-ink/80">{error}</p>}
      <ol className="space-y-4">
        {rows.map((row) => (
          <li key={row.id} className="flex gap-4 rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
            <div className="w-8 shrink-0 text-right font-display text-2xl font-bold text-hokie-gray">{row.rank}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link href={`/trail-crew/${row.teamSlug}/board`} className="font-semibold text-blaze-maroon underline underline-offset-2 hover:text-trail-orange">
                  {row.productName}
                </Link>
                {row.cardNumber !== null && (
                  <span className="text-hokie-gray">
                    Card {row.cardNumber}: {row.cardTitle}
                  </span>
                )}
                <span className={`rounded-full border px-2 py-0.5 font-medium ${SEVERITY_STYLE[row.severity ? (String(row.severity) as "1" | "2" | "3") : "none"]}`}>
                  {row.severity ? `How bad: ${row.severity}` : "How bad: not said"}
                </span>
                {row.teacherPriority && (
                  <span className="rounded-full border border-ridge-green/50 bg-ridge-green/10 px-2 py-0.5 font-medium text-ridge-green">
                    Teacher: {PRIORITY_LABEL[row.teacherPriority]}
                  </span>
                )}
              </div>
              <p className="mt-2 text-ink">{row.title}</p>
              {row.steps && <p className="mt-1 text-sm text-ink/70">To make it happen: {row.steps}</p>}
              <p className="mt-2 text-xs text-hokie-gray">Why it is here: {row.why}</p>
              <p className="mt-2 text-xs">
                <Link href={`/trail-crew/${row.teamSlug}/test`} className="text-blaze-maroon underline underline-offset-2 hover:text-trail-orange">
                  Re-test it
                </Link>
              </p>
              {staff && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-ink/10 pt-3">
                  <span className="mr-1 text-xs text-hokie-gray">Move:</span>
                  {(["now", "next", "later"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      disabled={busy || row.teacherPriority === p}
                      onClick={() => move(row, p)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                        row.teacherPriority === p ? "border-ridge-green/50 bg-ridge-green/10 text-ridge-green" : "border-ink/15 text-ink/70 hover:bg-ink/5"
                      }`}
                    >
                      {PRIORITY_LABEL[p]}
                    </button>
                  ))}
                  {row.teacherPriority && (
                    <button type="button" disabled={busy} onClick={() => move(row, null)} className="text-xs text-ink/60 underline">
                      Let the rule decide
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
