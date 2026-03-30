import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { validateSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * GET /api/services
 * Fetch all services for current teacher
 */
export async function GET(req: Request): Promise<NextResponse> {
  console.log("[services/get] Fetching services...");

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "שירות אינו זמין" },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req);

    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok) {
      return NextResponse.json(
        { ok: false, error: "לא מאומת" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[services/get] Error:", error);
      return NextResponse.json(
        { ok: false, error: "שגיאה בטעינת שירותים" },
        { status: 500 }
      );
    }

    console.log(`[services/get] SUCCESS - Returned ${data?.length || 0} services`);

    return NextResponse.json({
      ok: true,
      services: data || [],
    });
  } catch (e) {
    console.error("[services/get] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בלתי צפויה" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/services
 * Create a new service
 */
export async function POST(req: Request): Promise<NextResponse> {
  console.log("[services/post] Creating service...");

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "שירות אינו זמין" },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req);

    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok) {
      return NextResponse.json(
        { ok: false, error: "לא מאומת" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, price, durationMinutes, isActive, displayOrder } = body;

    if (!name || typeof price !== "number" || typeof durationMinutes !== "number") {
      return NextResponse.json(
        { ok: false, error: "נתונים חסרים או לא תקינים" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("services")
      .insert({
        business_id: businessId,
        teacher_id: teacherId,
        name,
        description: description || null,
        price,
        duration_minutes: durationMinutes,
        is_active: isActive ?? true,
        display_order: displayOrder ?? 0,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("[services/post] Error:", error);
      return NextResponse.json(
        { ok: false, error: "שגיאה ביצירת שירות" },
        { status: 500 }
      );
    }

    console.log("[services/post] SUCCESS - Created service:", data.id);

    return NextResponse.json({
      ok: true,
      service: data,
    });
  } catch (e) {
    console.error("[services/post] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בלתי צפויה" },
      { status: 500 }
    );
  }
}
