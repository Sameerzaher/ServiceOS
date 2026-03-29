import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { pbkdf2Sync } from "crypto";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { coerceBusinessType, type BusinessType } from "@/core/types/teacher";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { persistAppSettings } from "@/core/repositories/supabase/appSettingsRepository";
import { persistBookingSettings } from "@/core/repositories/supabase/bookingSettingsRepository";
import { DEFAULT_APP_SETTINGS } from "@/core/types/settings";
import { DEFAULT_AVAILABILITY_SETTINGS } from "@/core/types/availability";

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

export async function GET(req: Request): Promise<NextResponse> {
  console.log("[teachers/get] Request to list teachers");
  
  if (!isSupabaseAdminConfigured()) {
    console.error("[teachers/get] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    
    // Get current authenticated teacher from session
    const { cookies } = await import("next/headers");
    const sessionToken = cookies().get("session_token")?.value;
    
    if (!sessionToken) {
      console.error("[teachers/get] No session token - unauthorized");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    // Validate session and get teacher
    const { data: session } = await supabase
      .from("sessions")
      .select("teacher_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    
    if (!session) {
      console.error("[teachers/get] Invalid or expired session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    // Get the authenticated teacher's role
    const { data: currentTeacher } = await supabase
      .from("teachers")
      .select("id, role, email")
      .eq("id", session.teacher_id)
      .eq("is_active", true)
      .maybeSingle();
    
    if (!currentTeacher) {
      console.error("[teachers/get] Teacher not found for session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    console.log("[teachers/get] Authenticated as:", { 
      email: currentTeacher.email, 
      role: currentTeacher.role 
    });
    
    // Only admin can see all teachers
    if (currentTeacher.role !== "admin") {
      console.log("[teachers/get] Non-admin user - returning only self");
      
      // Regular users see only themselves
      const { data: selfData, error: selfError } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", currentTeacher.id)
        .eq("business_id", businessId)
        .single();
      
      if (selfError || !selfData) {
        console.error("[teachers/get] Failed to load self:", selfError);
        return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
      }
      
      const r = selfData as {
        id: string;
        full_name?: string;
        business_name?: string;
        slug?: string;
        business_type?: string | null;
        email?: string;
        role?: string;
        is_active?: boolean;
        password_hash?: string | null;
      };
      
      const teachers: TeacherListItem[] = [{
        id: r.id,
        fullName: typeof r.full_name === "string" ? r.full_name : "",
        businessName: typeof r.business_name === "string" ? r.business_name : "",
        slug: typeof r.slug === "string" ? r.slug : "",
        businessType: coerceBusinessType(r.business_type),
        email: r.email,
        role: r.role,
        isActive: r.is_active,
        hasPassword: r.password_hash != null && r.password_hash.length > 0,
      }];
      
      console.log("[teachers/get] SUCCESS - Returned self only");
      return NextResponse.json({ ok: true as const, teachers });
    }
    
    // Admin can see all teachers in same business
    console.log("[teachers/get] Admin user - loading all teachers for business:", businessId);
    
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

    console.log("[teachers/get] SUCCESS - Returned", teachers.length, "teachers (admin view)");

    return NextResponse.json({ ok: true as const, teachers });
  } catch (e) {
    console.error("[teachers/get] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  console.log("[teachers/post] Request to create teacher");
  
  if (!isSupabaseAdminConfigured()) {
    console.error("[teachers/post] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    
    // Get current authenticated teacher from session
    const { cookies } = await import("next/headers");
    const sessionToken = cookies().get("session_token")?.value;
    
    if (!sessionToken) {
      console.error("[teachers/post] No session token - unauthorized");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    // Validate session and get teacher
    const { data: session } = await supabase
      .from("sessions")
      .select("teacher_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    
    if (!session) {
      console.error("[teachers/post] Invalid or expired session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    // Get the authenticated teacher's role
    const { data: currentTeacher } = await supabase
      .from("teachers")
      .select("id, role, email")
      .eq("id", session.teacher_id)
      .eq("is_active", true)
      .maybeSingle();
    
    if (!currentTeacher) {
      console.error("[teachers/post] Teacher not found for session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    // Only admin can create teachers
    if (currentTeacher.role !== "admin") {
      console.error("[teachers/post] Non-admin attempted to create teacher:", currentTeacher.email);
      return NextResponse.json(
        { ok: false as const, error: "רק מנהל יכול ליצור מורים חדשים" },
        { status: 403 }
      );
    }
    
    console.log("[teachers/post] Admin creating teacher:", currentTeacher.email);
    
    // Parse request body
    const body = await req.json();
    const { fullName, businessName, phone, slug, businessType, email, password, role } = body;
    
    if (!fullName || !businessName || !slug || !email || !password) {
      console.error("[teachers/post] Missing required fields");
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_INVALID },
        { status: 400 }
      );
    }
    
    console.log("[teachers/post] Creating teacher:", { email, slug, role });
    
    // Check if slug already exists
    const { data: existing } = await supabase
      .from("teachers")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    
    if (existing) {
      console.error("[teachers/post] Slug already exists:", slug);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_SLUG_EXISTS },
        { status: 400 }
      );
    }
    
    // Hash password
    const salt = randomUUID();
    const passwordHash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    
    // Create teacher
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const { error: insertError } = await supabase
      .from("teachers")
      .insert({
        id,
        business_id: businessId,
        full_name: fullName,
        business_name: businessName,
        phone: phone || null,
        slug,
        business_type: businessType || null,
        email,
        password_hash: passwordHash,
        role: role || "user",
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    
    if (insertError) {
      console.error("[teachers/post] Database error:", insertError);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 }
      );
    }
    
    console.log("[teachers/post] Teacher created, initializing settings...");
    
    // Create initial settings for the new teacher
    try {
      await persistAppSettings(supabase, businessId, id, {
        ...DEFAULT_APP_SETTINGS,
        businessName,
        teacherName: fullName,
        businessPhone: phone || "",
        activePreset: (businessType as BusinessType) || "driving_instructor",
      });
      
      await persistBookingSettings(supabase, businessId, id, DEFAULT_AVAILABILITY_SETTINGS);
      
      console.log("[teachers/post] Initial settings created");
    } catch (settingsError) {
      console.error("[teachers/post] Failed to create settings:", settingsError);
    }
    
    console.log("[teachers/post] SUCCESS - Teacher created:", { id, email, slug, role: role || "user" });
    
    return NextResponse.json({ 
      ok: true as const, 
      teacher: { 
        id, 
        email, 
        slug, 
        role: role || "user" 
      } 
    });
  } catch (e) {
    console.error("[teachers/post] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
