import {
  CustomFieldInputKind,
  type VerticalPreset,
} from "@/core/types/vertical";

/** Fitness / personal training vertical — generic clients & sessions. */
export const fitnessVerticalPreset = {
  id: "fitness",
  slug: "fitness",
  labels: {
    student: "מתאמן",
    students: "מתאמנים",
    lesson: "אימון",
    lessons: "אימונים",
    addStudent: "הוסף מתאמן",
    addLesson: "קבע אימון",
    editStudent: "ערוך מתאמן",
    nextLesson: "אימון הבא",
    membership: "מנוי",
    goal: "מטרת אימון",
    trainingArea: "אזור אימון",
    appTitle: "ניהול",
    appTagline:
      "מעקב אחר מתאמנים ואימונים — הכל נשמר מקומית בדפדפן.",
  },
  clientFields: [
    {
      key: "membershipType",
      label: "סוג מנוי",
      kind: CustomFieldInputKind.Select,
      required: false,
      options: ["חודשי", "רב־עונתי", "אימון בודד"] as const,
    },
    {
      key: "fitnessGoal",
      label: "מטרה / הערות",
      kind: CustomFieldInputKind.TextArea,
      required: false,
    },
  ],
  appointmentFields: [
    {
      key: "trainingFocus",
      label: "מיקוד באימון",
      kind: CustomFieldInputKind.TextArea,
      required: false,
    },
    {
      key: "gymArea",
      label: "אזור במתחם",
      kind: CustomFieldInputKind.Text,
      required: false,
    },
  ],
  defaultServices: [
    {
      name: "אימון אישי (60 דקות)",
      duration: 60,
      price: 0,
    },
    {
      name: "אימון זוגי (60 דקות)",
      duration: 60,
      price: 0,
    },
  ],
} satisfies VerticalPreset;

export type FitnessVerticalPreset = typeof fitnessVerticalPreset;
