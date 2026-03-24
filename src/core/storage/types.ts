import type { AppointmentRecord } from "@/core/types/appointment";
import type { AvailabilitySettings } from "@/core/types/availability";
import type { Client } from "@/core/types/client";
import type { AppSettings } from "@/core/types/settings";

/**
 * Persistence boundary — swap implementation for API/backend later.
 * All methods are sync for LocalStorage; async variants can be added when needed.
 */
export interface ServiceStorage {
  loadClients(): Client[];
  persistClients(clients: Client[]): void;
  loadAppointments(): AppointmentRecord[];
  persistAppointments(appointments: AppointmentRecord[]): void;
  loadSettings(): AppSettings;
  persistSettings(settings: AppSettings): void;
  loadAvailabilitySettings(): AvailabilitySettings;
  persistAvailabilitySettings(settings: AvailabilitySettings): void;
}
