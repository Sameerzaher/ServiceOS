"use client";

import { type FormEvent, useMemo, useState } from "react";

import { heUi } from "@/config";
import { Button, EmptyState, Spinner, ui } from "@/components/ui";
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
  isSubmitting: boolean;
  isSuccess: boolean;
  className?: string;
}

interface FieldErrors {
  fullName?: string;
  phone?: string;
  slot?: string;
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

/** Validates date (YYYY-MM-DD) + time (HH:mm) derived from the selected slot. */
function slotDateTimeValid(slot: AvailableSlot): boolean {
  if (!Number.isFinite(new Date(slot.slotStart).getTime())) return false;
  const date = toLocalDate(slot.slotStart);
  const time = toLocalTime(slot.slotStart);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  return true;
}

export function PublicBookingForm({
  selectedSlot,
  onSubmit,
  submitError = null,
  isSubmitting,
  isSuccess,
  className,
}: PublicBookingFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [carType, setCarType] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

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
    const pb = heUi.publicBooking;
    const next: FieldErrors = {};

    const name = fullName.trim();
    if (!name) next.fullName = pb.errFullName;
    else if (name.length < 2) next.fullName = pb.errFullNameShort;

    const phoneTrim = phone.trim();
    if (!phoneTrim) next.phone = pb.errPhone;
    else if (phoneTrim.replace(/\D/g, "").length < 8) next.phone = pb.errPhoneInvalid;

    if (!selectedSlot) next.slot = pb.errSlot;
    else if (!slotDateTimeValid(selectedSlot)) next.slot = pb.errSlotInvalid;

    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedSlot) return;

    const ok = await onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      slotStart: selectedSlot.slotStart,
      slotEnd: selectedSlot.slotEnd,
      pickupLocation: pickupLocation.trim(),
      carType: carType.trim(),
    });
    if (ok) {
      setFullName("");
      setPhone("");
      setNotes("");
      setPickupLocation("");
      setCarType("");
      setErrors({});
    }
  }

  if (isSuccess) {
    const pb = heUi.publicBooking;
    return (
      <EmptyState
        tone="muted"
        className="py-10"
        title={pb.successTitle}
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
        <p className="text-xs text-neutral-600">
          {heUi.publicBooking.selectedSlotLabel}
        </p>
        <p className="mt-1 text-sm font-semibold text-neutral-900">
          {selectedSlotLabel || heUi.publicBooking.noSlotSelected}
        </p>
        {errors.slot ? (
          <p className="mt-1 text-sm text-red-600">{errors.slot}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="public-booking-name" className={ui.label}>
          {heUi.publicBooking.fullNameLabel}
        </label>
        <input
          id="public-booking-name"
          type="text"
          value={fullName}
          disabled={isSubmitting}
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
          {heUi.publicBooking.phoneLabel}
        </label>
        <input
          id="public-booking-phone"
          type="tel"
          value={phone}
          disabled={isSubmitting}
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
          {heUi.publicBooking.notesLabel}
        </label>
        <textarea
          id="public-booking-notes"
          value={notes}
          disabled={isSubmitting}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={`${ui.input} min-h-[5.5rem] resize-y`}
        />
      </div>

      <div>
        <label htmlFor="public-booking-pickup" className={ui.label}>
          {heUi.publicBooking.pickupLabel}
        </label>
        <textarea
          id="public-booking-pickup"
          value={pickupLocation}
          disabled={isSubmitting}
          onChange={(e) => setPickupLocation(e.target.value)}
          rows={2}
          className={`${ui.input} min-h-[4rem] resize-y`}
          placeholder={heUi.publicBooking.pickupPlaceholder}
        />
      </div>

      <div>
        <label htmlFor="public-booking-car" className={ui.label}>
          {heUi.publicBooking.carLabel}
        </label>
        <input
          id="public-booking-car"
          type="text"
          value={carType}
          disabled={isSubmitting}
          onChange={(e) => setCarType(e.target.value)}
          className={ui.input}
          placeholder={heUi.publicBooking.carPlaceholder}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner className="size-4 border-white/40 border-t-white" />
            {heUi.publicBooking.submitSubmitting}
          </span>
        ) : (
          heUi.publicBooking.submitIdle
        )}
      </Button>
      {submitError ? (
        <p className="text-sm text-red-600" role="alert">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
