"use client";

import { useState } from "react";

/**
 * The approve and reject controls.
 *
 * The proposed text is editable before approving, because the common case with
 * a first attempt from a twelve year old is that the idea is right and the
 * sentence needs a nudge. Rewriting it here beats rejecting it and asking them
 * to try again, which mostly teaches them not to bother.
 */
export interface QueueItem {
  id: string;
  label: string;
  story_heading: string;
  original_text: string;
  proposed_text: string;
  reason: string | null;
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

export function TrailCrewQueue({ items }: { items: QueueItem[] }) {
  const [done, setDone] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function decide(id: string, decision: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await fetch("/api/trail-crew/decide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, decision, text: drafts[id] }),
      });
      const data = await res.json();
      setDone((d) => ({
        ...d,
        [id]: data.ok ? (data.status === "approved" ? "Approved and committed." : "Rejected.") : data.error,
      }));
    } catch {
      setDone((d) => ({ ...d, [id]: "Could not reach the server." }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="mt-4 space-y-6">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-ink/10 bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-blaze-maroon">{item.label}</h3>
            <span className="text-xs text-hokie-gray">
              {new Date(item.created_at).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-hokie-gray">
            Story: <span className="font-medium text-ink">{item.story_heading}</span>
          </p>

          {item.flagged && (
            <p className="mt-3 rounded-md border border-trail-orange/40 bg-trail-orange/5 px-3 py-2 text-sm text-ink/80">
              <strong>Flagged:</strong> {item.flag_reason}
              <br />
              <span className="text-ink/60">
                Screening only tags. Read it and decide yourself.
              </span>
            </p>
          )}

          {item.reason && (
            <p className="mt-4 text-sm text-ink/80">
              <span className="font-medium">Their reason:</span> {item.reason}
            </p>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-hokie-gray">Now</p>
              <pre className="mt-1 whitespace-pre-wrap rounded-md bg-ink/5 p-3 text-sm">
                {item.original_text || "(empty)"}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-hokie-gray">
                Proposed (you can edit before approving)
              </p>
              <textarea
                className="mt-1 w-full rounded-md border border-ink/15 p-3 text-sm"
                rows={7}
                value={drafts[item.id] ?? item.proposed_text}
                onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
              />
            </div>
          </div>

          {done[item.id] ? (
            <p className="mt-4 text-sm font-medium text-ridge-green">{done[item.id]}</p>
          ) : (
            <div className="mt-4 flex gap-3">
              <button
                className="btn-primary"
                disabled={busy === item.id}
                onClick={() => decide(item.id, "approve")}
              >
                {busy === item.id ? "Working..." : "Approve and commit"}
              </button>
              <button
                className="rounded-md border border-ink/20 px-5 py-2.5 font-medium text-ink/70 hover:bg-ink/5"
                disabled={busy === item.id}
                onClick={() => decide(item.id, "reject")}
              >
                Reject
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
