import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { isDebtStatus, isPaidStatus } from "@/core/utils/insights";
import {
  matchesDateFilter,
  type AppointmentDateFilter,
} from "@/core/utils/dateRange";

export type PaymentFilter = "all" | "paid" | "unpaid";
export type AppointmentSort = "date" | "name";

export function filterAppointments(
  rows: readonly AppointmentRecord[],
  opts: {
    dateFilter: AppointmentDateFilter;
    paymentFilter: PaymentFilter;
  },
): AppointmentRecord[] {
  return rows.filter((a) => {
    if (!matchesDateFilter(a.startAt, opts.dateFilter)) return false;
    if (opts.paymentFilter === "paid" && !isPaidStatus(a.paymentStatus)) {
      return false;
    }
    if (opts.paymentFilter === "unpaid" && !isDebtStatus(a.paymentStatus)) {
      return false;
    }
    return true;
  });
}

export function sortAppointments(
  rows: readonly AppointmentRecord[],
  sort: AppointmentSort,
  clientsById: Map<string, Pick<Client, "fullName">>,
): AppointmentRecord[] {
  const copy = [...rows];
  if (sort === "date") {
    copy.sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    return copy;
  }
  copy.sort((a, b) => {
    const na = clientsById.get(a.clientId)?.fullName ?? "";
    const nb = clientsById.get(b.clientId)?.fullName ?? "";
    return na.localeCompare(nb, "he", { sensitivity: "base" });
  });
  return copy;
}

export function matchesClientSearch(client: Client, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const phone = client.phone.replace(/\s/g, "").toLowerCase();
  const needle = q.replace(/\s/g, "");
  return (
    client.fullName.toLowerCase().includes(q) ||
    (needle.length > 0 && phone.includes(needle))
  );
}
