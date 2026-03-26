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
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

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
  appointmentsTable: string,
): Promise<{ appointments: AppointmentRecord[]; error: unknown | null }> {
  const { data: apptRows, error: apptLoadErr } = await supabase
    .from(appointmentsTable)
    .select("*")
    .eq("business_id", businessId);

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
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false as const, error: heUi.publicBooking.errInvalidPayload },
      { status: 400 },
    );
  }

  const parsed = parsePublicBookingBody(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false as const, error: parsed.errorHe },
      { status: 400 },
    );
  }

  const { fullName, phone, notes, slotStart, slotEnd, pickupLocation, carType } =
    parsed.data;
  const businessId = getSupabaseBusinessId();
  const appointmentsTable = getSupabaseAppointmentsTable();
  const clientsTableName = getSupabaseClientsTable();

  const slotStartMs = new Date(slotStart).getTime();
  const nowMs = Date.now();

  try {
    const supabase = getSupabaseAdminClient();

    const gate = await loadPublicBookingGate(supabase, businessId);
    if (!gate.ok) {
      console.error("[public-booking] booking gate load failed");
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    if (!gate.bookingEnabled) {
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_UNAVAILABLE },
        { status: 403 },
      );
    }

    if (
      publicSlotOutsideBookingHorizon(slotStartMs, nowMs, gate.daysAhead)
    ) {
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_SLOT_HORIZON },
        { status: 400 },
      );
    }

    const firstLoad = await loadAppointmentsForOverlap(
      supabase,
      businessId,
      appointmentsTable,
    );
    if (firstLoad.error) {
      console.error("[public-booking] load appointments", firstLoad.error);
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
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_CONFLICT },
        { status: 409 },
      );
    }

    const { data: clientRows, error: clientLoadErr } = await supabase
      .from(clientsTableName)
      .select("*")
      .eq("business_id", businessId);

    if (clientLoadErr) {
      console.error("[public-booking] load clients", clientLoadErr);
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
        break;
      }
    }

    const now = new Date().toISOString();

    if (!clientId) {
      clientId = randomUUID();
      const { error: insertClientErr } = await supabase
        .from(clientsTableName)
        .insert({
          id: clientId,
          business_id: businessId,
          full_name: fullName,
          phone,
          notes,
          custom_fields: {},
          created_at: now,
          updated_at: now,
        });

      if (insertClientErr) {
        console.error("[public-booking] insert client", insertClientErr);
        return NextResponse.json(
          { ok: false as const, error: HE_ERR_GENERIC },
          { status: 500 },
        );
      }
    } else {
      const { error: patchErr } = await supabase
        .from(clientsTableName)
        .update({
          full_name: fullName,
          notes,
          updated_at: now,
        })
        .eq("id", clientId)
        .eq("business_id", businessId);

      if (patchErr) {
        console.error("[public-booking] update client", patchErr);
        return NextResponse.json(
          { ok: false as const, error: HE_ERR_GENERIC },
          { status: 500 },
        );
      }
    }

    const preInsertLoad = await loadAppointmentsForOverlap(
      supabase,
      businessId,
      appointmentsTable,
    );
    if (preInsertLoad.error) {
      console.error(
        "[public-booking] reload appointments before insert",
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
    if (pickupLocation) customFields.pickupLocation = pickupLocation;
    if (carType) customFields.carType = carType;

    const { error: insertApptErr } = await supabase
      .from(appointmentsTable)
      .insert({
        id: appointmentId,
        business_id: businessId,
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
      console.error("[public-booking] insert appointment", insertApptErr);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true as const,
      appointmentId,
      clientId,
    });
  } catch (e) {
    console.error("[public-booking]", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}
