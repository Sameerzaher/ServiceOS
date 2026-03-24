import type { AppointmentRecord } from "@/core/types/appointment";
import {
  normalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";
import type { Client } from "@/core/types/client";
import {
  normalizeAppSettings,
  type AppSettings,
} from "@/core/types/settings";
import { loadFromStorage, saveToStorage } from "@/core/utils/storage";
import {
  ensureStorageBootstrap,
  parseAppointmentsArray,
  parseClientsArray,
  STORAGE_KEYS,
} from "@/core/persistence";

import type { ServiceStorage } from "./types";

export const localStorageAdapter: ServiceStorage = {
  loadClients(): Client[] {
    ensureStorageBootstrap();
    const raw = loadFromStorage<unknown>(STORAGE_KEYS.clients);
    return parseClientsArray(raw);
  },

  persistClients(clients: Client[]): void {
    ensureStorageBootstrap();
    saveToStorage(STORAGE_KEYS.clients, clients);
  },

  loadAppointments(): AppointmentRecord[] {
    ensureStorageBootstrap();
    const clientIds = new Set(this.loadClients().map((c) => c.id));
    const raw = loadFromStorage<unknown>(STORAGE_KEYS.appointments);
    return parseAppointmentsArray(raw, clientIds);
  },

  persistAppointments(appointments: AppointmentRecord[]): void {
    ensureStorageBootstrap();
    saveToStorage(STORAGE_KEYS.appointments, appointments);
  },

  loadSettings(): AppSettings {
    ensureStorageBootstrap();
    const raw = loadFromStorage<unknown>(STORAGE_KEYS.settings);
    return normalizeAppSettings(raw);
  },

  persistSettings(settings: AppSettings): void {
    ensureStorageBootstrap();
    saveToStorage(STORAGE_KEYS.settings, settings);
  },

  loadAvailabilitySettings(): AvailabilitySettings {
    ensureStorageBootstrap();
    const raw = loadFromStorage<unknown>(STORAGE_KEYS.availability);
    return normalizeAvailabilitySettings(raw);
  },

  persistAvailabilitySettings(settings: AvailabilitySettings): void {
    ensureStorageBootstrap();
    saveToStorage(STORAGE_KEYS.availability, settings);
  },
};
