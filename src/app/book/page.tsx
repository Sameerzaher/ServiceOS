"use client";

import { useMemo, useState } from "react";

import { ui } from "@/components/ui";
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

export default function PublicBookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => todayLocalYmd());
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);

  const { settings: availability } = useAvailabilitySettings();
  const { sortedAppointments } = useAppointments();
  const { isReady, isSuccess, error, submitBooking, resetState } = useBooking();

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

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>הזמנת שיעור נהיגה</h1>
        <p className={ui.pageSubtitle}>
          בחרו תאריך, שעה פנויה והשאירו פרטים. נחזור אליכם לאישור סופי.
        </p>
      </header>

      <div className={ui.pageStack}>
        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>בחירת תאריך</h2>
          <div className={`${ui.formCard} space-y-4`}>
            {!availability.bookingEnabled ? (
              <p className="text-sm text-neutral-700">
                כרגע ההזמנה הציבורית סגורה. אפשר לנסות שוב מאוחר יותר.
              </p>
            ) : (
              <>
                <div>
                  <label htmlFor="book-date" className={ui.label}>
                    תאריך מבוקש
                  </label>
                  <input
                    id="book-date"
                    type="date"
                    className={ui.input}
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
          <h2 className={ui.sectionHeading}>פרטי יצירת קשר</h2>
          <PublicBookingForm
            selectedSlot={selectedSlot}
            submitError={error}
            onSubmit={(input) => submitBooking(input)}
            className={!isReady ? "opacity-80" : ""}
          />
          {isSuccess ? (
            <p className="text-sm text-emerald-700" role="status">
              הבקשה נשמרה במערכת בהצלחה.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

