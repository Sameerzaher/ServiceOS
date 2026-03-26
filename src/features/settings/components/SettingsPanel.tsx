"use client";

import { useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { Button, ui } from "@/components/ui";
import type { AvailabilitySettings } from "@/core/types/availability";
import type { ActivePreset, AppSettings } from "@/core/types/settings";
import { applyReminderTemplate } from "@/core/utils/reminderTemplate";
import { cn } from "@/lib/cn";

export interface SettingsPanelProps {
  settings: AppSettings;
  availabilitySettings: AvailabilitySettings;
  onSave: (next: AppSettings, nextAvailability: AvailabilitySettings) => void;
}

const ACTIVE_PRESET_OPTIONS: ReadonlyArray<{
  value: ActivePreset;
  label: string;
}> = [
  { value: "driving", label: heUi.settings.activePresetDriving },
  { value: "fitness", label: heUi.settings.activePresetFitness },
  { value: "beauty", label: heUi.settings.activePresetBeauty },
];

export function SettingsPanel({
  settings,
  availabilitySettings,
  onSave,
}: SettingsPanelProps) {
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
    <div className={cn(ui.formCard, "space-y-5 sm:space-y-4")}>
      <p className="text-sm text-neutral-600">{heUi.settings.sectionHint}</p>

      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 shadow-sm shadow-emerald-900/5 ring-1 ring-emerald-900/[0.04]">
        <label htmlFor="settings-active-preset" className={ui.label}>
          {heUi.settings.businessType}
        </label>
        <select
          id="settings-active-preset"
          value={draft.activePreset}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              activePreset: e.target.value as ActivePreset,
            }))
          }
          className={ui.select}
        >
          {ACTIVE_PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-600">
          {heUi.settings.businessTypeHint}
        </p>
      </div>

      <div className="border-t border-neutral-200/70 pt-5">
        <label htmlFor="settings-business" className={ui.label}>
          {heUi.settings.businessName}
        </label>
        <input
          id="settings-business"
          type="text"
          value={draft.businessName}
          onChange={(e) =>
            setDraft((d) => ({ ...d, businessName: e.target.value }))
          }
          className={ui.input}
          placeholder="השם שיופיע ללקוחות — למשל: בית ספר לנהיגה «דרך בטוחה»"
          autoComplete="organization"
        />
        <p className="mt-1 text-xs text-neutral-500">
          {heUi.settings.businessNameHint}
        </p>
      </div>

      <div>
        <label htmlFor="settings-business-phone" className={ui.label}>
          {heUi.settings.businessPhone}
        </label>
        <input
          id="settings-business-phone"
          type="tel"
          value={draft.businessPhone}
          onChange={(e) =>
            setDraft((d) => ({ ...d, businessPhone: e.target.value }))
          }
          className={ui.input}
          inputMode="tel"
          autoComplete="tel"
          placeholder="050-0000000"
        />
        <p className="mt-1 text-xs text-neutral-500">
          {heUi.settings.businessPhoneHint}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="settings-price" className={ui.label}>
            {heUi.settings.defaultLessonPrice}
          </label>
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
            className={ui.input}
          />
          <p className="mt-1 text-xs text-neutral-500">
            {heUi.settings.defaultLessonPriceHint}
          </p>
        </div>

        <div>
          <label htmlFor="settings-duration" className={ui.label}>
            {heUi.settings.defaultLessonDuration}
          </label>
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
            className={ui.input}
          />
          <p className="mt-1 text-xs text-neutral-500">
            {heUi.settings.defaultLessonDurationHint}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="settings-buffer" className={ui.label}>
            {heUi.settings.lessonBuffer}
          </label>
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
            className={ui.input}
          />
          <p className="mt-1 text-xs text-neutral-500">
            {heUi.settings.lessonBufferHint}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 sm:p-4">
          <label
            htmlFor="settings-booking-enabled"
            className="mb-1.5 block text-sm font-medium text-neutral-800"
          >
            {heUi.settings.bookingEnabled}
          </label>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-neutral-600">{heUi.settings.bookingHint}</p>
            <input
              id="settings-booking-enabled"
              type="checkbox"
              checked={bookingEnabled}
              onChange={(e) => setBookingEnabled(e.target.checked)}
              className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
            />
          </div>
        </div>
      </div>

      <div>
        <p className={ui.label}>{heUi.settings.workingHours}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-working-start" className="mb-1 block text-sm text-neutral-700">
              {heUi.settings.workingHoursStart}
            </label>
            <input
              id="settings-working-start"
              type="time"
              value={draft.workingHoursStart}
              onChange={(e) =>
                setDraft((d) => ({ ...d, workingHoursStart: e.target.value }))
              }
              className={ui.input}
            />
          </div>
          <div>
            <label htmlFor="settings-working-end" className="mb-1 block text-sm text-neutral-700">
              {heUi.settings.workingHoursEnd}
            </label>
            <input
              id="settings-working-end"
              type="time"
              value={draft.workingHoursEnd}
              onChange={(e) =>
                setDraft((d) => ({ ...d, workingHoursEnd: e.target.value }))
              }
              className={ui.input}
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-neutral-500">{heUi.settings.workingHoursHint}</p>
      </div>

      <div>
        <label htmlFor="settings-template" className={ui.label}>
          {heUi.settings.reminderTemplate}
        </label>
        <textarea
          id="settings-template"
          value={draft.reminderTemplate}
          onChange={(e) =>
            setDraft((d) => ({ ...d, reminderTemplate: e.target.value }))
          }
          rows={4}
          className={cn(ui.input, "min-h-[6rem] resize-y")}
        />
        <p className="mt-1 text-xs text-neutral-500">
          {heUi.settings.reminderTemplateHint}
        </p>
        <div
          className="mt-3 rounded-xl border border-emerald-100/90 bg-emerald-50/60 p-3 ring-1 ring-emerald-900/[0.04]"
          aria-live="polite"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-900/70">
            {heUi.settings.reminderPreviewTitle}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-900">
            {reminderPreview}
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-2 border-t border-neutral-200/80 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
        <Button
          type="button"
          variant="primary"
          className="w-full sm:w-auto"
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
            onSave(draft, {
              ...availabilitySettings,
              bookingEnabled,
              weeklyAvailability: weekly,
            });
            window.setTimeout(() => setIsSaving(false), 0);
          }}
        >
          {isSaving ? heUi.settings.saving : heUi.settings.save}
        </Button>
      </div>
    </div>
  );
}
