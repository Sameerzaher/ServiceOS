import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { loadAppSettings } from "@/core/repositories/supabase/appSettingsRepository";
import { loadBookingSettings } from "@/core/repositories/supabase/bookingSettingsRepository";
import { teacherFromRow, type TeacherRow } from "@/core/storage/supabase/mappers";
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
    return jsonErr(heUi.publicBooking.errUnavailable, 503);
  }

  let slug: string;
  try {
    slug = new URL(req.url).searchParams.get("slug")?.trim() ?? "";
  } catch {
    return jsonErr(heUi.publicBooking.invalidSlugMessage, 400);
  }

  if (!isValidPublicTeacherSlug(slug)) {
    return jsonErr(heUi.publicBooking.invalidSlugMessage, 404);
  }

  const normalizedSlug = normalizeTeacherSlug(slug);

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();

    let teacherRes = await supabase
      .from("teachers")
      .select("*")
      .eq("business_id", businessId)
      .eq("slug", normalizedSlug)
      .maybeSingle();
    if (!teacherRes.data && !teacherRes.error && isUuidLike(normalizedSlug)) {
      teacherRes = await supabase
        .from("teachers")
        .select("*")
        .eq("business_id", businessId)
        .eq("id", normalizedSlug)
        .maybeSingle();
    }
    const { data: row, error: teacherErr } = teacherRes;

    if (teacherErr) {
      console.error("[public-booking/bootstrap] teacher", teacherErr);
      return jsonErr(heUi.publicBooking.errServerGeneric, 500);
    }

    const teacher =
      row && typeof row === "object"
        ? teacherFromRow(row as unknown as TeacherRow)
        : null;
    if (!teacher) {
      if (!isUuidLike(normalizedSlug)) {
        return jsonErr(heUi.publicBooking.invalidSlugMessage, 404);
      }

      // Legacy single-teacher fallback: no `teachers` row yet, but booking can
      // still run by scoped/default teacher UUID.
      const legacySettings = await loadAppSettings(
        supabase,
        businessId,
        normalizedSlug,
      );
      const availability = await loadBookingSettings(
        supabase,
        businessId,
        normalizedSlug,
      );
      return NextResponse.json({
        ok: true as const,
        teacher: {
          id: normalizedSlug,
          slug: normalizedSlug,
          fullName: legacySettings.teacherName,
          businessName: legacySettings.businessName,
          phone: legacySettings.businessPhone,
        },
        availability,
      });
    }

    const availability = await loadBookingSettings(
      supabase,
      businessId,
      teacher.id,
    );

    return NextResponse.json({
      ok: true as const,
      teacher: {
        id: teacher.id,
        slug: teacher.slug,
        fullName: teacher.fullName,
        businessName: teacher.businessName,
        phone: teacher.phone,
      },
      availability,
    });
  } catch (e) {
    console.error("[public-booking/bootstrap]", e);
    return jsonErr(heUi.publicBooking.errServerGeneric, 500);
  }
}
