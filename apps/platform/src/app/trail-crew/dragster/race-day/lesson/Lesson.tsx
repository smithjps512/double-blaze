"use client";

import { useMemo, useState } from "react";
import { fmtPlace, standings, type RaceDay } from "@/lib/race-day/model";

/**
 * Video vs. electronic gate, worked on our own race. Three things to play
 * with: how long one frame lasts at different frame rates, what happens to a
 * car's place when you read its start or finish one frame differently, and
 * whether a faster camera or the gate could have split today's top cars.
 *
 * Read only: nothing a student does here is saved. No em dashes in any copy.
 */

type Method = { id: string; label: string; fps: number | null };

const METHODS: Method[] = [
  { id: "30", label: "30 fps (normal video)", fps: 30 },
  { id: "60", label: "60 fps", fps: 60 },
  { id: "120", label: "120 fps (Slo-Mo)", fps: 120 },
  { id: "240", label: "240 fps (Slo-Mo)", fps: 240 },
  { id: "gate", label: "Electronic gate", fps: null },
];

/** About a frame and a half of doubt: 0.05 s at 30 fps, the rule the leaderboard uses. */
function uncertaintyS(m: Method): number {
  return m.fps ? 1.5 / m.fps : 0.001;
}

function s(n: number, digits = 3) {
  return `${n.toFixed(digits)} s`;
}

export default function Lesson({ day }: { day: RaceDay }) {
  return (
    <div className="container-page py-6 md:py-10">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Intro to Technology</p>
        <h1 className="text-3xl font-bold md:text-4xl">Video vs. electronic gate</h1>
        <p className="mt-1 max-w-3xl text-ink/70">
          Our race times came from phone video. Here is what that means for how exact they are, worked out on our own cars.
        </p>
      </header>
      <div className="mt-6 space-y-6">
        <FrameMath />
        <ReadItYourself day={day} />
        <BetterTools day={day} />
        <WhyItDiffers />
      </div>
    </div>
  );
}

