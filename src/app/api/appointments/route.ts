import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getSupabaseAppointmentsTable, getSupabaseBusinessId } from "@/core/config/supabaseEnv";
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

  const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
  const startAt = typeof body.startAt === "string" ? body.startAt.trim() : "";
  if (!clientId || !startAt) return null;
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

function toApiAppointment(row: AppointmentRecord) {
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

  return {
    id: row.id,
    studentId: row.clientId,
    date,
    startTime,
    endTime,
    status: row.status,
    notes,
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
    for (const row of data ?? []) {
      const parsed = appointmentFromRow(row as unknown as AppointmentRow);
      if (parsed) appointments.push(toApiAppointment(parsed));
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

    const { error } = await supabase.from(table).insert({
      id,
      business_id: businessId,
      client_id: parsed.clientId,
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
      clientId: parsed.clientId,
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
