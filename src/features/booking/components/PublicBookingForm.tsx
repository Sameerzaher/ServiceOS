"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ui } from "@/components/ui/theme";
import type { AvailableSlot } from "@/features/booking/utils/generateAvailableSlots";
import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
} from "@/core/types/vertical";
import { cn } from "@/lib/cn";

export interface PublicBookingFormSubmitInput {
  fullName: string;
  phone: string;
  notes: string;
  slotStart: string;
  slotEnd: string;
  bookingCustomFields: Record<string, string>;
}

export interface PublicBookingFormProps {
  extraFields: readonly CustomFieldDefinition[];
  selectedSlot: AvailableSlot | null;
  /** False if the slot was taken / no longer in the generated list (race). */
  isSelectedSlotAvailable: boolean;
  onSubmit: (input: PublicBookingFormSubmitInput) => Promise<boolean> | boolean;
  submitError?: string | null;
  isSubmitting: boolean;
  className?: string;
}

interface FieldErrors {
  fullName?: string;
  phone?: string;
  slot?: string;
  extra?: Record<string, string>;
}

function emptyExtra(
  defs: readonly CustomFieldDefinition[],
): Record<string, string> {
  const o: Record<string, string> = {};
  for (const d of defs) o[d.key] = "";
  return o;
}

function PublicExtraFieldControl({
  def,
  value,
  disabled,
  onChange,
}: {
  def: CustomFieldDefinition;
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
}) {
  const selectPlaceholder = heUi.forms.selectPlaceholder;
  const id = `public-booking-extra-${def.key}`;

  switch (def.kind) {
    case CustomFieldInputKind.Text:
      return (
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          className={cn(ui.input, "text-xs sm:text-sm")}
          autoComplete="off"
        />
      );
    case CustomFieldInputKind.TextArea:
      return (
        <textarea
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          rows={3}
          className={cn(ui.input, "min-h-[5rem] resize-y text-xs sm:text-sm")}
          autoComplete="off"
        />
      );
    case CustomFieldInputKind.Select:
      return (
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          className={cn(ui.select, "text-xs sm:text-sm")}
        >
          <option value="">{selectPlaceholder}</option>
          {(def.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case CustomFieldInputKind.Number:
      return (
        <input
          id={id}
          type="number"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          min={0}
          step="any"
          className={cn(ui.input, "text-xs sm:text-sm")}
          inputMode="decimal"
        />
      );
    default:
      return null;
  }
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

function slotDateTimeValid(slot: AvailableSlot): boolean {
  if (!Number.isFinite(new Date(slot.slotStart).getTime())) return false;
  const date = toLocalDate(slot.slotStart);
  const time = toLocalTime(slot.slotStart);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  return true;
}

export function PublicBookingForm({
  extraFields,
  selectedSlot,
  isSelectedSlotAvailable,
  onSubmit,
  submitError = null,
  isSubmitting,
  className,
}: PublicBookingFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>(() =>
    emptyExtra(extraFields),
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const extraKey = useMemo(
    () => extraFields.map((d) => d.key).join("|"),
    [extraFields],
  );

  useEffect(() => {
    setExtra(emptyExtra(extraFields));
  }, [extraKey, extraFields]);

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
    const extraErr: Record<string, string> = {};

    const name = fullName.trim();
    if (!name) next.fullName = pb.errFullName;
    else if (name.length < 2) next.fullName = pb.errFullNameShort;

    const phoneTrim = phone.trim();
    if (!phoneTrim) next.phone = pb.errPhone;
    else if (phoneTrim.replace(/\D/g, "").length < 8) next.phone = pb.errPhoneInvalid;

    if (!selectedSlot) next.slot = pb.errSlot;
    else if (!slotDateTimeValid(selectedSlot)) next.slot = pb.errSlotInvalid;

    for (const def of extraFields) {
      if (!def.required) continue;
      const v = (extra[def.key] ?? "").trim();
      if (!v) {
        extraErr[def.key] = heUi.validation.fieldRequiredShort;
      }
    }
    if (Object.keys(extraErr).length > 0) next.extra = extraErr;

    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (isSubmitting) return;

    if (selectedSlot && !isSelectedSlotAvailable) {
      setErrors((prev) => ({
        ...prev,
        slot: heUi.publicBooking.errSlotTaken,
      }));
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedSlot) return;

    const bookingCustomFields: Record<string, string> = {};
    for (const def of extraFields) {
      const v = (extra[def.key] ?? "").trim();
      if (v) bookingCustomFields[def.key] = v;
    }

    const ok = await onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      slotStart: selectedSlot.slotStart,
      slotEnd: selectedSlot.slotEnd,
      bookingCustomFields,
    });
    if (ok) {
      setFullName("");
      setPhone("");
      setNotes("");
      setExtra(emptyExtra(extraFields));
      setErrors({});
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(ui.formCard, "space-y-4 p-3 sm:space-y-5 sm:p-4", className)}
    >
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <p className="text-[10px] text-neutral-600 dark:text-neutral-400 sm:text-xs">
          {heUi.publicBooking.selectedSlotLabel}
        </p>
        <p className="mt-1 text-xs font-semibold text-neutral-900 dark:text-neutral-100 sm:text-sm">
          {selectedSlotLabel || heUi.publicBooking.noSlotSelected}
        </p>
        {errors.slot ? (
          <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.slot}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="public-booking-name" className={cn(ui.label, "text-xs sm:text-sm")}>
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
          className={cn(ui.input, "text-xs sm:text-sm")}
          autoComplete="name"
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? "public-booking-name-error" : undefined}
        />
        {errors.fullName ? (
          <p id="public-booking-name-error" className="mt-1 text-xs text-red-600 sm:text-sm">
            {errors.fullName}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="public-booking-phone" className={cn(ui.label, "text-xs sm:text-sm")}>
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
          className={cn(ui.input, "text-xs sm:text-sm")}
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "public-booking-phone-error" : undefined}
        />
        {errors.phone ? (
          <p id="public-booking-phone-error" className="mt-1 text-xs text-red-600 sm:text-sm">
            {errors.phone}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="public-booking-notes" className={cn(ui.label, "text-xs sm:text-sm")}>
          {heUi.publicBooking.notesLabel}
        </label>
        <textarea
          id="public-booking-notes"
          value={notes}
          disabled={isSubmitting}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={cn(ui.input, "min-h-[5.5rem] resize-y text-xs sm:text-sm")}
        />
      </div>

      {extraFields.map((def) => (
        <div key={def.key}>
          <label htmlFor={`public-booking-extra-${def.key}`} className={cn(ui.label, "text-xs sm:text-sm")}>
            {def.label}
            {def.required ? (
              <span className="text-red-600" aria-hidden>
                {" "}
                *
              </span>
            ) : null}
          </label>
          <PublicExtraFieldControl
            def={def}
            value={extra[def.key] ?? ""}
            disabled={isSubmitting}
            onChange={(next) => {
              setExtra((prev) => ({ ...prev, [def.key]: next }));
              setErrors((prev) => {
                const ex = prev.extra ? { ...prev.extra } : undefined;
                if (ex && def.key in ex) delete ex[def.key];
                return {
                  ...prev,
                  extra:
                    ex && Object.keys(ex).length > 0 ? ex : undefined,
                };
              });
            }}
          />
          {errors.extra?.[def.key] ? (
            <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.extra[def.key]}</p>
          ) : null}
        </div>
      ))}

      <Button
        type="submit"
        variant="primary"
        className="w-full text-xs sm:text-sm"
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
        <p className="text-xs text-red-600 sm:text-sm" role="alert">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
