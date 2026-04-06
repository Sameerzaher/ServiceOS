"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { heUi } from "@/config";
import { DataLoadErrorBanner } from "@/components/ui/DataLoadErrorBanner";
import { useToast } from "@/components/ui/Toast";
import { ui } from "@/components/ui/theme";
import { BookingSlotPicker } from "@/features/booking/components/BookingSlotPicker";
import {
  PublicBookingForm,
  type PublicBookingFormSubmitInput,
} from "@/features/booking/components/PublicBookingForm";
import { PublicBookingSuccessPanel } from "@/features/booking/components/PublicBookingSuccessPanel";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { usePublicTeacherAppointments } from "@/features/booking/hooks/usePublicTeacherAppointments";
import { generateAvailableSlots } from "@/features/booking/utils/generateAvailableSlots";
import {
  safeNormalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";
import type { BusinessType } from "@/core/types/teacher";
import { getVerticalPreset } from "@/config/verticals/registry";
import { HILAI_NAILS_COPY } from "@/features/booking/hilai/constants";
import {
  HilaiNailsHero,
  HilaiNailsServiceGrid,
  HilaiNailsTrustLines,
  HilaiSectionHeading,
} from "@/features/booking/components/hilai/HilaiNailsSections";
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

function BookingSectionSkeleton({ tone = "default" }: { tone?: "default" | "hilai" }) {
  const bar =
    tone === "hilai" ? "bg-rose-100/70 dark:bg-rose-900/35" : "bg-neutral-200 dark:bg-neutral-700";
  const slot =
    tone === "hilai" ? "bg-stone-100/80 dark:bg-rose-900/25" : "bg-neutral-200 dark:bg-neutral-700";
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      <div className={cn("h-4 w-40 animate-pulse rounded", bar)} />
      <div className={cn("h-10 w-full max-w-xs animate-pulse rounded-lg", bar)} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn("h-10 animate-pulse rounded-lg", slot)} />
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

export type PublicBookingPageVariant = "default" | "hilai-nails";

export interface PublicBookingPageContentProps {
  teacherId: string;
  businessType: BusinessType;
  identity: PublicBookingIdentity;
  availability: AvailabilitySettings;
  /** Branded layout for specific demo slugs (see `HILAI_NAILS_SLUG`). */
  variant?: PublicBookingPageVariant;
}

export function PublicBookingPageContent({
  teacherId,
  businessType,
  identity,
  availability,
  variant = "default",
}: PublicBookingPageContentProps) {
  const toast = useToast();
  const toastShownForError = useRef<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() => todayLocalYmd());
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [appointmentsReloadKey, setAppointmentsReloadKey] = useState(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [servicePreflightError, setServicePreflightError] = useState<string | null>(null);

  const isHilai = variant === "hilai-nails";

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
    submitBooking: submitBookingRaw,
    resetState,
  } = useBooking({
    teacherId,
    onPublicBookingSuccess: () =>
      setAppointmentsReloadKey((k) => k + 1),
  });

  const submitBooking = useCallback(
    async (input: PublicBookingFormSubmitInput) => {
      if (isHilai) {
        const svc = selectedService?.trim();
        if (!svc) {
          setServicePreflightError(HILAI_NAILS_COPY.serviceRequired);
          return false;
        }
        setServicePreflightError(null);
        return submitBookingRaw({
          ...input,
          bookingCustomFields: {
            ...input.bookingCustomFields,
            treatmentType: svc,
          },
        });
      }
      return submitBookingRaw(input);
    },
    [isHilai, selectedService, submitBookingRaw],
  );

  const safeAvailability = useMemo(
    () => safeNormalizeAvailabilitySettings(availability, teacherId),
    [availability, teacherId],
  );

  const availableSlots = useMemo(() => {
    const appts = Array.isArray(sortedAppointments) ? sortedAppointments : [];
    console.log("[PublicBookingPageContent] [TEMP] slot_generation_inputs", {
      teacherId,
      date: selectedDate,
      bookingEnabled: safeAvailability.bookingEnabled,
      daysAhead: safeAvailability.daysAhead,
      slotDurationMinutes: safeAvailability.slotDurationMinutes,
      appointmentCount: appts.length,
    });
    try {
      return generateAvailableSlots({
        date: selectedDate,
        availability: safeAvailability,
        existingAppointments: appts,
      });
    } catch (e) {
      console.error("[PublicBookingPageContent] slot_generation_failed", e);
      return [];
    }
  }, [selectedDate, safeAvailability, sortedAppointments, teacherId]);

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
    const da = safeAvailability.daysAhead;
    const ahead = Math.max(1, Number.isFinite(da) ? da : 30);
    return addLocalDaysYmd(new Date(), ahead - 1);
  }, [safeAvailability.daysAhead]);

  const publicBookingExtraFields = useMemo(
    () =>
      isHilai ? [] : getVerticalPreset(businessType).publicBookingFields,
    [businessType, isHilai],
  );

  useEffect(() => {
    if (selectedService) setServicePreflightError(null);
  }, [selectedService]);

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
    if (isHilai) setSelectedService(null);
  }, [resetState, isHilai]);

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

  const hilaiMainClass =
    "min-h-screen bg-gradient-to-b from-[#fdf8fa] via-[#fffcfd] to-[#faf8ff] pb-20 pt-3 sm:pb-24 sm:pt-6";
  const hilaiCardClass =
    "rounded-[1.75rem] border border-stone-200/40 bg-white/90 shadow-[0_16px_48px_-20px_rgba(170,130,145,0.18)] backdrop-blur-[2px]";

  if (isHilai) {
    const displayBusiness = businessLine || "Hilai Nails";
    return (
      <main
        className={cn(hilaiMainClass, "px-4 sm:px-6")}
        dir="rtl"
        lang="he"
      >
        <div className="mx-auto flex max-w-md flex-col gap-8 sm:gap-10">
          <HilaiNailsHero
            businessName={displayBusiness}
            subtitle={HILAI_NAILS_COPY.subtitle}
          />
          <HilaiNailsTrustLines
            lineA={HILAI_NAILS_COPY.trustA}
            lineB={HILAI_NAILS_COPY.trustB}
          />

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
              variant="hilai"
            />
          ) : null}

          {!showSuccess ? (
            <>
              <section className={cn(ui.section, "space-y-0")}>
                <HilaiNailsServiceGrid
                  heading={HILAI_NAILS_COPY.sectionServices}
                  hint={HILAI_NAILS_COPY.sectionServicesHint}
                  selected={selectedService}
                  onSelect={(name) => setSelectedService(name)}
                  disabled={isSubmitting}
                />
              </section>

              <section className={cn(ui.section, "space-y-4 sm:space-y-5")}>
                <HilaiSectionHeading
                  title={HILAI_NAILS_COPY.sectionDate}
                  hint={HILAI_NAILS_COPY.sectionDateHint}
                />
                <div
                  className={cn(
                    ui.formCard,
                    hilaiCardClass,
                    "space-y-5 p-4 sm:space-y-6 sm:p-6",
                  )}
                >
                  {!bookingDataReady ? (
                    <BookingSectionSkeleton tone="hilai" />
                  ) : !safeAvailability.bookingEnabled ? (
                    <p className="text-sm text-stone-600">{heUi.publicBooking.bookingClosed}</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label
                          htmlFor="book-date-hilai"
                          className="text-xs font-medium text-stone-600 sm:text-sm"
                        >
                          {heUi.publicBooking.dateLabel}
                        </label>
                        <input
                          id="book-date-hilai"
                          type="date"
                          className={cn(
                            ui.input,
                            "min-h-[3rem] w-full rounded-2xl border-stone-200/80 bg-white/95 text-sm",
                            "text-stone-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]",
                            "focus:border-rose-300/90 focus:outline-none focus:ring-2 focus:ring-rose-200/50",
                          )}
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
                        tone="hilai"
                        slotHeadingOverride={HILAI_NAILS_COPY.slotIntro}
                      />
                    </>
                  )}
                </div>
              </section>

              <section className={cn(ui.section, "space-y-4 sm:space-y-5")}>
                <HilaiSectionHeading title={HILAI_NAILS_COPY.sectionContact} />
                {phoneLine ? (
                  <p className="text-[13px] text-stone-500" dir="ltr">
                    {phoneLine}
                  </p>
                ) : null}
                <PublicBookingForm
                  extraFields={publicBookingExtraFields}
                  selectedSlot={selectedSlot}
                  isSelectedSlotAvailable={isSelectedSlotAvailable}
                  submitError={error}
                  isSubmitting={isSubmitting}
                  onSubmit={(input) => submitBooking(input)}
                  className={!isReady ? "opacity-80" : ""}
                  formCardClassName={hilaiCardClass}
                  preflightError={servicePreflightError}
                  submitIdleLabel={HILAI_NAILS_COPY.submitCta}
                  visualTone="hilai"
                  submitButtonClassName="!border-rose-300/90 !bg-gradient-to-r !from-[#e8a0b3] !via-[#d4a5c9] !to-[#c4b5d4] !text-white !shadow-[0_14px_40px_-18px_rgba(170,110,140,0.55)] hover:!brightness-[1.03] focus-visible:!outline-rose-300/80 active:!scale-[0.99] dark:!border-rose-400/50"
                />
              </section>
            </>
          ) : null}
        </div>
      </main>
    );
  }

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
                ) : !safeAvailability.bookingEnabled ? (
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
