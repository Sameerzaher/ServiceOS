import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";

function safeLoadingDefaults(): AvailabilitySettings {
  return normalizeAvailabilitySettings({ bookingEnabled: false });
}

function mapRowToPartial(row: Record<string, unknown>) {
  return {
    bookingEnabled: row.booking_enabled,
    weeklyAvailability: row.weekly_availability,
    slotDurationMinutes: row.slot_duration_minutes,
    daysAhead: row.days_ahead,
  };
}

/**
 * Public / instructor availability (`booking_settings` columns ↔ `AvailabilitySettings`).
 * Single source of truth for weekly slots and booking toggle.
 */
export async function loadBookingSettings(
  supabase: SupabaseClient,
  businessId: string,
): Promise<AvailabilitySettings> {
  const { data, error } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    console.error("[ServiceOS] loadBookingSettings", error);
    throw error;
  }

  if (!data || typeof data !== "object") {
    return safeLoadingDefaults();
  }

  return normalizeAvailabilitySettings(
    mapRowToPartial(data as Record<string, unknown>),
  );
}

export async function persistBookingSettings(
  supabase: SupabaseClient,
  businessId: string,
  settings: AvailabilitySettings,
): Promise<void> {
  const { error } = await supabase.from("booking_settings").upsert(
    {
      business_id: businessId,
      booking_enabled: settings.bookingEnabled,
      weekly_availability: settings.weeklyAvailability,
      slot_duration_minutes: settings.slotDurationMinutes,
      days_ahead: settings.daysAhead,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  );
  if (error) throw error;
}

/** @deprecated Use `loadBookingSettings`; kept for `ServiceStorage` shape. */
export const loadAvailabilitySettings = loadBookingSettings;

/** @deprecated Use `persistBookingSettings`; kept for `ServiceStorage` shape. */
export const persistAvailabilitySettings = persistBookingSettings;

export type PublicBookingGate =
  | { ok: true; bookingEnabled: boolean; daysAhead: number }
  | { ok: false };

/**
 * Load booking toggle + horizon for server-side public booking validation.
 * On hard DB errors returns `{ ok: false }` so the route can respond 500 (no silent defaults).
 */
export async function loadPublicBookingGate(
  supabase: SupabaseClient,
  businessId: string,
): Promise<PublicBookingGate> {
  const { data, error } = await supabase
    .from("booking_settings")
    .select("booking_enabled, days_ahead")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    console.error("[ServiceOS] loadPublicBookingGate", error);
    return { ok: false };
  }

  if (!data || typeof data !== "object") {
    const safe = safeLoadingDefaults();
    return {
      ok: true,
      bookingEnabled: safe.bookingEnabled,
      daysAhead: safe.daysAhead,
    };
  }

  const normalized = normalizeAvailabilitySettings(
    mapRowToPartial(data as Record<string, unknown>),
  );
  return {
    ok: true,
    bookingEnabled: normalized.bookingEnabled,
    daysAhead: normalized.daysAhead,
  };
}
