import {
  AppointmentStatus,
  PaymentStatus,
  type AppointmentRecord,
} from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { DEFAULT_APP_SETTINGS, type AppSettings } from "@/core/types/settings";

import { BACKUP_VERSION, type AppBackupPayload } from "./schema";

const APPOINTMENT_STATUSES = new Set<string>(
  Object.values(AppointmentStatus),
);
const PAYMENT_STATUSES = new Set<string>(Object.values(PaymentStatus));

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isClientRow(x: unknown): x is Client {
  if (!isRecord(x)) return false;
  return (
    typeof x.id === "string" &&
    typeof x.fullName === "string" &&
    typeof x.phone === "string" &&
    typeof x.notes === "string" &&
    isRecord(x.customFields) &&
    typeof x.createdAt === "string" &&
    typeof x.updatedAt === "string"
  );
}

function isAppointmentRow(x: unknown): x is AppointmentRecord {
  if (!isRecord(x)) return false;
  if (
    typeof x.id !== "string" ||
    typeof x.clientId !== "string" ||
    typeof x.startAt !== "string" ||
    typeof x.status !== "string" ||
    typeof x.paymentStatus !== "string" ||
    typeof x.createdAt !== "string" ||
    typeof x.updatedAt !== "string" ||
    !isRecord(x.customFields)
  ) {
    return false;
  }
  if (!APPOINTMENT_STATUSES.has(x.status)) return false;
  if (!PAYMENT_STATUSES.has(x.paymentStatus)) return false;
  const amount = x.amount;
  if (amount !== undefined && typeof amount !== "number") return false;
  return true;
}

function normalizeSettings(raw: unknown): AppSettings | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.businessName !== "string") return null;
  if (typeof raw.reminderTemplate !== "string") return null;
  const price = raw.defaultLessonPrice;
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  return {
    businessName: raw.businessName,
    defaultLessonPrice: Math.max(0, price),
    reminderTemplate:
      raw.reminderTemplate.trim() || DEFAULT_APP_SETTINGS.reminderTemplate,
  };
}

export type BackupValidationResult =
  | { ok: true; data: AppBackupPayload }
  | { ok: false; errorKey: BackupErrorKey };

export type BackupErrorKey =
  | "notObject"
  | "badVersion"
  | "missingArrays"
  | "invalidClient"
  | "invalidAppointment"
  | "invalidSettings"
  | "orphanAppointment";

/**
 * Validates unknown JSON and returns a typed payload safe to apply to storage.
 */
export function parseAndValidateBackup(
  raw: unknown,
): BackupValidationResult {
  if (!isRecord(raw)) {
    return { ok: false, errorKey: "notObject" };
  }

  const version = raw.version;
  if (version !== BACKUP_VERSION) {
    return { ok: false, errorKey: "badVersion" };
  }

  const clientsRaw = raw.clients;
  const appointmentsRaw = raw.appointments;
  const settingsRaw = raw.settings;

  if (!Array.isArray(clientsRaw) || !Array.isArray(appointmentsRaw)) {
    return { ok: false, errorKey: "missingArrays" };
  }

  const clients: Client[] = [];
  for (let i = 0; i < clientsRaw.length; i++) {
    if (!isClientRow(clientsRaw[i])) {
      return { ok: false, errorKey: "invalidClient" };
    }
    clients.push(clientsRaw[i]);
  }

  const appointments: AppointmentRecord[] = [];
  for (let i = 0; i < appointmentsRaw.length; i++) {
    const row = appointmentsRaw[i];
    if (!isAppointmentRow(row)) {
      return { ok: false, errorKey: "invalidAppointment" };
    }
    appointments.push({
      ...row,
      amount: typeof row.amount === "number" ? row.amount : 0,
      status: row.status as AppointmentRecord["status"],
      paymentStatus: row.paymentStatus as AppointmentRecord["paymentStatus"],
    });
  }

  const settings = normalizeSettings(settingsRaw);
  if (!settings) {
    return { ok: false, errorKey: "invalidSettings" };
  }

  const clientIds = new Set(clients.map((c) => c.id));
  for (const a of appointments) {
    if (!clientIds.has(a.clientId)) {
      return { ok: false, errorKey: "orphanAppointment" };
    }
  }

  const exportedAt =
    typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString();

  const data: AppBackupPayload = {
    version: BACKUP_VERSION,
    exportedAt,
    clients,
    appointments,
    settings,
  };

  return { ok: true, data };
}
