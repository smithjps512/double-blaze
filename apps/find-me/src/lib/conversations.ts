import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUnread, sideOf } from "./messages";
import { reportFromRow, type ReportRow } from "./reports-data";
import type { Report } from "./reports";

export interface ConversationSummary {
  id: string;
  report: Report;
  side: "poster" | "helper";
  helperDetail: string;
  lastMessageAt: string;
  unread: boolean;
}

type ConvRow = {
  id: string;
  poster_id: string;
  helper_id: string;
  helper_detail: string;
  last_message_at: string;
  poster_read_at: string | null;
  helper_read_at: string | null;
  fm_reports: ReportRow | null;
};

const SELECT = "id, poster_id, helper_id, helper_detail, last_message_at, poster_read_at, helper_read_at, fm_reports(*)";

function summarize(r: ConvRow, userId: string): ConversationSummary | null {
  const side = sideOf({ posterId: r.poster_id, helperId: r.helper_id }, userId);
  if (!side || !r.fm_reports) return null;
  return {
    id: r.id,
    report: reportFromRow(r.fm_reports),
    side,
    helperDetail: r.helper_detail,
    lastMessageAt: r.last_message_at,
    unread: isUnread(r.last_message_at, side === "poster" ? r.poster_read_at : r.helper_read_at),
  };
}

/** Every conversation the user is in, newest first. RLS limits it to theirs. */
export async function listConversations(db: SupabaseClient, userId: string): Promise<ConversationSummary[]> {
  const { data, error } = await db.from("fm_conversations").select(SELECT).order("last_message_at", { ascending: false }).limit(200);
  if (error) console.error("[find-me] conversations:", error.message);
  return ((data ?? []) as unknown as ConvRow[]).map((r) => summarize(r, userId)).filter((c): c is ConversationSummary => Boolean(c));
}

export async function getConversation(db: SupabaseClient, id: string, userId: string): Promise<ConversationSummary | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("fm_conversations").select(SELECT).eq("id", id).maybeSingle();
  return data ? summarize(data as unknown as ConvRow, userId) : null;
}

export async function unreadCount(db: SupabaseClient, userId: string): Promise<number> {
  return (await listConversations(db, userId)).filter((c) => c.unread).length;
}
