"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { SETTING_FIELDS, validateSettings, type SettingKey } from "@/lib/settings";

export interface SettingsState {
  ok?: boolean;
  errors?: Partial<Record<SettingKey, string>>;
  formError?: string;
}

export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const admin = await requireAdmin();
  if (!admin) return { formError: "Admins only." };

  const input: Record<string, unknown> = {};
  for (const { key } of SETTING_FIELDS) input[key] = form.get(key);
  const result = validateSettings(input);
  if (!result.ok) return { errors: result.errors };

  const now = new Date().toISOString();
  const { error } = await admin.db
    .from("pys_settings")
    .upsert(
      SETTING_FIELDS.map(({ key }) => ({ key, value: result.values[key], updated_at: now })),
      { onConflict: "key" },
    );
  if (error) {
    console.error("[paint-your-spot] settings save failed:", error.message);
    return { formError: "Settings did not save. Try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
