"use client";

import { useEffect, useState } from "react";

import { heUi } from "@/config";
import { Button, ui } from "@/components/ui";
import type { AppSettings } from "@/core/types/settings";
import { cn } from "@/lib/cn";

export interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (next: AppSettings) => void;
}

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  return (
    <div className={cn(ui.formCard, "space-y-4")}>
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
          rows={3}
          className={cn(ui.input, "min-h-[5rem] resize-y")}
        />
        <p className="mt-1 text-xs text-neutral-500">
          {heUi.settings.reminderTemplateHint}
        </p>
      </div>

      <Button
        type="button"
        variant="primary"
        className="w-full sm:w-auto"
        onClick={() => onSave(draft)}
      >
        {heUi.settings.save}
      </Button>
    </div>
  );
}
