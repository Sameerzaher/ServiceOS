import { paymentStatusLabel } from "@/config";
import type { AppointmentRecord } from "@/core/types/appointment";
import { AppointmentStatus } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { downloadCsv } from "@/core/utils/csv";

function stamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function exportStudentsCsv(clients: Client[], prefix = "תלמידים"): void {
  const headers = ["מזהה", "שם מלא", "טלפון", "הערות", "נוצר"];
  const rows = clients.map((c) => [
    c.id,
    c.fullName,
    c.phone,
    c.notes.replace(/\r?\n/g, " "),
    c.createdAt,
  ]);
  downloadCsv(`${prefix}-${stamp()}`, headers, rows);
}

export function exportLessonsCsv(
  appointments: AppointmentRecord[],
  clients: Client[],
): void {
  const byId = new Map(clients.map((c) => [c.id, c.fullName]));
  const headers = [
    "מזהה",
    "תלמיד",
    "תאריך ושעה",
    "סטטוס שיעור",
    "תשלום",
    "סכום (₪)",
  ];
  const rows = appointments.map((a) => [
    a.id,
    byId.get(a.clientId) ?? a.clientId,
    a.startAt,
    String(a.status ?? AppointmentStatus.Scheduled),
    paymentStatusLabel(a.paymentStatus),
    String(a.amount ?? 0),
  ]);
  downloadCsv(`שיעורים-${stamp()}`, headers, rows);
}
