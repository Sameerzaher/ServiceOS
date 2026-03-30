import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  getSupabaseAppointmentsTable,
  getSupabaseBusinessId,
  getSupabaseClientsTable,
} from "@/core/config/supabaseEnv";
import { loadPublicBookingGate } from "@/core/repositories/supabase/bookingSettingsRepository";
import {
  AppointmentStatus,
  PaymentStatus,
  type AppointmentRecord,
} from "@/core/types/appointment";
import {
  appointmentFromRow,
  type AppointmentRow,
} from "@/core/storage/supabase/mappers";
import {
  bookingOverlapsExistingAppointments,
  normalizePhone,
  parsePublicBookingBody,
  publicSlotOutsideBookingHorizon,
} from "@/features/booking/logic/publicBookingShared";
import { heUi } from "@/config";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

// Simple in-memory rate limiter for public booking (per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitMap.entries());
  for (const [ip, entry] of entries) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

type ClientRow = {
  id: string;
  business_id: string;
  full_name: string;
  phone: string;
  notes: string;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const HE_ERR_GENERIC = heUi.publicBooking.errServerGeneric;
const HE_ERR_UNAVAILABLE = heUi.publicBooking.errUnavailable;
const HE_ERR_CONFLICT = heUi.publicBooking.errSlotTaken;
const HE_ERR_SLOT_HORIZON = heUi.publicBooking.errDateNotInRange;

async function loadAppointmentsForOverlap(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  businessId: string,
  teacherId: string,
  appointmentsTable: string,
): Promise<{ appointments: AppointmentRecord[]; error: unknown | null }> {
  const { data: apptRows, error: apptLoadErr } = await supabase
    .from(appointmentsTable)
    .select("*")
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId);

  if (apptLoadErr) {
    return { appointments: [], error: apptLoadErr };
  }

  const appointments: AppointmentRecord[] = [];
  for (const row of apptRows ?? []) {
    const a = appointmentFromRow(row as unknown as AppointmentRow);
    if (a) appointments.push(a);
  }
  return { appointments, error: null };
}

