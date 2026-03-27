import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  getSupabaseAppointmentsTable,
  getSupabaseBusinessId,
  getSupabaseClientsTable,
} from "@/core/config/supabaseEnv";
import {
  appointmentFromRow,
  type AppointmentRow,
} from "@/core/storage/supabase/mappers";
import {
  AppointmentStatus,
  PaymentStatus,
  type AppointmentRecord,
} from "@/core/types/appointment";
import {
  bookingOverlapsExistingAppointments,
  normalizePhone,
} from "@/features/booking/logic/publicBookingShared";
import { isMissingColumnError } from "@/core/repositories/supabase/postgrestErrors";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שמירת בקשה אינה זמינה כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "פרטי הבקשה אינם תקינים.";
const HE_ERR_GENERIC = "אירעה תקלה בשמירת הבקשה. נסו שוב.";
const HE_ERR_CONFLICT = "השעה שבחרתם כבר נתפסה. נסו לבחור שעה אחרת.";

type ClientRow = {
  id: string;
  phone: string;
};

type BookingPayload = {
  fullName: string;
  phone: string;
  pickupLocation: string;
  carType: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: "pending";
  createdAt?: string;
  slotStart: string;
  slotEnd: string;
};

type BookingListRow = {
  id: string;
  teacherId: string;
  fullName: string;
  phone: string;
  pickupLocation: string;
  carType: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
};

