import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import {
  loadAppSettingsOrDefault,
} from "@/core/repositories/supabase/appSettingsRepository";
import { loadBookingSettingsOrDefault } from "@/core/repositories/supabase/bookingSettingsRepository";
import { teacherFromRow, type TeacherRow } from "@/core/storage/supabase/mappers";
import { coerceBusinessType, type BusinessType } from "@/core/types/teacher";
import type { AvailabilitySettings } from "@/core/types/availability";
import {
  isValidPublicTeacherSlug,
  normalizeTeacherSlug,
} from "@/core/validation/teacher";
import { heUi } from "@/config";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

/** Prevents static analysis from executing the handler without a real Request URL. */
export const dynamic = "force-dynamic";

type BootstrapTeacher = {
  id: string;
  slug: string;
  fullName: string;
  businessName: string;
  phone: string;
  businessType: BusinessType;
};

type BootstrapOk = {
  ok: true;
  teacher: BootstrapTeacher;
  availability: AvailabilitySettings;
};

type BootstrapErr = {
  ok: false;
  error: string;
};

function jsonErr(message: string, status: number): NextResponse<BootstrapErr> {
  return NextResponse.json({ ok: false as const, error: message }, { status });
}

function isUuidLike(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v.trim(),
  );
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function asNonEmptyString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function businessIdFromRow(row: unknown, fallback: string): string {
  if (!isRecord(row)) return fallback;
  const bid = row.business_id;
  if (typeof bid === "string" && bid.trim().length > 0) return bid.trim();
  return fallback;
}

/**
 * Prefer mapper; if it returns null (partial row), rebuild from snake_case — avoids 404/500
 * when UI slug is valid but normalizedTeacher rejects sparse data.
 */
function bootstrapTeacherFromDbRow(
  row: unknown,
  urlSlugNormalized: string,
): BootstrapTeacher | null {
  if (!isRecord(row)) {
    console.warn("[public-booking/bootstrap] bootstrapTeacherFromDbRow: not an object");
    return null;
  }

  const mapped = teacherFromRow(row as unknown as TeacherRow);
  if (mapped) {
    return {
      id: mapped.id,
      slug: mapped.slug,
      fullName: mapped.fullName,
      businessName: mapped.businessName,
      phone: mapped.phone,
      businessType: mapped.businessType,
    };
  }

  const id = asNonEmptyString(row.id);
  if (!id) {
    console.warn("[public-booking/bootstrap] bootstrapTeacherFromDbRow: missing id on row");
    return null;
  }

  const slug =
    asNonEmptyString(row.slug) ?? urlSlugNormalized;
  const fullName = typeof row.full_name === "string" ? row.full_name : "";
  const businessName = typeof row.business_name === "string" ? row.business_name : "";
  const phone = typeof row.phone === "string" ? row.phone : "";

  console.warn(
    "[public-booking/bootstrap] teacherFromRow returned null; using raw row fields",
    { id, slug },
  );

  return {
    id,
    slug,
    fullName: fullName.trim(),
    businessName: businessName.trim(),
    phone: phone.trim(),
    businessType: coerceBusinessType(row.business_type),
  };
}

async function loadLegacyBootstrap(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  businessId: string,
  teacherIdForScope: string,
  slugForDisplay: string,
): Promise<{ teacher: BootstrapTeacher; availability: AvailabilitySettings }> {
  console.log("[public-booking/bootstrap] Step=legacy_load_app_settings", {
    businessId,
    teacherId: teacherIdForScope,
  });
  const legacySettings = await loadAppSettingsOrDefault(
    supabase,
    businessId,
    teacherIdForScope,
    "legacy-bootstrap",
  );
  console.log("[public-booking/bootstrap] Step=legacy_app_settings_result", {
    hasBusinessName: legacySettings.businessName.trim().length > 0,
    activePreset: legacySettings.activePreset,
  });

  const availability = await loadBookingSettingsOrDefault(
    supabase,
    businessId,
    teacherIdForScope,
    "legacy-bootstrap",
  );
  console.log("[public-booking/bootstrap] Step=legacy_booking_settings_result", {
    bookingEnabled: availability.bookingEnabled,
    daysAhead: availability.daysAhead,
  });

  return {
    teacher: {
      id: teacherIdForScope,
      slug: slugForDisplay,
      fullName: legacySettings.teacherName,
      businessName: legacySettings.businessName,
      phone: legacySettings.businessPhone,
      businessType: coerceBusinessType(legacySettings.activePreset),
    },
    availability,
  };
}

