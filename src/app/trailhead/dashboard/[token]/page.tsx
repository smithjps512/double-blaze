"use client";

import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TIP_PRESETS, TIP_MIN_CENTS, TIP_MAX_CENTS } from "@/lib/trailhead";

export default function TrailheadDashboard() {
  const params = useParams();
  const token = params.token as string;

  return (
    <div className="container-page py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Your Trailhead dashboard</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">Your site</h1>
        <p className="mt-3 text-ink/75">
          Tip, export your files, request a correction, or upgrade whenever
          you are ready.
        </p>

        <div className="mt-10 space-y-8">
          {/* Tip section */}
          <TipSection token={token} />

          {/* Export */}
          <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
            <h2 className="text-lg font-bold text-ink">Export your files</h2>
            <p className="mt-2 text-sm text-ink/75">
              Download a zip of your site files (HTML, CSS, images) to host
              anywhere. Free, always.
            </p>
            <a
              href={`/api/trailhead/export?token=${token}`}
              className="btn-secondary mt-4 inline-flex"
            >
              Download files
            </a>
          </div>

          {/* Correction */}
          <CorrectionSection token={token} />

          {/* Upgrade */}
          <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-6">
            <h2 className="text-lg font-bold text-ink">Ready for more?</h2>
            <p className="mt-2 text-sm text-ink/75">
              Want your own domain, ecommerce, booking, or automation? Upgrade
              to a paid package. Everything you have carries over, and your first
              month is on us through Trail Run.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <UpgradeButton token={token} tier="green" label="Green Trail: $199/mo" />
              <UpgradeButton token={token} tier="blue" label="Blue Trail: $499/mo" />
              <UpgradeButton token={token} tier="black" label="Black Trail: $999/mo" />
              <UpgradeButton token={token} tier="double_black" label="Double Black: $1,499/mo" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TipSection({ token }: { token: string }) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleTip(e: FormEvent) {
    e.preventDefault();
    setError("");

    let amountCents: number;
    if (useCustom) {
      const dollars = parseFloat(customAmount);
      if (!dollars || dollars <= 0) {
        setError("Please enter an amount.");
        return;
      }
      amountCents = Math.round(dollars * 100);
    } else if (selectedPreset !== null) {
      amountCents = selectedPreset * 100;
    } else {
      setError("Please select an amount.");
      return;
    }

    if (amountCents < TIP_MIN_CENTS || amountCents > TIP_MAX_CENTS) {
      setError("Please enter an amount between $1 and $1,000.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trailhead/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, amount_cents: amountCents }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
      <h2 className="text-lg font-bold text-ink">Tip</h2>
      <p className="mt-2 text-sm text-ink/75">
        A site like this normally runs a few thousand dollars to have built.
        You are going to pay whatever you think it was worth. There is no
        minimum, and there is no catch. Your site stays live whether you tip
        or not.
      </p>
      <p className="mt-2 text-sm text-ink/60">
        You do not have to decide today. This link is permanent.
      </p>

      <form onSubmit={handleTip} className="mt-6">
        <div className="flex flex-wrap gap-3">
          {TIP_PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setSelectedPreset(amount);
                setUseCustom(false);
              }}
              className={`rounded-lg border px-5 py-3 text-sm font-semibold transition ${
                !useCustom && selectedPreset === amount
                  ? "border-trail-orange bg-trail-orange text-stone-white"
                  : "border-ink/20 bg-stone-white text-ink hover:border-ink/40"
              }`}
            >
              ${amount}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setUseCustom(true);
              setSelectedPreset(null);
            }}
            className={`rounded-lg border px-5 py-3 text-sm font-semibold transition ${
              useCustom
                ? "border-trail-orange bg-trail-orange text-stone-white"
                : "border-ink/20 bg-stone-white text-ink hover:border-ink/40"
            }`}
          >
            Name your own
          </button>
        </div>

        {useCustom && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-ink">$</span>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="input w-32"
              placeholder="Amount"
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || (!selectedPreset && !useCustom)}
          className="btn-primary mt-4 disabled:opacity-50"
        >
          {submitting ? "Setting up..." : "Leave a tip"}
        </button>
      </form>
    </div>
  );
}

function CorrectionSection({ token }: { token: string }) {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/trailhead/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, description }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-6">
        <h2 className="text-lg font-bold text-ink">Correction requested</h2>
        <p className="mt-2 text-sm text-ink/75">
          We will review and fix it. You will hear from us soon.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
      <h2 className="text-lg font-bold text-ink">Request a correction</h2>
      <p className="mt-2 text-sm text-ink/75">
        If we got something wrong (a misspelling, the wrong brand colors,
        messaging that does not match what you approved, a broken link, a
        factual error), tell us and we will fix it.
      </p>
      <p className="mt-2 text-sm text-ink/50">
        For added features, redesigns, or anything beyond what was approved,
        we would be glad to talk about an upgrade or a custom build.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input min-h-[80px]"
          placeholder="Describe the correction needed"
          rows={3}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !description.trim()}
          className="btn-secondary disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Request correction"}
        </button>
      </form>
    </div>
  );
}

function UpgradeButton({ token, tier, label }: { token: string; tier: string; label: string }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/trailhead/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tier }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="btn-secondary text-sm disabled:opacity-50"
    >
      {loading ? "..." : label}
    </button>
  );
}
