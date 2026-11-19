"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitSignup, type SubmitResult } from "@/app/actions";
import {
  EXPERIENCE,
  GRADES,
  LIMITS,
  PLAYED_WHERE,
  POSITIONS,
  validateSignup,
  type FieldErrors,
} from "@/lib/signup";

interface FormState {
  firstName: string;
  lastName: string;
  grade: string;
  positions: string[];
  yearsPlayed: string;
  playedWhere: string[];
  teamNames: string;
  notes: string;
}

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  grade: "",
  positions: [],
  yearsPlayed: "",
  playedWhere: [],
  teamNames: "",
  notes: "",
};

const FIELD_ORDER: (keyof FieldErrors)[] = ["firstName", "lastName", "grade", "positions", "yearsPlayed", "teamNames", "notes"];

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function SignupForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [startedAt, setStartedAt] = useState(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => setStartedAt(Date.now()), []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as keyof FieldErrors]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function focusFirstError(errs: FieldErrors) {
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) document.getElementById(`field-${first}`)?.focus();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const local = validateSignup(form);
    if (!local.ok) {
      setErrors(local.errors);
      focusFirstError(local.errors);
      return;
    }
    startTransition(async () => {
      const res = await submitSignup({ ...form, website: honeypot.current?.value ?? "", startedAt });
      if (res.status === "invalid") {
        setErrors(res.errors);
        focusFirstError(res.errors);
        return;
      }
      setResult(res);
      if (res.status === "success") topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function reset() {
    setForm(EMPTY);
    setErrors({});
    setResult(null);
    setStartedAt(Date.now());
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (result?.status === "success") {
    return (
      <div ref={topRef} className="scroll-mt-4 rounded-3xl bg-white p-6 text-center shadow-card sm:p-10" role="status">
        <div className="pop text-7xl" aria-hidden>
          ⚾
        </div>
        <h2 className="mt-4 font-display text-3xl font-extrabold text-bms-deep sm:text-4xl">
          You&apos;re on the list, {result.firstName}!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-lg text-muted">
          Thanks for signing up. We can&apos;t wait to see you at tryouts!
        </p>
        <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
          <h3 className="font-display text-lg font-bold text-bms-deep">What happens next</h3>
          <NextStep emoji="📣" text="Listen for morning announcements. Coaches will share tryout dates and times." />
          <NextStep
            emoji="🩺"
            text="You will need a current sports physical to try out. Ask a grown-up to check if yours is up to date, and get one scheduled if not."
          />
          <NextStep emoji="🧤" text="Play catch whenever you can. Even 10 minutes in the yard helps!" />
        </div>
        <button
          type="button"
          onClick={reset}
          className="focus-ring mt-8 rounded-full border-2 border-bms px-5 py-2.5 font-semibold text-bms transition hover:bg-bms-light"
        >
          Sign up another player
        </button>
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const years = form.yearsPlayed === "" ? null : Number(form.yearsPlayed);

  return (
    <div ref={topRef} className="scroll-mt-4">
      <h2 className="font-display text-3xl font-extrabold text-bms-deep">Sign up for tryouts</h2>
      <p className="mt-1 text-muted">
        Fields marked <span className="font-semibold text-stitch">*</span> are needed. There are no wrong answers!
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        {errorCount > 0 && (
          <div role="alert" className="rounded-2xl border-2 border-stitch/40 bg-stitch/5 p-4 text-[15px]">
            <strong>Almost there!</strong> Check the {errorCount === 1 ? "spot" : `${errorCount} spots`} marked below.
          </div>
        )}
        {result?.status === "error" && (
          <div role="alert" className="rounded-2xl border-2 border-stitch/40 bg-stitch/5 p-4 text-[15px]">
            {result.message}
          </div>
        )}

        {/* Hidden from people. Bots fill it in. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <Card step={1} title="Who are you?">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="firstName"
              label="First name"
              value={form.firstName}
              onChange={(v) => set("firstName", v)}
              error={errors.firstName}
              autoComplete="given-name"
              maxLength={LIMITS.name}
            />
            <TextField
              id="lastName"
              label="Last name"
              value={form.lastName}
              onChange={(v) => set("lastName", v)}
              error={errors.lastName}
              autoComplete="family-name"
              maxLength={LIMITS.name}
            />
          </div>
        </Card>

        <Card step={2} title="What grade are you in?" required error={errors.grade} legendId="field-grade">
          <div className="grid grid-cols-3 gap-3">
            {GRADES.map((g) => (
              <Choice
                key={g}
                type="radio"
                name="grade"
                checked={form.grade === String(g)}
                onChange={() => set("grade", String(g))}
                first={g === GRADES[0]}
                fieldId="grade"
              >
                <span className="text-2xl font-extrabold">{g}</span>
                <span className="text-sm font-semibold opacity-80">th</span>
              </Choice>
            ))}
          </div>
        </Card>

        <Card
          step={3}
          title="What positions do you play, or want to try?"
          hint="Pick as many as you like."
          required
          error={errors.positions}
          legendId="field-positions"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {POSITIONS.map((p, i) => (
              <Choice
                key={p.id}
                type="checkbox"
                name="positions"
                checked={form.positions.includes(p.id)}
                onChange={() => set("positions", toggle(form.positions, p.id))}
                wide={p.id === "not_sure"}
                first={i === 0}
                fieldId="positions"
              >
                {p.id === "not_sure" ? (
                  <>
                    <span aria-hidden>🤷</span> {p.label}
                  </>
                ) : (
                  <>
                    <span className="rounded-md bg-black/10 px-1.5 text-xs font-bold opacity-70">{p.short}</span>
                    {p.label}
                  </>
                )}
              </Choice>
            ))}
          </div>
        </Card>

        <Card
          step={4}
          title="How many years have you played baseball before this year?"
          hint="Count any league or team. Softball counts too!"
          required
          error={errors.yearsPlayed}
          legendId="field-yearsPlayed"
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {EXPERIENCE.map((x, i) => (
              <Choice
                key={x.value}
                type="radio"
                name="yearsPlayed"
                checked={form.yearsPlayed === String(x.value)}
                onChange={() => set("yearsPlayed", String(x.value))}
                wide={x.value === 0}
                first={i === 0}
                fieldId="yearsPlayed"
              >
                {x.emoji && <span aria-hidden>{x.emoji}</span>}
                {x.value === 0 ? x.label : x.value === 6 ? "6+" : x.value}
              </Choice>
            ))}
          </div>
          {years !== null && (
            <p className="pop mt-4 rounded-xl bg-gold-light px-4 py-3 font-semibold text-bms-deep" aria-live="polite">
              {years === 0
                ? "Awesome! Everybody starts somewhere. Tryouts are a great place to learn. 🌱"
                : years >= 4
                  ? "Wow, look at you! We can't wait to see what you've got. 🔥"
                  : "Nice! Every season of practice helps. See you at tryouts! 💪"}
            </p>
          )}
        </Card>

        <Card step={5} title="Where have you played?" hint="Pick any that fit." optional>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLAYED_WHERE.map((p) => (
              <Choice
                key={p.id}
                type="checkbox"
                name="playedWhere"
                checked={form.playedWhere.includes(p.id)}
                onChange={() => set("playedWhere", toggle(form.playedWhere, p.id))}
                align="start"
              >
                {p.label}
              </Choice>
            ))}
          </div>
          <div className="mt-4">
            <TextField
              id="teamNames"
              label="Team names (if you remember)"
              value={form.teamNames}
              onChange={(v) => set("teamNames", v)}
              error={errors.teamNames}
              maxLength={LIMITS.teams}
              optional
              placeholder="Example: Blacksburg Little League Cubs"
            />
          </div>
        </Card>

        <Card step={6} title="Anything else you want the coach to know?" optional>
          <label htmlFor="field-notes" className="sr-only">
            Anything else you want the coach to know?
          </label>
          <textarea
            id="field-notes"
            rows={4}
            maxLength={LIMITS.notes}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            aria-invalid={Boolean(errors.notes)}
            placeholder="Other sports you play, questions about tryouts, something you're excited or nervous about... anything!"
            className="focus-ring w-full rounded-xl border-2 border-bms/20 bg-white px-4 py-3 text-base placeholder:text-muted/70"
          />
          {errors.notes && <FieldError>{errors.notes}</FieldError>}
        </Card>

        <div className="pt-2">
          <button
            type="submit"
            disabled={pending}
            className="focus-ring w-full rounded-full bg-bms px-6 py-4 text-xl font-extrabold text-white shadow-card transition hover:bg-bms-dark disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:px-10"
          >
            {pending ? "Sending..." : "Sign me up! ⚾"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Card({
  step,
  title,
  hint,
  required,
  optional,
  error,
  legendId,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  legendId?: string;
  children: React.ReactNode;
}) {
  const heading = (
    <span className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-extrabold text-ink"
      >
        {step}
      </span>
      <span className="font-display text-lg font-bold leading-snug text-bms-deep sm:text-xl">
        {title}
        {required && <span className="text-stitch"> *</span>}
        {optional && <span className="ml-2 text-sm font-medium text-muted">(optional)</span>}
      </span>
    </span>
  );
  const body = (
    <>
      {hint && <p className="mb-3 ml-10 text-[15px] text-muted">{hint}</p>}
      {children}
      {error && <FieldError>{error}</FieldError>}
    </>
  );
  // Choice groups are fieldsets with a legend; text sections use a plain heading.
  if (legendId || optional) {
    return (
      <fieldset
        className={`rounded-3xl bg-white p-5 shadow-card sm:p-6 ${error ? "ring-2 ring-stitch/50" : ""}`}
        aria-invalid={Boolean(error) || undefined}
      >
        <legend className="float-left mb-3 w-full">{heading}</legend>
        <div className="clear-left">{body}</div>
      </fieldset>
    );
  }
  return (
    <section className={`rounded-3xl bg-white p-5 shadow-card sm:p-6 ${error ? "ring-2 ring-stitch/50" : ""}`}>
      <div className="mb-3">{heading}</div>
      {body}
    </section>
  );
}

function Choice({
  type,
  name,
  checked,
  onChange,
  wide,
  align = "center",
  first,
  fieldId,
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  wide?: boolean;
  align?: "center" | "start";
  first?: boolean;
  fieldId?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`${wide ? "col-span-full" : ""} block`}>
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        id={first && fieldId ? `field-${fieldId}` : undefined}
        className="peer sr-only"
      />
      <span className={`chip ${align === "start" ? "justify-start text-left" : ""}`}>
        {type === "checkbox" && (
          <span
            aria-hidden
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs ${
              checked ? "border-white bg-white text-bms" : "border-bms/30"
            }`}
          >
            {checked ? "✓" : ""}
          </span>
        )}
        {children}
      </span>
    </label>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  optional,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: boolean;
  autoComplete?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={`field-${id}`} className="mb-1.5 block font-semibold">
        {label}
        {!optional && <span className="text-stitch"> *</span>}
      </label>
      <input
        id={`field-${id}`}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `err-${id}` : undefined}
        className={`focus-ring w-full rounded-xl border-2 bg-white px-4 py-3 text-base placeholder:text-muted/70 ${
          error ? "border-stitch" : "border-bms/20"
        }`}
        {...rest}
      />
      {error && <FieldError id={`err-${id}`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 text-[15px] font-semibold text-stitch">
      {children}
    </p>
  );
}

function NextStep({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-bms-light p-4">
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <p className="text-[15px] text-ink">{text}</p>
    </div>
  );
}
