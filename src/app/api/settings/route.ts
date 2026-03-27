import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { loadAppSettings, persistAppSettings } from "@/core/repositories/supabase/appSettingsRepository";
import { loadBookingSettings, persistBookingSettings } from "@/core/repositories/supabase/bookingSettingsRepository";
import { normalizeAppSettings, type AppSettings } from "@/core/types/settings";
import { normalizeAvailabilitySettings } from "@/core/types/availability";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "טעינת ההגדרות אינה זמינה כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "בקשת ההגדרות לא תקינה.";
const HE_ERR_GENERIC = "אירעה תקלה בשמירת ההגדרות. נסו שוב.";

type SettingsApiResponse = {
  businessName: string;
  teacherName: string;
  phone: string;
  defaultLessonDuration: number;
  bookingEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  bufferBetweenLessons: number;
};

function toApiShape(
  app: AppSettings,
  bookingEnabled: boolean,
): SettingsApiResponse {
  return {
    businessName: app.businessName,
    teacherName: app.teacherName ?? "",
    phone: app.businessPhone,
    defaultLessonDuration: app.defaultLessonDurationMinutes,
    bookingEnabled,
    workingHoursStart: app.workingHoursStart,
    workingHoursEnd: app.workingHoursEnd,
    bufferBetweenLessons: app.lessonBufferMinutes,
  };
}

function parseBody(raw: unknown): SettingsApiResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const businessName = typeof o.businessName === "string" ? o.businessName.trim() : "";
  const teacherName = typeof o.teacherName === "string" ? o.teacherName.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const workingHoursStart =
    typeof o.workingHoursStart === "string" ? o.workingHoursStart.trim() : "";
  const workingHoursEnd =
    typeof o.workingHoursEnd === "string" ? o.workingHoursEnd.trim() : "";
  const bookingEnabled = typeof o.bookingEnabled === "boolean" ? o.bookingEnabled : null;
  const defaultLessonDuration = Number(o.defaultLessonDuration);
  const bufferBetweenLessons = Number(o.bufferBetweenLessons);

  if (bookingEnabled === null) return null;
  if (!Number.isFinite(defaultLessonDuration)) return null;
  if (!Number.isFinite(bufferBetweenLessons)) return null;

  return {
    businessName,
    teacherName,
    phone,
    defaultLessonDuration,
    bookingEnabled,
    workingHoursStart,
    workingHoursEnd,
    bufferBetweenLessons,
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req);
    const [appSettings, bookingSettings, teacherRow] = await Promise.all([
      loadAppSettings(supabase, businessId, teacherId),
      loadBookingSettings(supabase, businessId, teacherId),
      supabase
        .from("teachers")
        .select("slug")
        .eq("business_id", businessId)
        .eq("id", teacherId)
        .maybeSingle(),
    ]);

    if (teacherRow.error) {
      console.error("[settings/get] teacher slug", teacherRow.error);
    }
    const teacherSlug =
      !teacherRow.error &&
      teacherRow.data &&
      typeof (teacherRow.data as { slug?: string }).slug === "string"
        ? (teacherRow.data as { slug: string }).slug.trim()
        : null;

    return NextResponse.json({
      ok: true as const,
      settings: toApiShape(appSettings, bookingSettings.bookingEnabled),
      teacherSlug: teacherSlug && teacherSlug.length > 0 ? teacherSlug : null,
    });
  } catch (e) {
    console.error("[settings/get]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }
  const parsed = parseBody(raw);
  if (!parsed) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req, raw);
    const currentApp = await loadAppSettings(supabase, businessId, teacherId);
    const currentAvailability = await loadBookingSettings(
      supabase,
      businessId,
      teacherId,
    );

    const nextApp = normalizeAppSettings({
      ...currentApp,
      teacherId,
      businessName: parsed.businessName,
      teacherName: parsed.teacherName,
      businessPhone: parsed.phone,
      defaultLessonDurationMinutes: parsed.defaultLessonDuration,
      lessonBufferMinutes: parsed.bufferBetweenLessons,
      workingHoursStart: parsed.workingHoursStart,
      workingHoursEnd: parsed.workingHoursEnd,
    });
    const nextAvailability = normalizeAvailabilitySettings({
      ...currentAvailability,
      teacherId,
      bookingEnabled: parsed.bookingEnabled,
    });

    await Promise.all([
      persistAppSettings(supabase, businessId, teacherId, nextApp),
      persistBookingSettings(supabase, businessId, teacherId, nextAvailability),
    ]);

    const { data: slugRow } = await supabase
      .from("teachers")
      .select("slug")
      .eq("business_id", businessId)
      .eq("id", teacherId)
      .maybeSingle();
    const slugRaw =
      slugRow && typeof slugRow === "object" && "slug" in slugRow
        ? String((slugRow as { slug: unknown }).slug ?? "").trim()
        : "";
    const teacherSlugAfter = slugRaw.length > 0 ? slugRaw : null;

    return NextResponse.json({
      ok: true as const,
      settings: toApiShape(nextApp, nextAvailability.bookingEnabled),
      teacherSlug: teacherSlugAfter,
    });
  } catch (e) {
    console.error("[settings/put]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
