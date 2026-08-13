"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Waitlist capture for a coming_soon region (task item 2). Posts to
 * /api/region-interest, which stores the interest and emails the region lead or
 * the central inbox. Mirrors StartProjectForm's honeypot + guarded pattern.
 */
export function RegionInterestForm({
  slug,
  regionName,
}: {
  slug: string;
  regionName: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    const form = event.currentTarget;
    const data = {
      ...Object.fromEntries(new FormData(form).entries()),
      slug,
    };
    try {
      const res = await fetch("/api/region-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-xl border border-ridge-green/30 bg-ridge-green/10 p-6 text-center"
      >
        <h3 className="text-lg font-bold text-ridge-green">You are on the list.</h3>
        <p className="mt-2 text-sm text-ink/75">
          We will reach out as soon as Double Blaze opens in {regionName}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot, visually hidden from users. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ri-name" className="mb-1.5 block text-sm font-semibold text-ink">
            Your name
          </label>
          <input id="ri-name" name="name" type="text" autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="ri-email" className="mb-1.5 block text-sm font-semibold text-ink">
            Email <span className="text-impact-orange" aria-hidden="true">*</span>
          </label>
          <input id="ri-email" name="email" type="email" required autoComplete="email" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="ri-message" className="mb-1.5 block text-sm font-semibold text-ink">
          Anything we should know? <span className="font-normal text-ink/50">(optional)</span>
        </label>
        <textarea id="ri-message" name="message" rows={3} className={inputClass} />
      </div>

      {status === "error" && (
        <p role="alert" className="text-sm font-medium text-impact-orange">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending..." : "Join the list"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-ink/20 bg-stone-white px-3.5 py-2.5 text-ink placeholder:text-ink/40 focus:border-trail-orange focus-visible:ring-2 focus-visible:ring-trail-orange focus-visible:ring-offset-0";
