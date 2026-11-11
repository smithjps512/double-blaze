"use client";

import { useState } from "react";
import { officialTime, fmtTime, sessionName, type RaceCar, type RaceDay } from "@/lib/race-day/model";

/**
 * The teacher's to-do list for names: every car with a run but no student,
 * fastest first within each session, and every student with no car. Each row
 * links a student already on the list or adds a new first name, and can ask
 * the frame viewer to show who was at the start gate for that run.
 *
 * The list shrinks as names go in. No em dashes in any copy here.
 */

export interface GateRequest {
  clip: string;
  seconds: number;
  label: string;
  nonce: number;
}

type Save = (body: Record<string, unknown>, done?: string) => Promise<boolean>;

export default function NeedsName({
  day,
  disabled,
  save,
  showGate,
}: {
  day: RaceDay;
  disabled: boolean;
  save: Save;
  showGate: (r: Omit<GateRequest, "nonce">) => void;
}) {
  const named = new Set(day.students.map((s) => s.carId).filter(Boolean));
  const rows = day.cars
    .filter((c) => !named.has(c.id))
    .map((car) => {
      const runs = day.runs.filter((r) => r.carId === car.id && !r.excluded);
      const best = [...runs].sort((a, b) => officialTime(a).ms - officialTime(b).ms)[0];
      return { car, run: best };
    })
    .filter((x) => x.run)
    .sort((a, b) => a.car.sessionId.localeCompare(b.car.sessionId) || officialTime(a.run!).ms - officialTime(b.run!).ms);
  const loose = day.students.filter((s) => !s.carId);

  if (rows.length === 0 && loose.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-ridge-green/40 bg-white p-5">
        <h2 className="text-xl font-bold">Needs a name</h2>
        <p className="mt-1 text-sm text-ridge-green">Every car with a run has a student. Nothing left to match.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-blaze-maroon/30 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">Needs a name</h2>
        <p className="text-sm text-ink/65">
          {rows.length} {rows.length === 1 ? "car" : "cars"} without a student
          {loose.length > 0 && `, ${loose.length} ${loose.length === 1 ? "student" : "students"} without a car`}
        </p>
      </div>
      <p className="mt-1 max-w-3xl text-sm text-ink/65">
        At the gate opens that run in the frame viewer below, zoomed on the students at the launcher. Pick a student already on the list
        or type a first name. Students still see cars only until you tick Show first name.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink/55">
            <tr>
              <th className="py-1.5 pr-3">Car</th>
              <th className="py-1.5 pr-3">Run</th>
              <th className="py-1.5 pr-3">See who raced</th>
              <th className="py-1.5">Who is it?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ car, run }) => (
              <tr key={car.id} className="border-t border-ink/10 align-top">
                <td className="py-2 pr-3">
                  <span className="font-medium">{car.label}</span>
                  <span className="block text-xs text-ink/55">{sessionName(day.sessions.find((s) => s.id === car.sessionId))}</span>
                  {car.hint && <span className="mt-1 block max-w-xs text-xs text-ink/60">{car.hint}</span>}
                </td>
                <td className="py-2 pr-3 tabular-nums">
                  {fmtTime(officialTime(run!))}
                  <span className="block text-xs text-ink/55">clip {run!.clip.replace("IMG_", "")}</span>
                </td>
                <td className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => showGate({ clip: run!.clip.toUpperCase(), seconds: run!.startS - 0.3, label: `${car.label}, ${fmtTime(officialTime(run!))}` })}
                    className="rounded-lg border border-ink/20 bg-white px-2.5 py-1 hover:border-trail-orange"
                  >
                    At the gate
                  </button>
                </td>
                <td className="py-2">
                  <NameRow car={car} loose={loose} disabled={disabled} save={save} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loose.length > 0 && (
        <p className="mt-3 text-sm text-ink/70">
          <span className="font-medium">Students without a car:</span>{" "}
          {loose.map((s) => (s.carNote ? `${s.firstName} (${s.carNote.split(".")[0]})` : s.firstName)).join(", ")}.
        </p>
      )}
    </section>
  );
}

function NameRow({ car, loose, disabled, save }: { car: RaceCar; loose: RaceDay["students"]; disabled: boolean; save: Save }) {
  const [pick, setPick] = useState("");
  const [name, setName] = useState("");
  const isNew = pick === "new";
  const ready = isNew ? name.trim().length > 0 : pick !== "";

  async function link() {
    if (isNew) {
      const ok = await save({ op: "add-student", firstName: name, carNote: car.label, carId: car.id }, `${name.trim()} linked to ${car.label}.`);
      if (ok) setName("");
    } else {
      const st = loose.find((s) => s.id === pick);
      await save({ op: "student", id: pick, carId: car.id }, `${st?.firstName ?? "Student"} linked to ${car.label}.`);
    }
    setPick("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={pick}
        disabled={disabled}
        onChange={(e) => setPick(e.target.value)}
        className="rounded-lg border border-ink/20 bg-white px-2 py-1"
        aria-label={`Student for ${car.label}`}
      >
        <option value="">Choose</option>
        {loose.map((s) => (
          <option key={s.id} value={s.id}>
            {s.firstName}
          </option>
        ))}
        <option value="new">New name...</option>
      </select>
      {isNew && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="First name"
          disabled={disabled}
          className="w-32 rounded-lg border border-ink/20 px-2 py-1"
          aria-label="First name"
        />
      )}
      <button
        type="button"
        disabled={disabled || !ready}
        onClick={link}
        className="rounded-lg bg-blaze-maroon px-3 py-1 font-semibold text-white disabled:opacity-40"
      >
        Link
      </button>
    </div>
  );
}
