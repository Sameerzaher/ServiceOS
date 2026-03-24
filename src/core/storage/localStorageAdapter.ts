import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from "@/core/types/settings";
import { loadFromStorage, saveToStorage } from "@/core/utils/storage";

import type { ServiceStorage } from "./types";

const CLIENTS_KEY = "serviceos.clients";
const APPOINTMENTS_KEY = "serviceos.appointments";
const SETTINGS_KEY = "serviceos.settings";

function isAppSettings(value: unknown): value is AppSettings {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.businessName === "string" &&
    typeof o.defaultLessonPrice === "number" &&
    Number.isFinite(o.defaultLessonPrice) &&
    typeof o.reminderTemplate === "string"
  );
}

function isClientArray(value: unknown): value is Client[] {
  return Array.isArray(value);
}

function isAppointmentRecordArray(
  value: unknown,
): value is AppointmentRecord[] {
  return Array.isArray(value);
}

/** Normalizes legacy rows (e.g. missing `amount`). */
function normalizeAppointment(row: AppointmentRecord): AppointmentRecord {
  return {
    ...row,
    amount: row.amount ?? 0,
  };
}

export const localStorageAdapter: ServiceStorage = {
  loadClients(): Client[] {
    const raw = loadFromStorage<unknown>(CLIENTS_KEY);
    if (isClientArray(raw)) return raw;
    return [];
  },

  persistClients(clients: Client[]): void {
    saveToStorage(CLIENTS_KEY, clients);
  },

  loadAppointments(): AppointmentRecord[] {
    const raw = loadFromStorage<unknown>(APPOINTMENTS_KEY);
    if (!isAppointmentRecordArray(raw)) return [];
    return raw.map(normalizeAppointment);
  },

  persistAppointments(appointments: AppointmentRecord[]): void {
    saveToStorage(APPOINTMENTS_KEY, appointments);
  },

  loadSettings(): AppSettings {
    const raw = loadFromStorage<unknown>(SETTINGS_KEY);
    if (!isAppSettings(raw)) return { ...DEFAULT_APP_SETTINGS };
    return {
      businessName: raw.businessName,
      defaultLessonPrice: Math.max(0, raw.defaultLessonPrice),
      reminderTemplate:
        raw.reminderTemplate.trim() || DEFAULT_APP_SETTINGS.reminderTemplate,
    };
  },

  persistSettings(settings: AppSettings): void {
    saveToStorage(SETTINGS_KEY, settings);
  },
};
