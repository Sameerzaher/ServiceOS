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
import type { AppointmentRecord } from "@/core/types/appointment";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שמירת שיעורים אינה זמינה כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "בקשה לא תקינה.";
const HE_ERR_GENERIC = "אירעה תקלה בשמירת השיעור. נסו שוב.";

type CreateBody = {
  id?: unknown;
  clientId?: unknown;
  startAt?: unknown;
  endAt?: unknown;
  status?: unknown;
  paymentStatus?: unknown;
  amount?: unknown;
  notes?: unknown;
  customFields?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  clientName?: unknown;
  phone?: unknown;
  date?: unknown;
  time?: unknown;
  sourceBookingId?: unknown;
};

function isStatus(value: string): value is AppointmentStatus {
  return (Object.values(AppointmentStatus) as string[]).includes(value);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return (Object.values(PaymentStatus) as string[]).includes(value);
}

function parseCreateBody(raw: unknown): Omit<AppointmentRecord, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  endAt?: string;
  notes?: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as CreateBody;

  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";
  const startAtRaw =
    typeof body.startAt === "string" ? body.startAt.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const time = typeof body.time === "string" ? body.time.trim() : "";
  let startAt = startAtRaw;
  if (!startAt && date && time) {
    const parsed = new Date(`${date}T${time}:00`);
    if (Number.isFinite(parsed.getTime())) {
      startAt = parsed.toISOString();
    }
  }
  if (!startAt) return null;
  if (!Number.isFinite(new Date(startAt).getTime())) return null;

  const statusRaw = typeof body.status === "string" ? body.status.trim() : "";
  const status = isStatus(statusRaw) ? statusRaw : AppointmentStatus.Scheduled;

  const paymentRaw =
    typeof body.paymentStatus === "string" ? body.paymentStatus.trim() : "";
  const paymentStatus = isPaymentStatus(paymentRaw)
    ? paymentRaw
    : PaymentStatus.Pending;

  const amountRaw =
    typeof body.amount === "number" ? body.amount : Number(body.amount ?? 0);
  const amount = Number.isFinite(amountRaw) ? Math.max(0, amountRaw) : 0;

  const baseCustom =
    body.customFields && typeof body.customFields === "object" && !Array.isArray(body.customFields)
      ? ({ ...(body.customFields as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const endAt = typeof body.endAt === "string" ? body.endAt.trim() : "";
  if (endAt && Number.isFinite(new Date(endAt).getTime())) {
    baseCustom.bookingSlotEnd = endAt;
  }
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  if (notes) {
    baseCustom.notes = notes;
  }
  const sourceBookingId =
    typeof body.sourceBookingId === "string" ? body.sourceBookingId.trim() : "";
  if (sourceBookingId) {
    baseCustom.sourceBookingId = sourceBookingId;
  }

  return {
    id: typeof body.id === "string" ? body.id.trim() : undefined,
    createdAt: typeof body.createdAt === "string" ? body.createdAt : undefined,
    updatedAt: typeof body.updatedAt === "string" ? body.updatedAt : undefined,
    endAt: endAt || undefined,
    notes: notes || undefined,
    clientId,
    startAt,
    status,
    paymentStatus,
    amount,
    customFields: baseCustom,
  };
}

function toApiAppointment(
  row: AppointmentRecord,
  client?: { fullName: string; phone: string },
) {
  const endRaw = row.customFields?.bookingSlotEnd;
  const endAt = typeof endRaw === "string" && endRaw.trim() ? endRaw.trim() : "";
  const dateObj = new Date(row.startAt);
  const date = Number.isFinite(dateObj.getTime())
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(dateObj)
    : "";
  const startTime = Number.isFinite(dateObj.getTime())
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }).format(dateObj)
    : "";
  const endObj = endAt ? new Date(endAt) : null;
  const endTime =
    endObj && Number.isFinite(endObj.getTime())
      ? new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }).format(endObj)
      : "";

  const notesRaw = row.customFields?.notes;
  const notes = typeof notesRaw === "string" ? notesRaw : "";
  const sourceBookingIdRaw = row.customFields?.sourceBookingId;
  const sourceBookingId =
    typeof sourceBookingIdRaw === "string" ? sourceBookingIdRaw : "";

  return {
    id: row.id,
    clientName: client?.fullName ?? "",
    phone: client?.phone ?? "",
    time: startTime,
    studentId: row.clientId,
    date,
    startTime,
    endTime,
    status: row.status,
    notes,
    sourceBookingId,
    clientId: row.clientId,
    startAt: row.startAt,
    endAt,
    paymentStatus: row.paymentStatus,
    amount: row.amount,
    customFields: row.customFields,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET(): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const table = getSupabaseAppointmentsTable();
    const clientsTable = getSupabaseClientsTable();
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("business_id", businessId)
      .order("start_at", { ascending: true });

    if (error) {
      console.error("[appointments/get]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    const appointments: ReturnType<typeof toApiAppointment>[] = [];
    const { data: clientRows, error: clientsErr } = await supabase
      .from(clientsTable)
      .select("id, full_name, phone")
      .eq("business_id", businessId);
    if (clientsErr) {
      console.error("[appointments/get clients]", clientsErr);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }
    const clientMap = new Map<string, { fullName: string; phone: string }>();
    for (const row of clientRows ?? []) {
      const r = row as { id?: string; full_name?: string; phone?: string };
      if (!r.id) continue;
      clientMap.set(r.id, {
        fullName: typeof r.full_name === "string" ? r.full_name : "",
        phone: typeof r.phone === "string" ? r.phone : "",
      });
    }
    for (const row of data ?? []) {
      const parsed = appointmentFromRow(row as unknown as AppointmentRow);
      if (parsed) {
        appointments.push(toApiAppointment(parsed, clientMap.get(parsed.clientId)));
      }
    }
    return NextResponse.json({ ok: true as const, appointments });
  } catch (e) {
    console.error("[appointments/get]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  const parsed = parseCreateBody(raw);
  if (!parsed) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = parsed.id && parsed.id.length > 0 ? parsed.id : randomUUID();
  const createdAt = parsed.createdAt ?? now;
  const updatedAt = parsed.updatedAt ?? now;
  const endAtRaw = parsed.customFields.bookingSlotEnd;
  const endAt = typeof endAtRaw === "string" && endAtRaw.trim() ? endAtRaw.trim() : null;

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const table = getSupabaseAppointmentsTable();
    const clientsTable = getSupabaseClientsTable();
    const body = raw as CreateBody;

    let clientId = parsed.clientId;
    if (!clientId) {
      const clientName =
        typeof body.clientName === "string" ? body.clientName.trim() : "";
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      if (!clientName || !phone) {
        return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
      }
      const { data: existingClientRows, error: existingClientErr } = await supabase
        .from(clientsTable)
        .select("id, phone")
        .eq("business_id", businessId);
      if (existingClientErr) throw existingClientErr;
      const normalized = phone.replace(/\D+/g, "");
      for (const row of existingClientRows ?? []) {
        const r = row as { id?: string; phone?: string };
        const candidate = (typeof r.phone === "string" ? r.phone : "").replace(/\D+/g, "");
        if (normalized.length > 0 && normalized === candidate && r.id) {
          clientId = r.id;
          break;
        }
      }
      if (!clientId) {
        clientId = randomUUID();
        const { error: insertClientErr } = await supabase.from(clientsTable).insert({
          id: clientId,
          business_id: businessId,
          full_name: clientName,
          phone,
          notes: "",
          custom_fields: {},
          created_at: now,
          updated_at: now,
        });
        if (insertClientErr) throw insertClientErr;
      }
    }

    const { error } = await supabase.from(table).insert({
      id,
      business_id: businessId,
      client_id: clientId,
      start_at: parsed.startAt,
      end_at: endAt,
      status: parsed.status,
      payment_status: parsed.paymentStatus,
      amount: parsed.amount,
      custom_fields: parsed.customFields,
      created_at: createdAt,
      updated_at: updatedAt,
    });
    if (error) {
      console.error("[appointments/post]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    const row: AppointmentRecord = {
      id,
      clientId,
      startAt: parsed.startAt,
      status: parsed.status,
      paymentStatus: parsed.paymentStatus,
      amount: parsed.amount,
      customFields: parsed.customFields,
      createdAt,
      updatedAt,
    };
    return NextResponse.json({ ok: true as const, appointment: toApiAppointment(row) });
  } catch (e) {
    console.error("[appointments/post]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
