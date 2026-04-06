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

export const HILAI_NAILS_COPY = {
  heroTitle: "Hilai Nails 💅",
  subtitle: "קביעת תורים אונליין בקלות ובנוחות",
  heroSupporting: "בחרי טיפול, יום ושעה — והכל מסודר ✨",
  trustA: "פשוט, מהיר ונוח",
  trustB: "בלי הודעות, בלי בלאגן",
  sectionServices: "בוחרים טיפול",
  sectionServicesHint: "לחצי על הכרטיס המתאים — אפשר לפרט בהערות",
  sectionDate: "מתי נוח לך?",
  sectionDateHint: "תאריך ואז שעה מהרשימה",
  sectionContact: "פרטים לחזרה",
  slotIntro: "שעות פנויות",
  serviceRequired: "נא לבחור טיפול מהרשימה.",
  submitCta: "קבעי תור",
} as const;
