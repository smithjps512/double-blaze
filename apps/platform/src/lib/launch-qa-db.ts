import "server-only";
import { getSupabaseServiceClient } from "./supabase";
import type { QaKind, QaReport, QaStatus } from "./launch/qa";

/**
 * Storage for /play QA reports. See supabase/migrations/0046_launch_qa.sql.
 *
 * Service role only, and every function returns null rather than throwing
 * when Supabase is not configured, so /play still lets students play.
 */

export interface StoredReport {
  id: string;
  app: string;
  kind: QaKind;
  answers: Record<string, string>;
  period: number;
  teamName: string;
  status: QaStatus;
  createdAt: string;
}

type Row = { id: string; app: string; kind: QaKind; answers: Record<string, string>; period: number; team_name: string; status: QaStatus; created_at: string };
const COLUMNS = "id, app, kind, answers, period, team_name, status, created_at";
const toReport = (r: Row): StoredReport => ({
  id: r.id,
  app: r.app,
  kind: r.kind,
  answers: r.answers ?? {},
  period: r.period,
  teamName: r.team_name,
  status: r.status,
  createdAt: r.created_at,
});

export async function addReport(report: QaReport): Promise<boolean | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { error } = await db.from("launch_qa").insert({
    app: report.app,
    kind: report.kind,
    answers: report.answers,
    period: report.period,
    team_key: report.teamKey,
    team_name: report.teamName,
  });
  if (error) console.error("[launch-qa] insert failed", error.message);
  return !error;
}

/** Approved reports about one app: what its team sees. */
export async function approvedFor(app: string): Promise<StoredReport[] | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data, error } = await db.from("launch_qa").select(COLUMNS).eq("app", app).eq("status", "approved").order("created_at", { ascending: false }).limit(100);
  if (error) {
    console.error("[launch-qa] read failed", error.message);
    return null;
  }
  return (data as Row[]).map(toReport);
}

/** Everything, newest first, for the teacher's review page. */
export async function allReports(): Promise<StoredReport[] | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data, error } = await db.from("launch_qa").select(COLUMNS).order("created_at", { ascending: false }).limit(500);
  if (error) {
    console.error("[launch-qa] review read failed", error.message);
    return null;
  }
  return (data as Row[]).map(toReport);
}

export async function pendingCount(): Promise<number> {
  const db = getSupabaseServiceClient();
  if (!db) return 0;
  const { count } = await db.from("launch_qa").select("id", { count: "exact", head: true }).eq("status", "pending");
  return count ?? 0;
}

export async function setStatus(id: string, status: QaStatus): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db.from("launch_qa").update({ status, decided_at: status === "pending" ? null : new Date().toISOString() }).eq("id", id);
  if (error) console.error("[launch-qa] decide failed", error.message);
  return !error;
}
