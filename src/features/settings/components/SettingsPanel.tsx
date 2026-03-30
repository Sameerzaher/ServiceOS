"use client";

import { useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { Button, ui } from "@/components/ui";
import type { AvailabilitySettings } from "@/core/types/availability";
import type { ActivePreset, AppSettings } from "@/core/types/settings";
import { applyReminderTemplate } from "@/core/utils/reminderTemplate";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/AuthContext";

export interface SettingsPanelProps {
  settings: AppSettings;
  availabilitySettings: AvailabilitySettings;
  onSave: (
    next: AppSettings,
    nextAvailability: AvailabilitySettings,
  ) => Promise<boolean> | boolean;
}

const ACTIVE_PRESET_OPTIONS: ReadonlyArray<{
  value: ActivePreset;
  label: string;
}> = [
  {
    value: "driving_instructor",
    label: heUi.settings.activePresetDrivingInstructor,
  },
  {
    value: "cosmetic_clinic",
    label: heUi.settings.activePresetCosmeticClinic,
  },
];

export function SettingsPanel({
  settings,
  availabilitySettings,
  onSave,
}: SettingsPanelProps) {
  const { isAdmin } = useAuth();
  const [draft, setDraft] = useState(settings);
  const [bookingEnabled, setBookingEnabled] = useState(
    availabilitySettings.bookingEnabled,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);
  useEffect(() => {
    setBookingEnabled(availabilitySettings.bookingEnabled);
  }, [availabilitySettings.bookingEnabled]);

  const reminderPreview = useMemo(
    () =>
      applyReminderTemplate(draft.reminderTemplate, {
        name: heUi.settings.previewStudentName,
        time: heUi.settings.previewLessonTime,
        businessName:
          draft.businessName.trim() || heUi.settings.previewBusinessFallback,
        businessPhone:
          draft.businessPhone.trim() || heUi.settings.previewPhoneFallback,
      }),
    [
      draft.reminderTemplate,
      draft.businessName,
      draft.businessPhone,
    ],
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Business Info Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:mb-4 sm:text-lg">
          פרטי העסק
        </h2>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="settings-business" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.businessName}
            </label>
            <input
              id="settings-business"
              type="text"
              value={draft.businessName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, businessName: e.target.value }))
              }
              className={cn(ui.input, "text-xs sm:text-sm")}
              placeholder="השם שיופיע ללקוחות"
              autoComplete="organization"
            />
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.businessNameHint}
            </p>
          </div>

          <div>
            <label htmlFor="settings-teacher-name" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.teacherName}
            </label>
            <input
              id="settings-teacher-name"
              type="text"
              value={draft.teacherName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, teacherName: e.target.value }))
              }
              className={cn(ui.input, "text-xs sm:text-sm")}
              placeholder={heUi.settings.teacherNamePlaceholder}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="settings-business-phone" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.businessPhone}
            </label>
            <input
              id="settings-business-phone"
              type="tel"
              value={draft.businessPhone}
              onChange={(e) =>
                setDraft((d) => ({ ...d, businessPhone: e.target.value }))
              }
              className={cn(ui.input, "text-xs sm:text-sm")}
              inputMode="tel"
              autoComplete="tel"
              placeholder="050-0000000"
            />
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.businessPhoneHint}
            </p>
          </div>
        </div>
      </div>

      {/* Lesson Defaults Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:mb-4 sm:text-lg">
          הגדרות שיעורים
        </h2>
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor="settings-price" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.defaultLessonPrice}
            </label>
            <div className="relative">
              <input
                id="settings-price"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={draft.defaultLessonPrice === 0 ? "" : draft.defaultLessonPrice}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setDraft((d) => ({ ...d, defaultLessonPrice: 0 }));
                    return;
                  }
                  const n = Number.parseInt(v, 10);
                  setDraft((d) => ({
                    ...d,
                    defaultLessonPrice: Number.isFinite(n) ? Math.max(0, n) : 0,
                  }));
                }}
                className={cn(ui.input, "text-xs sm:text-sm")}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 sm:text-sm">
                ₪
              </span>
            </div>
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.defaultLessonPriceHint}
            </p>
          </div>

          <div>
            <label htmlFor="settings-duration" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.defaultLessonDuration}
            </label>
            <div className="relative">
              <input
                id="settings-duration"
                type="number"
                min={15}
                max={240}
                step={5}
                inputMode="numeric"
                value={draft.defaultLessonDurationMinutes}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = Number.parseInt(v, 10);
                  setDraft((d) => ({
                    ...d,
                    defaultLessonDurationMinutes: Number.isFinite(n)
                      ? Math.min(240, Math.max(15, n))
                      : d.defaultLessonDurationMinutes,
                  }));
                }}
                className={cn(ui.input, "text-xs sm:text-sm")}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 sm:text-sm">
                {"דק'"}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.defaultLessonDurationHint}
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4">
          <label htmlFor="settings-buffer" className={cn(ui.label, "text-xs sm:text-sm")}>
            {heUi.settings.lessonBuffer}
          </label>
          <div className="relative max-w-full sm:max-w-xs">
            <input
              id="settings-buffer"
              type="number"
              min={0}
              max={120}
              step={5}
              inputMode="numeric"
              value={draft.lessonBufferMinutes}
              onChange={(e) => {
                const v = e.target.value;
                const n = Number.parseInt(v, 10);
                setDraft((d) => ({
                  ...d,
                  lessonBufferMinutes: Number.isFinite(n)
                    ? Math.min(120, Math.max(0, n))
                    : d.lessonBufferMinutes,
                }));
              }}
              className={cn(ui.input, "text-xs sm:text-sm")}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 sm:text-sm">
              {"דק'"}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {heUi.settings.lessonBufferHint}
          </p>
        </div>
      </div>

      {/* Working Hours & Booking Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:mb-4 sm:text-lg">
          שעות עבודה והזמנות
        </h2>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20 sm:p-4">
            <label
              htmlFor="settings-booking-enabled"
              className="mb-2 flex items-center justify-between"
            >
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 sm:text-sm">
                {heUi.settings.bookingEnabled}
              </span>
              <input
                id="settings-booking-enabled"
                type="checkbox"
                checked={bookingEnabled}
                onChange={(e) => setBookingEnabled(e.target.checked)}
                className="size-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 sm:text-xs">{heUi.settings.bookingHint}</p>
          </div>

          <div>
            <p className={cn(ui.label, "text-xs sm:text-sm")}>{heUi.settings.workingHours}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="settings-working-start" className="mb-1 block text-[11px] text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {heUi.settings.workingHoursStart}
                </label>
                <input
                  id="settings-working-start"
                  type="time"
                  value={draft.workingHoursStart}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, workingHoursStart: e.target.value }))
                  }
                  className={cn(ui.input, "text-xs sm:text-sm")}
                />
              </div>
              <div>
                <label htmlFor="settings-working-end" className="mb-1 block text-[11px] text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {heUi.settings.workingHoursEnd}
                </label>
                <input
                  id="settings-working-end"
                  type="time"
                  value={draft.workingHoursEnd}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, workingHoursEnd: e.target.value }))
                  }
                  className={cn(ui.input, "text-xs sm:text-sm")}
                />
              </div>
            </div>
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">{heUi.settings.workingHoursHint}</p>
          </div>
        </div>
      </div>

      {/* Reminder Template Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:mb-4 sm:text-lg">
          תזכורות ללקוחות
        </h2>
        
        <div>
          <label htmlFor="settings-template" className={cn(ui.label, "text-xs sm:text-sm")}>
            {heUi.settings.reminderTemplate}
          </label>
          <textarea
            id="settings-template"
            value={draft.reminderTemplate}
            onChange={(e) =>
              setDraft((d) => ({ ...d, reminderTemplate: e.target.value }))
            }
            rows={4}
            className={cn(ui.input, "min-h-[6rem] resize-y font-mono text-xs sm:text-sm")}
          />
          <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {heUi.settings.reminderTemplateHint}
          </p>
          <div
            className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5 dark:border-emerald-900 dark:bg-emerald-950/20 sm:p-3"
            aria-live="polite"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-900/70 dark:text-emerald-400/70 sm:text-xs">
              {heUi.settings.reminderPreviewTitle}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-neutral-900 dark:text-neutral-100 sm:text-sm">
              {reminderPreview}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button - Sticky on Mobile */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 -mx-2 border-t border-neutral-200 bg-white/95 px-2 pb-3 pt-3 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95 sm:static sm:bottom-0 sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
        <Button
          type="button"
          variant="primary"
          className="w-full text-sm sm:w-auto"
          disabled={isSaving}
          aria-busy={isSaving}
          onClick={() => {
            if (isSaving) return;
            setIsSaving(true);
            const weekly = { ...availabilitySettings.weeklyAvailability };
            for (const day of Object.keys(weekly) as Array<keyof typeof weekly>) {
              weekly[day] = {
                ...weekly[day],
                startTime: draft.workingHoursStart,
                endTime: draft.workingHoursEnd,
              };
            }
            void (async () => {
              try {
                await onSave(draft, {
                  ...availabilitySettings,
                  bookingEnabled,
                  weeklyAvailability: weekly,
                });
              } finally {
                setIsSaving(false);
              }
            })();
          }}
        >
          {isSaving ? heUi.settings.saving : heUi.settings.save}
        </Button>
      </div>
    </div>
  );
}
