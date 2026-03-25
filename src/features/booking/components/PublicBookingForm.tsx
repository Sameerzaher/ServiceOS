"use client";

import { type FormEvent, useMemo, useState } from "react";

import { Button, EmptyState, ui } from "@/components/ui";
import type { AvailableSlot } from "@/features/booking/utils/generateAvailableSlots";

export interface PublicBookingFormSubmitInput {
  fullName: string;
  phone: string;
  notes: string;
  slotStart: string;
  slotEnd: string;
  pickupLocation: string;
  carType: string;
}

export interface PublicBookingFormProps {
  selectedSlot: AvailableSlot | null;
  onSubmit: (input: PublicBookingFormSubmitInput) => Promise<boolean> | boolean;
  submitError?: string | null;
  className?: string;
}

interface FieldErrors {
  fullName?: string;
  phone?: string;
  slot?: string;
}

export function PublicBookingForm({
  selectedSlot,
  onSubmit,
  submitError = null,
  className,
}: PublicBookingFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [carType, setCarType] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedSlotLabel = useMemo(() => {
    if (!selectedSlot) return "";
    try {
      const fmt = new Intl.DateTimeFormat("he-IL", { timeStyle: "short" });
      return `${fmt.format(new Date(selectedSlot.slotStart))} - ${fmt.format(
        new Date(selectedSlot.slotEnd),
      )}`;
    } catch {
      return `${selectedSlot.slotStart} - ${selectedSlot.slotEnd}`;
    }
  }, [selectedSlot]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.fullName = "נא להזין שם מלא.";
    if (!phone.trim()) next.phone = "נא להזין מספר טלפון.";
    if (!selectedSlot) next.slot = "נא לבחור שעה פנויה לפני שליחת הבקשה.";
    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedSlot) return;

    setIsSubmitting(true);
    try {
      const ok = await onSubmit({
        fullName: fullName.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
        pickupLocation: pickupLocation.trim(),
        carType: carType.trim(),
      });
      if (!ok) return;
      setIsSuccess(true);
      setFullName("");
      setPhone("");
      setNotes("");
      setPickupLocation("");
      setCarType("");
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <EmptyState
        tone="muted"
        className="py-10"
        title="הבקשה נשלחה בהצלחה"
        description="תודה! נחזור אליכם בהקדם לאישור סופי של השיעור."
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`${ui.formCard} space-y-5 ${className ?? ""}`}
    >
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-3 py-2">
        <p className="text-xs text-neutral-600">השעה שנבחרה</p>
        <p className="mt-1 text-sm font-semibold text-neutral-900">
          {selectedSlotLabel || "לא נבחרה שעה עדיין"}
        </p>
        {errors.slot ? (
          <p className="mt-1 text-sm text-red-600">{errors.slot}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="public-booking-name" className={ui.label}>
          שם מלא
        </label>
        <input
          id="public-booking-name"
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setErrors((prev) => ({ ...prev, fullName: undefined }));
          }}
          className={ui.input}
          autoComplete="name"
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? "public-booking-name-error" : undefined}
        />
        {errors.fullName ? (
          <p id="public-booking-name-error" className="mt-1 text-sm text-red-600">
            {errors.fullName}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="public-booking-phone" className={ui.label}>
          טלפון
        </label>
        <input
          id="public-booking-phone"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setErrors((prev) => ({ ...prev, phone: undefined }));
          }}
          className={ui.input}
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "public-booking-phone-error" : undefined}
        />
        {errors.phone ? (
          <p id="public-booking-phone-error" className="mt-1 text-sm text-red-600">
            {errors.phone}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="public-booking-notes" className={ui.label}>
          הערות (אופציונלי)
        </label>
        <textarea
          id="public-booking-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={`${ui.input} min-h-[5.5rem] resize-y`}
        />
      </div>

      <div>
        <label htmlFor="public-booking-pickup" className={ui.label}>
          מיקום איסוף (אופציונלי)
        </label>
        <textarea
          id="public-booking-pickup"
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          rows={2}
          className={`${ui.input} min-h-[4rem] resize-y`}
          placeholder="למשל: רחוב, שכונה"
        />
      </div>

      <div>
        <label htmlFor="public-booking-car" className={ui.label}>
          סוג רכב (אופציונלי)
        </label>
        <input
          id="public-booking-car"
          type="text"
          value={carType}
          onChange={(e) => setCarType(e.target.value)}
          className={ui.input}
          placeholder="למשל: אוטומט / ידני"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? "שולח בקשה..." : "שליחת בקשת הזמנה"}
      </Button>
      {submitError ? (
        <p className="text-sm text-red-600" role="alert">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}

