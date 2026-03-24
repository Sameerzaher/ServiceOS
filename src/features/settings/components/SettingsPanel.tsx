"use client";

import { useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { Button, ui } from "@/components/ui";
import type { AppSettings } from "@/core/types/settings";
import { applyReminderTemplate } from "@/core/utils/reminderTemplate";
import { cn } from "@/lib/cn";

export interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (next: AppSettings) => void;
}

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

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

      <div>
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
          placeholder="למשל: בית ספר לנהיגה"
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
          className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50/90 p-3"
          aria-live="polite"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
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
            onSave(draft);
            window.setTimeout(() => setIsSaving(false), 0);
          }}
        >
          {isSaving ? heUi.settings.saving : heUi.settings.save}
        </Button>
      </div>
    </div>
  );
}
