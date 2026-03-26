import {
  CustomFieldInputKind,
  type VerticalPreset,
} from "@/core/types/vertical";

/** Driving-school vertical — labels and fields for instructors / students. */
export const drivingVerticalPreset = {
  id: "driving",
  slug: "driving",
  labels: {
    student: "תלמיד",
    students: "תלמידים",
    lesson: "שיעור",
    lessons: "שיעורים",
    addStudent: "הוספת תלמיד",
    addLesson: "קביעת שיעור",
    editStudent: "עריכת תלמיד",
    nextLesson: "שיעור הבא",
    transmission: "תיבת הילוכים",
    pickup: "איסוף",
    vehicle: "רכב",
    /** First part of the main app title; combined with `students` in the shell. */
    appTitle: "ניהול",
    /** Hero subtitle on the home screen for this vertical. */
    appTagline:
      "יומן, לקוחות ותזכורות במקום אחד — מוכנים ליום עבודה אמיתי.",
  },
  clientFields: [
    {
      key: "lessonCount",
      label: "מספר שיעורים",
      kind: CustomFieldInputKind.Number,
      required: false,
    },
    {
      key: "transmissionType",
      label: "סוג הילוכים",
      kind: CustomFieldInputKind.Select,
      required: true,
      options: ["ידני", "אוטומט"] as const,
    },
  ],
  appointmentFields: [
    {
      key: "pickupLocation",
      label: "מיקום איסוף",
      kind: CustomFieldInputKind.TextArea,
      required: false,
    },
    {
      key: "carType",
      label: "סוג רכב",
      kind: CustomFieldInputKind.Text,
      required: false,
    },
  ],
  defaultServices: [
    {
      name: "שיעור נהיגה (40 דקות)",
      duration: 40,
      price: 0,
    },
    {
      name: "שיעור כפול (80 דקות)",
      duration: 80,
      price: 0,
    },
  ],
} satisfies VerticalPreset;

export type DrivingVerticalPreset = typeof drivingVerticalPreset;
