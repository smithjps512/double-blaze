"use client";

import { useActionState } from "react";
import { sendInquiry, type InquiryState } from "@/app/animals/[id]/actions";

export function InquiryForm({ animalId, animalName, defaultName, hasAnswers }: { animalId: string; animalName: string; defaultName: string; hasAnswers: boolean }) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(sendInquiry, {});
  if (state.ok) {
    return (
      <div className="rounded-2xl bg-pine-light p-5" role="status">
        <p className="font-display text-xl font-extrabold text-pine">Sent!</p>
        <p className="mt-1">The shelter has your note about {animalName} and will reply by email. You can see it under My pets.</p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="animalId" value={animalId} />
      <label>
        <span className="label">Your name</span>
        <input name="name" required defaultValue={defaultName} className="field" autoComplete="name" />
      </label>
      <label>
        <span className="label">A note for the shelter (optional)</span>
        <textarea
          name="message"
          rows={3}
          maxLength={2000}
          className="field"
          placeholder={`Tell them a little about your home and why ${animalName} caught your eye.`}
        />
      </label>
      {hasAnswers && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="shareAnswers" defaultChecked className="mt-0.5 h-5 w-5 accent-ember" />
          Share my match quiz answers with the shelter, so they can see how we fit.
        </label>
      )}
      {state.error && (
        <p className="rounded-xl bg-ember-light px-4 py-3 text-sm text-ember-dark" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Sending..." : `I'm interested in ${animalName}`}
      </button>
    </form>
  );
}
