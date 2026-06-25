"use client";

import { useState } from "react";

export function CheckoutForm({
  catalogKey,
  requiresConsent,
  termMonths,
  region,
}: {
  catalogKey: string;
  requiresConsent: boolean;
  termMonths: number | null;
  /** Region slug the buyer arrived from; tags the org and assigns the lead. */
  region?: string;
}) {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (requiresConsent && !consent) {
      setError("Please confirm the minimum term to continue.");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalog_key: catalogKey, consent, region }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setStatus("error");
        setError(json.error ?? "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = json.url as string;
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {requiresConsent && (
        <label className="flex items-start gap-3 rounded-lg border border-ink/15 bg-ink/[0.02] p-4 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 flex-none accent-trail-orange"
            aria-describedby="term-desc"
          />
          <span id="term-desc" className="text-ink/80">
            I understand this plan runs on a{" "}
            <strong>{termMonths ?? 12}-month minimum term</strong>, billed
            monthly, and I consent to that term. Early termination is handled per
            the client agreement.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-impact-orange">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Redirecting..." : "Continue to payment"}
      </button>

      <p className="text-xs text-ink/55">
        Payments are processed securely by Stripe. Tax is calculated at checkout.
      </p>
    </form>
  );
}
