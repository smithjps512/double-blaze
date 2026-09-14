"use client";

import { useState } from "react";

/**
 * "Email me my queue link."
 *
 * The link is the credential, so this button cannot show it; it can only send
 * it to the one address the server already knows. That is what lets the
 * button sit on a public page: a student pressing it sends their teacher an
 * email the teacher wanted anyway, at most once every few minutes.
 */
export function QueueLinkRequest({ inline = false }: { inline?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function request() {
    setState("sending");
    try {
      const res = await fetch("/api/trail-crew/queue-link", { method: "POST" });
      const data = await res.json();
      setMessage(data.message ?? data.error ?? null);
      setState(res.ok ? "sent" : "failed");
    } catch {
      setMessage("Could not reach the server.");
      setState("failed");
    }
  }

  const button = (
    <button
      type="button"
      onClick={request}
      disabled={state === "sending" || state === "sent"}
      className={
        inline
          ? "underline underline-offset-2 text-blaze-maroon disabled:text-ink/40"
          : "btn-primary"
      }
    >
      {state === "sending" ? "Sending..." : state === "sent" ? "Sent" : "Email me a link to the whole queue"}
    </button>
  );

  if (inline) {
    return (
      <>
        {button}
        {message && <span className="ml-2 text-ink/60">{message}</span>}
      </>
    );
  }
  return (
    <div>
      {button}
      {message && <p className="mt-3 text-sm text-ink/70">{message}</p>}
    </div>
  );
}
