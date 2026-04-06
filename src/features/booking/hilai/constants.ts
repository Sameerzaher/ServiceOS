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

/** Conversion-focused copy — Hebrew only except brand name */
export const HILAI_NAILS_COPY = {
  heroTitle: "Hilai Nails 💅",
  subtitle: "קביעת תורים אונליין בקלות ובנוחות",
  emotionalHook: "קבעי תור בלי הודעות, בלי בלאגן ✨",
  instructionLine: "בחרי טיפול כדי להתחיל 👇",
  trust1: "פשוט, מהיר ונוח",
  trust2: "לקוחות קובעות תור לבד",
  trust3: "בלי התעסקות בוואטסאפ",
  sectionServices: "בחרי טיפול",
  sectionServicesHint: "תלחצי על טיפול כדי להמשיך",
  sectionDate: "יום ושעה",
  sectionDateHint: "עכשיו בחרי יום ושעה שמתאימים לך",
  sectionContact: "פרטים לאישור",
  slotIntro: "שעות פנויות",
  serviceRequired: "נא לבחור טיפול מהרשימה.",
  submitCta: "קבעי תור",
  ctaHelper: "תוך כמה שניות וזה מסודר ✔",
} as const;