export async function POST(req: Request): Promise<NextResponse> {
  // Rate limiting check
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  console.log("[public-booking] New booking request from IP:", ip);
  
  if (!checkRateLimit(ip)) {
    console.warn("[public-booking] Rate limit exceeded for IP:", ip);
    return NextResponse.json(
      { ok: false as const, error: "יותר מדי בקשות. נסו שוב בעוד דקה." },
      { status: 429 },
    );
  }

  if (!isSupabaseAdminConfigured()) {
    console.error("[public-booking] Supabase not configured");
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch (e) {
    console.error("[public-booking] Invalid JSON:", e);
    return NextResponse.json(
      { ok: false as const, error: heUi.publicBooking.errInvalidPayload },
      { status: 400 },
    );
  }

  const parsed = parsePublicBookingBody(raw);
  if (!parsed.ok) {
    console.error("[public-booking] Validation failed:", parsed.errorHe);
    return NextResponse.json(
      { ok: false as const, error: parsed.errorHe },
      { status: 400 },
    );
  }

  const { fullName, phone, notes, slotStart, slotEnd, bookingCustomFields } =
    parsed.data;
  const businessId = getSupabaseBusinessId();
  const teacherId = resolveTeacherIdFromRequest(req, raw);
  
  console.log("[public-booking] Parsed booking:", { 
    teacherId, 
    businessId, 
    fullName, 
    phone, 
    slotStart, 
    slotEnd 
  });
  
  const appointmentsTable = getSupabaseAppointmentsTable();
  const clientsTableName = getSupabaseClientsTable();

  const slotStartMs = new Date(slotStart).getTime();
  const nowMs = Date.now();

  try {
    const supabase = getSupabaseAdminClient();

    const gate = await loadPublicBookingGate(supabase, businessId, teacherId);
    if (!gate.ok) {
      console.error("[public-booking] Booking gate load failed");
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    if (!gate.bookingEnabled) {
      console.warn("[public-booking] Booking disabled for teacher:", teacherId);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_UNAVAILABLE },
        { status: 403 },
      );
    }

    if (
      publicSlotOutsideBookingHorizon(slotStartMs, nowMs, gate.daysAhead)
    ) {
      console.warn("[public-booking] Slot outside horizon:", { slotStart, daysAhead: gate.daysAhead });
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_SLOT_HORIZON },
        { status: 400 },
      );
    }

    // Check blocked dates
    const { data: blockedDates } = await supabase
      .from("blocked_dates")
      .select("blocked_date, is_recurring")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);

    if (blockedDates && blockedDates.length > 0) {
      const { isDateBlocked } = await import("@/features/booking/logic/publicBookingShared");
      if (isDateBlocked(slotStart, blockedDates.map(b => ({ date: b.blocked_date, isRecurring: b.is_recurring })))) {
        console.warn("[public-booking] Date is blocked:", slotStart);
        return NextResponse.json(
          { ok: false as const, error: "תאריך זה אינו זמין להזמנה" },
          { status: 400 },
        );
      }
    }

    const firstLoad = await loadAppointmentsForOverlap(
      supabase,
      businessId,
      teacherId,
      appointmentsTable,
    );
    if (firstLoad.error) {
      console.error("[public-booking] Load appointments error:", firstLoad.error);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    if (
      bookingOverlapsExistingAppointments(
        slotStart,
        slotEnd,
        firstLoad.appointments,
      )
    ) {
      console.warn("[public-booking] Slot conflict detected:", { slotStart, slotEnd });
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_CONFLICT },
        { status: 409 },
      );
    }

    console.log("[public-booking] Checking for existing client by phone:", phone);
    
    const { data: clientRows, error: clientLoadErr } = await supabase
      .from(clientsTableName)
      .select("*")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);

    if (clientLoadErr) {
      console.error("[public-booking] Load clients error:", clientLoadErr);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    const targetKey = normalizePhone(phone);
    let clientId: string | null = null;
    for (const row of clientRows ?? []) {
      const cr = row as unknown as ClientRow;
      if (normalizePhone(cr.phone) === targetKey && targetKey.length > 0) {
        clientId = cr.id;
        console.log("[public-booking] Found existing client:", clientId);
        break;
      }
    }

    const now = new Date().toISOString();

    if (!clientId) {
      clientId = randomUUID();
      console.log("[public-booking] Creating new client:", clientId);
      
      const { error: insertClientErr } = await supabase
        .from(clientsTableName)
        .insert({
          id: clientId,
          business_id: businessId,
          teacher_id: teacherId,
          full_name: fullName,
          phone,
          notes,
          custom_fields: {},
          created_at: now,
          updated_at: now,
        });

      if (insertClientErr) {
        console.error("[public-booking] Insert client error:", insertClientErr);
        return NextResponse.json(
          { ok: false as const, error: HE_ERR_GENERIC },
          { status: 500 },
        );
      }
      console.log("[public-booking] Client created successfully");
    } else {
      console.log("[public-booking] Updating existing client:", clientId);
      
      const { error: patchErr } = await supabase
        .from(clientsTableName)
        .update({
          full_name: fullName,
          notes,
          updated_at: now,
        })
        .eq("id", clientId)
        .eq("business_id", businessId)
        .eq("teacher_id", teacherId);

      if (patchErr) {
        console.error("[public-booking] Update client error:", patchErr);
        return NextResponse.json(
          { ok: false as const, error: HE_ERR_GENERIC },
          { status: 500 },
        );
      }
      console.log("[public-booking] Client updated successfully");
    }

    const preInsertLoad = await loadAppointmentsForOverlap(
      supabase,
      businessId,
      teacherId,
      appointmentsTable,
    );
    if (preInsertLoad.error) {
      console.error(
        "[public-booking] Reload appointments error:",
        preInsertLoad.error,
      );
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    if (
      bookingOverlapsExistingAppointments(
        slotStart,
        slotEnd,
        preInsertLoad.appointments,
      )
    ) {
      console.warn("[public-booking] Slot taken during transaction:", { slotStart, slotEnd });
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_CONFLICT },
        { status: 409 },
      );
    }

    const appointmentId = randomUUID();
    const customFields: Record<string, unknown> = {
      bookingSource: "public",
      bookingApproval: "pending",
      bookingSlotEnd: slotEnd,
      bookingNotes: notes,
    };
    for (const [k, v] of Object.entries(bookingCustomFields)) {
      customFields[k] = v;
    }

    console.log("[public-booking] Creating appointment:", appointmentId);

    const { error: insertApptErr } = await supabase
      .from(appointmentsTable)
      .insert({
        id: appointmentId,
        business_id: businessId,
        teacher_id: teacherId,
        client_id: clientId,
        start_at: slotStart,
        end_at: slotEnd,
        status: AppointmentStatus.Scheduled,
        payment_status: PaymentStatus.Unpaid,
        amount: 0,
        custom_fields: customFields,
        created_at: now,
        updated_at: now,
      });

    if (insertApptErr) {
      console.error("[public-booking] Insert appointment error:", insertApptErr);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    console.log("[public-booking] Appointment created, sending notification to teacher...");

    // Create notification for the teacher
    try {
      await supabase.from("notifications").insert({
        business_id: businessId,
        teacher_id: teacherId,
        type: "new_booking",
        title: "הזמנה חדשה ממתינה לאישור",
        message: `${fullName} הזמין תור ל-${new Date(slotStart).toLocaleString("he-IL", { 
          dateStyle: "short", 
          timeStyle: "short" 
        })}`,
        entity_type: "appointment",
        entity_id: appointmentId,
        is_read: false,
        created_at: now,
      });
      
      console.log("[public-booking] Notification created successfully");
    } catch (notifErr) {
      console.error("[public-booking] Failed to create notification:", notifErr);
    }

    console.log("[public-booking] SUCCESS - Booking created:", { appointmentId, clientId, teacherId });

    return NextResponse.json({
      ok: true as const,
      appointmentId,
      clientId,
    });
  } catch (e) {
    console.error("[public-booking] Unexpected error:", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}
