"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";

import { heUi } from "@/config";
import type { ClientId } from "@/core/types/client";
import type {
  Appointment,
  AppointmentId,
  AppointmentRecord,
} from "@/core/types/appointment";
import { isSupabaseConfigured, useServiceStorage } from "@/core/storage";
import { createId } from "@/core/utils/ids";

export type AppointmentPatch = Partial<Omit<AppointmentRecord, "id" | "createdAt">>;

export interface UseAppointmentsResult {
  appointments: AppointmentRecord[];
  /** Sorted by `startAt` ascending (earliest first). */
  sortedAppointments: AppointmentRecord[];
  isReady: boolean;
  loadError: string | null;
  syncError: string | null;
  retryLoad: () => void;
  retrySync: () => void;
  addAppointment: (input: Appointment) => AppointmentRecord | null;
  updateAppointment: (id: AppointmentId, patch: AppointmentPatch) => void;
  deleteAppointment: (id: AppointmentId) => void;
  /** Removes all appointments for a client (e.g. when deleting the client). */
  deleteAppointmentsForClient: (clientId: ClientId) => void;
  /** Replace entire list (demo seed / reset). */
  replaceAppointments: (next: AppointmentRecord[]) => void;
}

/**
 * @param reloadKey Increment to force a reload from storage (e.g. after public API booking).
 */
export function useAppointments(reloadKey?: number): UseAppointmentsResult {
  const storage = useServiceStorage();
  const remote = isSupabaseConfigured();
  const skipPersistAfterRemoteLoadRef = useRef(false);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    void (async () => {
      try {
        const rows = await storage.loadAppointments();
        if (!cancelled) {
          setAppointments(rows);
          if (remote) skipPersistAfterRemoteLoadRef.current = true;
        }
      } catch (e) {
        console.error("[ServiceOS] useAppointments load", e);
        if (!cancelled) setLoadError(heUi.data.loadFailedTitle);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storage, reloadKey, remote, loadKey]);

  useEffect(() => {
    if (!isReady) return;
    if (remote && skipPersistAfterRemoteLoadRef.current) {
      skipPersistAfterRemoteLoadRef.current = false;
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await storage.persistAppointments(appointments);
        if (cancelled) return;
        setSyncError(null);
        if (remote) {
          skipPersistAfterRemoteLoadRef.current = true;
          const rows = await storage.loadAppointments();
          if (!cancelled) setAppointments(rows);
        }
      } catch (e) {
        console.error("[ServiceOS] useAppointments persist", e);
        if (!cancelled) setSyncError(heUi.data.syncFailedTitle);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointments, isReady, remote, storage]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setIsReady(false);
    setLoadKey((k) => k + 1);
  }, []);

  const retrySync = useCallback(() => {
    setSyncError(null);
    void (async () => {
      try {
        await storage.persistAppointments(appointments);
        setSyncError(null);
        if (remote) {
          skipPersistAfterRemoteLoadRef.current = true;
          const rows = await storage.loadAppointments();
          setAppointments(rows);
        }
      } catch (e) {
        console.error("[ServiceOS] useAppointments retrySync", e);
        setSyncError(heUi.data.syncFailedTitle);
      }
    });
  }, [appointments, remote, storage]);

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
    loadError,
    syncError,
    retryLoad,
    retrySync,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    deleteAppointmentsForClient,
    replaceAppointments,
  };
}
