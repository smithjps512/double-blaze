"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Brief review and acceptance (spec section 5 step 4). The client reads the
 * rendered brief and either accepts it or requests changes. Both actions call
 * /api/brief and refresh the portal.
 */
export function BriefReview({
  projectId,
  offeringName,
  renderedSummary,
  revision,
  status,
}: {
  projectId: string;
  offeringName: string;
  renderedSummary: string;
  revision: number;
  status: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "changes">("view");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<"" | "accept" | "changes">("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function accept() {
    setBusy("accept");
    setError("");
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action: "accept" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setBusy("");
        setError(json.error ?? "Could not accept the brief. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setBusy("");
      setError("Network error. Please try again.");
    }
  }

  async function requestChanges(e: React.FormEvent) {
    e.preventDefault();
    const text = notes.trim();
    if (!text) {
      setError("Please describe the changes you would like.");
      return;
    }
    setBusy("changes");
    setError("");
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action: "request_changes", notes: text }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setBusy("");
        setError(json.error ?? "Could not submit your changes. Please try again.");
        return;
      }
      setBusy("");
      setNotes("");
      setMode("view");
      if (json.revised) {
        setInfo("Thanks. Spark has revised your brief below for review.");
      } else {
        setInfo(
          "Thanks. We have recorded your notes and will update your brief shortly.",
        );
      }
      router.refresh();
    } catch {
      setBusy("");
      setError("Network error. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Project brief</p>
      <h1 className="mt-3 text-3xl font-bold text-ink">
        Review your {offeringName} brief
      </h1>
      <p className="mt-3 text-ink/70">
        Here is the scope we put together from your intake. Accept it to set the
        scope and kick off your project, or request changes.
        {revision > 1 && (
          <span className="ml-1 text-ink/50">Revision {revision}.</span>
        )}
      </p>

      {info && (
        <p className="mt-4 rounded-lg bg-ridge-green/10 px-4 py-3 text-sm text-ridge-green">
          {info}
        </p>
      )}

      <div className="mt-6 whitespace-pre-wrap rounded-xl border border-ink/10 bg-white p-6 text-sm leading-relaxed text-ink">
        {renderedSummary}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-impact-orange">
          {error}
        </p>
      )}

      {mode === "view" ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={accept}
            disabled={busy !== "" || status === "accepted"}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "accept" ? "Accepting..." : "Accept brief"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("changes");
              setError("");
              setInfo("");
            }}
            disabled={busy !== ""}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Request changes
          </button>
        </div>
      ) : (
        <form onSubmit={requestChanges} className="mt-6 space-y-3">
          <label htmlFor="brief-notes" className="block text-sm font-medium text-ink">
            What would you like to change?
          </label>
          <textarea
            id="brief-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-ink/20 px-4 py-2.5 text-sm focus:border-trail-orange focus:outline-none"
            placeholder="Tell us what to adjust in the scope, deliverables, or timeline..."
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy !== ""}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "changes" ? "Submitting..." : "Submit changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setError("");
              }}
              disabled={busy !== ""}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
