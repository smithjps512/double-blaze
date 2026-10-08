"use client";

import { useActionState } from "react";
import { requestLink, type LinkState } from "@/app/sign-in/actions";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(requestLink, {});

  if (state.sentTo) {
    return (
      <div className="rounded-2xl border-2 border-bms bg-bms-light p-6">
        <p className="font-display text-2xl font-extrabold">Check your inbox</p>
        <p className="mt-2">
          We sent a sign-in link to <strong>{state.sentTo}</strong>. Tap it and the survey opens.
        </p>
        <p className="mt-3 text-sm text-muted">
          Nothing after a few minutes? Check Junk or Quarantine. It comes from Paint Your Spot at
          doubleblaze.solutions.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="font-display text-lg font-bold">Your MCPS email</span>
        <input
          name="email"
          type="email"
          defaultValue={state.email}
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@mcps.org"
          className="mt-2 block w-full rounded-lg border-2 border-asphalt/20 bg-white px-4 py-3 text-lg focus:border-asphalt focus:outline-none focus:ring-4 focus:ring-tape/60"
        />
      </label>
      {state.error && (
        <p role="alert" className="font-semibold text-sold">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="focus-ring w-full rounded-full bg-bms px-8 py-4 font-display text-lg font-extrabold text-tape shadow-sign transition hover:bg-bms-dark disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send my sign-in link"}
      </button>
      <p className="text-sm text-muted">No password. We email you a link that signs you in with one tap.</p>
    </form>
  );
}
