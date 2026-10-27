"use client";

import { useState } from "react";

/** "Email me a review link." It can only send to the configured teacher address. */
export function QaLinkRequest() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function request() {
    setState("sending");
    try {
      const res = await fetch("/api/launch/qa/link", { method: "POST" });
      const data = await res.json();
      setMessage(data.message ?? data.error ?? null);
      setState(res.ok ? "sent" : "failed");
    } catch {
      setMessage("Could not reach the server.");
      setState("failed");
    }
  }

  return (
    <div>
      <button type="button" onClick={request} disabled={state === "sending" || state === "sent"} className="btn-primary disabled:opacity-60">
        {state === "sending" ? "Sending..." : state === "sent" ? "Sent" : "Email me a link to review QA reports"}
      </button>
      {message && <p className={`mt-3 text-sm ${state === "failed" ? "text-blaze-maroon" : "text-ink/70"}`}>{message}</p>}
    </div>
  );
}
