import { getSupabaseDefaultTeacherId } from "@/core/config/supabaseEnv";
import type { AppointmentRecord } from "@/core/types/appointment";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from "@/core/types/settings";

/** Settings applied when loading demo data (driving school context). */
export const DEMO_SETTINGS: AppSettings = {
  ...DEFAULT_APP_SETTINGS,
  businessName: "DrivePro תל אביב — דמו למורה נהיגה",
  businessPhone: "050-7132456",
  defaultLessonPrice: 210,
  defaultLessonDurationMinutes: 45,
  reminderTemplate:
    "היי {{name}}, כאן {{business}}. תזכורת לשיעור נהיגה מחר ב-{{time}}. אם צריך לשנות שעה, אפשר לעדכן אותי ב-{{businessPhone}}.",
};

function id(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function at(
  reference: Date,
  dayOffset: number,
  hour: number,
  minute: number,
): string {
  const d = new Date(reference);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Realistic demo for driving instructors (Hebrew). Amounts in ₪.
 * Call with `new Date()` so relative dates stay current.
 */
export function buildDemoDataset(reference: Date = new Date()): {
  clients: Client[];
  appointments: AppointmentRecord[];
} {
  const now = reference.toISOString();
  const teacherId = getSupabaseDefaultTeacherId();

  const c1 = id();
  const c2 = id();
  const c3 = id();
  const c4 = id();
  const c5 = id();
  const c6 = id();
  const c7 = id();
  const c8 = id();

  const clients: Client[] = [
    {
      id: c1,
      teacherId,
      fullName: "נועה כהן",
      phone: "050-1234567",
      notes: "מתחילה, מעדיפה איסוף ליד הבית בגבעתיים.",
      customFields: { lessonCount: 8, transmissionType: "אוטומט" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c2,
      teacherId,
      fullName: "יונתן לוי",
      phone: "052-9876543",
      notes: "מבחן פנימי בעוד שבועיים.",
      customFields: { lessonCount: 28, transmissionType: "ידני" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c3,
      teacherId,
      fullName: "מיכל אברהם",
      phone: "054-5551212",
      notes: "",
      customFields: { lessonCount: 14, transmissionType: "אוטומט" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c4,
      teacherId,
      fullName: "דניאל מזרחי",
      phone: "053-4448899",
      notes: "שעות ערב בלבד.",
      customFields: { lessonCount: 22, transmissionType: "אוטומט" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c5,
      teacherId,
      fullName: "שירה גולדשטיין",
      phone: "050-7788990",
      notes: "רכב בית ספר בלבד.",
      customFields: { lessonCount: 5, transmissionType: "אוטומט" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c6,
      teacherId,
      fullName: "איתי רוזן",
      phone: "052-3344556",
      notes: "מכין לטסט בחולון.",
      customFields: { lessonCount: 32, transmissionType: "ידני" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c7,
      teacherId,
      fullName: "רוני שמש",
      phone: "054-2211009",
      notes: "שיעור כפול מדי פעם.",
      customFields: { lessonCount: 18, transmissionType: "אוטומט" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c8,
      teacherId,
      fullName: "גל פרידמן",
      phone: "052-6644221",
      notes: "לחץ קל לפני טסט, מעדיף שיעורי בוקר.",
      customFields: { lessonCount: 35, transmissionType: "ידני" },
      createdAt: now,
      updatedAt: now,
    },
  ];

  function ap(
    clientId: string,
    startAt: string,
    status: AppointmentStatus,
    payment: PaymentStatus,
    amount: number,
    pickup: string,
    car: string,
  ): AppointmentRecord {
    return {
      id: id(),
      teacherId,
      clientId,
      startAt,
      status,
      paymentStatus: payment,
      amount,
      customFields: {
        pickupLocation: pickup,
        carType: car,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  const appointments: AppointmentRecord[] = [
    ap(
      c1,
      at(reference, -5, 9, 0),
      AppointmentStatus.Completed,
      PaymentStatus.Paid,
      200,
      "רח׳ ביאליק 12, גבעתיים",
      "יונדאי i20",
    ),
    ap(
      c1,
      at(reference, 0, 17, 30),
      AppointmentStatus.Confirmed,
      PaymentStatus.Unpaid,
      200,
      "אצל התלמידה",
      "יונדאי i20",
    ),
    ap(
      c1,
      at(reference, 1, 8, 0),
      AppointmentStatus.Confirmed,
      PaymentStatus.Pending,
      200,
      "גבעתיים — ליד הפארק",
      "יונדאי i20",
    ),
    ap(
      c2,
      at(reference, -3, 18, 0),
      AppointmentStatus.Completed,
      PaymentStatus.Paid,
      220,
      "תחנת רכבת — ארלוזורוב",
      "פולו",
    ),
    ap(
      c2,
      at(reference, 2, 16, 0),
      AppointmentStatus.Confirmed,
      PaymentStatus.Partial,
      220,
      "חניון קניון",
      "פולו",
    ),
    ap(
      c3,
      at(reference, -1, 10, 30),
      AppointmentStatus.Completed,
      PaymentStatus.Paid,
      180,
      "רמת גן — רח׳ בורוכוב",
      "מאזדה 3",
    ),
    ap(
      c3,
      at(reference, 4, 11, 0),
      AppointmentStatus.Scheduled,
      PaymentStatus.Unpaid,
      180,
      "בורוכוב",
      "מאזדה 3",
    ),
    ap(
      c4,
      at(reference, 0, 14, 0),
      AppointmentStatus.Confirmed,
      PaymentStatus.Paid,
      200,
      "ת״א — כיכר רבין",
      "קיה ריו",
    ),
    ap(
      c5,
      at(reference, -7, 19, 0),
      AppointmentStatus.Completed,
      PaymentStatus.Paid,
      200,
      "פתח תקווה",
      "יונדאי i10",
    ),
    ap(
      c5,
      at(reference, 1, 9, 30),
      AppointmentStatus.Confirmed,
      PaymentStatus.Unpaid,
      200,
      "ליד בית הספר",
      "יונדאי i10",
    ),
    ap(
      c6,
      at(reference, -2, 7, 0),
      AppointmentStatus.Completed,
      PaymentStatus.Paid,
      240,
      "חולון — רח׳ סוקולוב",
      "סקודה",
    ),
    ap(
      c6,
      at(reference, 3, 8, 30),
      AppointmentStatus.Confirmed,
      PaymentStatus.Pending,
      240,
      "חולון",
      "סקודה",
    ),
    ap(
      c7,
      at(reference, -4, 17, 0),
      AppointmentStatus.Completed,
      PaymentStatus.Paid,
      200,
      "רמת השרון",
      "טויוטה קורולה",
    ),
    ap(
      c7,
      at(reference, 0, 20, 0),
      AppointmentStatus.Scheduled,
      PaymentStatus.Unpaid,
      200,
      "כביש החוף",
      "טויוטה קורולה",
    ),
    ap(
      c4,
      at(reference, 1, 12, 30),
      AppointmentStatus.Scheduled,
      PaymentStatus.Pending,
      210,
      "ת״א — כיכר רבין",
      "קיה ריו",
    ),
    ap(
      c8,
      at(reference, 1, 7, 30),
      AppointmentStatus.Scheduled,
      PaymentStatus.Unpaid,
      240,
      "ראשל״צ מערב",
      "מאזדה 2",
    ),
    ap(
      c8,
      at(reference, 3, 7, 30),
      AppointmentStatus.Confirmed,
      PaymentStatus.Partial,
      240,
      "ראשל״צ — תחנה מרכזית ישנה",
      "מאזדה 2",
    ),
    ap(
      c2,
      at(reference, 6, 10, 0),
      AppointmentStatus.Scheduled,
      PaymentStatus.Pending,
      220,
      "צומת הר שמואל",
      "פולו",
    ),
    ap(
      c4,
      at(reference, -2, 19, 0),
      AppointmentStatus.NoShow,
      PaymentStatus.Waived,
      200,
      "ת״א — אבן גבירול",
      "קיה ריו",
    ),
    ap(
      c6,
      at(reference, 5, 12, 30),
      AppointmentStatus.Scheduled,
      PaymentStatus.Unpaid,
      260,
      "חולון — קניון הזהב",
      "סקודה",
    ),
  ];

  return { clients, appointments };
}
