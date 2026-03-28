import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { coerceBusinessType, type BusinessType } from "@/core/types/teacher";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "הפעולה אינה זמינה כרגע.";
const HE_ERR_GENERIC = "אירעה תקלה. נסו שוב.";
const HE_ERR_INVALID = "נתונים לא תקינים.";
const HE_ERR_NOT_FOUND = "המורה לא נמצא.";
const HE_ERR_SLUG_EXISTS = "ה-slug כבר קיים במערכת.";

type UpdateTeacherBody = {
  fullName?: string;
  businessName?: string;
  phone?: string;
  businessType?: BusinessType;
};

function parseUpdateBody(raw: unknown): UpdateTeacherBody | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  
  const result: UpdateTeacherBody = {};
  
  if ("fullName" in o && typeof o.fullName === "string") {
    result.fullName = o.fullName.trim();
  }
  if ("businessName" in o && typeof o.businessName === "string") {
    result.businessName = o.businessName.trim();
  }
  if ("phone" in o && typeof o.phone === "string") {
    result.phone = o.phone.trim();
  }
  if ("businessType" in o) {
    result.businessType = coerceBusinessType(o.businessType);
  }
  
  return result;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  const teacherId = params.id;
  if (!teacherId) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  const parsed = parseUpdateBody(raw);
  if (!parsed || Object.keys(parsed).length === 0) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    
    // Check if teacher exists
    const { data: existing } = await supabase
      .from("teachers")
      .select("id")
      .eq("business_id", businessId)
      .eq("id", teacherId)
      .maybeSingle();
    
    if (!existing) {
      return NextResponse.json({ ok: false as const, error: HE_ERR_NOT_FOUND }, { status: 404 });
    }
    
    const updateData: Record<string, unknown> = {};
    if (parsed.fullName !== undefined) updateData.full_name = parsed.fullName;
    if (parsed.businessName !== undefined) updateData.business_name = parsed.businessName;
    if (parsed.phone !== undefined) updateData.phone = parsed.phone;
    if (parsed.businessType !== undefined) updateData.business_type = parsed.businessType;
    
    const { error } = await supabase
      .from("teachers")
      .update(updateData)
      .eq("business_id", businessId)
      .eq("id", teacherId);
    
    if (error) {
      console.error("[teachers/put]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[teachers/put]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  const teacherId = params.id;
  if (!teacherId) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    
    // Check if teacher exists
    const { data: existing } = await supabase
      .from("teachers")
      .select("id")
      .eq("business_id", businessId)
      .eq("id", teacherId)
      .maybeSingle();
    
    if (!existing) {
      return NextResponse.json({ ok: false as const, error: HE_ERR_NOT_FOUND }, { status: 404 });
    }
    
    // Delete all related data (cascade)
    await Promise.all([
      supabase.from("clients").delete().eq("business_id", businessId).eq("teacher_id", teacherId),
      supabase.from("appointments").delete().eq("business_id", businessId).eq("teacher_id", teacherId),
      supabase.from("serviceos_app_settings").delete().eq("business_id", businessId).eq("teacher_id", teacherId),
      supabase.from("serviceos_availability_settings").delete().eq("business_id", businessId).eq("teacher_id", teacherId),
    ]);
    
    // Delete the teacher
    const { error } = await supabase
      .from("teachers")
      .delete()
      .eq("business_id", businessId)
      .eq("id", teacherId);
    
    if (error) {
      console.error("[teachers/delete]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[teachers/delete]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
