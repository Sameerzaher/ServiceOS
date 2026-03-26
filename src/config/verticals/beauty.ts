import {
  CustomFieldInputKind,
  type VerticalPreset,
} from "@/core/types/vertical";

/** Beauty / wellness vertical — generic clients & appointments. */
export const beautyVerticalPreset = {
  id: "beauty",
  slug: "beauty",
  labels: {
    student: "לקוח",
    students: "לקוחות",
    lesson: "טיפול",
    lessons: "טיפולים",
    addStudent: "הוספת לקוח",
    addLesson: "קביעת טיפול",
    editStudent: "עריכת לקוח",
    nextLesson: "טיפול הבא",
    skinProfile: "פרופיל עור",
    allergies: "רגישויות",
    room: "חדר",
    appTitle: "ניהול",
    appTagline:
      "לקוחות, תורים ותזכורות — נעים לנהל, קל לשמור על סדר.",
  },
  clientFields: [
    {
      key: "skinType",
      label: "סוג עור / שיער",
      kind: CustomFieldInputKind.Select,
      required: false,
      options: ["רגיל", "שמנוני", "יבש", "מעורב", "רגיש"] as const,
    },
    {
      key: "allergiesNotes",
      label: "אלרגיות והערות",
      kind: CustomFieldInputKind.TextArea,
      required: false,
    },
  ],
  appointmentFields: [
    {
      key: "treatmentNotes",
      label: "הערות לטיפול",
      kind: CustomFieldInputKind.TextArea,
      required: false,
    },
    {
      key: "preferredRoom",
      label: "חדר מועדף",
      kind: CustomFieldInputKind.Text,
      required: false,
    },
  ],
  defaultServices: [
    {
      name: "טיפול בסיסי (60 דקות)",
      duration: 60,
      price: 0,
    },
    {
      name: "טיפול מורחב (90 דקות)",
      duration: 90,
      price: 0,
    },
  ],
} satisfies VerticalPreset;

export type BeautyVerticalPreset = typeof beautyVerticalPreset;
