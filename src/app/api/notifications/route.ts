import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "שירות הנוטיפיקציות אינו זמין כרגע.";
const HE_ERR_GENERIC = "אירעה שגיאה.";

export type Notification = {
  id: string;
  type: string;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
};

export async function GET(): Promise<NextResponse> {
  console.log("[notifications/get] Loading notifications");
  
  if (!isSupabaseAdminConfigured()) {
    console.error("[notifications/get] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    
    // Get current authenticated teacher from session
    const { cookies } = await import("next/headers");
    const sessionToken = cookies().get("session_token")?.value;
    
    if (!sessionToken) {
      console.error("[notifications/get] No session token - unauthorized");
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
      console.error("[notifications/get] Invalid or expired session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    const teacherId = session.teacher_id;
    
    console.log("[notifications/get] Loading for teacher:", teacherId);
    
    // Get notifications for this teacher
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[notifications/get] Database error:", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    const notifications: Notification[] = (data ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      entityType: row.entity_type,
      entityId: row.entity_id,
      isRead: row.is_read,
      readAt: row.read_at,
      createdAt: row.created_at,
    }));

    console.log("[notifications/get] SUCCESS - Returned", notifications.length, "notifications");

    return NextResponse.json({ ok: true as const, notifications });
  } catch (e) {
    console.error("[notifications/get] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  console.log("[notifications/put] Mark notifications as read");
  
  if (!isSupabaseAdminConfigured()) {
    console.error("[notifications/put] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    
    // Get current authenticated teacher from session
    const { cookies } = await import("next/headers");
    const sessionToken = cookies().get("session_token")?.value;
    
    if (!sessionToken) {
      console.error("[notifications/put] No session token - unauthorized");
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
      console.error("[notifications/put] Invalid or expired session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    const teacherId = session.teacher_id;
    
    const body = await req.json();
    const { notificationIds } = body as { notificationIds?: string[] };
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      console.log("[notifications/put] No notification IDs provided, marking all as read");
      
      // Mark all unread notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq("business_id", businessId)
        .eq("teacher_id", teacherId)
        .eq("is_read", false);

      if (error) {
        console.error("[notifications/put] Database error:", error);
        return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
      }

      console.log("[notifications/put] SUCCESS - All marked as read");
      return NextResponse.json({ ok: true as const });
    }
    
    console.log("[notifications/put] Marking notifications as read:", notificationIds);
    
    // Mark specific notifications as read
    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .in("id", notificationIds);

    if (error) {
      console.error("[notifications/put] Database error:", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    console.log("[notifications/put] SUCCESS - Marked", notificationIds.length, "as read");

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[notifications/put] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
