import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import * as appSettingsRepo from "@/core/repositories/supabase/appSettingsRepository";
import * as appointmentsRepo from "@/core/repositories/supabase/appointmentsRepository";
import * as bookingSettingsRepo from "@/core/repositories/supabase/bookingSettingsRepository";
import * as clientsRepo from "@/core/repositories/supabase/clientsRepository";
import type { ServiceStorage } from "@/core/types/serviceStorage";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

import { createWriteQueue } from "./writeQueue";

const writeQueue = createWriteQueue();

export function createSupabaseStorageAdapter(): ServiceStorage {
  const supabase = getSupabaseBrowserClient();
  const businessId = getSupabaseBusinessId();

  return {
    loadClients: () => clientsRepo.loadClients(supabase, businessId),

    persistClients: (clients) =>
      writeQueue.run(() => clientsRepo.persistClients(supabase, businessId, clients)),

    loadAppointments: () =>
      appointmentsRepo.loadAppointments(supabase, businessId),

    persistAppointments: (appointments) =>
      writeQueue.run(() =>
        appointmentsRepo.persistAppointments(
          supabase,
          businessId,
          appointments,
        ),
      ),

    loadSettings: () =>
      appSettingsRepo.loadAppSettings(supabase, businessId),

    persistSettings: (settings) =>
      writeQueue.run(() =>
        appSettingsRepo.persistAppSettings(supabase, businessId, settings),
      ),

    loadAvailabilitySettings: () =>
      bookingSettingsRepo.loadBookingSettings(supabase, businessId),

    persistAvailabilitySettings: (settings) =>
      writeQueue.run(() =>
        bookingSettingsRepo.persistBookingSettings(
          supabase,
          businessId,
          settings,
        ),
      ),
  };
}
