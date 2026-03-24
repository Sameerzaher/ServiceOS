/** App preferences stored locally (no backend yet). */
export interface AppSettings {
  /** Shown in header and exports; e.g. "בית ספר לנהיגה — דני". */
  businessName: string;
  /** Default amount (₪) for new lessons in the form. */
  defaultLessonPrice: number;
  /** WhatsApp reminder; supports {{name}} and {{time}}. */
  reminderTemplate: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  businessName: "",
  defaultLessonPrice: 0,
  reminderTemplate: "היי {{name}}, תזכורת לשיעור מחר ב-{{time}}",
};
