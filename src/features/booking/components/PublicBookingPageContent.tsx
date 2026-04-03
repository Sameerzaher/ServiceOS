"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { heUi } from "@/config";
import { DataLoadErrorBanner, useToast, ui } from "@/components/ui";
import { BookingSlotPicker } from "@/features/booking/components/BookingSlotPicker";
import { PublicBookingForm } from "@/features/booking/components/PublicBookingForm";
import { PublicBookingSuccessPanel } from "@/features/booking/components/PublicBookingSuccessPanel";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { usePublicTeacherAppointments } from "@/features/booking/hooks/usePublicTeacherAppointments";
import { generateAvailableSlots } from "@/features/booking/utils/generateAvailableSlots";
import type { AvailabilitySettings } from "@/core/types/availability";
import type { BusinessType } from "@/core/types/teacher";
import { getVerticalPreset } from "@/config/verticals/registry";
import { cn } from "@/lib/cn";

function todayLocalYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addLocalDaysYmd(from: Date, daysToAdd: number): string {
  const d = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
  );
  d.setDate(d.getDate() + daysToAdd);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function BookingSectionSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      <div className="h-4 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-10 w-full max-w-xs animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700"
          />
        ))}
      </div>
      <span className="sr-only">{heUi.loading.ariaBusy}</span>
    </div>
  );
}

export type PublicBookingIdentity = {
  businessName: string;
  teacherName: string;
  phone: string;
};

export interface PublicBookingPageContentProps {
  teacherId: string;
  businessType: BusinessType;
  identity: PublicBookingIdentity;
  availability: AvailabilitySettings;
}

