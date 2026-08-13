"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";
import {
  TRAILHEAD_PAGES,
  MAX_PAGES,
  TONE_OPTIONS,
  ORG_TYPES,
  PRIMARY_ACTIONS,
} from "@/lib/trailhead";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface FormData {
  // Section 0
  site_name: string;
  subdomain: string;
  site_type: "marketing" | "member" | "";
  org_type: string;
  org_type_other: string;
  contact_email: string;
  contact_name: string;
  needs_payments: boolean;
  // Section 1
  pitch: string;
  audience: string;
  primary_action: string;
  primary_action_other: string;
  differentiator: string;
  // Section 2
  pages: string[];
  page_other: string;
  // Section 3
  logo_choice: string;
  photos_choice: string;
  copy_choice: string;
  hours: string;
  location: string;
  social_links: string;
  must_see: string;
  // Section 4
  member_join_method: string;
  member_fee: string;
  member_private_area: string;
  member_roster: string;
  // Section 5
  template: string;
  colors: string;
  inspiration_url: string;
  tone: string;
  // Section 6
  contact_form_email: string;
  show_phone: boolean;
  phone: string;
  show_address: boolean;
  address: string;
  // Section 7
  freetext_anything_else: string;
  freetext_not_asked: string;
  // Honeypot
  website: string;
}

const INITIAL: FormData = {
  site_name: "", subdomain: "", site_type: "", org_type: "", org_type_other: "",
  contact_email: "", contact_name: "", needs_payments: false,
  pitch: "", audience: "", primary_action: "", primary_action_other: "", differentiator: "",
  pages: ["home"], page_other: "",
  logo_choice: "", photos_choice: "", copy_choice: "",
  hours: "", location: "", social_links: "", must_see: "",
  member_join_method: "", member_fee: "", member_private_area: "", member_roster: "",
  template: "", colors: "", inspiration_url: "", tone: "",
  contact_form_email: "", show_phone: false, phone: "", show_address: false, address: "",
  freetext_anything_else: "", freetext_not_asked: "",
  website: "",
};

