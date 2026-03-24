/** App preferences stored locally (no backend yet). */
export interface AppSettings {
  /** Shown in header and exports; e.g. "בית ספר לנהיגה — דני". */
  businessName: string;
  /** Default amount (₪) for new lessons in the form. */
  defaultLessonPrice: number;
  /** Suggested lesson length (minutes); used for end-time hint in the form. */
  defaultLessonDurationMinutes: number;
  /** Business contact for reminders (WhatsApp / SMS). */
  businessPhone: string;
  /** WhatsApp reminder; supports {{name}}, {{time}}, {{business}}, {{businessPhone}}. */
  reminderTemplate: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  businessName: "",
  defaultLessonPrice: 0,
  defaultLessonDurationMinutes: 45,
  businessPhone: "",
  reminderTemplate: "היי {{name}}, תזכורת לשיעור מחר ב-{{time}}",
};

function clampDurationMinutes(n: number): number {
  return Math.min(240, Math.max(15, Math.round(n)));
}

function coerceNonNegativeNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.max(0, v);
  }
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", ".").trim());
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return fallback;
}

function coerceDurationMinutes(v: unknown, fallback: number): number {
  const n =
    typeof v === "number" && Number.isFinite(v)
      ? v
      : typeof v === "string"
        ? parseFloat(v.replace(",", ".").trim())
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  return clampDurationMinutes(n);
}

/**
 * Merges persisted or partial settings with defaults (migration-safe).
 */
export function normalizeAppSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_APP_SETTINGS };
  }
  const o = raw as Record<string, unknown>;
  const template =
    typeof o.reminderTemplate === "string"
      ? o.reminderTemplate.trim() || DEFAULT_APP_SETTINGS.reminderTemplate
      : DEFAULT_APP_SETTINGS.reminderTemplate;

  return {
    businessName: typeof o.businessName === "string" ? o.businessName : "",
    defaultLessonPrice: coerceNonNegativeNumber(
      o.defaultLessonPrice,
      DEFAULT_APP_SETTINGS.defaultLessonPrice,
    ),
    defaultLessonDurationMinutes: coerceDurationMinutes(
      o.defaultLessonDurationMinutes,
      DEFAULT_APP_SETTINGS.defaultLessonDurationMinutes,
    ),
    businessPhone: typeof o.businessPhone === "string" ? o.businessPhone : "",
    reminderTemplate: template,
  };
}
