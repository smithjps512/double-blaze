"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MAX_SCORE, PARTS, PHASES, PROMPTS, RUBRIC, TOTAL_MIN_WORDS, wordCount } from "@/lib/race-day/reflection";
import type { StoredReflection } from "@/lib/race-day-reflections-db";

/**
 * The teacher side of the project reflection: who turned it in, class-wide
 * ratings, every answer to one question side by side, and a score and note
 * per student. Names come from the database only. No em dashes in any copy.
 */

type View = "students" | "question";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: StoredReflection[]) {
  const head = [
    "Name",
    "Period",
    "Turned in",
    "Words",
    "Score",
    "Reviewed",
    "Teacher note",
    ...PHASES.flatMap((ph) => [`${ph.label}: enjoyed`, `${ph.label}: did well`]),
    ...PROMPTS.map((p) => `${p.num} ${p.prompt}`),
  ];
  const body = rows.map((r) => [
    r.fullName,
    r.period,
    r.submittedAt,
    r.words,
    r.score ?? "",
    r.reviewed ? "yes" : "no",
    r.teacherNote,
    ...PHASES.flatMap((ph) => [r.ratings[ph.id]?.enjoyed ?? "", r.ratings[ph.id]?.did ?? ""]),
    ...PROMPTS.map((p) => r.answers[p.id] ?? ""),
  ]);
  return [head, ...body].map((line) => line.map(csvCell).join(",")).join("\n");
}

