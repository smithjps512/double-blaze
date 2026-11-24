"use client";

import { useState } from "react";
import { PRACTICE_AREAS } from "@/lib/practice";
import {
  GOVERNMENT_ORG_TYPES,
  NEED_TYPES,
  NOT_SURE_PRACTICE,
  ORG_TYPES,
  TIMELINES,
} from "@/lib/intake";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * "Tell us about your needs." Collects who the client is and which practice
 * areas the work touches, so the request reaches the right program management
 * group(s). Success offers the discovery-call booking link when one is set.
 */
export function NeedsIntakeForm({
  defaultPractices = [],
  bookingUrl,
}: {
  defaultPractices?: string[];
  /** Scheduling link for the free discovery call (NEXT_PUBLIC_DISCOVERY_BOOKING_URL). */
  bookingUrl?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [orgType, setOrgType] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = event.currentTarget;
    const fd = new FormData(form);
    const data: Record<string, unknown> = Object.fromEntries(fd.entries());
    data.practices = fd.getAll("practices");

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
        className="rounded-xl border border-ridge-green/30 bg-ridge-green/10 p-8"
      >
        <h2 className="text-xl font-bold text-ridge-green">
          Thanks. Your request is with the right team.
        </h2>
        <p className="mt-2 text-ink/75">
          The program management group for your needs has your request.{" "}
          {bookingUrl
            ? "Pick a time for your free discovery call below, or we will reach out within one business day."
            : "We will reach out within one business day to set up your free discovery call."}
        </p>
        {bookingUrl && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6"
          >
            Book your free discovery call
          </a>
        )}
      </div>
    );
  }

  const isGov = GOVERNMENT_ORG_TYPES.has(orgType);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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

      <fieldset>
        <legend className="mb-2 block text-sm font-semibold text-ink">
          What can we help with?{" "}
          <span className="font-normal text-ink/60">Choose any that apply.</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRACTICE_AREAS.map((area) => (
            <Check
              key={area.slug}
              value={area.slug}
              label={area.title}
              defaultChecked={defaultPractices.includes(area.slug)}
            />
          ))}
          <Check
            value={NOT_SURE_PRACTICE}
            label="Not sure yet, help me choose"
            defaultChecked={defaultPractices.includes(NOT_SURE_PRACTICE)}
          />
        </div>
      </fieldset>

      <Field label="Tell us about your needs" htmlFor="message" required>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={inputClass}
          placeholder="What are you trying to accomplish, what is getting in the way, and who is involved?"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Are you looking to" htmlFor="needType">
          <select id="needType" name="needType" defaultValue="" className={inputClass}>
            <option value="">Select one</option>
            {NEED_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Timeline" htmlFor="timeline">
          <select id="timeline" name="timeline" defaultValue="" className={inputClass}>
            <option value="">Select one</option>
            {TIMELINES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Organization" htmlFor="organization" required>
          <input
            id="organization"
            name="organization"
            type="text"
            required
            autoComplete="organization"
            className={inputClass}
          />
        </Field>
        <Field label="Organization type" htmlFor="orgType" required>
          <select
            id="orgType"
            name="orgType"
            required
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            className={inputClass}
          >
            <option value="">Select one</option>
            {ORG_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {isGov && (
        <Field
          label="Solicitation, contract, or vehicle number (if any)"
          htmlFor="solicitation"
        >
          <input
            id="solicitation"
            name="solicitation"
            type="text"
            className={inputClass}
            placeholder="Optional"
          />
        </Field>
      )}

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
        <Field label="Your role" htmlFor="role">
          <input
            id="role"
            name="role"
            type="text"
            autoComplete="organization-title"
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
        <Field label="Phone" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass}
          />
        </Field>
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
        {status === "submitting" ? "Sending..." : "Request my free discovery call"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-ink/20 bg-stone-white px-3.5 py-2.5 text-ink placeholder:text-ink/40 focus:border-trail-orange focus-visible:ring-2 focus-visible:ring-trail-orange focus-visible:ring-offset-0";

function Check({
  value,
  label,
  defaultChecked,
}: {
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-ink/15 bg-stone-white px-3.5 py-3 text-sm text-ink transition-colors hover:border-trail-orange/60 has-[:checked]:border-trail-orange has-[:checked]:bg-trail-orange/5">
      <input
        type="checkbox"
        name="practices"
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 flex-none accent-trail-orange"
      />
      <span>{label}</span>
    </label>
  );
}

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
