import Link from "next/link";

import { heUi, paymentStatusLabel } from "@/config";
import { Button, EmptyState, ui } from "@/components/ui";
import { isTomorrowAppointment } from "@/core/reminders";
import type {
  AppointmentId,
  AppointmentRecord,
} from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { formatIls } from "@/core/utils/currency";
import { isDebtStatus, isPaidStatus } from "@/core/utils/insights";
import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
  type VerticalPreset,
} from "@/core/types/vertical";
import { cn } from "@/lib/cn";

export interface AppointmentListProps {
  appointments: AppointmentRecord[];
  /** Total appointments before filters (for empty-filter messaging). */
  totalAppointmentCount?: number;
  clients: Client[];
  preset: VerticalPreset;
  highlightedAppointmentId?: string | null;
  onRequestDelete?: (id: AppointmentId) => void;
  onEdit?: (id: AppointmentId) => void;
  onTogglePaid?: (id: AppointmentId) => void;
}

function clientNameById(clients: Client[], id: string): string {
  return clients.find((c) => c.id === id)?.fullName ?? "—";
}

function formatStartAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatCustomValue(
  def: CustomFieldDefinition,
  value: unknown,
): string {
  if (value === undefined || value === null) {
    return "—";
  }

  switch (def.kind) {
    case CustomFieldInputKind.Boolean:
      return value === true ? heUi.boolean.yes : heUi.boolean.no;
    case CustomFieldInputKind.Number: {
      if (typeof value === "number" && !Number.isNaN(value)) {
        return String(value);
      }
      const n = Number(value);
      return Number.isNaN(n) ? "—" : String(n);
    }
    case CustomFieldInputKind.Date:
      return typeof value === "string" ? value : String(value);
    default:
      return String(value);
  }
}

export function AppointmentList({
  appointments,
  totalAppointmentCount = 0,
  clients,
  preset,
  highlightedAppointmentId,
  onRequestDelete,
  onEdit,
  onTogglePaid,
}: AppointmentListProps) {
  const lessonsLabel = preset.labels.lessons;

  if (appointments.length === 0) {
    const isFilteredOut =
      totalAppointmentCount > 0 && appointments.length === 0;
    return (
      <EmptyState
        title={
          isFilteredOut
            ? heUi.filters.filterResultsEmpty
            : lessonsLabel
              ? heUi.empty.appointmentsTitle(lessonsLabel)
              : heUi.empty.appointmentsFallback
        }
        description={
          isFilteredOut ? undefined : heUi.empty.appointmentsDescription
        }
      />
    );
  }

  return (
    <ul className={ui.list}>
      {appointments.map((appt) => {
        const paid = isPaidStatus(appt.paymentStatus);
        const debt = isDebtStatus(appt.paymentStatus);
        const tomorrow = isTomorrowAppointment(appt);

        return (
          <li key={appt.id}>
            <article
              className={cn(
                ui.listItem,
                ui.cardHover,
                highlightedAppointmentId === appt.id &&
                  "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-neutral-50",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold leading-tight text-neutral-900">
                      <Link
                        href={`/clients/${appt.clientId}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {clientNameById(clients, appt.clientId)}
                      </Link>
                    </h3>
                    {tomorrow ? (
                      <span
                        className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900"
                        title={heUi.appointments.tomorrowBadgeTitle}
                      >
                        {heUi.appointments.tomorrowBadge}
                      </span>
                    ) : null}
                    {paid ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                        {heUi.appointments.paidBadge}
                      </span>
                    ) : null}
                    {debt ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        {heUi.appointments.unpaidBadge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-neutral-700">
                    {formatStartAt(appt.startAt)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    <span className="font-medium text-neutral-700">
                      {heUi.appointments.paymentPrefix}
                    </span>
                    {paymentStatusLabel(appt.paymentStatus)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    <span className="font-medium text-neutral-700">
                      {heUi.appointments.amountPrefix}
                    </span>
                    {formatIls(appt.amount ?? 0)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 sm:gap-2 sm:shrink-0 sm:justify-end">
                  {onTogglePaid ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onTogglePaid(appt.id)}
                      aria-label={
                        paid
                          ? `${heUi.appointments.markUnpaid} — ${clientNameById(clients, appt.clientId)}`
                          : `${heUi.appointments.markPaid} — ${clientNameById(clients, appt.clientId)}`
                      }
                      aria-pressed={paid}
                    >
                      {paid
                        ? heUi.appointments.markUnpaid
                        : heUi.appointments.markPaid}
                    </Button>
                  ) : null}
                  {onEdit ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(appt.id)}
                      aria-label={`${heUi.appointments.edit} — ${formatStartAt(appt.startAt)}`}
                    >
                      {heUi.appointments.edit}
                    </Button>
                  ) : null}
                  {onRequestDelete ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => onRequestDelete(appt.id)}
                      aria-label={`${heUi.appointments.delete}: ${clientNameById(clients, appt.clientId)} — ${formatStartAt(appt.startAt)}`}
                    >
                      {heUi.appointments.delete}
                    </Button>
                  ) : null}
                </div>
              </div>

              {preset.appointmentFields.length > 0 ? (
                <dl className="mt-4 grid gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-2 sm:gap-x-6">
                  {preset.appointmentFields.map((def) => {
                    const raw = appt.customFields[def.key];
                    return (
                      <div key={def.key} className="min-w-0">
                        <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          {def.label}
                        </dt>
                        <dd className="mt-0.5 break-words text-sm text-neutral-900">
                          {formatCustomValue(def, raw)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : null}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