export function PublicBookingPageContent({
  teacherId,
  businessType,
  identity,
  availability,
}: PublicBookingPageContentProps) {
  const toast = useToast();
  const toastShownForError = useRef<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() => todayLocalYmd());
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [appointmentsReloadKey, setAppointmentsReloadKey] = useState(0);

  const {
    sortedAppointments,
    isReady: appointmentsReady,
    loadError: appointmentsLoadError,
    retryLoad: retryAppointmentsLoad,
  } = usePublicTeacherAppointments(teacherId, appointmentsReloadKey);

  const {
    isReady,
    isSubmitting,
    isSuccess,
    error,
    successSnapshot,
    submitBooking,
    resetState,
  } = useBooking({
    teacherId,
    onPublicBookingSuccess: () =>
      setAppointmentsReloadKey((k) => k + 1),
  });

  const availableSlots = useMemo(
    () =>
      generateAvailableSlots({
        date: selectedDate,
        availability,
        existingAppointments: sortedAppointments,
      }),
    [selectedDate, availability, sortedAppointments],
  );

  const selectedSlot = useMemo(
    () =>
      availableSlots.find((slot) => slot.slotStart === selectedSlotStart) ?? null,
    [availableSlots, selectedSlotStart],
  );

  const isSelectedSlotAvailable = useMemo(() => {
    if (!selectedSlotStart) return false;
    return availableSlots.some((s) => s.slotStart === selectedSlotStart);
  }, [availableSlots, selectedSlotStart]);

  const maxBookDateYmd = useMemo(() => {
    const ahead = Math.max(1, availability.daysAhead);
    return addLocalDaysYmd(new Date(), ahead - 1);
  }, [availability.daysAhead]);

  const publicBookingExtraFields = useMemo(
    () => getVerticalPreset(businessType).publicBookingFields,
    [businessType],
  );

  useEffect(() => {
    const min = todayLocalYmd();
    if (selectedDate < min) {
      setSelectedDate(min);
      setSelectedSlotStart(null);
    }
    if (selectedDate > maxBookDateYmd) {
      setSelectedDate(maxBookDateYmd);
      setSelectedSlotStart(null);
    }
  }, [maxBookDateYmd, selectedDate]);

  useEffect(() => {
    if (isSuccess) return;
    if (selectedSlotStart && !isSelectedSlotAvailable) {
      setSelectedSlotStart(null);
      resetState();
    }
  }, [isSuccess, isSelectedSlotAvailable, selectedSlotStart, resetState]);

  useEffect(() => {
    if (!appointmentsLoadError) {
      toastShownForError.current = null;
      return;
    }
    if (toastShownForError.current === appointmentsLoadError) return;
    toastShownForError.current = appointmentsLoadError;
    toast(appointmentsLoadError, "error");
  }, [appointmentsLoadError, toast]);

  const lastToastedSubmitErr = useRef<string | null>(null);
  useEffect(() => {
    if (!error) {
      lastToastedSubmitErr.current = null;
      return;
    }
    if (lastToastedSubmitErr.current === error) return;
    lastToastedSubmitErr.current = error;
    toast(
      error.includes(heUi.publicBooking.errNetwork)
        ? heUi.publicBooking.toastNetworkError
        : heUi.publicBooking.toastSubmitFailed,
      "error",
    );
  }, [error, toast]);

  const handleBookAnother = useCallback(() => {
    resetState();
    setSelectedSlotStart(null);
  }, [resetState]);

  const onDateChange = useCallback(
    (next: string) => {
      setSelectedDate(next);
      setSelectedSlotStart(null);
      resetState();
    },
    [resetState],
  );

  const onSlotSelect = useCallback(
    (slot: { slotStart: string }) => {
      setSelectedSlotStart(slot.slotStart);
      resetState();
    },
    [resetState],
  );

  const bookingDataReady = appointmentsReady;
  const businessLine = (identity.businessName ?? "").trim();
  const teacherLine = (identity.teacherName ?? "").trim();
  const phoneLine = (identity.phone ?? "").trim();

  const showSuccess = Boolean(isSuccess && successSnapshot);

  return (
    <main className={cn(ui.pageMain, "px-3 sm:px-4")}>
      <header className={cn(ui.header, "space-y-2")}>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          {businessLine || heUi.publicBooking.pageTitle}
        </h1>
        {teacherLine ? (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">{teacherLine}</p>
        ) : (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">{heUi.publicBooking.pageSubtitle}</p>
        )}
        {phoneLine ? (
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm" dir="ltr">
            {phoneLine}
          </p>
        ) : null}
        <p className="mt-2 max-w-prose text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-sm">
          {heUi.publicBooking.trustLine}
        </p>
      </header>

      <div className={cn(ui.pageStack, "space-y-4 sm:space-y-5")}>
        <div className="flex flex-col gap-3">
          {appointmentsLoadError ? (
            <DataLoadErrorBanner
              title={appointmentsLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retryAppointmentsLoad}
            />
          ) : null}
        </div>

        {showSuccess && successSnapshot ? (
          <PublicBookingSuccessPanel
            instructorPhone={phoneLine}
            slotStart={successSnapshot.slotStart}
            slotEnd={successSnapshot.slotEnd}
            onBookAnother={handleBookAnother}
          />
        ) : null}

        {!showSuccess ? (
          <>
            <section className={ui.section}>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
                {heUi.publicBooking.sectionDate}
              </h2>
              <div className={cn(ui.formCard, "space-y-3 p-3 sm:space-y-4 sm:p-4")}>
                {!bookingDataReady ? (
                  <BookingSectionSkeleton />
                ) : !availability.bookingEnabled ? (
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                    {heUi.publicBooking.bookingClosed}
                  </p>
                ) : (
                  <>
                    <div>
                      <label htmlFor="book-date" className={cn(ui.label, "text-xs sm:text-sm")}>
                        {heUi.publicBooking.dateLabel}
                      </label>
                      <input
                        id="book-date"
                        type="date"
                        className={cn(ui.input, "min-h-[2.75rem] text-xs sm:text-sm")}
                        min={todayLocalYmd()}
                        max={maxBookDateYmd}
                        value={selectedDate}
                        disabled={isSubmitting}
                        onChange={(e) => onDateChange(e.target.value)}
                      />
                    </div>

                    <BookingSlotPicker
                      availableSlots={availableSlots}
                      selectedSlotStart={selectedSlotStart}
                      onSelect={onSlotSelect}
                      disabled={isSubmitting}
                      emptyDescription={heUi.publicBooking.slotEmptyDescription}
                    />
                  </>
                )}
              </div>
            </section>

            <section className={ui.section}>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
                {heUi.publicBooking.sectionContact}
              </h2>
              <PublicBookingForm
                extraFields={publicBookingExtraFields}
                selectedSlot={selectedSlot}
                isSelectedSlotAvailable={isSelectedSlotAvailable}
                submitError={error}
                isSubmitting={isSubmitting}
                onSubmit={(input) => submitBooking(input)}
                className={!isReady ? "opacity-80" : ""}
              />
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
