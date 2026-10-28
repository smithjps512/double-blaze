"use client";

import { useEffect, useState } from "react";
import { checkTeamName } from "@/lib/launch/plan";
import { POLL } from "@/lib/launch/vote";

/**
 * The ballot. Tap the cards in order, 1 then 2 then 3, so ranking is the
 * whole interaction and there is nothing to drag. Who is voting is the same
 * period and team as Launch Pad and /play, from the same Chromebook storage.
 * The Chromebook keeps a random voter key, so voting again replaces the old
 * vote instead of adding one. No em dashes in any copy here.
 */

interface Tester {
  period: number;
  teamName: string;
  key: string;
}

const LAST = "launch.last.v1";
const VOTER = "launch.voter.v1";
const VOTED = `launch.voted.${POLL.id}`;
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage off: the vote still sends */
  }
}

/** A random token for this Chromebook, made once and kept. */
function voterKey(): string {
  const existing = read<string>(VOTER);
  if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const key = Array.from(bytes, (b) => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[b % 64]).join("");
  write(VOTER, key);
  return key;
}

export default function Vote() {
  const [ready, setReady] = useState(false);
  const [tester, setTester] = useState<Tester | null>(null);
  const [editing, setEditing] = useState(false);
  const [period, setPeriod] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [ranking, setRanking] = useState<string[]>([]);
  const [why, setWhy] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = read<Tester>(LAST);
    setTester(t);
    setEditing(!t);
    setPeriod(t?.period ?? null);
    setName(t?.teamName ?? "");
    const prior = read<{ ranking: string[]; why: string }>(VOTED);
    if (prior) {
      setRanking(prior.ranking);
      setWhy(prior.why);
      setDone(true);
    }
    setReady(true);
  }, []);

  function saveTester() {
    if (!period) return setMsg("Pick your period.");
    const check = checkTeamName(name);
    if (!check.ok) return setMsg(check.error);
    const t = { period, teamName: check.name, key: check.key };
    write(LAST, t);
    setTester(t);
    setEditing(false);
    setMsg(null);
  }

  function tap(id: string) {
    setDone(false);
    setMsg(null);
    setRanking((r) => (r.includes(id) ? r : [...r, id]));
  }

  async function submit() {
    if (!tester) return setMsg("Type your period and team name first.");
    if (ranking.length !== POLL.options.length) return setMsg(`Tap all ${POLL.options.length} choices, your favorite first.`);
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/launch/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ poll: POLL.id, ranking, why, period: tester.period, team: tester.teamName, voter: voterKey() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg(data.error ?? "Could not send your vote.");
      write(VOTED, { ranking, why });
      setDone(true);
    } catch {
      setMsg("Could not reach the server. Check the wifi.");
    } finally {
      setSending(false);
    }
  }

  const first = POLL.options.find((o) => o.id === ranking[0]);

  return (
    <div className="bg-stone-white">
      <div className="container-page max-w-4xl py-8 md:py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Your vote</p>
        <h1 className="mt-1 text-3xl font-bold md:text-4xl">{POLL.question}</h1>
        <p className="mt-2 max-w-2xl text-ink/70">Tap the choices in order: your favorite first. Then say why. Your class decides.</p>

        {ready && (
          <div className="mt-6">
            {!editing && tester ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3">
                <span className="text-sm text-ink/60">Voting as</span>
                <span className="font-semibold">
                  {tester.teamName} &middot; Period {tester.period}
                </span>
                <button onClick={() => setEditing(true)} className="text-sm text-blaze-maroon underline underline-offset-2">
                  Change
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-trail-orange/40 bg-white p-4">
                <p className="font-semibold">Who is voting?</p>
                <p className="text-sm text-ink/60">Your Launch Pad team name. Never a real name.</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="text-sm">
                    <span className="block font-medium">Period</span>
                    <select value={period ?? ""} onChange={(e) => setPeriod(e.target.value ? Number(e.target.value) : null)} className="mt-1 rounded-lg border border-ink/20 bg-white px-3 py-2">
                      <option value="">Pick one</option>
                      {PERIODS.map((p) => (
                        <option key={p} value={p}>
                          Period {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="min-w-[12rem] flex-1 text-sm">
                    <span className="block font-medium">Team name</span>
                    <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveTester()} placeholder="Da purples" className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2" />
                  </label>
                  <button onClick={saveTester} className="btn-primary">
                    That&rsquo;s us
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {POLL.options.map((o) => {
            const rank = ranking.indexOf(o.id) + 1;
            return (
              <button
                key={o.id}
                onClick={() => tap(o.id)}
                aria-pressed={rank > 0}
                className={`relative flex flex-col rounded-2xl border-2 p-5 text-left transition ${rank === 1 ? "border-trail-orange bg-trail-orange/10" : rank > 0 ? "border-blaze-maroon/40 bg-white" : "border-ink/10 bg-white hover:border-ink/30"}`}
              >
                {rank > 0 && (
                  <span className={`absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-lg font-bold text-white ${rank === 1 ? "bg-trail-orange" : "bg-blaze-maroon"}`}>
                    {rank}
                  </span>
                )}
                <span className="text-4xl" aria-hidden>
                  {o.emoji}
                </span>
                <span className="mt-3 pr-12 font-display text-xl font-bold text-ink">{o.label}</span>
                <span className="mt-2 text-sm text-ink/70">{o.pitch}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-ink/60">{ranking.length < POLL.options.length ? `Tap choice #${ranking.length + 1}` : "All ranked."}</span>
          {ranking.length > 0 && (
            <>
              <button onClick={() => { setRanking((r) => r.slice(0, -1)); setDone(false); }} className="text-blaze-maroon underline underline-offset-2">
                Undo
              </button>
              <button onClick={() => { setRanking([]); setDone(false); }} className="text-ink/60 underline underline-offset-2">
                Start over
              </button>
            </>
          )}
        </div>

        {ranking.length === POLL.options.length && (
          <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-5">
            <label className="block">
              <span className="block font-semibold">
                Why is {first ? `${first.emoji} ${first.label}` : "your #1"} your #1?
              </span>
              <span className="block text-sm text-ink/60">One sentence. Real product teams decide with reasons, not just votes.</span>
              <input
                value={why}
                maxLength={200}
                onChange={(e) => { setWhy(e.target.value); setDone(false); }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Because..."
                className="mt-2 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-base"
              />
            </label>
            <button onClick={submit} disabled={sending} className="btn-primary mt-4 w-full disabled:opacity-50">
              {sending ? "Sending..." : done ? "Update my vote" : "Send my vote"}
            </button>
          </div>
        )}

        {msg && <p className="mt-4 font-medium text-blaze-maroon">{msg}</p>}
        {done && !msg && (
          <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-5" role="status">
            <p className="text-lg font-bold text-emerald-900">Thanks! Your vote is in.</p>
            <p className="mt-1 text-sm text-emerald-900/80">You can change your vote until your teacher closes it. Just re-rank and send again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
