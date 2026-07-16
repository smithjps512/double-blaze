"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

/**
 * Staff review surface for Trailhead sites. Staff can:
 * - Trigger content drafting from the intake
 * - Review and edit the draft before sending to customer
 * - Trigger the build after customer approval
 * - Review the build before sending preview
 * - Publish the site
 */
export default function TrailheadStaffReview() {
  const params = useParams();
  const siteId = params.siteId as string;
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function draftContent() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/trailhead/content-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_id: siteId }),
      });
      const data = await res.json();
      setStatus(data.ok ? "Draft created. Send to customer for review." : (data.error ?? "Failed."));
    } catch {
      setStatus("Failed to draft content.");
    } finally {
      setLoading(false);
    }
  }

  async function buildSite() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/trailhead/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: siteId }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("Build complete. Review, then send preview to customer.");
      } else if (data.violations) {
        setStatus(`Build failed: ${data.violations.map((v: { detail: string }) => v.detail).join("; ")}`);
      } else {
        setStatus(data.error ?? "Build failed.");
      }
    } catch {
      setStatus("Build failed.");
    } finally {
      setLoading(false);
    }
  }

  async function publishSite() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/trailhead/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: siteId }),
      });
      const data = await res.json();
      setStatus(data.ok ? `Published at ${data.liveUrl}` : (data.error ?? "Publish failed."));
    } catch {
      setStatus("Publish failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Trailhead staff review</p>
        <h1 className="mt-3 text-2xl font-bold text-ink">Site: {siteId}</h1>

        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={draftContent}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              Draft content
            </button>
            <button
              onClick={buildSite}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              Build site
            </button>
            <button
              onClick={publishSite}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              Publish
            </button>
          </div>

          {status && (
            <p className="mt-4 rounded-lg border border-ink/10 bg-ink/[0.03] p-4 text-sm text-ink/75">
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
