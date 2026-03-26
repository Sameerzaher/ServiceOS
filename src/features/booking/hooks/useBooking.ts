"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { heUi } from "@/config";
import { isSupabaseConfigured } from "@/core/storage";

export interface BookingSubmitInput {
  fullName: string;
  phone: string;
  notes: string;
  slotStart: string;
  slotEnd: string;
  pickupLocation: string;
  carType: string;
}

export interface UseBookingOptions {
  /** Called after a successful server booking (e.g. refresh local appointment list for slot UI). */
  onPublicBookingSuccess?: () => void;
}

export interface UseBookingResult {
  isReady: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  submitBooking: (input: BookingSubmitInput) => Promise<boolean>;
  resetState: () => void;
}

interface PublicBookingResponse {
  ok: boolean;
  error?: string;
  bookingId?: string;
  message?: string;
}

function toLocalDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function useBooking(options?: UseBookingOptions): UseBookingResult {
  const onSuccessRef = useRef(options?.onPublicBookingSuccess);
  useEffect(() => {
    onSuccessRef.current = options?.onPublicBookingSuccess;
  }, [options?.onPublicBookingSuccess]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = isSupabaseConfigured();

  const submitBooking = useCallback(
    async (input: BookingSubmitInput): Promise<boolean> => {
      if (isSubmitting) return false;
      setError(null);
      setIsSuccess(false);

      if (!isSupabaseConfigured()) {
        setError(heUi.publicBooking.errUnavailable);
        return false;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: input.fullName,
            phone: input.phone,
            pickupLocation: input.pickupLocation,
            carType: input.carType,
            preferredDate: toLocalDate(input.slotStart),
            preferredTime: toLocalTime(input.slotStart),
            notes: input.notes,
            status: "pending",
            createdAt: new Date().toISOString(),
            slotStart: input.slotStart,
            slotEnd: input.slotEnd,
          }),
        });

        let body: PublicBookingResponse | null = null;
        try {
          body = (await res.json()) as PublicBookingResponse;
        } catch {
          body = null;
        }

        if (!res.ok || !body || body.ok !== true) {
          const msg =
            typeof body?.error === "string" && body.error.length > 0
              ? body.error
              : heUi.publicBooking.errSaveFailed;
          setError(msg);
          return false;
        }

        setIsSuccess(true);
        onSuccessRef.current?.();
        return true;
      } catch {
        setError(heUi.publicBooking.errNetwork);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting],
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
