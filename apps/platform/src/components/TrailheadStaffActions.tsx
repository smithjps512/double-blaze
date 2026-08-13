"use client";

import { useState } from "react";

/**
 * Staff actions for a Trailhead site. Draft and Build run automatically in the
 * chain (on submission and on customer approval); these buttons are for
 * re-running a step. "Send preview" is the human review gate: it releases the
 * built site to the customer. "Publish" goes live after the customer accepts.
 *
 * Takes the resolved site id, so build/preview/publish target the right record
 * (the route param is the intake id).
 */
export function TrailheadStaffActions({
  intakeId,
  siteId,
  status,
}: {
  intakeId: string;
  siteId: string | null;
  status: string | null;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(path: string, body: Record<string, unknown>, label: string) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`${label}: done.`);
      } else if (data.violations) {
        setMessage(
          `${label} blocked: ${data.violations.map((v: { detail: string }) => v.detail).join("; ")}`,
        );
      } else {
        setMessage(`${label}: ${data.error ?? "failed."}`);
      }
    } catch {
      setMessage(`${label}: request failed.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => post("/api/trailhead/content-draft", { intake_id: intakeId }, "Draft")}
          disabled={busy}
          className="btn-secondary disabled:opacity-50"
        >
          Re-draft content
        </button>
        <button
          onClick={() => siteId && post("/api/trailhead/build", { site_id: siteId }, "Build")}
          disabled={busy || !siteId}
          className="btn-secondary disabled:opacity-50"
        >
          Re-build site
        </button>
        <button
          onClick={() => siteId && post("/api/trailhead/send-preview", { site_id: siteId }, "Send preview")}
          disabled={busy || !siteId || status !== "preview"}
          className="btn-primary disabled:opacity-50"
        >
          Send preview to customer
        </button>
        <button
          onClick={() => siteId && post("/api/trailhead/publish", { site_id: siteId }, "Publish")}
          disabled={busy || !siteId || status !== "preview"}
          className="btn-primary disabled:opacity-50"
        >
          Publish
        </button>
      </div>

      {message && (
        <p className="rounded-lg border border-ink/10 bg-ink/[0.03] p-4 text-sm text-ink/75">
          {message}
        </p>
      )}
    </div>
  );
}
