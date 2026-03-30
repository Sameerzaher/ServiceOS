import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { buildWhatsAppHref } from "@/core/utils/whatsapp";

export const runtime = "nodejs";

/**
 * GET /api/reminders/send
 * 
 * Send all pending reminders that are due
 * This should be called by a cron job every 5-10 minutes
 */
export async function GET(req: Request): Promise<NextResponse> {
  console.log("[reminders/send] Checking for pending reminders...");

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "שירות אינו זמין" },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const now = new Date();

    // Fetch pending reminders that are due
    const { data: reminders, error: remindersError } = await supabase
      .from("appointment_reminders")
      .select(`
        *,
        appointments:appointment_id (
          id,
          start_at,
          client_id,
          status
        )
      `)
      .eq("business_id", businessId)
      .eq("status", "pending")
      .lte("scheduled_for", now.toISOString())
      .limit(50);

    if (remindersError) {
      console.error("[reminders/send] Fetch error:", remindersError);
      return NextResponse.json(
        { ok: false, error: "שגיאה בטעינת תזכורות" },
        { status: 500 }
      );
    }

    if (!reminders || reminders.length === 0) {
      console.log("[reminders/send] No pending reminders");
      return NextResponse.json({ ok: true, sent: 0 });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const reminder of reminders) {
      try {
        // Skip if appointment was cancelled
        const appt = reminder.appointments as any;
        if (!appt || appt.status === "cancelled") {
          await supabase
            .from("appointment_reminders")
            .update({ status: "cancelled", updated_at: now.toISOString() })
            .eq("id", reminder.id);
          continue;
        }

        // Fetch client details
        const { data: client } = await supabase
          .from("clients")
          .select("full_name, phone")
          .eq("id", appt.client_id)
          .single();

        if (!client || !client.phone) {
          await supabase
            .from("appointment_reminders")
            .update({
              status: "failed",
              error_message: "לא נמצא מספר טלפון",
              updated_at: now.toISOString(),
            })
            .eq("id", reminder.id);
          errors.push(`Reminder ${reminder.id}: No phone`);
          continue;
        }

        // Fetch teacher settings
        const { data: settings } = await supabase
          .from("booking_settings")
          .select("reminder_custom_message")
          .eq("teacher_id", reminder.teacher_id)
          .single();

        const { data: appSettings } = await supabase
          .from("app_settings")
          .select("business_name, business_phone")
          .eq("teacher_id", reminder.teacher_id)
          .single();

        // Build reminder message
        const businessName = appSettings?.business_name || "העסק";
        const appointmentTime = new Date(appt.start_at).toLocaleString("he-IL", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        
        let message = settings?.reminder_custom_message || 
          `שלום ${client.full_name}, מזכירים לך על התור שלך ב-${businessName} בתאריך ${appointmentTime}`;

        // Generate WhatsApp link
        const whatsappUrl = buildWhatsAppHref(client.phone, message);
        
        console.log(`[reminders/send] Would send to ${client.phone}: ${message}`);
        console.log(`[reminders/send] WhatsApp URL: ${whatsappUrl}`);

        // Mark as sent
        await supabase
          .from("appointment_reminders")
          .update({
            status: "sent",
            sent_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", reminder.id);

        sent++;
      } catch (e) {
        console.error(`[reminders/send] Error processing reminder ${reminder.id}:`, e);
        await supabase
          .from("appointment_reminders")
          .update({
            status: "failed",
            error_message: String(e),
            updated_at: now.toISOString(),
          })
          .eq("id", reminder.id);
        errors.push(`Reminder ${reminder.id}: ${String(e)}`);
      }
    }

    console.log(`[reminders/send] SUCCESS: ${sent} sent, ${errors.length} errors`);

    return NextResponse.json({ 
      ok: true, 
      sent, 
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (e) {
    console.error("[reminders/send] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בלתי צפויה" },
      { status: 500 }
    );
  }
}
