"use client";

import { useState } from "react";

/**
 * The one interactive piece of the sign-in page.
 *
 * On success it says the same thing whether or not the address is known, which
 * matches what the route does. Telling a visitor "no account with that email"
 * would let anyone test who belongs to a private club, and a vetted
 * professional body exists precisely to keep that list closed.
 */
export function SignInForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);

    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setError("Could not reach the server. Please try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="notice" role="status">
        Check <strong>{email}</strong> for a sign-in link. It works once and
        expires in an hour.
      </p>
    );
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={state === "sending"}
      />
      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={state === "sending" || !email}>
        {state === "sending" ? "Sending..." : "Email me a link"}
      </button>
    </form>
  );
}
