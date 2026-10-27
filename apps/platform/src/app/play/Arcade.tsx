"use client";

import { useCallback, useEffect, useState } from "react";
import { checkTeamName } from "@/lib/launch/plan";
import { QA_FORMS, formFor, ideaAsStory, ownApp, type QaKind } from "@/lib/launch/qa";

/**
 * The /play arcade: play a classmate's app, then file a QA report about it.
 *
 * The form is the lesson, the same as on Launch Pad: "What did you do? What
 * happened? What did you expect?" is the shape of a real bug report, and a
 * tester who cannot fill in the first box has not tested yet. Who is testing
 * is a period and a team name, shared with Launch Pad through the same
 * Chromebook storage, so a team that has signed in there is already here.
 * No em dashes in any copy here.
 */

export interface ArcadeApp {
  slug: string;
  name: string;
  team: string;
  period: number | null;
  purpose: string;
  playHref: string;
  prototypeHref: string;
  working: boolean;
}

interface Tester {
  period: number;
  teamName: string;
  key: string;
}

interface Report {
  id: string;
  kind: QaKind;
  answers: Record<string, string>;
  teamName: string;
  period: number;
  createdAt: string;
}

// Launch Pad's key, so signing in on either page signs in on both.
const LAST = "launch.last.v1";
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

function readTester(): Tester | null {
  try {
    const raw = window.localStorage.getItem(LAST);
    return raw ? (JSON.parse(raw) as Tester) : null;
  } catch {
    return null;
  }
}

function saveTester(t: Tester) {
  try {
    window.localStorage.setItem(LAST, JSON.stringify(t));
  } catch {
    /* storage off: they will just type it again */
  }
}

/* ----------------------------------------------------------- who is testing */

function TesterBar({ tester, onChange }: { tester: Tester | null; onChange: (t: Tester | null) => void }) {
  const [editing, setEditing] = useState(!tester);
  const [period, setPeriod] = useState<number | null>(tester?.period ?? null);
  const [name, setName] = useState(tester?.teamName ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setEditing(!tester);
    setPeriod(tester?.period ?? null);
    setName(tester?.teamName ?? "");
  }, [tester]);

  function save() {
    if (!period) return setMsg("Pick your period.");
    const check = checkTeamName(name);
    if (!check.ok) return setMsg(check.error);
    const t = { period, teamName: check.name, key: check.key };
    saveTester(t);
    onChange(t);
    setMsg(null);
  }

  if (!editing && tester) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3">
        <span className="text-sm text-ink/60">Testing as</span>
        <span className="font-semibold">
          {tester.teamName} &middot; Period {tester.period}
        </span>
        <button onClick={() => setEditing(true)} className="text-sm text-blaze-maroon underline underline-offset-2">
          Change
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-trail-orange/40 bg-white p-4">
      <p className="font-semibold">Who is testing?</p>
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
          <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="Da purples" className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2" />
        </label>
        <button onClick={save} className="btn-primary">
          Start testing
        </button>
      </div>
      {msg && <p className="mt-2 text-sm font-medium text-blaze-maroon">{msg}</p>}
    </div>
  );
}

/* --------------------------------------------------------------- the report */

