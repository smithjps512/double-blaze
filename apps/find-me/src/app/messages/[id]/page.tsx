import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DetailCheck } from "@/components/DetailCheck";
import { MessageForm } from "@/components/MessageForm";
import { ReportBadge } from "@/components/ReportCard";
import { getConversation } from "@/lib/conversations";
import { getReportPrivate, reportTitle } from "@/lib/reports-data";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };
export const dynamic = "force-dynamic";

type Msg = { id: string; sender_id: string; body: string; created_at: string };

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { viewer, db } = await getViewer();
  if (!viewer || !db) redirect(`/sign-in?next=/messages/${id}`);
  const conv = await getConversation(db, id, viewer.id);
  if (!conv) notFound();

  const [{ data }, priv] = await Promise.all([
    db.from("fm_messages").select("id, sender_id, body, created_at").eq("conversation_id", id).order("created_at"),
    conv.side === "poster" ? getReportPrivate(db, conv.report.id) : Promise.resolve(null),
  ]);
  const messages = (data ?? []) as Msg[];
  // Opening the thread marks it read (the column grant allows only this).
  await db
    .from("fm_conversations")
    .update({ [conv.side === "poster" ? "poster_read_at" : "helper_read_at"]: new Date().toISOString() })
    .eq("id", id);

  const other = conv.side === "poster" ? (conv.report.kind === "lost" ? "Helper" : "Possible owner") : conv.report.kind === "lost" ? "Owner" : "Finder";

  return (
    <div className="container-page max-w-2xl py-8">
      <Link href="/messages" className="btn-quiet -ml-3">
        ← Messages
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ReportBadge report={conv.report} />
        <h1 className="font-display text-3xl font-extrabold">
          <Link href={`/lost-found/${conv.report.id}`} className="underline-offset-4 hover:underline">
            {reportTitle(conv.report)}
          </Link>
        </h1>
      </div>

      {priv && (
        <div className="mt-4">
          <DetailCheck secret={priv.secretDetail} answer={conv.helperDetail} />
        </div>
      )}

      <p className="mt-4 rounded-2xl bg-ember-light px-4 py-3 text-sm text-ember-dark">
        <strong>Stay safe:</strong> never pay before a pet is back with you. Meet in a public place, like a shelter or a
        vet&apos;s office, and bring someone with you.
      </p>

      <ol className="mt-6 flex flex-col gap-3" aria-label="Messages">
        {messages.map((m) => {
          const mine = m.sender_id === viewer.id;
          return (
            <li key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <span className="mb-1 text-xs text-muted">
                {mine ? "You" : other} · {when(m.created_at)}
              </span>
              <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 ${mine ? "bg-ember text-white" : "border border-line bg-white"}`}>
                {m.body}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="sticky bottom-16 mt-6 rounded-2xl bg-cream/95 py-3 backdrop-blur sm:bottom-0">
        <MessageForm conversationId={id} />
      </div>
    </div>
  );
}
