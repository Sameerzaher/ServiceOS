import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_APP_SETTINGS,
  normalizeAppSettings,
  type AppSettings,
} from "@/core/types/settings";

const SETTINGS_TABLES = ["serviceos_app_settings", "app_settings"] as const;
const SETTINGS_COLUMNS = ["payload", "settings", "value", "data"] as const;
type SettingsTable = (typeof SETTINGS_TABLES)[number];
type SettingsColumn = (typeof SETTINGS_COLUMNS)[number];
type SettingsSource = { table: SettingsTable; column: SettingsColumn };

let preferredSettingsSource: SettingsSource | null = null;
let probingDisabled = false;

function listSettingsSources(): SettingsSource[] {
  const sources: SettingsSource[] = [];
  if (preferredSettingsSource) {
    sources.push(preferredSettingsSource);
  }
  for (const table of SETTINGS_TABLES) {
    for (const column of SETTINGS_COLUMNS) {
      const exists =
        preferredSettingsSource &&
        preferredSettingsSource.table === table &&
        preferredSettingsSource.column === column;
      if (!exists) sources.push({ table, column });
    }
  }
  return sources;
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const maybeMessage =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";
  return maybeCode === "PGRST205" || maybeMessage.includes("could not find the table");
}

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const maybeMessage =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";
  return (
    maybeCode === "42703" ||
    maybeCode === "PGRST204" ||
    maybeMessage.includes("column") ||
    maybeMessage.includes("schema cache")
  );
}

/** App preferences (`serviceos_app_settings.payload` ↔ `AppSettings`). */
export async function loadAppSettings(
  supabase: SupabaseClient,
  businessId: string,
): Promise<AppSettings> {
  if (probingDisabled) {
    return DEFAULT_APP_SETTINGS;
  }

  for (const source of listSettingsSources()) {
    const { table: tableName, column: columnName } = source;
      const { data, error } = await supabase
        .from(tableName)
        .select(columnName)
        .eq("business_id", businessId)
        .maybeSingle();

      if (!error) {
        preferredSettingsSource = source;
        const payload =
          data && typeof data === "object" ? (data as Record<string, unknown>)[columnName] : null;
        return normalizeAppSettings(payload ?? null);
      }

      if (isMissingColumnError(error)) {
        continue;
      }
      if (!isMissingRelationError(error)) {
        console.error("[ServiceOS] loadAppSettings", error);
        throw error;
      }
  }

  // If none of the legacy/canonical sources exist, stop probing this session.
  probingDisabled = true;
  return DEFAULT_APP_SETTINGS;
}

export async function persistAppSettings(
  supabase: SupabaseClient,
  businessId: string,
  settings: AppSettings,
): Promise<void> {
  if (probingDisabled) {
    return;
  }

  let lastMissingTableError: unknown = null;
  let lastMissingColumnError: unknown = null;

  for (const source of listSettingsSources()) {
    const { table: tableName, column: columnName } = source;
      const payload: Record<string, unknown> = {
        business_id: businessId,
        [columnName]: settings,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from(tableName)
        .upsert(payload, { onConflict: "business_id" });
      if (!error) {
        preferredSettingsSource = source;
        return;
      }

      if (isMissingColumnError(error)) {
        lastMissingColumnError = error;
        continue;
      }
      if (!isMissingRelationError(error)) {
        throw error;
      }
      lastMissingTableError = error;
  }

  if (lastMissingTableError || lastMissingColumnError) {
    // Avoid repeated noisy probes/logs during this app session.
    probingDisabled = true;
    console.warn(
      "[ServiceOS] persistAppSettings skipped (settings table/column missing).",
      lastMissingTableError ?? lastMissingColumnError,
    );
  }
}
