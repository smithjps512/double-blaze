"use client";

import { useState } from "react";

interface TierOption {
  /** catalog_key */
  key: string;
  name: string;
  priceMonthly: number;
  tagline: string;
}

/**
 * Starts a Trail Run signup. The customer picks a tier (default Blue Trail),
 * acknowledges the terms, and is sent to Stripe to save a card with no charge.
 * The consent acknowledgment is required and mirrors the stored consent record.
 */
export function TrailRunStartForm({
  tiers,
  defaultTier,
  region,
}: {
  tiers: TierOption[];
  defaultTier: string;
  region?: string;
}) {
  const [tier, setTier] = useState(defaultTier);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  const selected = tiers.find((t) => t.key === tier) ?? tiers[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError("Please acknowledge the Trail Run terms to continue.");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/trail-run/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_tier: tier, consent, region }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setStatus("error");
        setError(json.error ?? "Could not start signup. Please try again.");
        return;
      }
      window.location.href = json.url as string;
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink">
          Choose where you start. Everyone runs on full Blue Trail during the
          window, and you can change levels anytime before it ends.
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {tiers.map((t) => (
            <label
              key={t.key}
              className={`flex cursor-pointer flex-col rounded-lg border p-4 text-sm ${
                tier === t.key
                  ? "border-trail-orange ring-1 ring-trail-orange"
                  : "border-ink/15"
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="font-semibold text-ink">{t.name}</span>
                <input
                  type="radio"
                  name="tier"
                  value={t.key}
                  checked={tier === t.key}
                  onChange={() => setTier(t.key)}
                  className="h-4 w-4 accent-trail-orange"
                />
              </span>
              <span className="mt-1 text-ink/70">{t.tagline}</span>
              <span className="mt-2 text-ink/55">
                ${t.priceMonthly}/mo after your window, if you continue
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-lg border border-ink/15 bg-ink/[0.02] p-4 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 flex-none accent-trail-orange"
          aria-describedby="trail-consent"
        />
        <span id="trail-consent" className="text-ink/80">
          I understand there is no charge until 30 days after my solution
          launches. On that date, my card is charged for{" "}
          <strong>{selected?.name ?? "Blue Trail"}</strong> monthly and a{" "}
          <strong>12-month term</strong> begins. I can cancel anytime before then
          with no charge.
        </span>
      </label>

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
        {status === "submitting" ? "Redirecting..." : "Start Trail Run"}
      </button>

      <p className="text-xs text-ink/55">
        We ask for a card now so nothing breaks if you continue. You are not
        charged today. Payments are processed securely by Stripe, and tax is
        calculated at billing.
      </p>
    </form>
  );
}
