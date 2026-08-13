"use client";

import { useState } from "react";
import { PLANS, ALA_CARTE } from "@/lib/catalog";

type Status = "idle" | "submitting" | "success" | "error";

const INTEREST_OPTIONS = [
  ...PLANS.map((p) => ({ value: p.slug, label: `${p.name} plan` })),
  ...ALA_CARTE.map((a) => ({ value: a.slug, label: a.name })),
  { value: "not-sure", label: "Not sure yet" },
];

export function StartProjectForm({
  defaultInterest = "",
  regions = [],
  defaultRegion = "",
}: {
  defaultInterest?: string;
  /** Active regions for the region picker; empty hides the field. */
  regions?: { slug: string; name: string }[];
  defaultRegion?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/start-a-project", {
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
      setErrorMsg("Network error. Please try again or email us directly.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-xl border border-ridge-green/30 bg-ridge-green/10 p-8 text-center"
      >
        <h2 className="text-xl font-bold text-ridge-green">
          Thanks, we have your request.
        </h2>
        <p className="mt-2 text-ink/75">
          We will review what you sent and get back to you within one business
          day with a recommended path.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Honeypot field, visually hidden from users. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" required>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
          />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Business name" htmlFor="business">
        <input
          id="business"
          name="business"
          type="text"
          autoComplete="organization"
          className={inputClass}
        />
      </Field>

      {regions.length > 0 && (
        <Field label="Your region" htmlFor="region">
          <select
            id="region"
            name="region"
            defaultValue={defaultRegion}
            className={inputClass}
          >
            <option value="">Other / not listed</option>
            {regions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="What are you interested in?" htmlFor="interest">
        <select
          id="interest"
          name="interest"
          defaultValue={defaultInterest}
          className={inputClass}
        >
          <option value="">Select an option</option>
          {INTEREST_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tell us about your project" htmlFor="message" required>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={inputClass}
          placeholder="Where is your business today, and what would you like to change?"
        />
      </Field>

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
        {status === "submitting" ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-ink/20 bg-stone-white px-3.5 py-2.5 text-ink placeholder:text-ink/40 focus:border-trail-orange focus-visible:ring-2 focus-visible:ring-trail-orange focus-visible:ring-offset-0";

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-semibold text-ink"
      >
        {label}
        {required && (
          <span className="text-impact-orange" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
