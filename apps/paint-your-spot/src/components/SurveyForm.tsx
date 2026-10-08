"use client";

import { useActionState } from "react";
import { saveInterest, type SaveState } from "@/app/interest/actions";
import {
  COMMENTS_MAX,
  INTEREST_LEVELS,
  KEEP_YEARLY,
  LOTS,
  NAME_MAX,
  PAINTERS,
  PRICE_COMFORT,
  ROLES,
  type SurveyAnswers,
} from "@/lib/survey";

type Option = { value: string; label: string; hint?: string };

function Field({
  legend,
  hint,
  error,
  children,
}: {
  legend: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border-2 border-asphalt/10 bg-white p-5 sm:p-6" aria-invalid={Boolean(error)}>
      <legend className="sr-only">{legend}</legend>
      <p aria-hidden className="font-display text-lg font-bold">
        {legend}
      </p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
      {error && (
        <p className="mt-3 text-sm font-semibold text-sold" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Chips({
  name,
  options,
  type = "radio",
  defaultValue,
}: {
  name: string;
  options: readonly Option[];
  type?: "radio" | "checkbox";
  defaultValue?: string | string[];
}) {
  const checked = (v: string) => (Array.isArray(defaultValue) ? defaultValue.includes(v) : defaultValue === v);
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((o) => (
        <label key={o.value} className="cursor-pointer">
          <input
            type={type}
            name={name}
            value={o.value}
            defaultChecked={checked(o.value)}
            required={type === "radio"}
            className="peer sr-only"
          />
          <span className="flex flex-col rounded-xl border-2 border-asphalt/20 px-4 py-3 transition hover:border-asphalt peer-checked:border-bms peer-checked:bg-tape peer-checked:shadow-sign peer-focus-visible:ring-4 peer-focus-visible:ring-tape/60">
            <span className="font-semibold">{o.label}</span>
            {o.hint && <span className="text-xs text-ink/70">{o.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

export function SurveyForm({
  email,
  defaults,
  isBoss,
  isUpdate,
}: {
  email: string;
  defaults: Partial<SurveyAnswers>;
  isBoss: boolean;
  isUpdate: boolean;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveInterest, {});
  const e = state.errors ?? {};
  // After a rejected submit, show what they typed rather than the old answers.
  const d = (state.values ?? defaults) as Partial<Record<keyof SurveyAnswers, string | string[] | null>>;
  const one = (k: keyof SurveyAnswers) => (typeof d[k] === "string" ? (d[k] as string) : undefined);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block rounded-2xl border-2 border-asphalt/10 bg-white p-5">
          <span className="font-display text-lg font-bold">Name</span>
          <input
            name="name"
            defaultValue={one("name")}
            required
            maxLength={NAME_MAX}
            autoComplete="name"
            className="mt-3 block w-full rounded-lg border-2 border-asphalt/20 px-3 py-2 focus:border-asphalt focus:outline-none focus:ring-4 focus:ring-tape/60"
          />
          {e.name && <span className="mt-2 block text-sm font-semibold text-sold">{e.name}</span>}
        </label>
        <label className="block rounded-2xl border-2 border-asphalt/10 bg-white p-5">
          <span className="font-display text-lg font-bold">Email</span>
          <input
            value={email}
            readOnly
            aria-readonly
            className="mt-3 block w-full cursor-not-allowed rounded-lg border-2 border-asphalt/10 bg-chalk-dim/50 px-3 py-2 text-muted"
          />
          <span className="mt-2 block text-xs text-muted">The school email you signed in with.</span>
        </label>
      </div>

      <Field legend="Your role" error={e.role}>
        <Chips name="role" options={ROLES} defaultValue={one("role")} />
      </Field>

      <Field legend="How interested are you?" error={e.interest_level}>
        <Chips name="interest_level" options={INTEREST_LEVELS} defaultValue={one("interest_level")} />
      </Field>

      <Field legend="Preferred lot" error={e.preferred_lot}>
        <Chips name="preferred_lot" options={LOTS} defaultValue={one("preferred_lot")} />
      </Field>

      <Field legend="Who paints?" hint="Art student requests are a donation to the art department, never a payment to a student." error={e.painter}>
        <Chips name="painter" options={PAINTERS} defaultValue={one("painter")} />
      </Field>

      <Field legend="Would you keep it year to year if offered?" error={e.keep_yearly}>
        <Chips name="keep_yearly" options={KEEP_YEARLY} defaultValue={one("keep_yearly")} />
      </Field>

      <Field legend="Price comfort" hint="Every spot will be one price. What would feel fair?" error={e.price_comfort}>
        <Chips name="price_comfort" options={PRICE_COMFORT} defaultValue={one("price_comfort")} />
      </Field>

      <label className="block rounded-2xl border-2 border-asphalt/10 bg-white p-5 sm:p-6">
        <span className="font-display text-lg font-bold">Anything else?</span>
        <span className="mt-1 block text-sm text-muted">Optional. Ideas, questions, design dreams.</span>
        <textarea
          name="comments"
          defaultValue={one("comments") ?? ""}
          rows={4}
          maxLength={COMMENTS_MAX}
          className="mt-3 block w-full rounded-lg border-2 border-asphalt/20 px-3 py-2 focus:border-asphalt focus:outline-none focus:ring-4 focus:ring-tape/60"
        />
        {e.comments && <span className="mt-2 block text-sm font-semibold text-sold">{e.comments}</span>}
      </label>

      {state.formError && (
        <p role="alert" className="rounded-xl bg-sold px-4 py-3 font-semibold text-chalk">
          {state.formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="focus-ring w-full rounded-full bg-bms px-8 py-4 font-display text-lg font-extrabold text-tape shadow-sign transition hover:bg-bms-dark disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Recording your deed..." : isUpdate ? "Update my answers" : "Count me in"}
      </button>
    </form>
  );
}
