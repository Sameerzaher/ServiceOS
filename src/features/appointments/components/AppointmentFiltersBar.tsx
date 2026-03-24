"use client";

import { heUi } from "@/config";
import { ui } from "@/components/ui";
import type { AppointmentDateFilter } from "@/core/utils/dateRange";
import type {
  AppointmentSort,
  PaymentFilter,
} from "@/core/utils/appointmentFilters";
import { cn } from "@/lib/cn";

export interface AppointmentFiltersBarProps {
  dateFilter: AppointmentDateFilter;
  onDateFilterChange: (next: AppointmentDateFilter) => void;
  paymentFilter: PaymentFilter;
  onPaymentFilterChange: (next: PaymentFilter) => void;
  sort: AppointmentSort;
  onSortChange: (next: AppointmentSort) => void;
  className?: string;
}

const dateOptions: { value: AppointmentDateFilter; label: string }[] = [
  { value: "all", label: heUi.filters.dateAll },
  { value: "today", label: heUi.filters.dateToday },
  { value: "tomorrow", label: heUi.filters.dateTomorrow },
  { value: "this_week", label: heUi.filters.dateThisWeek },
];

const paymentOptions: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: heUi.filters.paymentAll },
  { value: "paid", label: heUi.filters.paymentPaid },
  { value: "unpaid", label: heUi.filters.paymentUnpaid },
];

const sortOptions: { value: AppointmentSort; label: string }[] = [
  { value: "date", label: heUi.filters.sortByDate },
  { value: "name", label: heUi.filters.sortByName },
];

export function AppointmentFiltersBar({
  dateFilter,
  onDateFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  sort,
  onSortChange,
  className,
}: AppointmentFiltersBarProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 rounded-xl border border-neutral-200/90 bg-neutral-50/80 p-3.5 sm:grid-cols-3 sm:gap-4 sm:p-4",
        className,
      )}
    >
      <div className="min-w-0 sm:max-w-none">
        <label htmlFor="filter-date" className={ui.label}>
          {heUi.forms.appointmentDate}
        </label>
        <select
          id="filter-date"
          value={dateFilter}
          onChange={(e) =>
            onDateFilterChange(e.target.value as AppointmentDateFilter)
          }
          className={ui.input}
        >
          {dateOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0 sm:max-w-none">
        <label htmlFor="filter-payment" className={ui.label}>
          {heUi.forms.paymentStatus}
        </label>
        <select
          id="filter-payment"
          value={paymentFilter}
          onChange={(e) =>
            onPaymentFilterChange(e.target.value as PaymentFilter)
          }
          className={ui.input}
        >
          {paymentOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0 sm:max-w-none">
        <label htmlFor="filter-sort" className={ui.label}>
          {heUi.filters.sort}
        </label>
        <select
          id="filter-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as AppointmentSort)}
          className={ui.input}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
