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
 * DELETE /api/blocked-dates/[id]
 * Delete a blocked date
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  console.log("[blocked-dates/delete] Deleting blocked date...");

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "שירות אינו זמין" },
      { status: 503 }
    );
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "מזהה חסר" },
      { status: 400 }
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

    const { error } = await supabase
      .from("blocked_dates")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);

    if (error) {
      console.error("[blocked-dates/delete] Error:", error);
      return NextResponse.json(
        { ok: false, error: "שגיאה במחיקת חסימה" },
        { status: 500 }
      );
    }

    console.log("[blocked-dates/delete] SUCCESS");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[blocked-dates/delete] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בלתי צפויה" },
      { status: 500 }
    );
  }
}
