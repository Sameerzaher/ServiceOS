"use client";

import { useEffect, useMemo, useState } from "react";

import type { ClientId } from "@/core/types/client";
import type {
  Appointment,
  AppointmentId,
  AppointmentRecord,
} from "@/core/types/appointment";
import { useServiceStorage } from "@/core/storage";
import { createId } from "@/core/utils/ids";

export type AppointmentPatch = Partial<Omit<AppointmentRecord, "id" | "createdAt">>;

export interface UseAppointmentsResult {
  appointments: AppointmentRecord[];
  /** Sorted by `startAt` ascending (earliest first). */
  sortedAppointments: AppointmentRecord[];
  isReady: boolean;
  addAppointment: (input: Appointment) => AppointmentRecord | null;
  updateAppointment: (id: AppointmentId, patch: AppointmentPatch) => void;
  deleteAppointment: (id: AppointmentId) => void;
  /** Removes all appointments for a client (e.g. when deleting the client). */
  deleteAppointmentsForClient: (clientId: ClientId) => void;
  /** Replace entire list (demo seed / reset). */
  replaceAppointments: (next: AppointmentRecord[]) => void;
}

export function useAppointments(): UseAppointmentsResult {
  const storage = useServiceStorage();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setAppointments(storage.loadAppointments());
    setIsReady(true);
  }, [storage]);

  useEffect(() => {
    if (!isReady) return;
    storage.persistAppointments(appointments);
  }, [appointments, isReady, storage]);

  function addAppointment(input: Appointment): AppointmentRecord | null {
    const id = createId();
    if (!id) return null;

    const now = new Date().toISOString();
    const row: AppointmentRecord = {
      ...input,
      amount: input.amount ?? 0,
      id,
      createdAt: now,
      updatedAt: now,
    };

    setAppointments((prev) => [...prev, row]);
    return row;
  }

  function updateAppointment(id: AppointmentId, patch: AppointmentPatch): void {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          ...patch,
          id: a.id,
          createdAt: a.createdAt,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function deleteAppointment(id: AppointmentId): void {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  function deleteAppointmentsForClient(clientId: ClientId): void {
    setAppointments((prev) => prev.filter((a) => a.clientId !== clientId));
  }

  function replaceAppointments(next: AppointmentRecord[]): void {
    setAppointments(next);
  }

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [appointments],
  );

  return {
    appointments,
    sortedAppointments,
    isReady,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    deleteAppointmentsForClient,
    replaceAppointments,
  };
}
