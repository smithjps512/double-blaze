"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  QUALITY_EXPLAIN,
  QUALITY_LABEL,
  fmtPlace,
  fmtTime,
  fmtUncertainty,
  namesByCar,
  officialTime,
  sessionName,
  standings,
  type RaceDay,
  type StandingRow,
} from "@/lib/race-day/model";

/**
 * The class leaderboard. One row per car, ranked by its best run. Where the
 * video cannot separate two cars, they share a range of places instead of a
 * made up order, and the strip on the right shows why: each dot is a time and
 * each bar is the ±0.05 s around it. Overlapping bars are a tie the footage
 * cannot break. No em dashes in any copy here.
 */

type Sort = "time" | "clip" | "car";

export default function Leaderboard({ day }: { day: RaceDay }) {
  const [sessionId, setSessionId] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("time");
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => standings(day, sessionId === "all" ? undefined : sessionId), [day, sessionId]);
  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sort === "clip") copy.sort((a, b) => a.run.clip.localeCompare(b.run.clip) || a.run.startS - b.run.startS);
    if (sort === "car") copy.sort((a, b) => a.car.label.localeCompare(b.car.label));
    return copy;
  }, [rows, sort]);

  const names = useMemo(() => namesByCar(day), [day]);
  const label = (id: string) => rows.find((r) => r.car.id === id)?.car.label ?? id;
  const scale = useMemo(() => axis(rows), [rows]);
  const leaders = rows.filter((r) => r.placeFrom === 1);
  const unconfirmed = rows.filter((r) => !r.car.confirmed).length;
  const date = raceDates(day);

  return (
    <div className="container-page py-6 md:py-10">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Intro to Technology</p>
        <h1 className="text-3xl font-bold md:text-4xl">Race Day leaderboard</h1>
        <p className="mt-1 max-w-3xl text-ink/70">
          {day.eventName}, {date}. Every time was read frame by frame from 30 frames per second phone video, so each one is
          good to about ±0.05 s.
        </p>
      </header>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-blaze-maroon/20 bg-blaze-maroon/5 p-4 text-sm">
          <p className="font-semibold text-blaze-maroon">Too close to call</p>
          <p className="mt-1 text-ink/80">
            {leaders.length > 1 ? (
              <>
                {leaders.length} cars could be in first place. Their times are so close that the video cannot say which was
                fastest, so each car shows the range of places it could really hold.{" "}
              </>
            ) : (
              <>When two cars are within 0.05 s, the video cannot say which was faster, so they share a range of places. </>
            )}
            <Link href="/trail-crew/dragster/race-day/lesson" className="font-medium text-trail-orange underline underline-offset-2">
              Why?
            </Link>
          </p>
        </div>
        {unconfirmed > 0 && (
          <div className="rounded-xl border border-ink/10 bg-white p-4 text-sm">
            <p className="font-semibold">Not final yet</p>
            <p className="mt-1 text-ink/75">
              Cars are named by color for now. {unconfirmed} of {rows.length} still need your teacher to check them against the
              video. If your car looks wrong, tell your teacher.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block font-medium">Class</span>
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="mt-1 rounded-lg border border-ink/20 bg-white px-2 py-1.5">
            <option value="all">Both sessions</option>
            {day.sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {sessionName(s)} ({s.clipsRecorded})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="mt-1 rounded-lg border border-ink/20 bg-white px-2 py-1.5">
            <option value="time">Fastest first</option>
            <option value="car">Car name</option>
            <option value="clip">Video clip</option>
          </select>
        </label>
        <p className="text-xs text-ink/55">Click a row to see the details.</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-ink/10 bg-stone-white text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-3 py-2">Place</th>
              <th className="px-3 py-2">Car</th>
              <th className="px-3 py-2">Time</th>
              <th className="hidden px-3 py-2 md:table-cell" aria-label="Time with uncertainty">
                <ScaleHeader lo={scale.lo} hi={scale.hi} />
              </th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const isOpen = open === row.car.id;
              const tied = row.placeFrom !== row.placeTo;
              return (
                <Fragment key={row.car.id}>
                  <tr
                    className={`cursor-pointer border-b border-ink/5 align-top hover:bg-stone-white ${isOpen ? "bg-stone-white" : ""}`}
                    onClick={() => setOpen(isOpen ? null : row.car.id)}
                    aria-expanded={isOpen}
                  >
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className={`font-semibold ${row.placeFrom === 1 ? "text-blaze-maroon" : ""}`}>{fmtPlace(row)}</span>
                      {tied && <span className="block text-[11px] text-ink/55">too close to call</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-medium">{row.car.label}</span>
                      {names.get(row.car.id) && <span className="text-ink/70">, {names.get(row.car.id)}</span>}
                      <span className="block text-xs text-ink/55">
                        {sessionName(row.session)}, clip {row.run.clip.replace("IMG_", "")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                      <span className="font-semibold">{fmtTime(row.time)}</span>
                      <span className="block text-xs text-ink/55">
                        {fmtUncertainty(row.time)} {row.time.source === "gate" ? "gate" : "video"}
                      </span>
                    </td>
                    <td className="hidden w-[38%] px-3 py-2.5 md:table-cell">
                      <Strip row={row} lo={scale.lo} hi={scale.hi} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Flags row={row} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-ink/10 bg-stone-white">
                      <td colSpan={5} className="px-3 pb-4 pt-1">
                        <Detail row={row} label={label} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="mt-4 text-ink/60">No runs for this class yet.</p>}

      <p className="mt-4 text-xs text-ink/55">
        Place ranges: a car&apos;s best place counts only the cars that were clearly faster. Its worst place counts every car that
        was not clearly slower. &quot;Clearly&quot; means more than 0.05 s apart on video, or more than 0.001 s on the electronic gate.
      </p>
    </div>
  );
}

/** "November 10, 2026" or "November 10 and 11, 2026", from the sessions themselves. */
function raceDates(day: RaceDay): string {
  const dates = [...new Set(day.sessions.map((s) => s.date || day.eventDate))].sort();
  const d = dates.map((x) => new Date(`${x}T12:00:00`));
  const month = (x: Date) => x.toLocaleDateString("en-US", { month: "long" });
  if (d.length <= 1) return (d[0] ?? new Date()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const sameMonth = d.every((x) => month(x) === month(d[0]));
  const days = sameMonth
    ? `${month(d[0])} ${d.slice(0, -1).map((x) => x.getDate()).join(", ")} and ${d[d.length - 1].getDate()}`
    : d.map((x) => `${month(x)} ${x.getDate()}`).join(" and ");
  return `${days}, ${d[0].getFullYear()}`;
}

function Flags({ row }: { row: StandingRow }) {
  const tags: Array<{ text: string; tone: "warn" | "info" }> = [];
  if (row.run.quality !== "ok") tags.push({ text: QUALITY_LABEL[row.run.quality], tone: "warn" });
  if (row.run.rerun) tags.push({ text: "Rerun", tone: "info" });
  if (row.otherRuns.length) tags.push({ text: `${row.otherRuns.length + 1} runs`, tone: "info" });
  if (!row.car.confirmed) tags.push({ text: "Not confirmed", tone: "info" });
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span
          key={t.text}
          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
            t.tone === "warn" ? "bg-trail-orange/10 text-impact-orange" : "bg-ink/5 text-ink/65"
          }`}
        >
          {t.text}
        </span>
      ))}
    </div>
  );
}

function Detail({ row, label }: { row: StandingRow; label: (id: string) => string }) {
  const r = row.run;
  return (
    <div className="grid gap-4 text-sm md:grid-cols-2">
      <div className="space-y-1">
        <p>
          <span className="font-medium">Clip {r.clip}.</span> Start {r.startS.toFixed(2)} s, finish {r.finishS.toFixed(2)} s into the
          clip. That is about {Math.round((r.elapsedMs * 30) / 1000)} frames of video
          {row.run.gateMs !== null && <>. Video read {(r.elapsedMs / 1000).toFixed(2)} s, the gate read {fmtTime(row.time)}</>}.
        </p>
        <p className="text-ink/70">{QUALITY_EXPLAIN[r.quality]}</p>
        {r.note && <p className="text-ink/70">Note: {r.note}</p>}
      </div>
      <div className="space-y-1">
        {row.tiedWith.length > 0 ? (
          <p>
            <span className="font-medium">Cannot be separated from:</span> {row.tiedWith.map(label).join(", ")}.
          </p>
        ) : (
          <p className="text-ink/70">No other car is within 0.05 s, so this place is certain.</p>
        )}
        {row.otherRuns.length > 0 && (
          <div>
            <p className="font-medium">Other runs</p>
            <ul className="text-ink/75">
              {row.otherRuns.map((o) => (
                <li key={o.id}>
                  Clip {o.clip}: {fmtTime(officialTime(o))}
                  {o.quality !== "ok" && `, ${QUALITY_LABEL[o.quality].toLowerCase()}`}
                  {o.rerun && ", rerun"}
                  {o.excluded && ", not counted"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The uncertainty strip
// ---------------------------------------------------------------------------

/** A shared axis that fits the pack and leaves far-off runs to an arrow. */
function axis(rows: StandingRow[]): { lo: number; hi: number } {
  if (!rows.length) return { lo: 800, hi: 1500 };
  const fastest = rows[0].time.ms;
  const pack = rows.map((r) => r.time.ms).filter((ms) => ms <= fastest * 1.7);
  const lo = Math.floor((fastest - 70) / 50) * 50;
  const hi = Math.ceil((Math.max(...pack) + 70) / 50) * 50;
  return { lo, hi };
}

function pct(ms: number, lo: number, hi: number) {
  return Math.min(100, Math.max(0, ((ms - lo) / (hi - lo)) * 100));
}

function ScaleHeader({ lo, hi }: { lo: number; hi: number }) {
  const ticks: number[] = [];
  for (let t = Math.ceil(lo / 100) * 100; t <= hi; t += 100) ticks.push(t);
  return (
    <div className="relative h-4 normal-case">
      {ticks.map((t) => (
        <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${pct(t, lo, hi)}%` }}>
          {(t / 1000).toFixed(1)}
        </span>
      ))}
    </div>
  );
}

function Strip({ row, lo, hi }: { row: StandingRow; lo: number; hi: number }) {
  const t = row.time;
  const off = t.ms > hi;
  const left = pct(t.ms - t.uncertaintyMs, lo, hi);
  const right = pct(t.ms + t.uncertaintyMs, lo, hi);
  return (
    <div className="relative h-5" aria-hidden>
      <div className="absolute inset-x-0 top-1/2 h-px bg-ink/10" />
      {off ? (
        <span className="absolute right-0 top-0 text-[11px] text-ink/55">off scale &rarr;</span>
      ) : (
        <>
          <div
            className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full ${row.placeFrom === 1 ? "bg-blaze-maroon/25" : "bg-trail-orange/25"}`}
            style={{ left: `${left}%`, width: `${Math.max(1, right - left)}%` }}
          />
          <div
            className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${row.placeFrom === 1 ? "bg-blaze-maroon" : "bg-trail-orange"}`}
            style={{ left: `${pct(t.ms, lo, hi)}%` }}
          />
        </>
      )}
    </div>
  );
}
