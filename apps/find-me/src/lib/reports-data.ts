import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_CENTER, DEMO_REPORTS } from "./demo-data";
import type { LatLng } from "./geo";
import type { Report, ReportKind, ReportPrivate } from "./reports";
import { getSessionClient } from "./supabase";
import type { Species } from "./types";

/** Lost and found reads. Demo mode serves the invented sample posts. */

export type ReportRow = {
  id: string;
  kind: ReportKind;
  user_id: string;
  species: Species;
  name: string;
  sex: Report["sex"];
  size: Report["size"];
  colors: string;
  description: string;
  photo_url: string | null;
  seen_on: string;
  area_text: string;
  public_lat: number;
  public_lng: number;
  microchipped: Report["microchipped"];
  status: Report["status"];
  created_at: string;
};

export function reportFromRow(r: ReportRow): Report {
  return {
    id: r.id,
    kind: r.kind,
    userId: r.user_id,
    species: r.species,
    name: r.name ?? "",
    sex: r.sex,
    size: r.size,
    colors: r.colors,
    description: r.description ?? "",
    photoUrl: r.photo_url,
    seenOn: String(r.seen_on).slice(0, 10),
    areaText: r.area_text,
    publicPoint: { lat: r.public_lat, lng: r.public_lng },
    microchipped: r.microchipped,
    status: r.status,
    createdAt: r.created_at,
  };
}

export function mapCenter(): LatLng {
  const [lat, lng] = (process.env.FM_MAP_CENTER ?? "").split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng) ? { lat, lng } : DEMO_CENTER;
}

export interface ReportFilter {
  kind?: ReportKind;
  species?: Species;
  /** Include reunited posts (shown as good news). */
  withReunited?: boolean;
}

export async function listReports(f: ReportFilter = {}): Promise<Report[]> {
  const statuses = f.withReunited ? ["open", "reunited"] : ["open"];
  const db = await getSessionClient();
  if (!db) {
    return DEMO_REPORTS.filter(
      (r) => statuses.includes(r.status) && (!f.kind || r.kind === f.kind) && (!f.species || r.species === f.species),
    );
  }
  let q = db.from("fm_reports").select("*").in("status", statuses).order("seen_on", { ascending: false }).limit(300);
  if (f.kind) q = q.eq("kind", f.kind);
  if (f.species) q = q.eq("species", f.species);
  const { data, error } = await q;
  if (error) console.error("[find-me] reports:", error.message);
  return ((data ?? []) as ReportRow[]).map(reportFromRow);
}

export async function getReport(id: string): Promise<Report | null> {
  const db = await getSessionClient();
  if (!db) return DEMO_REPORTS.find((r) => r.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("fm_reports").select("*").eq("id", id).maybeSingle();
  return data ? reportFromRow(data as ReportRow) : null;
}

/** The exact spot and secret detail. RLS returns nothing unless the viewer posted it or is shelter staff. */
export async function getReportPrivate(db: SupabaseClient, id: string): Promise<ReportPrivate | null> {
  const { data } = await db.from("fm_report_private").select("*").eq("report_id", id).maybeSingle();
  if (!data) return null;
  const r = data as { report_id: string; exact_lat: number; exact_lng: number; secret_detail: string };
  return { reportId: r.report_id, exact: { lat: r.exact_lat, lng: r.exact_lng }, secretDetail: r.secret_detail };
}

export async function reunionCount(): Promise<number> {
  const db = await getSessionClient();
  if (!db) return DEMO_REPORTS.filter((r) => r.status === "reunited").length;
  const { data } = await db.rpc("fm_reunion_count");
  return typeof data === "number" ? data : 0;
}

export function reportTitle(r: Pick<Report, "kind" | "species" | "name">): string {
  const animal = r.species === "dog" ? "dog" : "cat";
  if (r.kind === "lost") return r.name ? `Lost ${animal}: ${r.name}` : `Lost ${animal}`;
  return `Found ${animal}`;
}