export default function ReviewReflections({
  rows,
  saving,
  loadError,
}: {
  rows: StoredReflection[];
  saving: boolean;
  loadError: string | null;
}) {
  const [period, setPeriod] = useState<number | "all">("all");
  const [newestOnly, setNewestOnly] = useState(true);
  const [show, setShow] = useState<"all" | "todo" | "reviewed">("all");
  const [view, setView] = useState<View>("students");
  const [questionId, setQuestionId] = useState(PROMPTS.find((p) => p.id === "add")?.id ?? PROMPTS[0].id);
  const [open, setOpen] = useState<string | null>(null);

  const periods = useMemo(() => [...new Set(rows.map((r) => r.period))].sort((a, b) => a - b), [rows]);

  // Rows arrive newest first. "Newest only" keeps the first row per name and period.
  const visible = useMemo(() => {
    const seen = new Set<string>();
    const olderCount = new Map<string, number>();
    const out: Array<StoredReflection & { older: number }> = [];
    for (const r of rows) {
      if (period !== "all" && r.period !== period) continue;
      const key = `${r.fullName.toLowerCase()}|${r.period}`;
      if (seen.has(key)) {
        olderCount.set(key, (olderCount.get(key) ?? 0) + 1);
        if (newestOnly) continue;
      }
      seen.add(key);
      out.push({ ...r, older: 0 });
    }
    return out
      .map((r) => ({ ...r, older: olderCount.get(`${r.fullName.toLowerCase()}|${r.period}`) ?? 0 }))
      .filter((r) => (show === "todo" ? !r.reviewed : show === "reviewed" ? r.reviewed : true));
  }, [rows, period, newestOnly, show]);

  const averages = useMemo(
    () =>
      PHASES.map((ph) => {
        const e = visible.map((r) => r.ratings[ph.id]?.enjoyed).filter((n): n is number => typeof n === "number");
        const d = visible.map((r) => r.ratings[ph.id]?.did).filter((n): n is number => typeof n === "number");
        const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
        return { ...ph, enjoyed: avg(e), did: avg(d) };
      }),
    [visible],
  );

  const reviewed = visible.filter((r) => r.reviewed).length;
  const question = PROMPTS.find((p) => p.id === questionId) ?? PROMPTS[0];

  function downloadCsv() {
    const blob = new Blob([toCsv(visible)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `co2-reflections${period === "all" ? "" : `-period-${period}`}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="container-page py-6 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Teacher</p>
          <h1 className="text-3xl font-bold md:text-4xl">Project reflections</h1>
          <p className="mt-1 max-w-3xl text-ink/70">
            {visible.length} shown, {reviewed} reviewed. Each needs at least {TOTAL_MIN_WORDS} words across {PROMPTS.filter((p) => p.minWords).length}{" "}
            answers. Students turn it in at{" "}
            <Link href="/trail-crew/dragster/race-day/reflection" className="text-trail-orange underline underline-offset-2">
              Reflection
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/trail-crew/dragster/race-day/teacher" className="text-ink/70 underline underline-offset-2 hover:text-trail-orange">
            Race Day setup
          </Link>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={!visible.length}
            className="rounded-lg border border-ink/20 bg-white px-3 py-1.5 font-medium hover:border-trail-orange disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>
      </header>

      {!saving && (
        <p className="mt-4 rounded-xl border border-trail-orange/40 bg-trail-orange/10 p-3 text-sm">
          {loadError ??
            "The database is not connected here, so no reflections can be turned in or read. Apply supabase/migrations/0054_race_day_reflections.sql and set the Supabase keys."}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label>
          <span className="mr-2 font-medium">Period</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="rounded-lg border border-ink/20 bg-white px-2 py-1.5"
          >
            <option value="all">All</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                Period {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mr-2 font-medium">Show</span>
          <select value={show} onChange={(e) => setShow(e.target.value as typeof show)} className="rounded-lg border border-ink/20 bg-white px-2 py-1.5">
            <option value="all">Everyone</option>
            <option value="todo">Not reviewed</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={newestOnly} onChange={(e) => setNewestOnly(e.target.checked)} />
          Newest copy per student only
        </label>
        <div className="ml-auto flex overflow-hidden rounded-lg border border-ink/20" role="tablist" aria-label="View">
          {(
            [
              ["students", "By student"],
              ["question", "By question"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 font-medium ${view === v ? "bg-blaze-maroon text-white" : "bg-white hover:bg-stone-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 && (
        <section className="mt-5 overflow-x-auto rounded-xl border border-ink/10 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-ink/60">Class ratings, average out of 5</h2>
          <table className="mt-2 w-full min-w-[28rem] text-sm tabular-nums">
            <thead>
              <tr className="text-left text-ink/60">
                <th className="py-1 font-medium">Phase</th>
                <th className="py-1 font-medium">Enjoyed</th>
                <th className="py-1 font-medium">Did well</th>
              </tr>
            </thead>
            <tbody>
              {averages.map((a) => (
                <tr key={a.id} className="border-t border-ink/5">
                  <td className="py-1.5">{a.label}</td>
                  <td className="py-1.5">
                    <Bar value={a.enjoyed} />
                  </td>
                  <td className="py-1.5">
                    <Bar value={a.did} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-ink/20 bg-white p-6 text-center text-ink/60">
          No reflections {rows.length ? "match these filters" : "turned in yet"}. Each one shows up here as soon as a student presses Turn in.
        </p>
      ) : view === "question" ? (
        <section className="mt-6">
          <label className="block text-sm">
            <span className="font-medium">Question</span>
            <select
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              className="mt-1 block w-full max-w-3xl rounded-lg border border-ink/20 bg-white px-2 py-1.5"
            >
              {PARTS.map((part) => (
                <optgroup key={part.id} label={part.title}>
                  {part.groups.flatMap((g) => g.prompts).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.num} {p.prompt.length > 90 ? `${p.prompt.slice(0, 90)}...` : p.prompt}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <p className="mt-3 max-w-3xl font-medium">
            {question.num} {question.prompt}
          </p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {visible.map((r) => (
              <li key={r.id} className="min-w-0 rounded-xl border border-ink/10 bg-white p-4">
                <p className="text-sm font-semibold">
                  {r.fullName} <span className="font-normal text-ink/55">, Period {r.period}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-ink/85">{r.answers[question.id] || <em className="text-ink/45">No answer</em>}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((r) => (
            <StudentRow key={r.id} r={r} open={open === r.id} toggle={() => setOpen(open === r.id ? null : r.id)} saving={saving} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Bar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-ink/40">none</span>;
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-28 overflow-hidden rounded-full bg-ink/10">
        <span className="block h-full rounded-full bg-trail-orange" style={{ width: `${(value / 5) * 100}%` }} />
      </span>
      {value.toFixed(1)}
    </span>
  );
}

function StudentRow({
  r,
  open,
  toggle,
  saving,
}: {
  r: StoredReflection & { older: number };
  open: boolean;
  toggle: () => void;
  saving: boolean;
}) {
  const router = useRouter();
  const [score, setScore] = useState(r.score === null ? "" : String(r.score));
  const [note, setNote] = useState(r.teacherNote);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);

  async function save(extra: { reviewed?: boolean } = {}) {
    setMsg(null);
    const n = score.trim() === "" ? null : Number(score);
    if (n !== null && (!Number.isInteger(n) || n < 0 || n > MAX_SCORE)) {
      setMsg({ text: `A score is a whole number from 0 to ${MAX_SCORE}.`, bad: true });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/race-day/reflection", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: r.id, score: n, teacherNote: note, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ text: data.error ?? "Could not save.", bad: true });
        return;
      }
      setMsg({ text: extra.reviewed ? "Saved and marked reviewed." : "Saved.", bad: false });
      router.refresh();
    } catch {
      setMsg({ text: "Could not reach the server.", bad: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-xl border border-ink/10 bg-white">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left">
        <span className="font-semibold">{r.fullName}</span>
        <span className="text-sm text-ink/60">Period {r.period}</span>
        <span className="text-sm tabular-nums text-ink/60">{r.words} words</span>
        <span className="text-sm text-ink/60">{fmtDate(r.submittedAt)}</span>
        {r.older > 0 && <span className="text-xs text-ink/50">+{r.older} older</span>}
        <span className="ml-auto flex items-center gap-2 text-sm">
          {r.score !== null && (
            <span className="tabular-nums font-semibold">
              {r.score}/{MAX_SCORE}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.reviewed ? "bg-ridge-green text-white" : "bg-trail-orange/15 text-impact-orange"}`}
          >
            {r.reviewed ? "Reviewed" : "To review"}
          </span>
          <span aria-hidden className="text-ink/40">
            {open ? "▲" : "▼"}
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-ink/10 p-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="min-w-0 space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[22rem] text-sm tabular-nums">
                  <thead>
                    <tr className="text-left text-ink/60">
                      <th className="py-1 font-medium">1.1 Phase</th>
                      <th className="py-1 font-medium">Enjoyed</th>
                      <th className="py-1 font-medium">Did well</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PHASES.map((ph) => (
                      <tr key={ph.id} className="border-t border-ink/5">
                        <td className="py-1">{ph.label}</td>
                        <td className="py-1">{r.ratings[ph.id]?.enjoyed ?? "?"} / 5</td>
                        <td className="py-1">{r.ratings[ph.id]?.did ?? "?"} / 5</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {PARTS.map((part, i) => (
                <div key={part.id}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-trail-orange">
                    Part {i + 1}: {part.title}
                  </h3>
                  <dl className="mt-2 space-y-3">
                    {part.groups.flatMap((g) => g.prompts).map((p) => {
                      const a = r.answers[p.id] ?? "";
                      return (
                        <div key={p.id}>
                          <dt className="text-sm text-ink/60">
                            <span className="font-semibold">{p.num}</span> {p.prompt}{" "}
                            {a && <span className="tabular-nums text-ink/45">({wordCount(a)} words)</span>}
                          </dt>
                          <dd className="mt-0.5 whitespace-pre-wrap break-words">{a || <em className="text-ink/45">No answer</em>}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              ))}
            </div>

            <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
              <div className="rounded-xl border border-ink/10 bg-stone-white p-3 text-sm">
                <p className="font-semibold">Scoring guide, {MAX_SCORE} points</p>
                <ul className="mt-2 space-y-1.5">
                  {RUBRIC.map((x) => (
                    <li key={x.label}>
                      <span className="font-semibold tabular-nums">{x.points}</span> {x.label}.{" "}
                      <span className="text-ink/65">{x.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <label className="block text-sm">
                <span className="font-medium">Score out of {MAX_SCORE}</span>
                <input
                  id={`score-${r.id}`}
                  inputMode="numeric"
                  value={score}
                  onChange={(e) => setScore(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                  className="mt-1 w-24 rounded-lg border border-ink/20 px-3 py-2 tabular-nums"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Note to yourself or the student</span>
                <textarea
                  id={`note-${r.id}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 4000))}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!saving || busy}
                  onClick={() => save({ reviewed: true })}
                  className="rounded-lg bg-blaze-maroon px-3 py-2 text-sm font-semibold text-white hover:bg-blaze-maroon/90 disabled:opacity-50"
                >
                  Save and mark reviewed
                </button>
                <button
                  type="button"
                  disabled={!saving || busy}
                  onClick={() => save(r.reviewed ? { reviewed: false } : {})}
                  className="rounded-lg border border-ink/20 px-3 py-2 text-sm font-medium hover:border-trail-orange disabled:opacity-50"
                >
                  {r.reviewed ? "Save, mark not reviewed" : "Save"}
                </button>
              </div>
              {msg && (
                <p className={`text-sm ${msg.bad ? "text-trail-orange" : "text-ridge-green"}`} role="status">
                  {msg.text}
                </p>
              )}
            </aside>
          </div>
        </div>
      )}
    </li>
  );
}
