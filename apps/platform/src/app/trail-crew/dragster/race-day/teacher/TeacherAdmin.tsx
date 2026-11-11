"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ClipViewer, { type Marks } from "./ClipViewer";
import NeedsName, { type GateRequest } from "./NeedsName";
import {
  QUALITIES,
  QUALITY_LABEL,
  sessionName,
  type Quality,
  type RaceCar,
  type RaceDay,
  type RaceRun,
  type RaceStudent,
} from "@/lib/race-day/model";

/**
 * Teacher screen. Each car is a card with its runs under it. Confirm a car
 * once you have checked it against the clip; move a run to another car when
 * two runs turn out to be the same car; type a gate time when you have one.
 *
 * Cars only on purpose. Student names and photos are not stored here until
 * permission is in, and the clothing notes used to match cars stay on the
 * teacher's own device. No em dashes in any copy here.
 */

const WORKSHEET = "https://claude.ai/artifact/2Y1KjtUCEih6YwNTjojz4C";

async function send(body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch("/api/race-day/teacher", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.error ?? "Could not save.";
  } catch {
    return "Could not reach the server.";
  }
}

export default function TeacherAdmin({ day, saving, classLocked }: { day: RaceDay; saving: boolean; classLocked: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [marks, setMarks] = useState<Marks | null>(null);
  const [gateRequest, setGateRequest] = useState<GateRequest | null>(null);

  async function save(body: Record<string, unknown>, done = "Saved.") {
    setBusy(true);
    const error = await send(body);
    setBusy(false);
    setMsg(error ? { text: error, bad: true } : { text: done, bad: false });
    if (!error) router.refresh();
    return !error;
  }

  const confirmed = day.cars.filter((c) => c.confirmed).length;
  // Move to lists every car, from any class, so a finals run can join the student's prelim car.
  const carOptions: RaceCar[] = day.cars.map((c) => {
    const names = day.students.filter((st) => st.carId === c.id).map((st) => st.firstName);
    const s = day.sessions.find((x) => x.id === c.sessionId);
    return { ...c, label: `${names.length ? `${names.join(", ")}: ` : ""}${c.label} (${sessionName(s)})` };
  });

  return (
    <div className="container-page py-6 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Teacher</p>
          <h1 className="text-3xl font-bold md:text-4xl">Race Day setup</h1>
          <p className="mt-1 max-w-3xl text-ink/70">
            {confirmed} of {day.cars.length} cars confirmed. The leaderboard marks every unconfirmed car as not final.
          </p>
        </div>
        <a href={WORKSHEET} target="_blank" rel="noreferrer" className="text-sm font-medium text-trail-orange underline underline-offset-2">
          Graded worksheet
        </a>
      </header>

      <div className="mt-4 space-y-2 text-sm">
        {!saving && (
          <p className="rounded-xl border border-trail-orange/40 bg-trail-orange/10 p-3">
            The database is not connected here, so this screen shows the built in race data and cannot save. Apply
            supabase/migrations/0050_race_day.sql and set the Supabase keys to switch saving on.
          </p>
        )}
        {!classLocked && (
          <p className="rounded-xl border border-trail-orange/40 bg-trail-orange/10 p-3">
            No class password is set, so students cannot open the leaderboard yet. Set RACE_DAY_CLASS_PASSWORD.
          </p>
        )}
        <p className="rounded-xl border border-ink/10 bg-white p-3 text-ink/75">
          Students see cars only. A first name shows on the leaderboard only after you tick Permission received for that student.
          Names live in the database, never in the code, and no photos are stored. Photo clues describe cars only.
        </p>
      </div>

      {msg && (
        <p
          className={`sticky top-2 z-10 mt-4 rounded-lg px-3 py-2 text-sm shadow-sm ${msg.bad ? "bg-trail-orange text-white" : "bg-ridge-green text-white"}`}
          role="status"
        >
          {msg.text}
        </p>
      )}

      <NeedsName
        day={day}
        disabled={!saving || busy}
        save={save}
        showGate={(r) => setGateRequest({ ...r, nonce: Date.now() })}
      />

      <Students day={day} disabled={!saving || busy} save={save} />

      {day.sessions.map((session) => {
        const cars = day.cars.filter((c) => c.sessionId === session.id);
        return (
          <section key={session.id} className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/10 pb-2">
              <div>
                <h2 className="text-xl font-bold">{sessionName(session)}</h2>
                <p className="text-sm text-ink/60">
                  {session.label}, clips recorded {session.clipsRecorded}
                </p>
              </div>
              <label className="text-sm">
                <span className="mr-2 font-medium">Class period</span>
                <select
                  value={session.period ?? ""}
                  disabled={!saving || busy}
                  onChange={(e) => save({ op: "session", id: session.id, period: e.target.value ? Number(e.target.value) : null })}
                  className="rounded-lg border border-ink/20 bg-white px-2 py-1.5"
                >
                  <option value="">Not set</option>
                  {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {cars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  students={day.students.filter((st) => st.carId === car.id)}
                  runs={day.runs.filter((r) => r.carId === car.id)}
                  siblings={carOptions}
                  disabled={!saving || busy}
                  save={save}
                />
              ))}
            </div>
          </section>
        );
      })}

      <ClipViewer day={day} onMarks={setMarks} request={gateRequest} />

      <AddRun day={day} disabled={!saving || busy} save={save} marks={marks} />
    </div>
  );
}

