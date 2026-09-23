"use client";

import { useState } from "react";
import type { CityAnswer, BoardRow } from "@/lib/smart-cities-db";

type Cities = Record<string, { name: string; questions: string[] }>;

async function decide(body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch("/api/smart-cities/decide", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data.ok ? null : (data.error ?? "Could not save.");
  } catch {
    return "Could not reach the server.";
  }
}

/** Answers waiting for approval, and the ones already showing. */
export function SmartCityAnswers({
  pending,
  approved,
  cities,
}: {
  pending: CityAnswer[];
  approved: CityAnswer[];
  cities: Cities;
}) {
  const [waiting, setWaiting] = useState(pending);
  const [live, setLive] = useState(approved);
  const [error, setError] = useState<string | null>(null);

  async function act(answer: CityAnswer, decision: "approved" | "rejected" | "pending") {
    setError(null);
    const err = await decide({ action: "answer", id: answer.id, decision });
    if (err) return setError(err);
    setWaiting((list) => list.filter((a) => a.id !== answer.id));
    setLive((list) => list.filter((a) => a.id !== answer.id));
    if (decision === "approved") setLive((list) => [...list, { ...answer, status: "approved" }]);
    if (decision === "pending") setWaiting((list) => [...list, { ...answer, status: "pending" }]);
  }

  return (
    <>
      {error && <p className="mt-4 text-sm text-trail-orange">{error}</p>}
      <h2 className="mt-10 font-display text-xl font-bold text-ink">
        Waiting on you{waiting.length > 0 ? ` (${waiting.length})` : ""}
      </h2>
      {waiting.length === 0 ? (
        <p className="mt-2 text-sm text-ink/60">No answers waiting.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {waiting.map((a) => (
            <AnswerCard key={a.id} answer={a} cities={cities}>
              <button className="btn-primary text-sm" onClick={() => act(a, "approved")}>
                Show on the city
              </button>
              <button
                className="rounded-md border border-ink/20 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
                onClick={() => act(a, "rejected")}
              >
                Don&rsquo;t show
              </button>
            </AnswerCard>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-display text-xl font-bold text-ink">Showing on the cities ({live.length})</h2>
      {live.length === 0 ? (
        <p className="mt-2 text-sm text-ink/60">Nothing approved yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {live.map((a) => (
            <AnswerCard key={a.id} answer={a} cities={cities}>
              <button className="text-sm text-ink/60 underline" onClick={() => act(a, "pending")}>
                Take it down
              </button>
            </AnswerCard>
          ))}
        </ul>
      )}
    </>
  );
}

function AnswerCard({ answer, cities, children }: { answer: CityAnswer; cities: Cities; children: React.ReactNode }) {
  const city = cities[answer.citySlug];
  return (
    <li className="rounded-xl border border-ink/10 bg-white p-5">
      <p className="text-sm font-semibold text-ink">
        {city?.name ?? answer.citySlug}
        <span className="ml-2 font-normal text-ink/50">
          {answer.writer === "designer" ? "from the designer" : "from a classmate"} ·{" "}
          {new Date(answer.createdAt).toLocaleString()}
        </span>
      </p>
      <p className="mt-1 text-sm text-ink/60">{city?.questions[answer.questionIndex] ?? `Question ${answer.questionIndex + 1}`}</p>
      {answer.flagged && (
        <p className="mt-2 rounded-md bg-trail-orange/10 px-3 py-2 text-sm text-ink/80">
          <strong>Flagged:</strong> {answer.flagReason}
        </p>
      )}
      <p className="mt-3 whitespace-pre-wrap text-ink">{answer.answer}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>
    </li>
  );
}

interface Board {
  city: string;
  cityName: string;
  mode: string;
  modeLabel: string;
  rows: BoardRow[];
}

/** Every leaderboard, with remove and clear. */
export function SmartCityBoards({ boards }: { boards: Board[] }) {
  const [state, setState] = useState(boards);
  const [armed, setArmed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(b: Board, initials: string) {
    const err = await decide({ action: "remove", city: b.city, mode: b.mode, initials });
    if (err) return setError(err);
    setState((all) => all.map((x) => (x === b ? { ...x, rows: x.rows.filter((r) => r.initials !== initials) } : x)));
  }

  async function clear(b: Board) {
    setArmed(null);
    const err = await decide({ action: "clear", city: b.city, mode: b.mode });
    if (err) return setError(err);
    setState((all) => all.map((x) => (x === b ? { ...x, rows: [] } : x)));
  }

  return (
    <>
      {error && <p className="mt-4 text-sm text-trail-orange">{error}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {state.map((b) => {
          const key = `${b.city}:${b.mode}`;
          return (
            <div key={key} className="rounded-xl border border-ink/10 bg-white p-5">
              <p className="text-sm font-semibold text-ink">{b.cityName}</p>
              <p className="text-sm text-ink/60">{b.modeLabel}</p>
              {b.rows.length === 0 ? (
                <p className="mt-3 text-sm text-ink/50">No scores yet.</p>
              ) : (
                <ol className="mt-3 grid gap-1 text-sm">
                  {b.rows.map((r, i) => (
                    <li key={`${r.initials}-${i}`} className="flex items-center justify-between">
                      <span>
                        {i + 1}. <strong>{r.initials}</strong> {r.score}
                      </span>
                      <button className="text-xs text-ink/50 underline" onClick={() => remove(b, r.initials)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              {b.rows.length > 0 &&
                (armed === key ? (
                  <div className="mt-3 flex gap-3">
                    <button className="rounded-md bg-trail-orange px-3 py-1.5 text-sm font-medium text-white" onClick={() => clear(b)}>
                      Yes, clear it
                    </button>
                    <button className="text-sm text-ink/60 underline" onClick={() => setArmed(null)}>
                      Never mind
                    </button>
                  </div>
                ) : (
                  <button className="mt-3 text-sm text-ink/60 underline" onClick={() => setArmed(key)}>
                    Clear this board
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
