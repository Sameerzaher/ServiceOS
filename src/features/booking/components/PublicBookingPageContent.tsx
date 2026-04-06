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
  HilaiNailsTrustChips,
  HilaiSectionDivider,
  HilaiSectionHeading,
  HilaiTrustMicroLine,
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
  }, [selectedDate, safeAvailability, sortedAppointments]);

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
    "min-h-screen bg-gradient-to-b from-[#fff5f9] via-white to-[#faf8ff] pb-8 pt-3 sm:pb-12 sm:pt-5";
  const hilaiCardClass =
    "rounded-2xl border border-pink-100/60 bg-white/95 shadow-lg shadow-pink-200/15";

  if (isHilai) {
    return (
      <main
        className={cn(hilaiMainClass, "px-4 sm:px-6")}
        dir="rtl"
        lang="he"
      >
        <div className="mx-auto flex max-w-md flex-col gap-7 sm:gap-10">
          <HilaiNailsHero
            primaryHook={HILAI_NAILS_COPY.primaryHook}
            instructionLine={HILAI_NAILS_COPY.instructionLine}
            title={HILAI_NAILS_COPY.heroTitle}
            subtitle={HILAI_NAILS_COPY.subtitle}
          />
          <HilaiTrustMicroLine text={HILAI_NAILS_COPY.trustMicro} />
          <HilaiNailsTrustChips
            line1={HILAI_NAILS_COPY.trust1}
            line2={HILAI_NAILS_COPY.trust2}
            line3={HILAI_NAILS_COPY.trust3}
          />
          <HilaiSectionDivider />

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
                  stepNumber={1}
                  selected={selectedService}
                  onSelect={(name) => setSelectedService(name)}
                  disabled={isSubmitting}
                />
              </section>

              <HilaiSectionDivider />

              <section className={cn(ui.section, "space-y-4 sm:space-y-5")}>
                <HilaiSectionHeading
                  title={HILAI_NAILS_COPY.sectionDate}
                  hint={HILAI_NAILS_COPY.sectionDateHint}
                  stepNumber={2}
                />
                <div
                  className={cn(
                    ui.formCard,
                    hilaiCardClass,
                    "space-y-5 p-4 sm:space-y-6 sm:p-6",
                    "overflow-hidden",
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
                          className="text-xs font-medium text-stone-500 sm:text-sm"
                        >
                          {heUi.publicBooking.dateLabel}
                        </label>
                        <input
                          id="book-date-hilai"
                          type="date"
                          className={cn(
                            ui.input,
                            "min-h-[3rem] w-full min-w-0 rounded-2xl border-pink-100/90 bg-[#fefcfb] text-sm",
                            "text-stone-800 shadow-inner shadow-stone-100/80",
                            "transition-all duration-200 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200/60",
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

              <HilaiSectionDivider />

              <section className={cn(ui.section, "space-y-4 sm:space-y-5")}>
                <HilaiSectionHeading title={HILAI_NAILS_COPY.sectionContact} stepNumber={3} />
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
                  className={cn(
                    !isReady ? "opacity-80" : "",
                    "pb-[calc(5.5rem_+_env(safe-area-inset-bottom))] sm:pb-0",
                  )}
                  formCardClassName={hilaiCardClass}
                  preflightError={servicePreflightError}
                  submitIdleLabel={HILAI_NAILS_COPY.submitCta}
                  ctaHelperText={HILAI_NAILS_COPY.ctaHelper}
                  visualTone="hilai"
                  stickyMobileCta
                  submitButtonClassName="!min-h-[3.85rem] !rounded-xl !border-pink-300/90 !bg-gradient-to-r !from-pink-400 !via-pink-500 !to-fuchsia-500 !text-[17px] !font-bold !text-white !shadow-[0_14px_44px_-14px_rgba(219,39,119,0.5)] !transition-all !duration-200 hover:!brightness-[1.06] hover:!shadow-[0_18px_48px_-16px_rgba(219,39,119,0.45)] active:!scale-[0.96] active:!shadow-[0_8px_24px_-12px_rgba(219,39,119,0.4)] focus-visible:!outline-pink-400/70 sm:!static sm:!min-h-[3.4rem] sm:!shadow-[0_12px_36px_-16px_rgba(219,39,119,0.42)]"
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
