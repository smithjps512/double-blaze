"use client";

import { useActionState } from "react";
import { startConversation, type FormState } from "@/app/lost-found/actions";

export function RespondForm({ reportId, kind, petLabel }: { reportId: string; kind: "lost" | "found"; petLabel: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(startConversation, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="reportId" value={reportId} />
      <label>
        <span className="label">
          {kind === "lost" ? `Describe something about ${petLabel} that is not in this post` : "Describe something about your pet that is not in this post"}
        </span>
        <input name="detail" maxLength={300} className="field" placeholder="A marking, a scar, the collar, a habit" />
        <span className="mt-1 block text-xs text-muted">
          {kind === "lost"
            ? "The owner sees this next to a private detail they gave us. It helps them know you have the right pet. You cannot change it later."
            : "The finder sees this next to a private detail they noted. It is how they know the pet is really yours. You cannot change it later."}
        </span>
        {e.detail && <span className="mt-1 block text-sm font-semibold text-ember-dark">{e.detail}</span>}
      </label>
      <label>
        <span className="label">Message</span>
        <textarea
          name="body"
          rows={3}
          maxLength={2000}
          className="field"
          placeholder={kind === "lost" ? "Where and when you saw them, and whether they are with you now" : "When and where you lost them"}
        />
        {e.body && <span className="mt-1 block text-sm font-semibold text-ember-dark">{e.body}</span>}
      </label>
      {state.error && (
        <p className="rounded-xl bg-ember-light px-4 py-3 text-sm text-ember-dark" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn-primary self-start" disabled={pending}>
        {pending ? "Sending..." : "Send in Find Me"}
      </button>
      <p className="text-xs text-muted">Your email and phone stay private. You choose what to share in the conversation.</p>
    </form>
  );
}
