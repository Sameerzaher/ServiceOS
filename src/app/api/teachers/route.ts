import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "רשימת המורים אינה זמינה כרגע.";
const HE_ERR_GENERIC = "אירעה תקלה בטעינת המורים.";

export type TeacherListItem = {
  id: string;
  fullName: string;
  businessName: string;
  slug: string;
};

export async function GET(): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const { data, error } = await supabase
      .from("teachers")
      .select("id, full_name, business_name, slug")
      .eq("business_id", businessId)
      .order("full_name", { ascending: true });

    if (error) {
      console.error("[teachers/get]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    const teachers: TeacherListItem[] = [];
    for (const row of data ?? []) {
      const r = row as {
        id?: string;
        full_name?: string;
        business_name?: string;
        slug?: string;
      };
      if (!r.id) continue;
      teachers.push({
        id: r.id,
        fullName: typeof r.full_name === "string" ? r.full_name : "",
        businessName: typeof r.business_name === "string" ? r.business_name : "",
        slug: typeof r.slug === "string" ? r.slug : "",
      });
    }

    return NextResponse.json({ ok: true as const, teachers });
  } catch (e) {
    console.error("[teachers/get]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
