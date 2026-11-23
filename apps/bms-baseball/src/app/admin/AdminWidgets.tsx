"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-6 space-y-3">
      <label htmlFor="password" className="block font-semibold">
        Coach password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="focus-ring w-full rounded-xl border-2 border-bms/20 bg-white px-4 py-3"
      />
      {error && (
        <p role="alert" className="font-semibold text-stitch">
          {error}
        </p>
      )}
      <button
        disabled={pending}
        className="focus-ring rounded-full bg-bms px-6 py-3 font-bold text-white hover:bg-bms-dark disabled:opacity-70"
      >
        {pending ? "Checking..." : "Open the sign up list"}
      </button>
    </form>
  );
}

/** Submit button for a delete form that asks first. */
export function DeleteButton({ name }: { name: string }) {
  return (
    <button
      onClick={(e) => {
        if (!window.confirm(`Delete the sign up for ${name}? This can't be undone.`)) e.preventDefault();
      }}
      className="rounded-lg px-2 py-1 text-xs font-semibold text-stitch hover:bg-stitch/10"
    >
      Delete
    </button>
  );
}