export function TrailheadIntakeForm() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [step, setStep] = useState<Step>(0);
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({ checking: false, available: null, error: null });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    error?: string;
    upgradeUrl?: string;
    message?: string;
    statusUrl?: string | null;
    token?: string | null;
  } | null>(null);

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  // Live subdomain check with debounce
  useEffect(() => {
    const name = form.subdomain.trim().toLowerCase();
    if (name.length < 3) {
      setSubdomainStatus({ checking: false, available: null, error: null });
      return;
    }
    setSubdomainStatus({ checking: true, available: null, error: null });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/trailhead/check-subdomain?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        setSubdomainStatus({
          checking: false,
          available: data.available,
          error: data.error || null,
        });
      } catch {
        setSubdomainStatus({ checking: false, available: null, error: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.subdomain]);

  const isMember = form.site_type === "member";

  // Determine the steps to show (skip section 4 for marketing sites)
  const steps: Step[] = isMember ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 5, 6, 7];
  const currentStepIndex = steps.indexOf(step);
  const isLast = currentStepIndex === steps.length - 1;
  const canAdvance = currentStepIndex < steps.length - 1;

  function nextStep() {
    if (canAdvance) setStep(steps[currentStepIndex + 1]);
  }
  function prevStep() {
    if (currentStepIndex > 0) setStep(steps[currentStepIndex - 1]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/trailhead/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
      // Only clear form on success; on failure the form data stays intact
    } catch {
      setResult({ ok: false, error: "Something went wrong. Your answers are still here. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-8">
        <h3 className="text-2xl font-bold text-ink">We are on it.</h3>
        <p className="mt-3 text-ink/75">
          We received your request for <strong>{form.site_name}</strong> at{" "}
          <strong>{form.subdomain}.doubleblaze.solutions</strong>. Next, we will
          draft your messaging, copy, and look, then bring it back to you to
          review and approve before anything is built.
        </p>

        {result.statusUrl ? (
          <div className="mt-6 rounded-lg border border-ink/15 bg-stone-white p-5">
            <p className="text-sm font-semibold text-ink">
              This is your status page. Bookmark it now.
            </p>
            <p className="mt-1 text-sm text-ink/70">
              It is your way back in at every step, and it stays current. You do
              not have to wait for an email or rely on one arriving.
            </p>
            <a
              href={result.statusUrl}
              className="mt-3 inline-block break-all font-medium text-impact-orange underline"
            >
              {result.statusUrl}
            </a>
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink/60">
            Watch your email for a confirmation and a link to review your draft.
          </p>
        )}

        <p className="mt-4 text-sm text-ink/60">
          We also sent a copy of this link to your email.
        </p>
      </div>
    );
  }

  if (result?.error === "qualification_gate") {
    return (
      <div className="rounded-xl border border-trail-orange/30 bg-trail-orange/5 p-8 text-center">
        <h3 className="text-2xl font-bold text-ink">Trailhead might not be the right fit.</h3>
        <p className="mt-3 text-ink/75">{result.message}</p>
        <a href={result.upgradeUrl ?? "/pricing"} className="btn-primary mt-6 inline-flex">
          See packages that include that
        </a>
      </div>
    );
  }

  if (result?.error === "capacity_full") {
    return <WaitlistForm message={result.message} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Honeypot: hidden from real users */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStepIndex ? "bg-trail-orange" : "bg-ink/10"
            }`}
          />
        ))}
      </div>

      {/* Section 0: Site identity */}
      {step === 0 && (
        <fieldset className="space-y-5">
          <legend className="text-lg font-bold text-ink">Tell us about your site</legend>

          <Field label="Site name (what this is called)" required>
            <input
              type="text"
              value={form.site_name}
              onChange={(e) => set("site_name", e.target.value)}
              className="input"
              required
            />
          </Field>

          <Field label="Chosen web address" required>
            <div className="flex items-center gap-0">
              <input
                type="text"
                value={form.subdomain}
                onChange={(e) => set("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="input rounded-r-none"
                placeholder="your-name"
                required
              />
              <span className="rounded-r-md border border-l-0 border-ink/20 bg-ink/5 px-3 py-2.5 text-sm text-ink/60">
                .doubleblaze.solutions
              </span>
            </div>
            {form.subdomain.length >= 3 && (
              <p className={`mt-1 text-sm ${
                subdomainStatus.checking ? "text-ink/50" :
                subdomainStatus.available ? "text-ridge-green" :
                "text-red-600"
              }`}>
                {subdomainStatus.checking ? "Checking..." :
                 subdomainStatus.available ? "Available" :
                 subdomainStatus.error ?? ""}
              </p>
            )}
          </Field>

          <Field label="Site type" required>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="site_type"
                  value="marketing"
                  checked={form.site_type === "marketing"}
                  onChange={() => set("site_type", "marketing")}
                  className="accent-trail-orange"
                />
                Simple marketing site
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="site_type"
                  value="member"
                  checked={form.site_type === "member"}
                  onChange={() => set("site_type", "member")}
                  className="accent-trail-orange"
                />
                Member or club site
              </label>
            </div>
          </Field>

          <Field label="Who you are" required>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ORG_TYPES.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="org_type"
                    value={opt.id}
                    checked={form.org_type === opt.id}
                    onChange={() => set("org_type", opt.id)}
                    className="accent-trail-orange"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {form.org_type === "other" && (
              <input
                type="text"
                value={form.org_type_other}
                onChange={(e) => set("org_type_other", e.target.value)}
                className="input mt-2"
                placeholder="Tell us more"
              />
            )}
          </Field>

          <Field label="Your email" required>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => set("contact_email", e.target.value)}
              className="input"
              required
            />
          </Field>

          <Field label="Your name" required>
            <input
              type="text"
              value={form.contact_name}
              onChange={(e) => set("contact_name", e.target.value)}
              className="input"
              required
            />
          </Field>

          <div className="rounded-lg border border-ink/10 bg-stone-white p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.needs_payments}
                onChange={(e) => set("needs_payments", e.target.checked)}
                className="mt-1 accent-trail-orange"
              />
              <span>
                I need to sell online or collect payments on this site.{" "}
                <span className="text-ink/50">
                  (If so, we will point you to the right package instead.)
                </span>
              </span>
            </label>
          </div>
        </fieldset>
      )}

      {/* Section 1: Plain-language pitch */}
      {step === 1 && (
        <fieldset className="space-y-5">
          <legend className="text-lg font-bold text-ink">Tell us what you do</legend>

          <Field label="What you do or who you are, in one sentence">
            <input
              type="text"
              value={form.pitch}
              onChange={(e) => set("pitch", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Who this site is for (the visitor you most want to reach)">
            <input
              type="text"
              value={form.audience}
              onChange={(e) => set("audience", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="What you want a visitor to do (pick the main one)">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRIMARY_ACTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="primary_action"
                    value={opt.id}
                    checked={form.primary_action === opt.id}
                    onChange={() => set("primary_action", opt.id)}
                    className="accent-trail-orange"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {form.primary_action === "other" && (
              <input
                type="text"
                value={form.primary_action_other}
                onChange={(e) => set("primary_action_other", e.target.value)}
                className="input mt-2"
                placeholder="What should they do?"
              />
            )}
          </Field>

          <Field label="What makes you different, in your own words">
            <textarea
              value={form.differentiator}
              onChange={(e) => set("differentiator", e.target.value)}
              className="input min-h-[80px]"
              rows={3}
            />
          </Field>
        </fieldset>
      )}

      {/* Section 2: Pages */}
      {step === 2 && (
        <fieldset className="space-y-5">
          <legend className="text-lg font-bold text-ink">
            Pick your pages (up to {MAX_PAGES})
          </legend>

          <div className="space-y-2">
            {TRAILHEAD_PAGES.map((page) => (
              <label key={page.id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.pages.includes(page.id)}
                  disabled={page.id === "home"}
                  onChange={(e) => {
                    if (page.id === "home") return;
                    const checked = e.target.checked;
                    set(
                      "pages",
                      checked
                        ? [...form.pages, page.id]
                        : form.pages.filter((p) => p !== page.id),
                    );
                  }}
                  className="accent-trail-orange"
                />
                {page.label}
                {page.id === "home" && (
                  <span className="text-xs text-ink/50">(required)</span>
                )}
              </label>
            ))}
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.pages.includes("other")}
                onChange={(e) => {
                  const checked = e.target.checked;
                  set(
                    "pages",
                    checked
                      ? [...form.pages, "other"]
                      : form.pages.filter((p) => p !== "other"),
                  );
                }}
                className="accent-trail-orange"
              />
              Other
            </label>
            {form.pages.includes("other") && (
              <input
                type="text"
                value={form.page_other}
                onChange={(e) => set("page_other", e.target.value)}
                className="input ml-7"
                placeholder="What page?"
              />
            )}
          </div>
          {form.pages.length > MAX_PAGES && (
            <p className="text-sm text-red-600">
              Please select no more than {MAX_PAGES} pages.
            </p>
          )}
        </fieldset>
      )}

      {/* Section 3: Content you have */}
      {step === 3 && (
        <fieldset className="space-y-5">
          <legend className="text-lg font-bold text-ink">What content do you have?</legend>

          <Field label="Logo">
            <RadioGroup
              name="logo_choice"
              value={form.logo_choice}
              onChange={(v) => set("logo_choice", v)}
              options={[
                { value: "upload", label: "I will upload mine" },
                { value: "generate", label: "Make me a simple one" },
                { value: "none", label: "None needed" },
              ]}
            />
          </Field>

          <Field label="Photos">
            <RadioGroup
              name="photos_choice"
              value={form.photos_choice}
              onChange={(v) => set("photos_choice", v)}
              options={[
                { value: "upload", label: "I will upload mine" },
                { value: "stock", label: "None yet (use tasteful stock)" },
              ]}
            />
          </Field>

          <Field label="Existing copy or text">
            <RadioGroup
              name="copy_choice"
              value={form.copy_choice}
              onChange={(v) => set("copy_choice", v)}
              options={[
                { value: "paste", label: "I will paste or upload it" },
                { value: "write_for_me", label: "Write it for me" },
              ]}
            />
          </Field>

          <Field label="Hours (if relevant)">
            <input
              type="text"
              value={form.hours}
              onChange={(e) => set("hours", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Location or service area">
            <input
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Social links">
            <input
              type="text"
              value={form.social_links}
              onChange={(e) => set("social_links", e.target.value)}
              className="input"
              placeholder="Facebook, Instagram, etc."
            />
          </Field>

          <Field label="Anything a visitor must see (a policy, a schedule, a document)">
            <textarea
              value={form.must_see}
              onChange={(e) => set("must_see", e.target.value)}
              className="input min-h-[60px]"
              rows={2}
            />
          </Field>
        </fieldset>
      )}

      {/* Section 4: Member/club specifics (only for member sites) */}
      {step === 4 && isMember && (
        <fieldset className="space-y-5">
          <legend className="text-lg font-bold text-ink">Member and club details</legend>

          <Field label="How do people join?">
            <RadioGroup
              name="member_join_method"
              value={form.member_join_method}
              onChange={(v) => set("member_join_method", v)}
              options={[
                { value: "open", label: "Open to anyone" },
                { value: "request", label: "Request or application" },
                { value: "invite", label: "Invite only" },
              ]}
            />
          </Field>

          <Field label="Is there any fee to join?">
            <RadioGroup
              name="member_fee"
              value={form.member_fee}
              onChange={(v) => set("member_fee", v)}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
            />
            {form.member_fee === "yes" && (
              <p className="mt-2 text-sm text-trail-orange">
                Trailhead does not handle member dues. We will point you to a
                package that does.
              </p>
            )}
          </Field>

          <Field label="Do you need a private or members-only area?">
            <RadioGroup
              name="member_private_area"
              value={form.member_private_area}
              onChange={(v) => set("member_private_area", v)}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
            />
            {form.member_private_area === "yes" && (
              <p className="mt-2 text-sm text-trail-orange">
                Private areas go beyond Trailhead scope. We will flag this and
                talk about options.
              </p>
            )}
          </Field>

          <Field label="Roster or member list on the site?">
            <RadioGroup
              name="member_roster"
              value={form.member_roster}
              onChange={(v) => set("member_roster", v)}
              options={[
                { value: "no", label: "No" },
                { value: "yes_public", label: "Yes, public" },
                { value: "yes_names", label: "Yes, names only" },
              ]}
            />
          </Field>
        </fieldset>
      )}

      {/* Section 5: Look and feel */}
      {step === 5 && (
        <fieldset className="space-y-5">
          <legend className="text-lg font-bold text-ink">Look and feel</legend>

          <Field label="Colors you like or must use">
            <input
              type="text"
              value={form.colors}
              onChange={(e) => set("colors", e.target.value)}
              className="input"
              placeholder="Hex codes, color names, or just describe them"
            />
          </Field>

          <Field label="A site you like the feel of (paste a link)">
            <p className="mb-2 text-sm text-ink/70">
              This is one of the most important answers you give us. We use the
              site you share here as the reference for how yours will look and
              feel, its colors, layout, and overall style. Pick a site whose look
              you would be proud to stand next to, not one whose business matches
              yours. The closer this is to what you love, the closer your first
              draft will be.
            </p>
            <input
              type="url"
              value={form.inspiration_url}
              onChange={(e) => set("inspiration_url", e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </Field>

          <Field label="Tone">
            <RadioGroup
              name="tone"
              value={form.tone}
              onChange={(v) => set("tone", v)}
              options={TONE_OPTIONS.map((t) => ({ value: t.id, label: t.label }))}
            />
          </Field>
        </fieldset>
      )}

      {/* Section 6: Contact path */}
      {step === 6 && (
        <fieldset className="space-y-5">
          <legend className="text-lg font-bold text-ink">How people reach you</legend>

          <Field label="Where should contact-form messages go (email)">
            <input
              type="email"
              value={form.contact_form_email}
              onChange={(e) => set("contact_form_email", e.target.value)}
              className="input"
            />
          </Field>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.show_phone}
              onChange={(e) => set("show_phone", e.target.checked)}
              className="accent-trail-orange"
            />
            Show a phone number
          </label>
          {form.show_phone && (
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="input"
              placeholder="Your phone number"
            />
          )}

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.show_address}
              onChange={(e) => set("show_address", e.target.checked)}
              className="accent-trail-orange"
            />
            Show a physical address
          </label>
          {form.show_address && (
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="input"
              placeholder="Your address"
            />
          )}
        </fieldset>
      )}

      {/* Section 7: Anything else */}
      {step === 7 && (
        <fieldset className="space-y-5">
          <legend className="text-lg font-bold text-ink">Anything else?</legend>

          <Field label="Anything we should know">
            <textarea
              value={form.freetext_anything_else}
              onChange={(e) => set("freetext_anything_else", e.target.value)}
              className="input min-h-[80px]"
              rows={3}
            />
          </Field>

          <Field label="Anything you want that was not asked about">
            <textarea
              value={form.freetext_not_asked}
              onChange={(e) => set("freetext_not_asked", e.target.value)}
              className="input min-h-[80px]"
              rows={3}
            />
          </Field>
        </fieldset>
      )}

      {/* Error display: form data is preserved so the user can retry */}
      {result?.error && result.error !== "qualification_gate" && result.error !== "capacity_full" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{result.error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className="btn-secondary disabled:opacity-30"
        >
          Back
        </button>
        {isLast ? (
          <button
            type="submit"
            disabled={submitting || form.pages.length > MAX_PAGES}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        ) : (
          <button type="button" onClick={nextStep} className="btn-primary">
            Next
          </button>
        )}
      </div>
    </form>
  );
}

function WaitlistForm({ message }: { message?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot

  async function submit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/trailhead/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, website }),
    });
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-8 text-center">
        <h3 className="text-2xl font-bold text-ink">You are on the list.</h3>
        <p className="mt-3 text-ink/75">
          We will reach out when the next month opens.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-trail-orange/30 bg-trail-orange/5 p-8">
      <h3 className="text-xl font-bold text-ink">This month is full.</h3>
      <p className="mt-2 text-sm text-ink/75">{message ?? "Join the waitlist for next month."}</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="Your email"
          required
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="Your name (optional)"
        />
        <button type="submit" className="btn-primary w-full">
          Join the waitlist
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared form primitives
// ---------------------------------------------------------------------------

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-trail-orange"> *</span>}
      </label>
      {children}
    </div>
  );
}

function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-trail-orange"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
