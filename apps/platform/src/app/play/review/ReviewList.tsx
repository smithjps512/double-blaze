"use client";

import { useState } from "react";
import { formFor, type QaKind, type QaStatus } from "@/lib/launch/qa";

interface Report {
  id: string;
  app: string;
  kind: QaKind;
  answers: Record<string, string>;
  period: number;
  teamName: string;
  status: QaStatus;
  createdAt: string;
}

const KIND: Record<QaKind, string> = { bug: "🐞 Bug", confusing: "🤔 Confusing", idea: "💡 Idea", love: "⭐ Love it" };

/** Approve or hide, one tap each, with pending first and the rest underneath. */
export default function ReviewList({ token, reports, names }: { token: string; reports: Report[]; names: Record<string, string> }) {
  const [list, setList] = useState(reports);
  const [app, setApp] = useState("all");
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, status: QaStatus) {
    setError(null);
    const res = await fetch("/api/launch/qa/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, id, status }) }).catch(() => null);
    if (!res?.ok) return setError((await res?.json().catch(() => null))?.error ?? "Could not save that.");
    setList((l) => l.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const shown = list.filter((r) => app === "all" || r.app === app);
  const apps = Array.from(new Set(list.map((r) => r.app)));
  const groups: Array<[QaStatus, string]> = [["pending", "Waiting on you"], ["approved", "Approved: teams can see these"], ["hidden", "Hidden"]];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {["all", ...apps].map((a) => (
          <button key={a} onClick={() => setApp(a)} className={`rounded-full px-3 py-1.5 text-sm ${app === a ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}>
            {a === "all" ? `All apps (${list.length})` : `${names[a] ?? a} (${list.filter((r) => r.app === a).length})`}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm font-medium text-blaze-maroon">{error}</p>}
      {groups.map(([status, title]) => {
        const items = shown.filter((r) => r.status === status);
        return (
          <div key={status} className="mt-8">
            <h2 className="text-lg font-bold">
              {title} ({items.length})
            </h2>
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-ink/50">None.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {items.map((r) => (
                  <li key={r.id} className="rounded-xl border border-ink/10 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        {KIND[r.kind]} &middot; {names[r.app] ?? r.app}
                      </p>
                      <p className="text-xs text-ink/50">
                        from {r.teamName}, period {r.period} &middot; {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      {formFor(r.kind).questions
                        .filter((q) => r.answers[q.key])
                        .map((q) => (
                          <p key={q.key}>
                            <span className="text-ink/50">{q.label}</span> {r.answers[q.key]}
                          </p>
                        ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {status !== "approved" && (
                        <button onClick={() => decide(r.id, "approved")} className="btn-primary px-4 py-1.5 text-sm">
                          Approve
                        </button>
                      )}
                      {status !== "hidden" && (
                        <button onClick={() => decide(r.id, "hidden")} className="rounded-md border border-ink/20 bg-white px-4 py-1.5 text-sm">
                          Hide
                        </button>
                      )}
                      {status !== "pending" && (
                        <button onClick={() => decide(r.id, "pending")} className="text-sm text-ink/50 underline">
                          Undo
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
