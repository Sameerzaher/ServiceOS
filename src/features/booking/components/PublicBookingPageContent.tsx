"use client";

import { useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { DataLoadErrorBanner, Spinner, ui } from "@/components/ui";
import { BookingSlotPicker } from "@/features/booking/components/BookingSlotPicker";
import { PublicBookingForm } from "@/features/booking/components/PublicBookingForm";
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

  const bookingDataReady = appointmentsReady;

  const businessLine = identity.businessName.trim();
  const teacherLine = identity.teacherName.trim();
  const phoneLine = identity.phone.trim();

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
        <section className={ui.section}>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">{heUi.publicBooking.sectionDate}</h2>
          <div className={cn(ui.formCard, "space-y-3 p-3 sm:space-y-4 sm:p-4")}>
            {!bookingDataReady ? (
              <div
                className="flex items-center gap-2 py-2 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm"
                role="status"
                aria-live="polite"
              >
                <Spinner className="size-4 border-neutral-300 border-t-neutral-700" />
                <span className="sr-only">{heUi.loading.ariaBusy}</span>
              </div>
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
                    className={cn(ui.input, "text-xs sm:text-sm")}
                    min={todayLocalYmd()}
                    max={maxBookDateYmd}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlotStart(null);
                      resetState();
                    }}
                  />
                </div>

                <BookingSlotPicker
                  availableSlots={availableSlots}
                  selectedSlotStart={selectedSlotStart}
                  onSelect={(slot) => {
                    setSelectedSlotStart(slot.slotStart);
                    resetState();
                  }}
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
            submitError={error}
            isSubmitting={isSubmitting}
            isSuccess={isSuccess}
            onSubmit={(input) => submitBooking(input)}
            className={!isReady ? "opacity-80" : ""}
          />
        </section>
      </div>
    </main>
  );
}
