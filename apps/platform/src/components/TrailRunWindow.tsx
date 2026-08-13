"use client";

import { useState } from "react";

interface TierOption {
  key: string;
  name: string;
  priceMonthly: number;
}

/**
 * Customer portal during the 30-day window. Leads with results (graceful empty
 * state when no metrics are flowing yet), shows the client-safe summary of what
 * was built, and offers the three actions: continue, change level, or cancel.
 * The day-31 conversion itself is Sprint T4.
 */
export function TrailRunWindow({
  tiers,
  selectedTier,
  daysRemaining,
  liveUrl,
  summary,
}: {
  tiers: TierOption[];
  selectedTier: string;
  daysRemaining: number;
  liveUrl: string | null;
  summary: string | null;
}) {
  const [tier, setTier] = useState(selectedTier);
  const [savedTier, setSavedTier] = useState(selectedTier);
  const [busy, setBusy] = useState<null | "tier" | "cancel">(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceled, setCanceled] = useState(false);

  const tierName = (k: string) => tiers.find((t) => t.key === k)?.name ?? k;

  async function changeTier() {
    if (tier === savedTier) {
      setNote(`You are set to stay at ${tierName(tier)}.`);
      return;
    }
    setBusy("tier");
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/trail-run/tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_tier: tier }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not change your level. Please try again.");
        return;
      }
      setSavedTier(tier);
      setNote(`Your level is set to ${tierName(tier)}. You will only be charged if you continue past day 31.`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    setError("");
    try {
      const res = await fetch("/api/trail-run/cancel", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not cancel. Please try again.");
        return;
      }
      setCanceled(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (canceled) {
    return (
      <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
        <h2 className="text-lg font-bold text-ink">Your Trail Run is canceled.</h2>
        <p className="mt-2 text-ink/70">
          You were not charged. We will hold your build for 90 days in case you
          change your mind.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results, value-forward with a graceful empty state. */}
      <section className="rounded-xl border border-ink/10 bg-stone-white p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-bold text-ink">Your results</h2>
          <span className="text-sm text-ink/60">
            {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left in your window
          </span>
        </div>
        <p className="mt-3 text-ink/70">
          Live numbers from your dashboard will appear here as they come in:
          leads, sales, and hours saved. Nothing to show just yet, your solution
          is gathering its first results.
        </p>
        {liveUrl && (
          <p className="mt-4 text-sm">
            <a href={liveUrl} className="font-semibold text-impact-orange">
              Visit your live solution
            </a>
          </p>
        )}
      </section>

      {/* What we built. */}
      {summary && (
        <section className="rounded-xl border border-ink/10 bg-ink/[0.02] p-6">
          <h2 className="text-xl font-bold text-ink">What we built</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-ink/80">{summary}</pre>
        </section>
      )}

      {/* Three actions. */}
      <section className="rounded-xl border border-ink/10 bg-stone-white p-6">
        <h2 className="text-xl font-bold text-ink">Your options</h2>
        <p className="mt-2 text-sm text-ink/70">
          On day 31 you decide. You are only charged if you continue.
        </p>

        {note && <p className="mt-4 text-sm font-medium text-ridge-green">{note}</p>}
        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-impact-orange">
            {error}
          </p>
        )}

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-ink">Continue</p>
            <p className="mt-1 text-sm text-ink/70">
              Stay at {tierName(savedTier)}. Nothing to do, you are all set to
              continue when your window ends.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Change your level</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="rounded-md border border-ink/15 bg-stone-white px-3 py-2 text-sm text-ink"
              >
                {tiers.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name} (${t.priceMonthly}/mo)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={changeTier}
                disabled={busy === "tier"}
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "tier" ? "Saving..." : "Update level"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Stop</p>
            <p className="mt-1 text-sm text-ink/70">
              Cancel before day 31 and you will not be charged.
            </p>
            {!confirmCancel ? (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="mt-2 text-sm font-semibold text-impact-orange"
              >
                Cancel my Trail Run
              </button>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink/70">Are you sure?</span>
                <button
                  type="button"
                  onClick={cancel}
                  disabled={busy === "cancel"}
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "cancel" ? "Canceling..." : "Yes, cancel with no charge"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="text-sm text-ink/60"
                >
                  Keep my Trail Run
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
