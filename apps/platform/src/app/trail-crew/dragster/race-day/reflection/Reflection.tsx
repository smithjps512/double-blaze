"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PARTS,
  PHASES,
  PROMPTS,
  TOTAL_MIN_WORDS,
  emptyDraft,
  missing,
  promptStatus,
  wordCount,
  type Prompt,
  type ReflectionDraft,
} from "@/lib/race-day/reflection";

/**
 * The student side of the project reflection. Drafts save to this browser as
 * the student types, so a closed tab or a bell does not lose work, and Turn in
 * stays locked until every answer meets its minimum. The server runs the same
 * checks again. No em dashes in any copy here.
 */

const DRAFT_KEY = "race-day-reflection-draft-v1";

function loadDraft(): ReflectionDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<ReflectionDraft>;
    const base = emptyDraft();
    return {
      fullName: typeof saved.fullName === "string" ? saved.fullName : "",
      period: typeof saved.period === "number" ? saved.period : null,
      ratings: { ...base.ratings, ...(saved.ratings ?? {}) },
      answers: { ...base.answers, ...(saved.answers ?? {}) },
    };
  } catch {
    return null;
  }
}

function saveDraft(d: ReflectionDraft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    // Private windows can refuse storage. The page still works.
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}

export default function Reflection({ saving }: { saving: boolean }) {
  const [draft, setDraft] = useState<ReflectionDraft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ words: number; at: string; name: string } | null>(null);
  const [confirmFresh, setConfirmFresh] = useState(false);
  const missingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setDraft(d);
      setRestored(Object.values(d.answers).some((a) => a.trim()) || !!d.fullName);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || done) return;
    const t = setTimeout(() => saveDraft(draft), 400);
    return () => clearTimeout(t);
  }, [draft, loaded, done]);

  const gaps = useMemo(() => missing(draft), [draft]);
  const required = PROMPTS.filter((p) => p.minWords > 0);
  const answered = required.filter((p) => promptStatus(p, draft.answers[p.id] ?? "") === "done").length;
  const words = PROMPTS.reduce((n, p) => n + wordCount(draft.answers[p.id] ?? ""), 0);
  const pct = Math.min(100, Math.round((answered / required.length) * 100));

  const setAnswer = (id: string, value: string) => setDraft((d) => ({ ...d, answers: { ...d.answers, [id]: value } }));
  const setRating = (phase: string, key: "enjoyed" | "did", value: number) =>
    setDraft((d) => ({ ...d, ratings: { ...d.ratings, [phase]: { ...d.ratings[phase as keyof typeof d.ratings], [key]: value } } }));

  async function turnIn() {
    setError(null);
    if (gaps.length) {
      missingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/race-day/reflection", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not turn it in. Your answers are still here. Try again.");
        return;
      }
      clearDraft();
      setDone({ words: data.words ?? words, at: new Date().toLocaleString(), name: draft.fullName.trim() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not reach the server. Your answers are still here and saved on this device. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="container-page py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-ridge-green/30 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-ridge-green">Turned in</p>
          <h1 className="mt-1 text-2xl font-bold">Thanks, {done.name.split(" ")[0]}.</h1>
          <p className="mt-2 text-ink/75">
            Your reflection is with your teacher: {done.words} words, turned in {done.at}. You can close this tab.
          </p>
          <p className="mt-3 text-sm text-ink/60">
            Want to change something? Start a new copy and turn it in again. Your teacher sees the newest one.
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft(emptyDraft());
              setDone(null);
              setRestored(false);
            }}
            className="mt-4 rounded-lg border border-ink/20 px-4 py-2 text-sm font-medium hover:border-trail-orange"
          >
            Start a new copy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="container-page max-w-3xl py-6 md:py-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Intro to Technology</p>
          <h1 className="text-3xl font-bold md:text-4xl">CO2 Dragster Project Reflection</h1>
          <p className="mt-2 text-ink/75">
            Engineers do not stop when the product ships. They look back at what worked, what did not, and what they would change. Plan on
            at least 30 minutes. Most people need 35 to 45.
          </p>
          <div className="mt-4 rounded-xl border border-ink/10 bg-white p-4 text-sm">
            <p className="font-semibold">What a strong answer looks like</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/80">
              <li>
                <strong>Specific.</strong> &ldquo;It was fun&rdquo; earns little. &ldquo;Sanding the nose down to 1/4 inch took two class periods,
                and I learned to sand with the grain&rdquo; earns full credit.
              </li>
              <li>
                <strong>Explains why.</strong> Every opinion gets a reason.
              </li>
              <li>
                <strong>Honest.</strong> Saying a part was boring or frustrating will not hurt your grade. A vague answer will.
              </li>
              <li>
                <strong>Meets the word minimum.</strong> The minimum is the floor, not the goal.
              </li>
            </ul>
            <p className="mt-3 text-ink/60">
              Your answers save on this device as you type. On a shared computer, turn it in before you leave.
            </p>
          </div>
          {restored && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-3 text-sm">
              <span>Welcome back. Your saved answers are filled in below.</span>
              {confirmFresh ? (
                <span className="flex items-center gap-2">
                  <span className="text-ink/70">Erase them and start over?</span>
                  <button
                    type="button"
                    className="rounded-md bg-trail-orange px-2 py-1 font-medium text-white"
                    onClick={() => {
                      clearDraft();
                      setDraft(emptyDraft());
                      setRestored(false);
                      setConfirmFresh(false);
                    }}
                  >
                    Erase
                  </button>
                  <button type="button" className="underline" onClick={() => setConfirmFresh(false)}>
                    Keep
                  </button>
                </span>
              ) : (
                <button type="button" className="text-ink/60 underline underline-offset-2" onClick={() => setConfirmFresh(true)}>
                  Not you? Start over
                </button>
              )}
            </div>
          )}
          {!saving && (
            <p className="mt-3 rounded-xl border border-trail-orange/40 bg-trail-orange/10 p-3 text-sm">
              Turning in is not switched on yet. You can still write, and your answers save on this device until it is.
            </p>
          )}
        </header>

        <section className="mt-8 rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="text-lg font-bold">Who you are</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto]">
            <label className="block text-sm">
              <span className="font-medium">First and last name</span>
              <input
                id="full-name"
                value={draft.fullName}
                onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value.slice(0, 80) }))}
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Class period</span>
              <select
                id="period"
                value={draft.period ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, period: e.target.value ? Number(e.target.value) : null }))}
                className="mt-1 block w-full rounded-lg border border-ink/20 bg-white px-3 py-2 sm:w-36"
              >
                <option value="">Pick one</option>
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {PARTS.map((part, i) => (
          <section key={part.id} className="mt-10" aria-labelledby={`${part.id}-title`}>
            <div className="border-b border-ink/10 pb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-trail-orange">
                Part {i + 1} &middot; about {part.minutes} minutes
              </p>
              <h2 id={`${part.id}-title`} className="text-2xl font-bold">
                {part.title}
              </h2>
              <p className="mt-1 text-ink/70">{part.intro}</p>
            </div>

            {part.id === "p1" && <RatingsGrid draft={draft} setRating={setRating} />}

            {part.groups.map((g, gi) => (
              <div key={gi} className="mt-6">
                {g.heading && <h3 className="mb-3 text-lg font-semibold text-blaze-maroon">{g.heading}</h3>}
                <div className="space-y-5">
                  {g.prompts.map((p) => (
                    <Answer key={p.id} prompt={p} value={draft.answers[p.id] ?? ""} onChange={(v) => setAnswer(p.id, v)} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}

        <section className="mt-12 rounded-2xl border border-ink/10 bg-white p-5" aria-labelledby="turn-in-title">
          <h2 id="turn-in-title" className="text-xl font-bold">
            Turn it in
          </h2>
          <div ref={missingRef}>
            {gaps.length ? (
              <div className="mt-3 text-sm">
                <p className="font-medium">Still to do ({gaps.length}):</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/75">
                  {gaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ridge-green">
                Everything meets its minimum. Read it over once more: is every answer specific, with a reason?
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={turnIn}
            disabled={busy || !saving || gaps.length > 0}
            className="mt-4 w-full rounded-lg bg-blaze-maroon px-4 py-3 font-semibold text-white hover:bg-blaze-maroon/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {busy ? "Turning in..." : "Turn in my reflection"}
          </button>
          {error && (
            <p className="mt-3 text-sm text-trail-orange" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-stone-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
          <span className="font-semibold">
            {answered} of {required.length} answers done
          </span>
          <div
            className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-ink/10"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Answers done"
          >
            <div className="h-full rounded-full bg-ridge-green transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <span className="tabular-nums text-ink/70">
            {words} / {TOTAL_MIN_WORDS}+ words
          </span>
        </div>
      </div>

    </div>
  );
}

function RatingsGrid({
  draft,
  setRating,
}: {
  draft: ReflectionDraft;
  setRating: (phase: string, key: "enjoyed" | "did", value: number) => void;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-blaze-maroon">
        <span className="mr-2 text-sm font-semibold text-ink/50">1.1</span>Rate each phase
      </h3>
      <p className="text-sm text-ink/65">1 is the lowest, 5 is the highest.</p>
      <div className="mt-3 space-y-3">
        {PHASES.map((ph) => (
          <fieldset key={ph.id} className="rounded-xl border border-ink/10 bg-white p-3">
            <legend className="px-1 font-medium">{ph.label}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["enjoyed", "How much I enjoyed it"],
                  ["did", "How well I did"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} role="radiogroup" aria-label={`${ph.label}: ${label}`}>
                  <p className="text-sm text-ink/70">{label}</p>
                  <div className="mt-1 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const on = draft.ratings[ph.id]?.[key] === n;
                      return (
                        <label
                          key={n}
                          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold focus-within:ring-2 focus-within:ring-trail-orange ${
                            on ? "border-blaze-maroon bg-blaze-maroon text-white" : "border-ink/20 bg-white hover:border-trail-orange"
                          }`}
                        >
                          <input
                            type="radio"
                            id={`rate-${ph.id}-${key}-${n}`}
                            name={`rate-${ph.id}-${key}`}
                            value={n}
                            checked={on}
                            onChange={() => setRating(ph.id, key, n)}
                            className="sr-only"
                          />
                          {n}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

function Answer({ prompt: p, value, onChange }: { prompt: Prompt; value: string; onChange: (v: string) => void }) {
  const n = wordCount(value);
  const status = promptStatus(p, value);
  const id = `answer-${p.id}`;
  const counter =
    status === "optional" ? (
      <span className="text-ink/50">Optional, {n} words</span>
    ) : status === "done" ? (
      <span className="text-ridge-green">
        {n} / {p.minWords} words &#10003;
      </span>
    ) : status === "padded" ? (
      <span className="text-trail-orange">Too much repeating. Use your own words.</span>
    ) : (
      <span className="text-ink/60">
        {n} / {p.minWords} words
      </span>
    );

  return (
    <div>
      <label htmlFor={id} className="block">
        <span className="mr-2 text-sm font-semibold text-ink/50">{p.num}</span>
        <span className="font-medium">{p.prompt}</span>
        {p.minWords > 1 && !p.short && <span className="ml-1 text-sm text-ink/50">({p.minWords} words)</span>}
      </label>
      {p.hint && <p className="mt-0.5 text-sm text-ink/60">{p.hint}</p>}
      {p.short ? (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 200))}
          className="mt-2 w-full rounded-lg border border-ink/20 bg-white px-3 py-2"
        />
      ) : (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 6000))}
          rows={Math.max(4, Math.ceil(p.minWords / 12))}
          className="mt-2 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 leading-relaxed"
        />
      )}
      <p className="mt-1 text-right text-xs tabular-nums" aria-live="polite">
        {counter}
      </p>
    </div>
  );
}
