"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { todayIso } from "@/lib/care-plan";
import { isDemo, listShelters, siteUrl } from "@/lib/data";
import { sendNewMessageNotice, sendReportAlertToShelter } from "@/lib/email";
import { shouldNotify } from "@/lib/messages";
import { photoFrom, uploadPhoto } from "@/lib/photos";
import { parseReportForm, publicPointFor } from "@/lib/reports";
import { getReport, reportTitle } from "@/lib/reports-data";
import { getServiceClient } from "@/lib/supabase";
import { getViewer } from "@/lib/viewer";

export interface FormState {
  errors?: Record<string, string>;
  error?: string;
}

const DEMO = "Demo mode: posts and messages are not saved. In the live app this goes live right away.";

export async function createReport(_prev: FormState, form: FormData): Promise<FormState> {
  if (isDemo()) return { error: DEMO };
  const { viewer, db } = await getViewer();
  if (!viewer || !db) return { error: "Sign in first." };

  // Today in the poster's own time zone can be a day ahead of UTC.
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const { value, errors } = parseReportForm(form, tomorrow);
  if (!value) return { errors };

  let photoUrl: string | null = null;
  const photo = photoFrom(form);
  if (photo) {
    const up = await uploadPhoto(`reports/${viewer.id}`, photo);
    if (up.error) return { errors: { photo: up.error } };
    photoUrl = up.url ?? null;
  }

  const pub = publicPointFor(value);
  const { data, error } = await db
    .from("fm_reports")
    .insert({
      kind: value.kind,
      user_id: viewer.id,
      species: value.species,
      name: value.name,
      sex: value.sex,
      size: value.size,
      colors: value.colors,
      description: value.description,
      photo_url: photoUrl,
      seen_on: value.seenOn,
      area_text: value.areaText,
      public_lat: pub.lat,
      public_lng: pub.lng,
      microchipped: value.microchipped,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[find-me] report:", error?.message);
    return { error: "That did not post. Try again." };
  }
  const id = (data as { id: string }).id;
  const { error: privError } = await db
    .from("fm_report_private")
    .insert({ report_id: id, exact_lat: value.exact.lat, exact_lng: value.exact.lng, secret_detail: value.secretDetail });
  if (privError) {
    // A post without its private row would have no secret detail to check
    // against. Take it down rather than leave it half made.
    console.error("[find-me] report private:", privError.message);
    await db.from("fm_reports").update({ status: "closed" }).eq("id", id);
    return { error: "That did not post. Try again." };
  }

  const title = reportTitle(value);
  const shelters = await listShelters();
  await Promise.all(
    shelters
      .filter((s) => s.email)
      .map((s) =>
        sendReportAlertToShelter({
          to: s.email,
          title,
          areaText: value.areaText,
          colors: value.colors,
          seenOn: value.seenOn,
          microchipped: value.microchipped,
          url: `${siteUrl()}/lost-found/${id}`,
        }),
      ),
  );
  revalidatePath("/lost-found");
  redirect(`/lost-found/${id}?posted=1`);
}

export async function setReportStatus(form: FormData): Promise<void> {
  const id = String(form.get("reportId") ?? "");
  const status = String(form.get("status") ?? "");
  if (!["open", "reunited", "closed"].includes(status)) return;
  const { viewer, db } = await getViewer();
  if (!viewer || !db) return;
  // RLS limits this to the poster (or an admin).
  await db
    .from("fm_reports")
    .update({ status, resolved_at: status === "open" ? null : new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/lost-found/${id}`);
  revalidatePath("/lost-found");
}

async function emailOf(userId: string): Promise<string | null> {
  const service = getServiceClient();
  if (!service) return null;
  const { data } = await service.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

/** Notifies the other person, at most once per quiet window, and records it. */
async function notify(convId: string, recipient: "poster" | "helper", about: string, first: boolean) {
  const service = getServiceClient();
  if (!service) return;
  const { data } = await service
    .from("fm_conversations")
    .select("poster_id, helper_id, poster_notified_at, helper_notified_at, poster_read_at, helper_read_at")
    .eq("id", convId)
    .single();
  if (!data) return;
  const c = data as Record<string, string | null>;
  if (!shouldNotify(c[`${recipient}_notified_at`], c[`${recipient}_read_at`], new Date())) return;
  const to = await emailOf(c[`${recipient}_id`]!);
  if (!to) return;
  const sent = await sendNewMessageNotice({ to, about, url: `${siteUrl()}/messages/${convId}`, first });
  if (sent) await service.from("fm_conversations").update({ [`${recipient}_notified_at`]: new Date().toISOString() }).eq("id", convId);
}

/**
 * "I found your pet" / "This is my pet". The helper's description of a
 * detail not in the post is saved with the conversation and cannot be
 * edited later (column grants in 0056).
 */
export async function startConversation(_prev: FormState, form: FormData): Promise<FormState> {
  if (isDemo()) return { error: DEMO };
  const reportId = String(form.get("reportId") ?? "");
  const detail = String(form.get("detail") ?? "").trim().slice(0, 300);
  const body = String(form.get("body") ?? "").trim().slice(0, 2000);
  const { viewer, db } = await getViewer();
  if (!viewer || !db) return { error: "Sign in first." };
  const report = await getReport(reportId);
  if (!report || report.status !== "open") return { error: "This post is no longer open." };
  if (report.userId === viewer.id) return { error: "This is your own post." };
  if (detail.length < 3) return { errors: { detail: "Describe one thing about the pet that is not in the post." } };
  if (!body) return { errors: { body: "Write a short message." } };

  const { data: existing } = await db.from("fm_conversations").select("id").eq("report_id", reportId).eq("helper_id", viewer.id).maybeSingle();
  if (existing) redirect(`/messages/${(existing as { id: string }).id}`);

  const { data, error } = await db
    .from("fm_conversations")
    .insert({ report_id: reportId, poster_id: report.userId, helper_id: viewer.id, helper_detail: detail })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[find-me] conversation:", error?.message);
    return { error: "That did not send. Try again." };
  }
  const convId = (data as { id: string }).id;
  await db.from("fm_messages").insert({ conversation_id: convId, sender_id: viewer.id, body });
  await notify(convId, "poster", reportTitle(report), true);
  redirect(`/messages/${convId}`);
}

export async function sendMessage(_prev: FormState, form: FormData): Promise<FormState> {
  if (isDemo()) return { error: DEMO };
  const convId = String(form.get("conversationId") ?? "");
  const body = String(form.get("body") ?? "").trim().slice(0, 2000);
  if (!body) return { errors: { body: "Write a message first." } };
  const { viewer, db } = await getViewer();
  if (!viewer || !db) return { error: "Sign in first." };
  const { data: conv } = await db.from("fm_conversations").select("poster_id, helper_id, report_id").eq("id", convId).maybeSingle();
  if (!conv) return { error: "Conversation not found." };
  const c = conv as { poster_id: string; helper_id: string; report_id: string };
  const { error } = await db.from("fm_messages").insert({ conversation_id: convId, sender_id: viewer.id, body });
  if (error) {
    console.error("[find-me] message:", error.message);
    return { error: "That did not send. Try again." };
  }
  const report = await getReport(c.report_id);
  await notify(convId, viewer.id === c.poster_id ? "helper" : "poster", report ? reportTitle(report) : "your post", false);
  revalidatePath(`/messages/${convId}`);
  revalidatePath("/messages");
  return {};
}
