import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import {
  getSupabaseAppointmentsTable,
  getSupabaseBusinessId,
  getSupabaseClientsTable,
} from "@/core/config/supabaseEnv";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "עדכון בקשה אינו זמין כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "בקשה לא תקינה.";
const HE_ERR_GENERIC = "אירעה תקלה בעדכון הבקשה. נסו שוב.";

type BookingStatus = "pending" | "confirmed" | "cancelled";

function parseStatus(raw: unknown): BookingStatus | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const status = o.status;
  if (
    status === "pending" ||
    status === "confirmed" ||
    status === "cancelled"
  ) {
    return status;
  }
  return null;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }

  const nextStatus = parseStatus(raw);
  if (!nextStatus) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const table = getSupabaseAppointmentsTable();
    const clientsTable = getSupabaseClientsTable();

    const { data: existing, error: loadErr } = await supabase
      .from(table)
      .select("client_id, start_at, end_at, custom_fields, status")
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();
    if (loadErr) throw loadErr;
    if (!existing) {
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_INVALID },
        { status: 404 },
      );
    }

    const customFields =
      existing.custom_fields &&
      typeof existing.custom_fields === "object" &&
      !Array.isArray(existing.custom_fields)
        ? (existing.custom_fields as Record<string, unknown>)
        : {};

    const source = customFields.bookingSource;
    if (source !== "public") {
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_INVALID },
        { status: 400 },
      );
    }

    // Confirm request: create a new real appointment and remove request row.
    if (nextStatus === "confirmed") {
      const nowIso = new Date().toISOString();

      const { data: existingConfirmedRows, error: existingConfirmedErr } =
        await supabase
          .from(table)
          .select("id")
          .eq("business_id", businessId)
          .eq("custom_fields->>sourceBookingId", id)
          .limit(1);
      if (existingConfirmedErr) throw existingConfirmedErr;
      if ((existingConfirmedRows ?? []).length > 0) {
        const { error: deleteErr } = await supabase
          .from(table)
          .delete()
          .eq("id", id)
          .eq("business_id", businessId);
        if (deleteErr) throw deleteErr;
        return NextResponse.json({ ok: true as const, duplicate: true });
      }

      const { data: client, error: clientErr } = await supabase
        .from(clientsTable)
        .select("id, full_name, phone")
        .eq("id", existing.client_id)
        .eq("business_id", businessId)
        .maybeSingle();
      if (clientErr || !client) {
        throw clientErr ?? new Error("client not found for booking request");
      }

      const nextNotesRaw = customFields.bookingNotes;
      const nextNotes =
        typeof nextNotesRaw === "string" ? nextNotesRaw.trim() : "";

      const appointmentId = randomUUID();
      const appointmentCustomFields: Record<string, unknown> = {
        notes: nextNotes,
      };
      if (typeof customFields.pickupLocation === "string") {
        appointmentCustomFields.pickupLocation = customFields.pickupLocation;
      }
      if (typeof customFields.carType === "string") {
        appointmentCustomFields.carType = customFields.carType;
      }
      if (typeof customFields.bookingDate === "string") {
        appointmentCustomFields.bookingDate = customFields.bookingDate;
      }
      if (typeof customFields.bookingTime === "string") {
        appointmentCustomFields.bookingTime = customFields.bookingTime;
      }
      appointmentCustomFields.sourceBookingId = id;

      const { error: insertErr } = await supabase.from(table).insert({
        id: appointmentId,
        business_id: businessId,
        client_id: existing.client_id,
        start_at: existing.start_at,
        end_at: existing.end_at,
        status: AppointmentStatus.Scheduled,
        payment_status: PaymentStatus.Unpaid,
        amount: 0,
        custom_fields: appointmentCustomFields,
        created_at: nowIso,
        updated_at: nowIso,
      });
      if (insertErr) throw insertErr;

      const { error: deleteErr } = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .eq("business_id", businessId);
      if (deleteErr) throw deleteErr;

      return NextResponse.json({
        ok: true as const,
        appointmentId,
      });
    }

    let appointmentStatus = existing.status;
    let bookingApproval: "pending" | "approved" | "rejected" = "pending";
    if (nextStatus === "cancelled") {
      bookingApproval = "rejected";
      appointmentStatus = AppointmentStatus.Cancelled;
    }

    const { error: updateErr } = await supabase
      .from(table)
      .update({
        status: appointmentStatus,
        custom_fields: {
          ...customFields,
          bookingSource: "public",
          bookingApproval,
          bookingRequestStatus: nextStatus,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("business_id", businessId);
    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[bookings/put]", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}