type Save = (body: Record<string, unknown>, done?: string) => Promise<boolean>;

function CarCard({
  car,
  students,
  runs,
  siblings,
  disabled,
  save,
}: {
  car: RaceCar;
  students: RaceStudent[];
  runs: RaceRun[];
  siblings: RaceCar[];
  disabled: boolean;
  save: Save;
}) {
  const [label, setLabel] = useState(car.label);
  return (
    <div className={`rounded-xl border bg-white p-4 ${car.confirmed ? "border-ridge-green/40" : "border-ink/10"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={60}
          disabled={disabled}
          className="min-w-0 flex-1 rounded-lg border border-ink/20 px-2 py-1.5 font-semibold"
          aria-label="Car name"
        />
        {label.trim() !== car.label && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => save({ op: "car", id: car.id, label }, "Car renamed.")}
            className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm hover:border-trail-orange"
          >
            Rename
          </button>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => save({ op: "car", id: car.id, confirmed: !car.confirmed }, car.confirmed ? "Marked not confirmed." : "Confirmed.")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            car.confirmed ? "bg-ridge-green text-white" : "border border-blaze-maroon text-blaze-maroon hover:bg-blaze-maroon/5"
          }`}
        >
          {car.confirmed ? "Confirmed" : "Confirm"}
        </button>
      </div>
      <p className="mt-1 text-xs text-ink/50">
        {students.length === 0
          ? "No student linked. Shown as: car only"
          : students.map((st) => `${st.firstName} (${st.showName ? "name shown to class" : "car only"})`).join(", ")}
      </p>
      {car.hint && <p className="mt-2 rounded-lg bg-stone-white p-2 text-xs text-ink/70">Photo clue: {car.hint}</p>}
      <div className="mt-3 space-y-3">
        {runs.map((run) => (
          <RunRow key={`${run.id}:${run.gateMs}:${run.quality}:${run.note}`} run={run} siblings={siblings} disabled={disabled} save={save} />
        ))}
        {runs.length === 0 && <p className="text-sm text-ink/55">No runs. Move a run here or add one below.</p>}
      </div>
    </div>
  );
}

