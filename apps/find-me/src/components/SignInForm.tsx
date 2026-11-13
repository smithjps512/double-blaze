"use client";

import { useActionState } from "react";
import { requestLink, type LinkState } from "@/app/sign-in/actions";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(requestLink, {});
  if (state.sentTo) {
    return (
      <div className="card p-6 text-center" role="status">
        <p className="font-display text-2xl font-extrabold">Check your email</p>
        <p className="mt-2 text-muted">
          We sent a sign-in link to <strong className="text-ink">{state.sentTo}</strong>. It works once, for an hour.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="card flex flex-col gap-4 p-6">
      <input type="hidden" name="next" value={next} />
      <label>
        <span className="label">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={state.email}
          className="field"
          placeholder="you@example.com"
        />
      </label>
      {state.error && (
        <p className="rounded-xl bg-ember-light px-4 py-3 text-sm text-ember-dark" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Sending..." : "Email me a sign-in link"}
      </button>
      <p className="text-center text-xs text-muted">No password. We never share your email.</p>
    </form>
  );
}
