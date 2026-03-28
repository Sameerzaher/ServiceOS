import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { verifyPassword, generateSessionToken } from "@/lib/auth/passwordUtils";
import type { AuthTeacher, Teacher } from "@/core/types/teacher";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שירות ההתחברות אינו זמין כרגע.";
const HE_ERR_INVALID_CREDENTIALS = "אימייל או סיסמה שגויים.";
const HE_ERR_USER_INACTIVE = "החשבון שלך אינו פעיל. צור קשר עם התמיכה.";
const HE_ERR_GENERIC = "אירעה שגיאה. נסה שוב.";

export async function POST(req: Request): Promise<NextResponse> {
  console.log("[auth/login] Starting login attempt");
  
  if (!isSupabaseAdminConfigured()) {
    console.error("[auth/login] Supabase admin not configured");
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    console.error("[auth/login] Invalid JSON:", e);
    return NextResponse.json(
      { ok: false as const, error: "נתונים לא תקינים" },
      { status: 400 }
    );
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string") {
    console.error("[auth/login] Invalid input types");
    return NextResponse.json(
      { ok: false as const, error: "נתונים לא תקינים" },
      { status: 400 }
    );
  }

  console.log("[auth/login] Login attempt for email:", email);

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();

    console.log("[auth/login] Business ID:", businessId);

    // Find teacher by email and business
    const { data: teachers, error: teacherError } = await supabase
      .from("teachers")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("business_id", businessId)
      .limit(1);

    if (teacherError) {
      console.error("[auth/login] Database query error:", teacherError);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 }
      );
    }

    if (!teachers || teachers.length === 0) {
      console.error("[auth/login] Teacher not found:", email);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    const teacher = teachers[0];
    console.log("[auth/login] Found teacher:", { id: teacher.id, email: teacher.email, role: teacher.role });

    // Check if password is set
    if (!teacher.password_hash) {
      console.error("[auth/login] Teacher has no password hash:", teacher.id);
      return NextResponse.json(
        { ok: false as const, error: "יש להגדיר סיסמה למורה זה תחילה." },
        { status: 401 }
      );
    }

    console.log("[auth/login] Verifying password...");
    // Verify password
    const isValid = verifyPassword(password, teacher.password_hash);
    if (!isValid) {
      console.error("[auth/login] Password verification failed for:", email);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    console.log("[auth/login] Password verified successfully");

    // Check if teacher is active
    if (!teacher.is_active) {
      console.error("[auth/login] Teacher is inactive:", teacher.id);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_USER_INACTIVE },
        { status: 403 }
      );
    }

    // Create session
    console.log("[auth/login] Creating session...");
    const token = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const { error: sessionError } = await supabase.from("sessions").insert({
      teacher_id: teacher.id,
      token,
      expires_at: expiresAt.toISOString(),
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      user_agent: req.headers.get("user-agent"),
    });

    if (sessionError) {
      console.error("[auth/login] Session creation error:", sessionError);
    } else {
      console.log("[auth/login] Session created successfully");
    }

    // Update last login
    await supabase
      .from("teachers")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", teacher.id);

    // Set session cookie
    cookies().set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    console.log("[auth/login] Cookie set successfully");

    const mappedTeacher: Teacher = {
      id: teacher.id,
      fullName: teacher.full_name,
      businessName: teacher.business_name,
      phone: teacher.phone || "",
      slug: teacher.slug,
      businessType: teacher.business_type || "driving_instructor",
      createdAt: teacher.created_at,
      email: teacher.email,
      role: teacher.role || "user",
      isActive: teacher.is_active !== false,
      lastLoginAt: teacher.last_login_at,
    };

    const authTeacher: AuthTeacher = {
      teacher: mappedTeacher,
      token,
    };

    console.log("[auth/login] SUCCESS - Login complete for:", { id: teacher.id, email: teacher.email, role: teacher.role });

    return NextResponse.json({ ok: true as const, data: authTeacher });
  } catch (e) {
    console.error("[auth/login] Unexpected error:", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 }
    );
  }
}
