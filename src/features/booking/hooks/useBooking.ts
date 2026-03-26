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
  appointmentId?: string;
  clientId?: string;
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
        const res = await fetch("/api/public-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: input.fullName,
            phone: input.phone,
            notes: input.notes,
            slotStart: input.slotStart,
            slotEnd: input.slotEnd,
            pickupLocation: input.pickupLocation,
            carType: input.carType,
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