export async function GET(req: Request): Promise<NextResponse<BootstrapOk | BootstrapErr>> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[public-booking/bootstrap] Supabase admin not configured (URL / service role)");
    return jsonErr(heUi.publicBooking.errUnavailable, 503);
  }

  let slug: string;
  try {
    slug = new URL(req.url).searchParams.get("slug")?.trim() ?? "";
  } catch (e) {
    console.error("[public-booking/bootstrap] Step=parse_url failed:", e);
    return jsonErr(heUi.publicBooking.invalidSlugMessage, 400);
  }

  console.log("[public-booking/bootstrap] Step=start slug_received=", JSON.stringify(slug));

  if (!isValidPublicTeacherSlug(slug)) {
    console.warn("[public-booking/bootstrap] Step=validate_slug invalid format");
    return jsonErr(heUi.publicBooking.invalidSlugMessage, 404);
  }

  const normalizedSlug = normalizeTeacherSlug(slug);
  const envFallbackBusinessId = getSupabaseBusinessId();

  try {
    const supabase = getSupabaseAdminClient();

    let teacherRes = await supabase
      .from("teachers")
      .select("*")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (!teacherRes.data && !teacherRes.error && isUuidLike(normalizedSlug)) {
      console.log("[public-booking/bootstrap] Step=lookup no row by slug; trying id=UUID");
      teacherRes = await supabase
        .from("teachers")
        .select("*")
        .eq("id", normalizedSlug)
        .maybeSingle();
    }

    const { data: row, error: teacherErr } = teacherRes;

    if (teacherErr) {
      console.error(
        "[public-booking/bootstrap] Step=teacher_query failed (PostgREST):",
        teacherErr,
      );
      return jsonErr(heUi.publicBooking.errUnavailable, 503);
    }

    if (!row) {
      if (!isUuidLike(normalizedSlug)) {
        console.warn(
          "[public-booking/bootstrap] Step=teacher_lookup teacher_not_found slug=",
          normalizedSlug,
        );
        return jsonErr(heUi.publicBooking.invalidSlugMessage, 404);
      }

      console.log(
        "[public-booking/bootstrap] Step=legacy_no_teacher_row using env business_id for UUID scope",
        normalizedSlug,
      );
      const { teacher, availability } = await loadLegacyBootstrap(
        supabase,
        envFallbackBusinessId,
        normalizedSlug,
        normalizedSlug,
      );
      return NextResponse.json({
        ok: true as const,
        teacher,
        availability,
      });
    }

    console.log("[public-booking/bootstrap] Step=teacher_row_present");

    const teacher = bootstrapTeacherFromDbRow(row, normalizedSlug);
    if (!teacher) {
      console.warn(
        "[public-booking/bootstrap] Step=map_teacher unusable row slug=",
        normalizedSlug,
      );
      return jsonErr(heUi.publicBooking.invalidSlugMessage, 404);
    }

    let teacherBusinessId = businessIdFromRow(row, "");
    if (!teacherBusinessId) {
      teacherBusinessId = envFallbackBusinessId;
      console.warn(
        "[public-booking/bootstrap] Step=business_id missing on teacher row; using NEXT_PUBLIC_BUSINESS_ID / default",
        { teacherId: teacher.id, fallback: teacherBusinessId },
      );
    }

    console.log("[public-booking/bootstrap] Step=load_app_settings", {
      teacherId: teacher.id,
      businessId: teacherBusinessId,
    });
    const appSettings = await loadAppSettingsOrDefault(
      supabase,
      teacherBusinessId,
      teacher.id,
      "bootstrap",
    );
    console.log("[public-booking/bootstrap] Step=app_settings_result", {
      hasBusinessName: appSettings.businessName.trim().length > 0,
      hasTeacherName: appSettings.teacherName.trim().length > 0,
      activePreset: appSettings.activePreset,
    });

    console.log("[public-booking/bootstrap] Step=load_booking_settings", {
      teacherId: teacher.id,
      businessId: teacherBusinessId,
    });

    const availability = await loadBookingSettingsOrDefault(
      supabase,
      teacherBusinessId,
      teacher.id,
      "bootstrap",
    );
    console.log("[public-booking/bootstrap] Step=booking_settings_result", {
      bookingEnabled: availability.bookingEnabled,
      daysAhead: availability.daysAhead,
      slotDurationMinutes: availability.slotDurationMinutes,
    });

    const businessName =
      teacher.businessName.trim() ||
      appSettings.businessName.trim() ||
      "";
    const fullName =
      teacher.fullName.trim() ||
      appSettings.teacherName.trim() ||
      "";
    const phone =
      teacher.phone.trim() || appSettings.businessPhone.trim() || "";
    const businessType =
      teacher.businessType ||
      coerceBusinessType(appSettings.activePreset);

    console.log(
      "[public-booking/bootstrap] Step=done ok teacher_slug=",
      teacher.slug,
      "bookingEnabled=",
      availability.bookingEnabled,
    );

    return NextResponse.json({
      ok: true as const,
      teacher: {
        id: teacher.id,
        slug: teacher.slug,
        fullName,
        businessName,
        phone,
        businessType,
      },
      availability,
    });
  } catch (e) {
    console.error("[public-booking/bootstrap] Step=unhandled_exception:", e);
    return jsonErr(heUi.publicBooking.errUnavailable, 503);
  }
}
