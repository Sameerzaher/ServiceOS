/** Public booking slug for the Hilai Nails demo tenant. */
export const HILAI_NAILS_SLUG = "hilai-nails" as const;

export const HILAI_NAILS_SERVICES: readonly string[] = [
  "מניקור",
  "מבנה אנטומי",
  "בנייה בטיפסים הפוכים",
  "חיזוק בג׳ל",
  "תיקון ציפורן",
  "קישוטים",
] as const;

/** Emoji per service — aligned with `HILAI_NAILS_SERVICES` order */
export const HILAI_SERVICE_EMOJI: Record<string, string> = {
  מניקור: "💅",
  "מבנה אנטומי": "✨",
  "בנייה בטיפסים הפוכים": "🌸",
  "חיזוק בג׳ל": "💎",
  "תיקון ציפורן": "🩷",
  קישוטים: "✨",
};

/** Conversion copy — Hebrew only except brand name */
export const HILAI_NAILS_COPY = {
  /** Dominant hook — two lines, shown first (use \n for break) */
  primaryHook: "קבעי תור בקלות 💅\nבלי הודעות, בלי בלאגן",
  instructionLine: "בחרי טיפול כדי להתחיל 👇",
  heroTitle: "Hilai Nails 💅",
  subtitle: "קביעת תורים אונליין בקלות ובנוחות",
  /** Single micro trust line (under hero) */
  trustMicro: "לקוחות קובעות תור לבד בלי התעסקות",
  trust1: "פשוט, מהיר ונוח ✨",
  trust2: "אישור מהיר מהסטודיו",
  trust3: "בלי התעסקות בוואטסאפ",
  sectionServices: "בחרי טיפול",
  sectionServicesHint: "תלחצי על טיפול כדי להמשיך",
  sectionDate: "בחרי יום ושעה",
  sectionDateHint: "קודם תאריך, אחר כך שעה מהרשימה",
  sectionContact: "פרטים לאישור",
  slotIntro: "שעות פנויות",
  serviceRequired: "נא לבחור טיפול מהרשימה.",
  submitCta: "קבעי תור",
  ctaHelper: "תוך כמה שניות וזה מסודר ✔",
} as const;
