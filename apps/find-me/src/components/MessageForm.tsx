"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage, type FormState } from "@/app/lost-found/actions";

export function MessageForm({ conversationId }: { conversationId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMessage, {});
  const ref = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  // Clear the box after a successful send.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error && !state.errors) ref.current?.reset();
    wasPending.current = pending;
  }, [pending, state]);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="conversationId" value={conversationId} />
      <label htmlFor="body" className="sr-only">
        Message
      </label>
      <div className="flex gap-2">
        <textarea id="body" name="body" rows={2} maxLength={2000} required className="field flex-1" placeholder="Write a message" />
        <button className="btn-primary self-end" disabled={pending}>
          {pending ? "..." : "Send"}
        </button>
      </div>
      {(state.error || state.errors?.body) && (
        <p className="text-sm font-semibold text-ember-dark" role="alert">
          {state.error || state.errors?.body}
        </p>
      )}
    </form>
  );
}