function Card({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5 md:p-6">
      <h2 className="text-xl font-bold">
        <span className="mr-2 text-trail-orange">{n}.</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 1. One frame
// ---------------------------------------------------------------------------

function FrameMath() {
  const [id, setId] = useState("30");
  const m = METHODS.find((x) => x.id === id)!;
  const frame = m.fps ? 1 / m.fps : 0.001;
  // A fixed moment the car really crosses the line, inside a 0.1 s window.
  const WINDOW = 0.1;
  const crossing = 0.0517;
  const seenAt = Math.ceil(crossing / frame) * frame;
  const late = seenAt - crossing;
  const ticks = m.fps ? Array.from({ length: Math.floor(WINDOW / frame) + 1 }, (_, i) => i * frame) : [];
  const x = (t: number) => `${(t / WINDOW) * 100}%`;

  return (
    <Card n={1} title="How long is one frame?">
      <p className="text-ink/75">
        A video is a stack of still pictures. Between two pictures the camera sees nothing, so a car can cross the line and the video
        only shows it on the next frame.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {METHODS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setId(x.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              id === x.id ? "border-blaze-maroon bg-blaze-maroon text-white" : "border-ink/20 bg-white hover:border-trail-orange"
            }`}
            aria-pressed={id === x.id}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_2fr] md:items-center">
        <div className="rounded-xl bg-stone-white p-4">
          {m.fps ? (
            <>
              <p className="text-sm text-ink/60">One frame lasts</p>
              <p className="text-3xl font-bold tabular-nums">
                1 / {m.fps} = {s(frame)}
              </p>
              <p className="mt-1 text-sm text-ink/70">
                In this example the car crosses at {s(crossing, 4)} but the first frame that shows it is at {s(seenAt, 4)}, so the video
                reads {s(late, 4)} late.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-ink/60">The gate reads to</p>
              <p className="text-3xl font-bold tabular-nums">0.001 s</p>
              <p className="mt-1 text-sm text-ink/70">
                A light beam across the finish is broken by the car&apos;s nose and the timer stops right then. There are no frames to fall
                between and no person choosing a frame.
              </p>
            </>
          )}
        </div>
        <div>
          <div className="relative h-20 rounded-xl bg-[#2B2D30]" role="img" aria-label="A tenth of a second of time with frame marks">
            {ticks.map((t) => (
              <div key={t} className="absolute top-3 h-10 w-px bg-white/60" style={{ left: x(t) }} />
            ))}
            <div className="absolute top-2 h-12 w-0.5 bg-trail-orange" style={{ left: x(crossing) }} />
            {m.fps && <div className="absolute top-2 h-12 w-0.5 bg-[#7CC4A4]" style={{ left: x(seenAt) }} />}
            <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[10px] text-white/70 tabular-nums">
              <span>0.00 s</span>
              <span>0.10 s</span>
            </div>
          </div>
          <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-ink/65">
            <span>
              <span className="mr-1 inline-block h-2 w-2 bg-trail-orange" />
              car really crosses
            </span>
            {m.fps && (
              <>
                <span>
                  <span className="mr-1 inline-block h-2 w-2 bg-[#7CC4A4]" />
                  first frame that shows it
                </span>
                <span>
                  <span className="mr-1 inline-block h-2 w-px bg-ink/60" />
                  frames ({Math.round(WINDOW * m.fps)} in a tenth of a second)
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. Read it yourself
// ---------------------------------------------------------------------------

function ReadItYourself({ day }: { day: RaceDay }) {
  const runs = useMemo(() => {
    const counted = new Set(standings(day).map((r) => r.run.id));
    return day.runs.filter((r) => counted.has(r.id)).sort((a, b) => a.elapsedMs - b.elapsedMs);
  }, [day]);
  const [runId, setRunId] = useState(runs[0]?.id ?? "");
  const [startShift, setStartShift] = useState(0);
  const [finishShift, setFinishShift] = useState(0);
  const run = runs.find((r) => r.id === runId);
  const car = day.cars.find((c) => c.id === run?.carId);

  const result = useMemo(() => {
    if (!run) return null;
    // Start from the recorded time so no shift means no change, then move by whole frames.
    const ms = run.elapsedMs + Math.round(((finishShift - startShift) * 1000) / 30);
    const before = standings(day).find((r) => r.run.id === run.id);
    // Your reading, treated as if it were exact, to see how far one frame moves a car.
    const moved = standings({ ...day, runs: day.runs.map((r) => (r.id === run.id ? { ...r, elapsedMs: ms, gateMs: null } : r)) });
    const after = moved.find((r) => r.run.id === run.id);
    const strict = moved.filter((r) => r.time.ms < ms).length + 1;
    return { ms, before, after, strict };
  }, [day, run, startShift, finishShift]);

  if (!run || !result) return null;

  return (
    <Card n={2} title="Read a run yourself">
      <p className="text-ink/75">
        The start is the first frame the car is visibly off the gate. The finish is the frame the car passes under the black finish
        gate. Two careful people can still pick frames one apart. Move the frames and watch what happens to the time and the place.
      </p>
      <label className="mt-4 block text-sm">
        <span className="font-medium">Run</span>
        <select
          value={runId}
          onChange={(e) => {
            setRunId(e.target.value);
            setStartShift(0);
            setFinishShift(0);
          }}
          className="mt-1 block w-full max-w-md rounded-lg border border-ink/20 bg-white px-2 py-1.5"
        >
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {day.cars.find((c) => c.id === r.carId)?.label}, clip {r.clip.replace("IMG_", "")}, {(r.elapsedMs / 1000).toFixed(2)} s
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Stepper label="Start frame" base={Math.round(run.startS * 30)} shift={startShift} setShift={setStartShift} />
        <Stepper label="Finish frame" base={Math.round(run.finishS * 30)} shift={finishShift} setShift={setFinishShift} />
        <div className="rounded-xl bg-stone-white p-4">
          <p className="text-sm text-ink/60">Your reading</p>
          <p className="text-2xl font-bold tabular-nums">
            {(result.ms / 1000).toFixed(3)} s
          </p>
          <p className="text-xs text-ink/55">about {Math.round((result.ms * 30) / 1000)} frames</p>
          <p className="text-sm text-ink/70">
            Recorded: {(run.elapsedMs / 1000).toFixed(2)} s.{" "}
            {result.ms !== run.elapsedMs && (
              <>
                Your reading is {(Math.abs(result.ms - run.elapsedMs) / 1000).toFixed(3)} s {result.ms > run.elapsedMs ? "slower" : "faster"}.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-blaze-maroon/20 bg-blaze-maroon/5 p-4 text-sm">
        <p>
          <span className="font-semibold">{car?.label}</span> is <span className="font-semibold">{result.before && fmtPlace(result.before)}</span>{" "}
          on the leaderboard.
          {result.ms !== run.elapsedMs && (
            <>
              {" "}
              If you trusted your reading to the exact frame, it would be <span className="font-semibold">{ordinalPlace(result.strict)}</span>.
              Allowing ±0.05 s, it is still <span className="font-semibold">{result.after && fmtPlace(result.after)}</span>.
            </>
          )}
        </p>
        <p className="mt-1 text-ink/70">
          One frame is 0.033 s. At the top of our leaderboard the cars are only 0.01 to 0.03 s apart, less than one frame, which is
          why the video cannot rank them.
        </p>
      </div>
    </Card>
  );
}

function ordinalPlace(n: number) {
  return fmtPlace({ placeFrom: n, placeTo: n });
}

function Stepper({ label, base, shift, setShift }: { label: string; base: number; shift: number; setShift: (n: number) => void }) {
  const btn = "h-9 w-9 rounded-lg border border-ink/20 bg-white text-lg font-semibold hover:border-trail-orange disabled:opacity-40";
  return (
    <div className="rounded-xl bg-stone-white p-4">
      <p className="text-sm text-ink/60">{label}</p>
      <div className="mt-1 flex items-center gap-3">
        <button type="button" className={btn} onClick={() => setShift(shift - 1)} disabled={shift <= -3} aria-label={`${label} one earlier`}>
          &minus;
        </button>
        <span className="min-w-[5rem] text-center text-2xl font-bold tabular-nums">{base + shift}</span>
        <button type="button" className={btn} onClick={() => setShift(shift + 1)} disabled={shift >= 3} aria-label={`${label} one later`}>
          +
        </button>
      </div>
      <p className="mt-1 text-xs text-ink/55">
        {shift === 0 ? "nearest frame to the recorded time" : `${Math.abs(shift)} frame${Math.abs(shift) > 1 ? "s" : ""} ${shift > 0 ? "later" : "earlier"}`},{" "}
        {((base + shift) / 30).toFixed(3)} s into the clip
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Better tools
// ---------------------------------------------------------------------------

function BetterTools({ day }: { day: RaceDay }) {
  const rows = useMemo(() => standings(day), [day]);
  const [a, setA] = useState(rows[0]?.car.id ?? "");
  const [b, setB] = useState(rows[1]?.car.id ?? "");
  const ra = rows.find((r) => r.car.id === a);
  const rb = rows.find((r) => r.car.id === b);
  if (!ra || !rb) return null;
  const gap = Math.abs(ra.time.ms - rb.time.ms) / 1000;

  return (
    <Card n={3} title="Could a better camera, or the gate, settle it?">
      <p className="text-ink/75">
        Pick two cars. If their real times were what the video says, which timing methods could tell them apart? A method can split
        two cars when the gap is bigger than its doubt, about a frame and a half for video.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {[
          [a, setA],
          [b, setB],
        ].map(([value, set], i) => (
          <label key={i} className="text-sm">
            <span className="block font-medium">Car {i + 1}</span>
            <select
              value={value as string}
              onChange={(e) => (set as (v: string) => void)(e.target.value)}
              className="mt-1 rounded-lg border border-ink/20 bg-white px-2 py-1.5"
            >
              {rows.map((r) => (
                <option key={r.car.id} value={r.car.id}>
                  {r.car.label} ({(r.time.ms / 1000).toFixed(2)} s)
                </option>
              ))}
            </select>
          </label>
        ))}
        <p className="self-end pb-1.5 text-sm">
          Gap: <span className="font-semibold tabular-nums">{gap.toFixed(2)} s</span>
        </p>
      </div>
      <table className="mt-4 w-full max-w-xl text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-ink/55">
          <tr>
            <th className="py-1.5">Method</th>
            <th className="py-1.5">Doubt</th>
            <th className="py-1.5">Can it split them?</th>
          </tr>
        </thead>
        <tbody>
          {METHODS.map((m) => {
            const u = uncertaintyS(m);
            const ok = a !== b && gap > u + 1e-9;
            return (
              <tr key={m.id} className="border-t border-ink/10">
                <td className="py-1.5">{m.label}</td>
                <td className="py-1.5 tabular-nums">±{u.toFixed(3)} s</td>
                <td className={`py-1.5 font-semibold ${ok ? "text-ridge-green" : "text-impact-orange"}`}>
                  {a === b ? "Pick two different cars" : ok ? "Yes" : "No, too close to call"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4. Why
// ---------------------------------------------------------------------------

function WhyItDiffers() {
  return (
    <Card n={4} title="Why two people can read different times">
      <div className="grid gap-4 md:grid-cols-2">
        <ul className="list-disc space-y-1.5 pl-5 text-ink/80">
          <li>
            <span className="font-medium">Which frame is &quot;off the gate&quot;?</span> The first frame the car moves a little, or the first
            frame it is clearly gone? People pick differently.
          </li>
          <li>
            <span className="font-medium">Motion blur.</span> A fast car smears across a frame, so its nose is hard to place.
          </li>
          <li>
            <span className="font-medium">Camera angle.</span> On some of our clips the start gate is small and far away, or the finish gate is
            out of the shot. Those runs are flagged on the leaderboard.
          </li>
          <li>
            <span className="font-medium">Between frames.</span> The real start and finish almost never land exactly on a frame, so every
            reading can be up to one frame off at each end.
          </li>
        </ul>
        <div className="rounded-xl bg-stone-white p-4 text-sm text-ink/80">
          <p className="font-semibold text-ink">Why the gate reads to 0.001 s</p>
          <p className="mt-1">
            The electronic gate starts its clock when the car is released and stops it the instant the car breaks a light beam at the
            finish. Its clock ticks a thousand times a second and no person has to judge a frame. That is why gate times have three
            decimals and video times on our leaderboard have two.
          </p>
          <p className="mt-2">
            The catch: the gate only tells you the time. The video shows you how the car got there, like a slow launch or a wobble.
          </p>
        </div>
      </div>
    </Card>
  );
}
