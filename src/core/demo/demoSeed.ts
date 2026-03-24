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
  businessName: "בית ספר לנהיגה — הדגמה",
  defaultLessonPrice: 200,
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

  const c1 = id();
  const c2 = id();
  const c3 = id();
  const c4 = id();
  const c5 = id();
  const c6 = id();
  const c7 = id();

  const clients: Client[] = [
    {
      id: c1,
      fullName: "נועה כהן",
      phone: "050-1234567",
      notes: "מתחילה, מעדיפה איסוף ליד הבית בגבעתיים.",
      customFields: { lessonCount: 8, transmissionType: "אוטומט" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c2,
      fullName: "יונתן לוי",
      phone: "052-9876543",
      notes: "מבחן פנימי בעוד שבועיים.",
      customFields: { lessonCount: 28, transmissionType: "ידני" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c3,
      fullName: "מיכל אברהם",
      phone: "054-5551212",
      notes: "",
      customFields: { lessonCount: 14, transmissionType: "אוטומט" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c4,
      fullName: "דניאל מזרחי",
      phone: "053-4448899",
      notes: "שעות ערב בלבד.",
      customFields: { lessonCount: 22, transmissionType: "אוטומט" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c5,
      fullName: "שירה גולדשטיין",
      phone: "050-7788990",
      notes: "רכב בית ספר בלבד.",
      customFields: { lessonCount: 5, transmissionType: "אוטומט" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c6,
      fullName: "איתי רוזן",
      phone: "052-3344556",
      notes: "מכין לטסט בחולון.",
      customFields: { lessonCount: 32, transmissionType: "ידני" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: c7,
      fullName: "רוני שמש",
      phone: "054-2211009",
      notes: "שיעור כפול מדי פעם.",
      customFields: { lessonCount: 18, transmissionType: "אוטומט" },
      createdAt: now,
      updatedAt: now,
    },
  ];

  function ap(
    clientId: string,
    startAt: string,
    payment: PaymentStatus,
    amount: number,
    pickup: string,
    car: string,
  ): AppointmentRecord {
    return {
      id: id(),
      clientId,
      startAt,
      status: AppointmentStatus.Scheduled,
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
      PaymentStatus.Paid,
      200,
      "רח׳ ביאליק 12, גבעתיים",
      "יונדאי i20",
    ),
    ap(
      c1,
      at(reference, 0, 17, 30),
      PaymentStatus.Unpaid,
      200,
      "אצל התלמידה",
      "יונדאי i20",
    ),
    ap(
      c1,
      at(reference, 1, 8, 0),
      PaymentStatus.Pending,
      200,
      "גבעתיים — ליד הפארק",
      "יונדאי i20",
    ),
    ap(
      c2,
      at(reference, -3, 18, 0),
      PaymentStatus.Paid,
      220,
      "תחנת רכבת — ארלוזורוב",
      "פולו",
    ),
    ap(
      c2,
      at(reference, 2, 16, 0),
      PaymentStatus.Partial,
      220,
      "חניון קניון",
      "פולו",
    ),
    ap(
      c3,
      at(reference, -1, 10, 30),
      PaymentStatus.Paid,
      180,
      "רמת גן — רח׳ בורוכוב",
      "מאזדה 3",
    ),
    ap(
      c3,
      at(reference, 4, 11, 0),
      PaymentStatus.Unpaid,
      180,
      "בורוכוב",
      "מאזדה 3",
    ),
    ap(
      c4,
      at(reference, 0, 14, 0),
      PaymentStatus.Paid,
      200,
      "ת״א — כיכר רבין",
      "קיה ריו",
    ),
    ap(
      c5,
      at(reference, -7, 19, 0),
      PaymentStatus.Paid,
      200,
      "פתח תקווה",
      "יונדאי i10",
    ),
    ap(
      c5,
      at(reference, 1, 9, 30),
      PaymentStatus.Unpaid,
      200,
      "ליד בית הספר",
      "יונדאי i10",
    ),
    ap(
      c6,
      at(reference, -2, 7, 0),
      PaymentStatus.Paid,
      240,
      "חולון — רח׳ סוקולוב",
      "סקודה",
    ),
    ap(
      c6,
      at(reference, 3, 8, 30),
      PaymentStatus.Pending,
      240,
      "חולון",
      "סקודה",
    ),
    ap(
      c7,
      at(reference, -4, 17, 0),
      PaymentStatus.Paid,
      200,
      "רמת השרון",
      "טויוטה קורולה",
    ),
    ap(
      c7,
      at(reference, 0, 20, 0),
      PaymentStatus.Unpaid,
      200,
      "כביש החוף",
      "טויוטה קורולה",
    ),
    ap(
      c2,
      at(reference, 6, 10, 0),
      PaymentStatus.Pending,
      220,
      "צומת הר שמואל",
      "פולו",
    ),
  ];

  return { clients, appointments };
}
