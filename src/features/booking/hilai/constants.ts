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

export const HILAI_NAILS_COPY = {
  subtitle: "קביעת תורים אונליין — בקלות, בנוחות, בלי הרבה מילים",
  trustA: "בוחרים טיפול, יום ושעה — ואנחנו דואגים לשאר",
  trustB: "בלי התעסקות, בלי בלבול — רק מה שצריך",
  sectionServices: "מה נרצה היום?",
  sectionServicesHint: "טיפול אחד לכל תור — רשמי בקצרה בהערות אם צריך משהו מיוחד",
  sectionDate: "מתי נוח לך?",
  sectionDateHint: "בוחרים תאריך ואז שעה מהרשימה",
  sectionContact: "איך נחזור אליך?",
  slotIntro: "שעות פנויות ליום שנבחר",
  serviceRequired: "נא לבחור טיפול מהרשימה.",
  submitCta: "קבעי תור",
} as const;
