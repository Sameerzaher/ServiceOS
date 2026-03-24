import type { AppointmentRecord } from "@/core/types/appointment";
import { PaymentStatus } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { isLocalCalendarDay } from "@/core/reminders/tomorrow";
import { isInLocalWeek } from "@/core/utils/week";

export function isPaidStatus(status: PaymentStatus): boolean {
  return status === PaymentStatus.Paid;
}

export function isDebtStatus(status: PaymentStatus): boolean {
  return (
    status === PaymentStatus.Unpaid ||
    status === PaymentStatus.Pending ||
    status === PaymentStatus.Partial
  );
}

export function sumAmount(
  rows: AppointmentRecord[],
  predicate: (a: AppointmentRecord) => boolean,
): number {
  return rows.reduce((sum, a) => {
    if (!predicate(a)) return sum;
    return sum + (a.amount ?? 0);
  }, 0);
}

export function sumPaidTotal(appointments: AppointmentRecord[]): number {
  return sumAmount(appointments, (a) => isPaidStatus(a.paymentStatus));
}

export function sumUnpaidDebt(appointments: AppointmentRecord[]): number {
  return sumAmount(appointments, (a) => isDebtStatus(a.paymentStatus));
}

export function sumClientDebt(
  appointments: AppointmentRecord[],
  clientId: string,
): number {
  return sumAmount(
    appointments,
    (a) =>
      a.clientId === clientId && isDebtStatus(a.paymentStatus),
  );
}

export function sumClientPaid(
  appointments: AppointmentRecord[],
  clientId: string,
): number {
  return sumAmount(
    appointments,
    (a) =>
      a.clientId === clientId && isPaidStatus(a.paymentStatus),
  );
}

/** Sum of `amount` for paid appointments that start on the same local day as `reference`. */
export function sumTodayPaidRevenue(
  appointments: AppointmentRecord[],
  reference: Date = new Date(),
): number {
  return sumAmount(
    appointments,
    (a) =>
      isPaidStatus(a.paymentStatus) &&
      isLocalCalendarDay(a.startAt, reference),
  );
}

/** Sum of lesson amounts marked as partial payment (still tracked as open balance). */
export function sumPartialAmount(appointments: AppointmentRecord[]): number {
  return sumAmount(
    appointments,
    (a) => a.paymentStatus === PaymentStatus.Partial,
  );
}

/** Paid revenue for lessons whose start falls in the current local calendar week (Sun–Sat). */
export function sumWeekPaidRevenue(
  appointments: AppointmentRecord[],
  reference: Date = new Date(),
): number {
  return sumAmount(
    appointments,
    (a) =>
      isPaidStatus(a.paymentStatus) && isInLocalWeek(a.startAt, reference),
  );
}

export interface ClientDebtRow {
  client: Client;
  debt: number;
}

/** Clients with positive debt, highest first (for dashboard lists). */
export function topClientsByDebt(
  clients: Client[],
  appointments: AppointmentRecord[],
  limit = 5,
): ClientDebtRow[] {
  return clients
    .map((c) => ({ client: c, debt: sumClientDebt(appointments, c.id) }))
    .filter((row) => row.debt > 0)
    .sort((a, b) => b.debt - a.debt)
    .slice(0, limit);
}

export function countClientsWithDebt(
  clients: Client[],
  appointments: AppointmentRecord[],
): number {
  return clients.filter((c) => sumClientDebt(appointments, c.id) > 0).length;
}
