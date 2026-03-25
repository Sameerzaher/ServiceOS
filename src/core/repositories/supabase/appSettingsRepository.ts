import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_APP_SETTINGS,
  normalizeAppSettings,
  type AppSettings,
} from "@/core/types/settings";

/** App preferences (`serviceos_app_settings.payload` ↔ `AppSettings`). */
export async function loadAppSettings(
  supabase: SupabaseClient,
  businessId: string,
): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("serviceos_app_settings")
    .select("payload")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    console.error("[ServiceOS] loadAppSettings", error);
    throw error;
  }

  return normalizeAppSettings(data?.payload ?? null);
}

export async function persistAppSettings(
  supabase: SupabaseClient,
  businessId: string,
  settings: AppSettings,
): Promise<void> {
  const { error } = await supabase.from("serviceos_app_settings").upsert(
    {
      business_id: businessId,
      payload: settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  );
  if (error) throw error;
}
