"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "@/app/admin/actions";
import { SETTING_FIELDS, type Settings } from "@/lib/settings";

export function SettingsForm({ values }: { values: Settings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});
  const errors = state.errors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {SETTING_FIELDS.map((f) => (
        <label key={f.key} className={f.kind === "text" || f.kind === "url" ? "sm:col-span-2" : ""}>
          <span className="block text-sm font-bold">{f.label}</span>
          <span className="block text-xs text-muted">{f.hint}</span>
          <input
            name={f.key}
            defaultValue={values[f.key]}
            inputMode={f.kind === "money" || f.kind === "number" ? "decimal" : undefined}
            type={f.kind === "url" ? "url" : "text"}
            className="mt-2 block w-full rounded-lg border-2 border-asphalt/20 px-3 py-2 focus:border-asphalt focus:outline-none focus:ring-4 focus:ring-tape/60"
          />
          {errors[f.key] && <span className="mt-1 block text-sm font-semibold text-sold">{errors[f.key]}</span>}
        </label>
      ))}
      <div className="flex items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="focus-ring rounded-full bg-bms px-6 py-3 font-bold text-tape hover:bg-bms-dark disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save settings"}
        </button>
        {state.ok && <span className="font-semibold text-grass">Saved. The landing page is updated.</span>}
        {state.formError && <span className="font-semibold text-sold">{state.formError}</span>}
      </div>
    </form>
  );
}
