import {
  getSupabaseDefaultTeacherId,
  isUuid,
} from "@/core/config/supabaseEnv";

/**
 * Resolves tenant teacher scope for data APIs.
 *
 * Precedence:
 * 1. Query `?teacherId=` (UUID)
 * 2. Header `x-teacher-id` (UUID)
 * 3. JSON body field `teacherId` when `body` is provided (POST/PUT after parse)
 * 4. Fallback: {@link getSupabaseDefaultTeacherId} (env / MVP default)
 */
export function resolveTeacherIdFromRequest(req: Request, body?: unknown): string {
  try {
    const q = new URL(req.url).searchParams.get("teacherId")?.trim();
    if (q && isUuid(q)) return q;
  } catch {
    /* ignore invalid URL */
  }

  const headerRaw =
    req.headers.get("x-teacher-id")?.trim() ||
    req.headers.get("X-Teacher-Id")?.trim();
  if (headerRaw && isUuid(headerRaw)) return headerRaw;

  if (body !== undefined && body !== null && typeof body === "object") {
    const raw = (body as Record<string, unknown>).teacherId;
    if (typeof raw === "string") {
      const t = raw.trim();
      if (isUuid(t)) return t;
    }
  }

  return getSupabaseDefaultTeacherId();
}
