"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Staff control to launch a Trail Run build. Captures the live URL (required)
 * and calls the launch API, which creates the trial subscription, sets the
 * window dates, and flips the engagement to active_window. A missing URL is
 * rejected by the server, so a launched build always has a live URL.
 */
export function LaunchControl({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [liveUrl, setLiveUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function launch() {
    const url = liveUrl.trim();
    if (!url) {
      setError("Enter the live URL to launch.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/trail-run/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, liveUrl: url }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not launch. Please try again.");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/[0.06] p-5">
        <p className="font-semibold text-ink">Launched.</p>
        <p className="mt-1 text-sm text-ink/70">
          The subscription is on a 30-day trial, the window has started, and the
          launch email has gone out.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-trail-orange/30 bg-trail-orange/[0.06] p-5">
      <h2 className="text-lg font-bold text-ink">Launch this build</h2>
      <p className="mt-1 text-sm text-ink/70">
        Marking this live creates the trial subscription on the saved card,
        starts the 30-day window, and sends the launch email. The live URL is
        required.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={liveUrl}
          onChange={(e) => setLiveUrl(e.target.value)}
          placeholder="https://the-live-solution.example.com"
          className="min-w-[18rem] flex-1 rounded-md border border-ink/15 bg-stone-white px-3 py-2 text-sm text-ink outline-none focus:border-trail-orange"
        />
        <button
          type="button"
          onClick={launch}
          disabled={busy}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Launching..." : "Mark live"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-impact-orange">
          {error}
        </p>
      )}
    </div>
  );
}
