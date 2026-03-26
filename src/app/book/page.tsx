"use client";

import { useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { DataLoadErrorBanner, ui } from "@/components/ui";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { BookingSlotPicker } from "@/features/booking/components/BookingSlotPicker";
import { PublicBookingForm } from "@/features/booking/components/PublicBookingForm";
import { useAvailabilitySettings } from "@/features/booking/hooks/useAvailabilitySettings";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { generateAvailableSlots } from "@/features/booking/utils/generateAvailableSlots";

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

export default function PublicBookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => todayLocalYmd());
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [appointmentsReloadKey, setAppointmentsReloadKey] = useState(0);

  const {
    settings: availability,
    isReady: availabilityReady,
    loadError: availabilityLoadError,
    syncError: availabilitySyncError,
    retryLoad: retryAvailabilityLoad,
    retrySync: retryAvailabilitySync,
  } = useAvailabilitySettings();
  const {
    sortedAppointments,
    isReady: appointmentsReady,
    loadError: appointmentsLoadError,
    syncError: appointmentsSyncError,
    retryLoad: retryAppointmentsLoad,
    retrySync: retryAppointmentsSync,
  } = useAppointments(appointmentsReloadKey);
  const { isReady, error, submitBooking, resetState } = useBooking({
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

  const bookingDataReady = availabilityReady && appointmentsReady;

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{heUi.publicBooking.pageTitle}</h1>
        <p className={ui.pageSubtitle}>{heUi.publicBooking.pageSubtitle}</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600">
          {heUi.publicBooking.trustLine}
        </p>
      </header>

      <div className={ui.pageStack}>
        <div className="flex flex-col gap-3">
          {availabilityLoadError ? (
            <DataLoadErrorBanner
              title={availabilityLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retryAvailabilityLoad}
            />
          ) : null}
          {availabilitySyncError ? (
            <DataLoadErrorBanner
              title={availabilitySyncError}
              description={heUi.data.syncFailedHint}
              onRetry={retryAvailabilitySync}
            />
          ) : null}
          {appointmentsLoadError ? (
            <DataLoadErrorBanner
              title={appointmentsLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retryAppointmentsLoad}
            />
          ) : null}
          {appointmentsSyncError ? (
            <DataLoadErrorBanner
              title={appointmentsSyncError}
              description={heUi.data.syncFailedHint}
              onRetry={retryAppointmentsSync}
            />
          ) : null}
        </div>
        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>{heUi.publicBooking.sectionDate}</h2>
          <div className={`${ui.formCard} space-y-4`}>
            {!bookingDataReady ? (
              <p className="text-sm text-neutral-600">{heUi.loading.default}</p>
            ) : !availability.bookingEnabled ? (
              <p className="text-sm text-neutral-700">
                {heUi.publicBooking.bookingClosed}
              </p>
            ) : (
              <>
                <div>
                  <label htmlFor="book-date" className={ui.label}>
                    {heUi.publicBooking.dateLabel}
                  </label>
                  <input
                    id="book-date"
                    type="date"
                    className={ui.input}
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
          <h2 className={ui.sectionHeading}>
            {heUi.publicBooking.sectionContact}
          </h2>
          <PublicBookingForm
            selectedSlot={selectedSlot}
            submitError={error}
            onSubmit={(input) => submitBooking(input)}
            className={!isReady ? "opacity-80" : ""}
          />
        </section>
      </div>
    </main>
  );
}