function RunRow({ run, siblings, disabled, save }: { run: RaceRun; siblings: RaceCar[]; disabled: boolean; save: Save }) {
  const [gate, setGate] = useState(run.gateMs === null ? "" : (run.gateMs / 1000).toFixed(3));
  const [quality, setQuality] = useState<Quality>(run.quality);
  const [note, setNote] = useState(run.note);
  const original = run.gateMs === null ? "" : (run.gateMs / 1000).toFixed(3);
  const dirty = gate.trim() !== original || quality !== run.quality || note !== run.note;

  return (
    <div className={`rounded-lg border p-3 text-sm ${run.excluded ? "border-dashed border-ink/20 opacity-70" : "border-ink/10"}`}>
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span>
          <span className="font-medium">{run.clip}</span>, {run.startS.toFixed(2)} to {run.finishS.toFixed(2)} s
          {run.stage === "final" && (
            <span className="ml-2 rounded bg-blaze-maroon px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Finals</span>
          )}
        </span>
        <span className="font-semibold tabular-nums">video {(run.elapsedMs / 1000).toFixed(2)} s</span>
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-ink/60">Gate time (s)</span>
          <input
            value={gate}
            onChange={(e) => setGate(e.target.value)}
            inputMode="decimal"
            placeholder="e.g. 0.931"
            disabled={disabled}
            className="mt-0.5 w-full rounded-lg border border-ink/20 px-2 py-1 tabular-nums"
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/60">Quality</span>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as Quality)}
            disabled={disabled}
            className="mt-0.5 w-full rounded-lg border border-ink/20 bg-white px-2 py-1"
          >
            {QUALITIES.map((q) => (
              <option key={q} value={q}>
                {QUALITY_LABEL[q]}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs text-ink/60">Note (students can see this)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            disabled={disabled}
            className="mt-0.5 w-full rounded-lg border border-ink/20 px-2 py-1"
          />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {dirty && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => save({ op: "run", id: run.id, gateS: gate.trim() === "" ? null : gate.trim(), quality, note }, "Run saved.")}
            className="rounded-lg bg-blaze-maroon px-3 py-1 font-semibold text-white disabled:opacity-50"
          >
            Save run
          </button>
        )}
        <label className="flex items-center gap-1.5">
          <span className="text-ink/60">Round</span>
          <select
            value={run.stage}
            disabled={disabled}
            onChange={(e) => save({ op: "run", id: run.id, stage: e.target.value }, e.target.value === "final" ? "Moved to finals." : "Moved to prelims.")}
            className="rounded-lg border border-ink/20 bg-white px-1.5 py-0.5"
          >
            <option value="prelim">Prelims</option>
            <option value="final">Finals</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={run.rerun}
            disabled={disabled}
            onChange={(e) => save({ op: "run", id: run.id, rerun: e.target.checked }, "Run saved.")}
          />
          Rerun
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={run.excluded}
            disabled={disabled}
            onChange={(e) => save({ op: "run", id: run.id, excluded: e.target.checked }, e.target.checked ? "Run left out of the standings." : "Run counted again.")}
          />
          Leave out of standings
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-ink/60">Move to</span>
          <select
            value={run.carId}
            disabled={disabled}
            onChange={(e) => save({ op: "run", id: run.id, carId: e.target.value }, "Run moved.")}
            className="rounded-lg border border-ink/20 bg-white px-1.5 py-0.5"
          >
            {siblings.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function AddRun({ day, disabled, save, marks }: { day: RaceDay; disabled: boolean; save: Save; marks: Marks | null }) {
  const blank = { sessionId: day.sessions[0]?.id ?? "", carId: "", newCarLabel: "", clip: "", startS: "", finishS: "", quality: "ok", note: "", rerun: false, stage: "prelim" };
  const [f, setF] = useState(blank);
  const section = useRef<HTMLElement>(null);

  // Times marked in the frame viewer land here, ready to check and save.
  useEffect(() => {
    if (!marks) return;
    setF((x) => ({ ...x, clip: marks.clip, startS: marks.startS.toFixed(2), finishS: marks.finishS.toFixed(2) }));
    section.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [marks]);
  const set = (patch: Partial<typeof blank>) => setF((x) => ({ ...x, ...patch }));
  const cars = day.cars.filter((c) => c.sessionId === f.sessionId);
  const elapsed = Number(f.finishS) - Number(f.startS);
  const input = "mt-0.5 w-full rounded-lg border border-ink/20 bg-white px-2 py-1.5";

  return (
    <section ref={section} className="mt-10 rounded-2xl border border-ink/10 bg-white p-5">
      <h2 className="text-xl font-bold">Add a run</h2>
      <p className="mt-1 text-sm text-ink/65">
        For a rerun or a new clip. Read the start and finish from the clip&apos;s own timer, in seconds.
      </p>
      <form
        className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await save({ op: "add-run", ...f, carId: f.carId || null }, "Run added.");
          if (ok) setF({ ...blank, sessionId: f.sessionId, stage: f.stage });
        }}
      >
        <label>
          <span className="text-xs text-ink/60">Session</span>
          <select value={f.sessionId} onChange={(e) => set({ sessionId: e.target.value, carId: "" })} className={input}>
            {day.sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {sessionName(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs text-ink/60">Car</span>
          <select value={f.carId} onChange={(e) => set({ carId: e.target.value })} className={input}>
            <option value="">New car</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {!f.carId && (
          <label>
            <span className="text-xs text-ink/60">New car name</span>
            <input value={f.newCarLabel} onChange={(e) => set({ newCarLabel: e.target.value })} placeholder="e.g. Silver" maxLength={60} className={input} />
          </label>
        )}
        <label>
          <span className="text-xs text-ink/60">Clip</span>
          <input value={f.clip} onChange={(e) => set({ clip: e.target.value })} placeholder="IMG_7830" className={input} />
        </label>
        <label>
          <span className="text-xs text-ink/60">Start (s into clip)</span>
          <input value={f.startS} onChange={(e) => set({ startS: e.target.value })} inputMode="decimal" className={input} />
        </label>
        <label>
          <span className="text-xs text-ink/60">Finish (s into clip)</span>
          <input value={f.finishS} onChange={(e) => set({ finishS: e.target.value })} inputMode="decimal" className={input} />
        </label>
        <label>
          <span className="text-xs text-ink/60">Quality</span>
          <select value={f.quality} onChange={(e) => set({ quality: e.target.value })} className={input}>
            {QUALITIES.map((q) => (
              <option key={q} value={q}>
                {QUALITY_LABEL[q]}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="text-xs text-ink/60">Note (students can see this)</span>
          <input value={f.note} onChange={(e) => set({ note: e.target.value })} maxLength={300} className={input} />
        </label>
        <label>
          <span className="text-xs text-ink/60">Round</span>
          <select value={f.stage} onChange={(e) => set({ stage: e.target.value })} className={input}>
            <option value="prelim">Prelims</option>
            <option value="final">Finals</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 self-end pb-2">
          <input type="checkbox" checked={f.rerun} onChange={(e) => set({ rerun: e.target.checked })} />
          This is a rerun
        </label>
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
          <button type="submit" disabled={disabled} className="rounded-lg bg-blaze-maroon px-4 py-2 font-semibold text-white disabled:opacity-50">
            Add run
          </button>
          {Number.isFinite(elapsed) && elapsed > 0 && f.startS && f.finishS && (
            <span className="tabular-nums text-ink/70">Video time: {elapsed.toFixed(2)} s</span>
          )}
        </div>
      </form>
    </section>
  );
}

function Students({ day, disabled, save }: { day: RaceDay; disabled: boolean; save: Save }) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const linked = day.students.filter((s) => s.carId).length;
  const carName = (c: RaceCar) => {
    const s = day.sessions.find((x) => x.id === c.sessionId);
    const run = day.runs.find((r) => r.carId === c.id);
    return `${c.label}, ${sessionName(s)}${run ? `, ${(run.elapsedMs / 1000).toFixed(2)} s` : ""}`;
  };

  return (
    <section className="mt-8 rounded-2xl border border-ink/10 bg-white p-5">
      <h2 className="text-xl font-bold">Students</h2>
      <p className="mt-1 text-sm text-ink/65">
        {linked} of {day.students.length} linked to a car. Links from photos are guesses until you check the clip and confirm the car.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink/55">
            <tr>
              <th className="py-1.5 pr-3">First name</th>
              <th className="py-1.5 pr-3">Car in photo</th>
              <th className="py-1.5 pr-3">Raced as</th>
              <th className="py-1.5">Permission received</th>
            </tr>
          </thead>
          <tbody>
            {day.students.map((st) => (
              <tr key={st.id} className="border-t border-ink/10 align-top">
                <td className="py-2 pr-3 font-medium">{st.firstName}</td>
                <td className="py-2 pr-3 text-ink/70">{st.carNote || "No note"}</td>
                <td className="py-2 pr-3">
                  <select
                    value={st.carId ?? ""}
                    disabled={disabled}
                    onChange={(e) => save({ op: "student", id: st.id, carId: e.target.value || null }, "Student linked.")}
                    className="w-full max-w-xs rounded-lg border border-ink/20 bg-white px-2 py-1"
                  >
                    <option value="">Not matched yet</option>
                    {day.sessions.map((s) => (
                      <optgroup key={s.id} label={sessionName(s)}>
                        {day.cars
                          .filter((c) => c.sessionId === s.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {carName(c)}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={st.showName}
                      disabled={disabled}
                      onChange={(e) =>
                        save(
                          { op: "student", id: st.id, showName: e.target.checked },
                          e.target.checked ? `${st.firstName} now shows on the leaderboard.` : `${st.firstName} is car only again.`,
                        )
                      }
                    />
                    <span className="text-ink/70">Show first name</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        className="mt-4 flex flex-wrap items-end gap-2 text-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await save({ op: "add-student", firstName: name, carNote: note }, "Student added.")) {
            setName("");
            setNote("");
          }
        }}
      >
        <label>
          <span className="block text-xs text-ink/60">First name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="rounded-lg border border-ink/20 px-2 py-1.5" />
        </label>
        <label className="min-w-[14rem] flex-1">
          <span className="block text-xs text-ink/60">Car (how it looks)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className="w-full rounded-lg border border-ink/20 px-2 py-1.5" />
        </label>
        <button type="submit" disabled={disabled || !name.trim()} className="rounded-lg bg-blaze-maroon px-4 py-1.5 font-semibold text-white disabled:opacity-50">
          Add student
        </button>
      </form>
    </section>
  );
}
