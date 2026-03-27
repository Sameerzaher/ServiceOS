import {
  getSupabaseBusinessId,
  getSupabaseDefaultTeacherId,
} from "@/core/config/supabaseEnv";
import * as appSettingsRepo from "@/core/repositories/supabase/appSettingsRepository";
import * as appointmentsRepo from "@/core/repositories/supabase/appointmentsRepository";
import * as bookingSettingsRepo from "@/core/repositories/supabase/bookingSettingsRepository";
import * as clientsRepo from "@/core/repositories/supabase/clientsRepository";
import type { ServiceStorage } from "@/core/types/serviceStorage";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

import { createWriteQueue } from "./writeQueue";

const writeQueue = createWriteQueue();

export function createSupabaseStorageAdapter(
  teacherId: string = getSupabaseDefaultTeacherId(),
): ServiceStorage {
  const supabase = getSupabaseBrowserClient();
  const businessId = getSupabaseBusinessId();

  return {
    loadClients: () => clientsRepo.loadClients(supabase, businessId, teacherId),

    persistClients: (clients) =>
      writeQueue.run(() =>
        clientsRepo.persistClients(supabase, businessId, teacherId, clients),
      ),

    loadAppointments: () =>
      appointmentsRepo.loadAppointments(supabase, businessId, teacherId),

    persistAppointments: (appointments) =>
      writeQueue.run(() =>
        appointmentsRepo.persistAppointments(
          supabase,
          businessId,
          teacherId,
          appointments,
        ),
      ),

    loadSettings: () =>
      appSettingsRepo.loadAppSettings(supabase, businessId, teacherId),

    persistSettings: (settings) =>
      writeQueue.run(() =>
        appSettingsRepo.persistAppSettings(
          supabase,
          businessId,
          teacherId,
          settings,
        ),
      ),

    loadAvailabilitySettings: () =>
      bookingSettingsRepo.loadBookingSettings(
        supabase,
        businessId,
        teacherId,
      ),

    persistAvailabilitySettings: (settings) =>
      writeQueue.run(() =>
        bookingSettingsRepo.persistBookingSettings(
          supabase,
          businessId,
          teacherId,
          settings,
        ),
      ),
  };
}
