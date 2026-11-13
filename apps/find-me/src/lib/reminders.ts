import { addDays } from "./care-plan";

/**
 * Which care tasks get an email today. Pure, so it is tested.
 *
 * A task is emailed once per due date, a few days ahead (or as soon as it is
 * found, if already overdue). Daily feeding never goes by email: a daily email
 * is spam. It waits for push notifications.
 */

export const REMIND_DAYS_AHEAD = 3;

export interface ReminderRow {
  id: string;
  adoptionId: string;
  kind: string;
  title: string;
  dueOn: string;
  enabled: boolean;
  repeatDays: number | null;
  lastDoneOn: string | null;
  remindedFor: string | null;
}

export function needsReminder(t: ReminderRow, today: string): boolean {
  if (!t.enabled || t.kind === "feeding") return false;
  if (!t.repeatDays && t.lastDoneOn) return false;
  if (t.remindedFor === t.dueOn) return false;
  return t.dueOn <= addDays(today, REMIND_DAYS_AHEAD);
}

/** One email per pet, listing everything coming up for it. */
export function groupByAdoption(rows: ReminderRow[], today: string): Map<string, ReminderRow[]> {
  const out = new Map<string, ReminderRow[]>();
  for (const r of rows) {
    if (!needsReminder(r, today)) continue;
    out.set(r.adoptionId, [...(out.get(r.adoptionId) ?? []), r]);
  }
  for (const list of out.values()) list.sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  return out;
}