/** Local calendar date YYYY-MM-DD from stored ISO instant (for list display). */
function localYmdFromIso(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local HH:mm from stored ISO instant (when custom `bookingTime` is missing). */
function localHHMMFromIso(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function parsePayload(raw: unknown): BookingPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;

  const fullName = typeof b.fullName === "string" ? b.fullName.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  const pickupLocation =
    typeof b.pickupLocation === "string" ? b.pickupLocation.trim() : "";
  const carType = typeof b.carType === "string" ? b.carType.trim() : "";
  const preferredDate =
    typeof b.preferredDate === "string" ? b.preferredDate.trim() : "";
  const preferredTime =
    typeof b.preferredTime === "string" ? b.preferredTime.trim() : "";
  const notes = typeof b.notes === "string" ? b.notes.trim() : "";
  const status = b.status === "pending" ? "pending" : null;
  const createdAt =
    typeof b.createdAt === "string" && b.createdAt.trim().length > 0
      ? b.createdAt.trim()
      : undefined;

  const slotStartRaw = typeof b.slotStart === "string" ? b.slotStart : "";
  const slotEndRaw = typeof b.slotEnd === "string" ? b.slotEnd : "";

  if (!fullName || !phone || !preferredDate || !preferredTime || !status) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return null;
  if (!/^\d{2}:\d{2}$/.test(preferredTime)) return null;

  let slotStart: string;
  if (slotStartRaw) {
    const parsed = new Date(slotStartRaw);
    if (!Number.isFinite(parsed.getTime())) return null;
    slotStart = parsed.toISOString();
  } else {
    const parsed = new Date(`${preferredDate}T${preferredTime}:00`);
    if (!Number.isFinite(parsed.getTime())) return null;
    slotStart = parsed.toISOString();
  }

  let slotEnd: string;
  if (slotEndRaw) {
    const parsed = new Date(slotEndRaw);
    if (!Number.isFinite(parsed.getTime())) return null;
    slotEnd = parsed.toISOString();
  } else {
    const endMs = new Date(slotStart).getTime() + 40 * 60 * 1000;
    slotEnd = new Date(endMs).toISOString();
  }

  if (new Date(slotEnd).getTime() <= new Date(slotStart).getTime()) return null;

  return {
    fullName,
    phone,
    pickupLocation,
    carType,
    preferredDate,
    preferredTime,
    notes,
    status,
    createdAt,
    slotStart,
    slotEnd,
  };
}

async function loadAppointments(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  businessId: string,
  teacherId: string,
  table: string,
): Promise<AppointmentRecord[]> {
  let res = await supabase
    .from(table)
    .select("*")
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId);
  if (res.error && isMissingColumnError(res.error)) {
    res = await supabase
      .from(table)
      .select("*")
      .eq("business_id", businessId);
  }
  const { data, error } = res;
  if (error) throw error;

  const rows: AppointmentRecord[] = [];
  for (const row of data ?? []) {
    const parsed = appointmentFromRow(row as unknown as AppointmentRow);
    if (parsed) rows.push(parsed);
  }
  return rows;
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
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }

  const input = parsePayload(raw);
  if (!input) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req, raw);
    const appointmentsTable = getSupabaseAppointmentsTable();
    const clientsTable = getSupabaseClientsTable();

    const existingAppointments = await loadAppointments(
      supabase,
      businessId,
      teacherId,
      appointmentsTable,
    );
    if (
      bookingOverlapsExistingAppointments(
        input.slotStart,
        input.slotEnd,
        existingAppointments,
      )
    ) {
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_CONFLICT },
        { status: 409 },
      );
    }

    let clientList = await supabase
      .from(clientsTable)
      .select("id, phone")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);
    if (clientList.error && isMissingColumnError(clientList.error)) {
      clientList = await supabase
        .from(clientsTable)
        .select("id, phone")
        .eq("business_id", businessId);
    }
    const { data: clientRows, error: clientsErr } = clientList;
    if (clientsErr) throw clientsErr;

    const normalizedPhone = normalizePhone(input.phone);
    let clientId: string | null = null;
    for (const row of clientRows ?? []) {
      const c = row as ClientRow;
      if (
        normalizedPhone.length > 0 &&
        normalizePhone(c.phone) === normalizedPhone
      ) {
        clientId = c.id;
        break;
      }
    }

    const now = input.createdAt ?? new Date().toISOString();
    if (!clientId) {
      clientId = randomUUID();
      const baseClient = {
        id: clientId,
        business_id: businessId,
        full_name: input.fullName,
        phone: input.phone,
        notes: input.notes,
        custom_fields: {},
        created_at: now,
        updated_at: now,
      };
      let ins = await supabase.from(clientsTable).insert({
        ...baseClient,
        teacher_id: teacherId,
      });
      if (ins.error && isMissingColumnError(ins.error)) {
        ins = await supabase.from(clientsTable).insert(baseClient);
      }
      if (ins.error) throw ins.error;
    }

    const appointmentId = randomUUID();
    const customFields: Record<string, unknown> = {
      bookingSource: "public",
      bookingApproval: "pending",
      bookingRequestStatus: input.status,
      bookingDate: input.preferredDate,
      bookingTime: input.preferredTime,
      bookingSlotEnd: input.slotEnd,
      bookingNotes: input.notes,
    };
    if (input.pickupLocation) customFields.pickupLocation = input.pickupLocation;
    if (input.carType) customFields.carType = input.carType;

    const baseAppt = {
      id: appointmentId,
      business_id: businessId,
      client_id: clientId,
      start_at: input.slotStart,
      end_at: input.slotEnd,
      status: AppointmentStatus.Scheduled,
      payment_status: PaymentStatus.Unpaid,
      amount: 0,
      custom_fields: customFields,
      created_at: now,
      updated_at: now,
    };
    let insertRes = await supabase.from(appointmentsTable).insert({
      ...baseAppt,
      teacher_id: teacherId,
    });
    if (insertRes.error && isMissingColumnError(insertRes.error)) {
      insertRes = await supabase.from(appointmentsTable).insert(baseAppt);
    }
    if (insertRes.error) throw insertRes.error;

    return NextResponse.json({
      ok: true as const,
      bookingId: appointmentId,
      message: "✅ הבקשה נשלחה בהצלחה. נחזור אליכם לאישור סופי.",
    });
  } catch (e) {
    console.error("[bookings/post]", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}

function deriveBookingStatus(
  customFields: Record<string, unknown>,
): "pending" | "confirmed" | "cancelled" {
  const approval = customFields.bookingApproval;
  if (approval === "approved") return "confirmed";
  if (approval === "rejected") return "cancelled";

  const explicit = customFields.bookingRequestStatus;
  if (
    explicit === "pending" ||
    explicit === "confirmed" ||
    explicit === "cancelled"
  ) {
    return explicit;
  }
  return "pending";
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req);
    const appointmentsTable = getSupabaseAppointmentsTable();
    const clientsTable = getSupabaseClientsTable();

    let apptList = await supabase
      .from(appointmentsTable)
      .select("id, client_id, start_at, created_at, custom_fields")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .order("start_at", { ascending: false });
    if (apptList.error && isMissingColumnError(apptList.error)) {
      apptList = await supabase
        .from(appointmentsTable)
        .select("id, client_id, start_at, created_at, custom_fields")
        .eq("business_id", businessId)
        .order("start_at", { ascending: false });
    }
    const { data: apptRows, error: apptErr } = apptList;
    if (apptErr) throw apptErr;

    let clientListGet = await supabase
      .from(clientsTable)
      .select("id, full_name, phone")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);
    if (clientListGet.error && isMissingColumnError(clientListGet.error)) {
      clientListGet = await supabase
        .from(clientsTable)
        .select("id, full_name, phone")
        .eq("business_id", businessId);
    }
    const { data: clientRows, error: clientErr } = clientListGet;
    if (clientErr) throw clientErr;

    const clientById = new Map<string, { full_name: string; phone: string }>();
    for (const row of clientRows ?? []) {
      const r = row as { id?: string; full_name?: string; phone?: string };
      if (!r.id) continue;
      clientById.set(r.id, {
        full_name: typeof r.full_name === "string" ? r.full_name : "",
        phone: typeof r.phone === "string" ? r.phone : "",
      });
    }

    const bookings: BookingListRow[] = [];
    for (const row of apptRows ?? []) {
      const r = row as {
        id?: string;
        client_id?: string;
        start_at?: string;
        created_at?: string;
        custom_fields?: Record<string, unknown>;
      };
      if (!r.id || !r.client_id || !r.start_at) continue;
      const cf =
        r.custom_fields && typeof r.custom_fields === "object"
          ? r.custom_fields
          : {};
      if (cf.bookingSource !== "public") continue;
      const client = clientById.get(r.client_id);
      const preferredDate =
        typeof cf.bookingDate === "string" && cf.bookingDate.trim().length > 0
          ? cf.bookingDate.trim()
          : localYmdFromIso(r.start_at);
      const preferredTime =
        typeof cf.bookingTime === "string" && cf.bookingTime.trim().length > 0
          ? cf.bookingTime.trim()
          : localHHMMFromIso(r.start_at);
      const notes =
        typeof cf.bookingNotes === "string" ? cf.bookingNotes.trim() : "";
      const pickupLocation =
        typeof cf.pickupLocation === "string" ? cf.pickupLocation.trim() : "";
      const carType = typeof cf.carType === "string" ? cf.carType.trim() : "";
      bookings.push({
        id: r.id,
        teacherId,
        fullName: client?.full_name?.trim() || "לקוח",
        phone: client?.phone?.trim() || "",
        pickupLocation,
        carType,
        preferredDate,
        preferredTime,
        notes,
        status: deriveBookingStatus(cf),
        createdAt: typeof r.created_at === "string" ? r.created_at : r.start_at,
      });
    }

    return NextResponse.json({ ok: true as const, bookings });
  } catch (e) {
    console.error("[bookings/get]", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}
