"use client";

import { useCallback, useMemo, useState } from "react";

import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useClients } from "@/features/clients/hooks/useClients";

export interface BookingSubmitInput {
  fullName: string;
  phone: string;
  notes: string;
  slotStart: string;
  slotEnd: string;
}

export interface UseBookingResult {
  isReady: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  submitBooking: (input: BookingSubmitInput) => Promise<boolean>;
  resetState: () => void;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function rangesOverlap(
  aStartMs: number,
  aEndMs: number,
  bStartMs: number,
  bEndMs: number,
): boolean {
  return aStartMs < bEndMs && bStartMs < aEndMs;
}

export function useBooking(): UseBookingResult {
  const { clients, isReady: clientsReady, addClient } = useClients();
  const {
    appointments,
    isReady: appointmentsReady,
    addAppointment,
  } = useAppointments();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = clientsReady && appointmentsReady;

  const clientByPhone = useMemo(() => {
    const map = new Map<string, (typeof clients)[number]>();
    for (const client of clients) {
      const key = normalizePhone(client.phone);
      if (!key) continue;
      if (!map.has(key)) map.set(key, client);
    }
    return map;
  }, [clients]);

  const submitBooking = useCallback(
    async (input: BookingSubmitInput): Promise<boolean> => {
      if (isSubmitting) return false;
      setError(null);
      setIsSuccess(false);

      if (!isReady) {
        setError("המערכת עדיין נטענת. נסו שוב בעוד רגע.");
        return false;
      }

      const fullName = input.fullName.trim();
      const phone = input.phone.trim();
      if (!fullName) {
        setError("נא להזין שם מלא.");
        return false;
      }
      if (!phone) {
        setError("נא להזין מספר טלפון.");
        return false;
      }

      const slotStartMs = new Date(input.slotStart).getTime();
      const slotEndMs = new Date(input.slotEnd).getTime();
      if (!Number.isFinite(slotStartMs) || !Number.isFinite(slotEndMs)) {
        setError("שעת ההזמנה לא תקינה. בחרו שעה מחדש.");
        return false;
      }
      if (slotEndMs <= slotStartMs) {
        setError("טווח השעות שנבחר אינו תקין. נסו לבחור שעה אחרת.");
        return false;
      }

      if (slotStartMs < Date.now()) {
        setError("השעה שנבחרה כבר חלפה. בחרו שעה פנויה אחרת.");
        return false;
      }

      const slotDurationMs = slotEndMs - slotStartMs;
      const hasConflict = appointments.some((appt) => {
        if (appt.status === AppointmentStatus.Cancelled) return false;
        const apptStartMs = new Date(appt.startAt).getTime();
        if (!Number.isFinite(apptStartMs)) return false;
        const apptEndMs = apptStartMs + slotDurationMs;
        return rangesOverlap(slotStartMs, slotEndMs, apptStartMs, apptEndMs);
      });
      if (hasConflict) {
        setError("השעה הזו נתפסה ממש עכשיו. בחרו שעה פנויה אחרת.");
        return false;
      }

      setIsSubmitting(true);
      try {
        const normalizedPhone = normalizePhone(phone);
        const existingClient = normalizedPhone
          ? clientByPhone.get(normalizedPhone) ?? null
          : null;
        const client =
          existingClient ??
          addClient({
            fullName,
            phone,
            notes: input.notes.trim(),
            customFields: {},
          });

        if (!client) {
          setError("לא הצלחנו לשמור את פרטי התלמיד. נסו שוב.");
          return false;
        }

        const row = addAppointment({
          clientId: client.id,
          startAt: input.slotStart,
          status: AppointmentStatus.Scheduled,
          paymentStatus: PaymentStatus.Pending,
          amount: 0,
          customFields: {
            bookingSource: "public",
            bookingSlotEnd: input.slotEnd,
            bookingNotes: input.notes.trim(),
          },
        });

        if (!row) {
          setError("לא הצלחנו לקבוע את השיעור. נסו שוב.");
          return false;
        }

        setIsSuccess(true);
        return true;
      } catch {
        setError("אירעה שגיאה בלתי צפויה. נסו שוב.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, isReady, appointments, clientByPhone, addClient, addAppointment],
  );

  const resetState = useCallback(() => {
    setError(null);
    setIsSuccess(false);
  }, []);

  return {
    isReady,
    isSubmitting,
    isSuccess,
    error,
    submitBooking,
    resetState,
  };
}

