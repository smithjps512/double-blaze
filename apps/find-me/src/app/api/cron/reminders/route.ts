import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/data";
import { sendCareReminder } from "@/lib/email";
import { addDays, todayIso } from "@/lib/care-plan";
import { groupByAdoption, REMIND_DAYS_AHEAD, type ReminderRow } from "@/lib/reminders";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reminders. Vercel Cron, daily (apps/find-me/vercel.json).
 * Emails each owner what is coming up for each pet, once per due date. The
 * route checks the CRON_SECRET bearer itself, so it is not publicly callable.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const today = todayIso();
  const { data, error } = await db
    .from("fm_care_tasks")
    .select("id, adoption_id, kind, title, due_on, enabled, repeat_days, last_done_on, reminded_for, fm_adoptions!inner(pet_name, adopter_email, status)")
    .eq("enabled", true)
    .neq("kind", "feeding")
    .lte("due_on", addDays(today, REMIND_DAYS_AHEAD))
    .neq("fm_adoptions.status", "rejected")
    .limit(2000);
  if (error) {
    console.error("[find-me] reminders query:", error.message);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  type Row = {
    id: string;
    adoption_id: string;
    kind: string;
    title: string;
    due_on: string;
    enabled: boolean;
    repeat_days: number | null;
    last_done_on: string | null;
    reminded_for: string | null;
    fm_adoptions: { pet_name: string; adopter_email: string };
  };
  const rows = (data ?? []) as unknown as Row[];
  const owner = new Map(rows.map((r) => [r.adoption_id, r.fm_adoptions]));
  const groups = groupByAdoption(
    rows.map<ReminderRow>((r) => ({
      id: r.id,
      adoptionId: r.adoption_id,
      kind: r.kind,
      title: r.title,
      dueOn: r.due_on,
      enabled: r.enabled,
      repeatDays: r.repeat_days,
      lastDoneOn: r.last_done_on,
      remindedFor: r.reminded_for,
    })),
    today,
  );

  let sent = 0;
  for (const [adoptionId, tasks] of groups) {
    const who = owner.get(adoptionId);
    if (!who?.adopter_email) continue;
    const ok = await sendCareReminder({
      to: who.adopter_email,
      petName: who.pet_name,
      items: tasks.map((t) => ({ title: t.title, due: t.dueOn })),
      url: `${siteUrl()}/my/pets/${adoptionId}`,
    });
    if (!ok) continue;
    sent++;
    // Record which due date each task was reminded for. One update per task,
    // because each has its own due date.
    await Promise.all(tasks.map((t) => db.from("fm_care_tasks").update({ reminded_for: t.dueOn }).eq("id", t.id)));
  }
  return NextResponse.json({ pets: groups.size, emailsSent: sent });
}
