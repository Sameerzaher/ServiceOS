import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { coerceBusinessType, type BusinessType } from "@/core/types/teacher";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

/** Teacher list uses headers/env; must not be statically prerendered. */
export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "רשימת המורים אינה זמינה כרגע.";
const HE_ERR_GENERIC = "אירעה תקלה בטעינת המורים.";
const HE_ERR_INVALID = "נתונים לא תקינים.";
const HE_ERR_SLUG_EXISTS = "ה-slug כבר קיים במערכת.";

export type TeacherListItem = {
  id: string;
  fullName: string;
  businessName: string;
  slug: string;
  businessType: BusinessType;
  email?: string;
  role?: string;
  isActive?: boolean;
  hasPassword?: boolean;
};

export async function GET(): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[teachers/get] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    
    console.log("[teachers/get] Loading teachers for business:", businessId);
    
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .eq("business_id", businessId)
      .order("full_name", { ascending: true });

    if (error) {
      console.error("[teachers/get] Database error:", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    const teachers: TeacherListItem[] = [];
    for (const row of data ?? []) {
      const r = row as {
        id?: string;
        full_name?: string;
        business_name?: string;
        slug?: string;
        business_type?: string | null;
        email?: string;
        role?: string;
        is_active?: boolean;
        password_hash?: string | null;
      };
      if (!r.id) continue;
      teachers.push({
        id: r.id,
        fullName: typeof r.full_name === "string" ? r.full_name : "",
        businessName: typeof r.business_name === "string" ? r.business_name : "",
        slug: typeof r.slug === "string" ? r.slug : "",
        businessType: coerceBusinessType(r.business_type),
        email: r.email,
        role: r.role,
        isActive: r.is_active,
        hasPassword: r.password_hash != null && r.password_hash.length > 0,
      });
    }

    console.log("[teachers/get] SUCCESS - Returned", teachers.length, "teachers");

    return NextResponse.json({ ok: true as const, teachers });
  } catch (e) {
    console.error("[teachers/get] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

