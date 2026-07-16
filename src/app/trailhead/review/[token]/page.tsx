"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ContentDraft {
  site_title: string;
  tagline: string;
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  tone_summary: string;
  pages: Array<{
    slug: string;
    title: string;
    sections: Array<{ type: string; heading: string; body: string }>;
  }>;
  footer: { text: string; show_phone: boolean; show_address: boolean };
  notes_for_customer: string;
}

export default function TrailheadReviewPage() {
  const params = useParams();
  const token = params.token as string;
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    fetch(`/api/trailhead/check-subdomain?token=${token}`)
      .catch(() => {});
    // In production, this would fetch the site and its content draft.
    // For now, we show a loading state until staff sends the review.
    setLoading(false);
  }, [token]);

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch("/api/trailhead/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.ok) {
        setApproved(true);
      } else {
        setStatus(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("Something went wrong. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  if (approved) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-3xl font-bold text-ink">Approved.</h1>
        <p className="mt-4 text-lg text-ink/75">
          We are building your site now. You will receive a private preview link
          when it is ready.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-ink/60">Loading your draft...</p>
      </div>
    );
  }

  // Draft would be loaded via an API call in the full implementation.
  // This page structure is ready for that data.
  return (
    <div className="container-page py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Review your site draft</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">
          Here is what we have so far.
        </h1>
        <p className="mt-4 text-ink/75">
          Please review the messaging, page copy, and look below. If anything
          needs to change, let us know before we build. Once you approve, we
          will build it exactly as shown here.
        </p>

        {draft && (
          <div className="mt-8 space-y-8">
            <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
              <h2 className="text-xl font-bold text-ink">{draft.site_title}</h2>
              <p className="mt-1 text-ink/70">{draft.tagline}</p>
              <p className="mt-3 text-sm text-ink/60">{draft.tone_summary}</p>
            </div>

            <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
              <h3 className="font-semibold text-ink">Colors</h3>
              <div className="mt-3 flex gap-3">
                {Object.entries(draft.color_palette).map(([name, hex]) => (
                  <div key={name} className="text-center">
                    <div
                      className="h-10 w-10 rounded-lg border border-ink/10"
                      style={{ backgroundColor: hex }}
                    />
                    <p className="mt-1 text-xs text-ink/50">{name}</p>
                  </div>
                ))}
              </div>
            </div>

            {draft.pages.map((page) => (
              <div
                key={page.slug}
                className="rounded-xl border border-ink/10 bg-stone-white p-6"
              >
                <h3 className="font-semibold text-ink">{page.title}</h3>
                {page.sections.map((section, i) => (
                  <div key={i} className="mt-4">
                    <p className="text-xs font-semibold uppercase text-ink/40">
                      {section.type}
                    </p>
                    <p className="mt-1 font-medium text-ink">{section.heading}</p>
                    <p className="mt-1 text-sm text-ink/70">{section.body}</p>
                  </div>
                ))}
              </div>
            ))}

            {draft.notes_for_customer && (
              <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-6">
                <h3 className="font-semibold text-ink">A note from us</h3>
                <p className="mt-2 text-sm text-ink/75">{draft.notes_for_customer}</p>
              </div>
            )}
          </div>
        )}

        {!draft && (
          <div className="mt-8 rounded-xl border border-ink/10 bg-ink/[0.03] p-8 text-center">
            <p className="text-ink/60">
              Your content draft is being prepared. You will receive an email
              when it is ready to review.
            </p>
          </div>
        )}

        {status && <p className="mt-4 text-sm text-red-600">{status}</p>}

        {draft && (
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="btn-primary disabled:opacity-50"
            >
              {approving ? "Approving..." : "Approve and build"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
