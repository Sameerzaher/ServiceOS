import { NextResponse } from "next/server";

import { loadAppSettings } from "@/core/repositories/supabase/appSettingsRepository";
import { loadBookingSettings } from "@/core/repositories/supabase/bookingSettingsRepository";
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

export async function GET(req: Request): Promise<NextResponse<BootstrapOk | BootstrapErr>> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[public-booking/bootstrap] Supabase not configured");
    return jsonErr(heUi.publicBooking.errUnavailable, 503);
  }

  let slug: string;
  try {
    slug = new URL(req.url).searchParams.get("slug")?.trim() ?? "";
  } catch (e) {
    console.error("[public-booking/bootstrap] Invalid URL:", e);
    return jsonErr(heUi.publicBooking.invalidSlugMessage, 400);
  }

  console.log("[public-booking/bootstrap] Request for slug:", slug);

  if (!isValidPublicTeacherSlug(slug)) {
    console.error("[public-booking/bootstrap] Invalid slug format:", slug);
    return jsonErr(heUi.publicBooking.invalidSlugMessage, 404);
  }

  const normalizedSlug = normalizeTeacherSlug(slug);
  console.log("[public-booking/bootstrap] Normalized slug:", normalizedSlug);

  try {
    const supabase = getSupabaseAdminClient();
    console.log("[public-booking/bootstrap] Searching for teacher by slug:", {
      slug: normalizedSlug,
    });

    let teacherRes = await supabase
      .from("teachers")
      .select("*")
      .eq("slug", normalizedSlug)
      .maybeSingle();
    if (!teacherRes.data && !teacherRes.error && isUuidLike(normalizedSlug)) {
      console.log("[public-booking/bootstrap] Slug not found, trying as UUID");
      teacherRes = await supabase
        .from("teachers")
        .select("*")
        .eq("id", normalizedSlug)
        .maybeSingle();
    }
    const { data: row, error: teacherErr } = teacherRes;

    if (teacherErr) {
      console.error("[public-booking/bootstrap] Database error:", teacherErr);
      return jsonErr(heUi.publicBooking.errServerGeneric, 500);
    }

    const teacher =
      row && typeof row === "object"
        ? teacherFromRow(row as unknown as TeacherRow)
        : null;
    if (!teacher) {
      console.log("[public-booking/bootstrap] Teacher not found, trying legacy fallback");
      
      if (!isUuidLike(normalizedSlug)) {
        console.error("[public-booking/bootstrap] No teacher found for slug:", normalizedSlug);
        return jsonErr(heUi.publicBooking.invalidSlugMessage, 404);
      }

      const legacyBusinessId = (row as unknown as { business_id?: string | null } | null)
        ?.business_id?.toString?.() ?? "";

      // Legacy single-teacher fallback
      const legacySettings = await loadAppSettings(
        supabase,
        legacyBusinessId,
        normalizedSlug,
      );
      const availability = await loadBookingSettings(
        supabase,
        legacyBusinessId,
        normalizedSlug,
      );
      
      console.log("[public-booking/bootstrap] SUCCESS (legacy) - Teacher:", normalizedSlug);
      
      return NextResponse.json({
        ok: true as const,
        teacher: {
          id: normalizedSlug,
          slug: normalizedSlug,
          fullName: legacySettings.teacherName,
          businessName: legacySettings.businessName,
          phone: legacySettings.businessPhone,
          businessType: coerceBusinessType(legacySettings.activePreset),
        },
        availability,
      });
    }

    const teacherBusinessId =
      (row as unknown as { business_id?: string | null })?.business_id?.toString?.() ??
      "";

    if (!teacherBusinessId) {
      console.error("[public-booking/bootstrap] Missing business_id for teacher:", {
        teacherId: teacher.id,
        slug: teacher.slug,
      });
      return jsonErr(heUi.publicBooking.errServerGeneric, 500);
    }

    console.log("[public-booking/bootstrap] Teacher found:", {
      id: teacher.id,
      slug: teacher.slug,
      businessName: teacher.businessName,
      businessId: teacherBusinessId,
    });

    const availability = await loadBookingSettings(
      supabase,
      teacherBusinessId,
      teacher.id,
    );

    console.log("[public-booking/bootstrap] SUCCESS - Returning data for:", teacher.slug);

    return NextResponse.json({
      ok: true as const,
      teacher: {
        id: teacher.id,
        slug: teacher.slug,
        fullName: teacher.fullName,
        businessName: teacher.businessName,
        phone: teacher.phone,
        businessType: teacher.businessType,
      },
      availability,
    });
  } catch (e) {
    console.error("[public-booking/bootstrap] Unexpected error:", e);
    return jsonErr(heUi.publicBooking.errServerGeneric, 500);
  }
}