function QaSheet({ app, tester, onClose, onSent }: { app: ArcadeApp; tester: Tester; onClose: () => void; onSent: () => void }) {
  const [kind, setKind] = useState<QaKind | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [sending, setSending] = useState(false);
  const form = kind ? formFor(kind) : null;

  async function send() {
    if (!kind) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/launch/qa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ app: app.slug, kind, answers, period: tester.period, team: tester.teamName }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return onSent();
      setError({ text: data.error ?? "Could not send it.", field: data.field });
    } catch {
      setError({ text: "Could not reach the server. Check the wifi." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-stone-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`QA report for ${app.name}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-trail-orange">QA report</p>
            <h2 className="text-xl font-bold">{app.name}</h2>
            <p className="text-sm text-ink/60">by {app.team}</p>
          </div>
          <button onClick={onClose} className="rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm">
            Close
          </button>
        </div>

        <p className="mt-4 font-semibold">What did you find?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {QA_FORMS.map((f) => (
            <button
              key={f.kind}
              onClick={() => {
                setKind(f.kind);
                setError(null);
              }}
              className={`rounded-xl border p-3 text-left transition ${kind === f.kind ? "border-blaze-maroon bg-blaze-maroon/5" : "border-ink/10 bg-white hover:border-ink/30"}`}
            >
              <span className="text-lg" aria-hidden>
                {f.emoji}
              </span>{" "}
              <span className="font-semibold">{f.label}</span>
              <span className="mt-0.5 block text-xs text-ink/60">{f.blurb}</span>
            </button>
          ))}
        </div>

        {form && (
          <div className="mt-4 space-y-3">
            {form.questions.map((q) => (
              <label key={q.key} className="block">
                <span className="block text-sm font-semibold">
                  {q.label}
                  {!q.required && <span className="font-normal text-ink/50"> (if you know)</span>}
                </span>
                {q.key === "screen" || kind === "idea" ? (
                  <input
                    value={answers[q.key] ?? ""}
                    maxLength={q.key === "screen" ? 60 : 400}
                    placeholder={q.placeholder}
                    onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 ${error?.field === q.key ? "border-blaze-maroon" : "border-ink/20"}`}
                  />
                ) : (
                  <textarea
                    value={answers[q.key] ?? ""}
                    maxLength={400}
                    rows={2}
                    placeholder={q.placeholder}
                    onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 ${error?.field === q.key ? "border-blaze-maroon" : "border-ink/20"}`}
                  />
                )}
              </label>
            ))}
            {error && <p className="text-sm font-medium text-blaze-maroon">{error.text}</p>}
            <button onClick={send} disabled={sending} className="btn-primary w-full disabled:opacity-50">
              {sending ? "Sending..." : "Send to the teacher"}
            </button>
            <p className="text-xs text-ink/50">Your teacher reads every report first. Kind and specific reports help a team fix things.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------- reports about our app */

const LABEL: Record<QaKind, string> = { bug: "🐞 Bugs", confusing: "🤔 Confusing", idea: "💡 Ideas", love: "⭐ What testers loved" };

function OurReports({ app }: { app: ArcadeApp }) {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [off, setOff] = useState(false);
  const load = useCallback(() => {
    fetch(`/api/launch/qa?app=${app.slug}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return setOff(true);
        setReports((await r.json()).reports);
      })
      .catch(() => setOff(true));
  }, [app.slug]);
  useEffect(load, [load]);

  return (
    <section className="rounded-2xl border border-blaze-maroon/20 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-trail-orange">Your app</p>
          <h2 className="text-xl font-bold">What testers found in {app.name}</h2>
        </div>
        <button onClick={load} className="text-sm text-blaze-maroon underline underline-offset-2">
          Refresh
        </button>
      </div>
      {off ? (
        <p className="mt-3 text-sm text-ink/60">Reports are not switched on here yet.</p>
      ) : !reports ? (
        <p className="mt-3 text-sm text-ink/60">Loading...</p>
      ) : reports.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60">Nothing yet. Your teacher shares reports here after reading them.</p>
      ) : (
        <div className="mt-4 space-y-5">
          {(["bug", "confusing", "idea", "love"] as QaKind[]).map((k) => {
            const list = reports.filter((r) => r.kind === k);
            if (!list.length) return null;
            return (
              <div key={k}>
                <h3 className="font-semibold">
                  {LABEL[k]} ({list.length})
                </h3>
                <ul className="mt-2 space-y-2">
                  {list.map((r) => (
                    <li key={r.id} className="rounded-lg bg-stone-white p-3 text-sm">
                      {formFor(k).questions
                        .filter((q) => r.answers[q.key])
                        .map((q) => (
                          <p key={q.key}>
                            <span className="text-ink/50">{q.label}</span> {r.answers[q.key]}
                          </p>
                        ))}
                      <p className="mt-1 text-xs text-ink/40">
                        from {r.teamName}, period {r.period}
                      </p>
                      {k === "idea" && (
                        <a
                          href={`/trail-crew/launch?story=${encodeURIComponent(JSON.stringify(ideaAsStory(r.answers)))}`}
                          className="mt-2 inline-block text-sm font-medium text-blaze-maroon underline underline-offset-2"
                        >
                          Add this idea to our stories
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ arcade */

export default function Arcade({ apps }: { apps: ArcadeApp[] }) {
  const [tester, setTester] = useState<Tester | null>(null);
  const [ready, setReady] = useState(false);
  const [qaFor, setQaFor] = useState<ArcadeApp | null>(null);
  const [sent, setSent] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setTester(readTester());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const mine = tester ? apps.find((a) => a.slug === ownApp(tester.period, tester.teamName)) ?? null : null;

  return (
    <div className="bg-stone-white">
      <div className="container-page py-8 md:py-12">
        <header>
          <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Play and QA</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">Your classmates built these. Break them.</h1>
          <p className="mt-2 max-w-2xl text-ink/70">
            Every app here started as a purpose, some users, and a few user stories. Play them, then be a <strong>QA tester</strong>: the person whose job
            is to find what is broken, confusing, or great, and write it down so the team can fix it.
          </p>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div>{ready && <TesterBar tester={tester} onChange={setTester} />}</div>
          <aside className="rounded-xl border border-ink/10 bg-white p-4 text-sm">
            <p className="font-semibold">How real QA testers work</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink/75">
              <li>Try every tab and every button.</li>
              <li>Try weird things: empty boxes, tapping twice, going back.</li>
              <li>Write the exact steps, so someone else can make it happen again.</li>
              <li>Say what you expected. That is how a team knows what &ldquo;fixed&rdquo; means.</li>
            </ol>
            {sent > 0 && <p className="mt-3 font-semibold text-emerald-700">You have sent {sent} {sent === 1 ? "report" : "reports"}. Nice testing.</p>}
          </aside>
        </div>

        {mine && (
          <div className="mt-6">
            <OurReports app={mine} />
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const own = mine?.slug === app.slug;
            return (
              <article key={app.slug} className="flex flex-col rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-blaze-maroon">{app.name}</h2>
                  {own && <span className="rounded-full bg-trail-orange/15 px-2 py-0.5 text-xs font-semibold text-trail-orange">Your app</span>}
                </div>
                <p className="text-sm text-hokie-gray">
                  {app.team}
                  {app.period ? ` · Period ${app.period}` : ""}
                </p>
                <p className="mt-3 flex-1 text-sm text-ink/75">{app.purpose.length > 160 ? `${app.purpose.slice(0, 159).trimEnd()}...` : app.purpose}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href={app.playHref} target="_blank" rel="noopener" className="btn-primary text-center">
                    ▶ Play
                  </a>
                  <button
                    onClick={() => (tester ? setQaFor(app) : setToast("Type your period and team name at the top first."))}
                    className="rounded-md border border-blaze-maroon px-4 py-2.5 font-medium text-blaze-maroon hover:bg-blaze-maroon/5"
                  >
                    🐞 QA it
                  </button>
                </div>
                {app.working && (
                  <a href={app.prototypeHref} target="_blank" rel="noopener" className="mt-3 text-center text-xs text-ink/50 underline underline-offset-2">
                    See the first prototype, made only from their words
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {qaFor && tester && (
        <QaSheet
          app={qaFor}
          tester={tester}
          onClose={() => setQaFor(null)}
          onSent={() => {
            setQaFor(null);
            setSent((n) => n + 1);
            setToast(`Sent to your teacher. Thanks for testing ${qaFor.name}!`);
          }}
        />
      )}
      {toast && (
        <div className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-md rounded-xl bg-ink px-4 py-3 text-center text-white shadow-lg" role="status">
          {toast}
          <button onClick={() => setToast(null)} className="ml-3 text-white/60 underline">
            OK
          </button>
        </div>
      )}
    </div>
  );
}
