/**
 * MVP: single tenant per deployment via fixed business UUID.
 * Must match RLS policies in `supabase/migrations/001_serviceos_core.sql` (or update both).
 */
export const DEFAULT_MVP_BUSINESS_ID =
  "00000000-0000-0000-0000-000000000001";

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

export function getSupabaseBusinessId(): string {
  const v = process.env.NEXT_PUBLIC_BUSINESS_ID?.trim();
  if (v && isUuid(v)) return v;
  return DEFAULT_MVP_BUSINESS_ID;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

/**
 * PostgREST table for appointments (`business_id`, `start_at`, etc.).
 * Default `appointments` matches common Supabase schemas; if you use the legacy
 * name from an older migration, set `NEXT_PUBLIC_SUPABASE_APPOINTMENTS_TABLE=serviceos_appointments`.
 */
export function getSupabaseAppointmentsTable(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_APPOINTMENTS_TABLE?.trim();
  if (v) return v;
  return "appointments";
}

/**
 * Client directory table (`business_id`, `full_name`, `phone`, …).
 * Default `clients`; legacy: `NEXT_PUBLIC_SUPABASE_CLIENTS_TABLE=serviceos_clients`.
 */
export function getSupabaseClientsTable(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_CLIENTS_TABLE?.trim();
  if (v) return v;
  return "clients";
}
