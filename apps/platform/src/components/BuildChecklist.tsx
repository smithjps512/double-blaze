"use client";

import { useState } from "react";

export interface BuildTask {
  id: string;
  title: string;
  status: "not_started" | "in_progress" | "done";
  notes: string | null;
}

const STATUS_LABELS: Record<BuildTask["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

/**
 * Internal Blue Trail build checklist (staff only). Each task shows its status
 * and notes; staff can update both. Saves through /api/build-tasks/[id].
 */
export function BuildChecklist({ tasks: initial }: { tasks: BuildTask[] }) {
  const [tasks, setTasks] = useState(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function patch(id: string, update: Partial<Pick<BuildTask, "status" | "notes">>) {
    setSavingId(id);
    setError("");
    try {
      const res = await fetch(`/api/build-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Could not save. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  function setStatus(id: string, status: BuildTask["status"]) {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, status } : x)));
    void patch(id, { status });
  }
  function setNotes(id: string, notes: string) {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, notes } : x)));
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm font-medium text-impact-orange">
          {error}
        </p>
      )}
      {tasks.map((task) => (
        <div key={task.id} className="rounded-lg border border-ink/10 bg-stone-white p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold text-ink">{task.title}</p>
            <select
              value={task.status}
              onChange={(e) => setStatus(task.id, e.target.value as BuildTask["status"])}
              disabled={savingId === task.id}
              className="rounded-md border border-ink/15 bg-stone-white px-2 py-1 text-sm text-ink"
            >
              {(Object.keys(STATUS_LABELS) as BuildTask["status"][]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={task.notes ?? ""}
            onChange={(e) => setNotes(task.id, e.target.value)}
            onBlur={(e) => patch(task.id, { notes: e.target.value })}
            placeholder="Notes for this task..."
            rows={2}
            className="mt-3 w-full rounded-md border border-ink/15 bg-stone-white px-3 py-2 text-sm text-ink outline-none focus:border-trail-orange"
          />
        </div>
      ))}
    </div>
  );
}
