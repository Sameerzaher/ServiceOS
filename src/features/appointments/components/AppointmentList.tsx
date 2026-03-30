import Link from "next/link";

import { heUi, paymentStatusLabel } from "@/config";
import { Button, EmptyState, ui } from "@/components/ui";
import { AppointmentStatus } from "@/core/types/appointment";
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
  onApproveRequest?: (id: AppointmentId) => void;
  onApproveAndSendWhatsapp?: (id: AppointmentId) => void;
  onRejectRequest?: (id: AppointmentId) => void;
  onChangeStatus?: (id: AppointmentId, status: AppointmentStatus) => void;
}

function isPendingPublicRequest(appt: AppointmentRecord): boolean {
  return (
    appt.customFields?.bookingSource === "public" &&
    appt.customFields?.bookingApproval === "pending" &&
    appt.status === AppointmentStatus.Scheduled
  );
}

function isApprovedPublicRequest(appt: AppointmentRecord): boolean {
  return (
    appt.customFields?.bookingSource === "public" &&
    appt.customFields?.bookingApproval === "approved"
  );
}

function isRejectedPublicRequest(appt: AppointmentRecord): boolean {
  return (
    appt.customFields?.bookingSource === "public" &&
    appt.customFields?.bookingApproval === "rejected"
  );
}

function clientNameById(clients: Client[], id: string): string {
  return clients.find((c) => c.id === id)?.fullName ?? "—";
}

function clientPhoneById(clients: Client[], id: string): string {
  const phone = clients.find((c) => c.id === id)?.phone ?? "";
  return phone.trim() || "—";
}

function appointmentStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.Confirmed:
      return heUi.appointments.statusConfirmed;
    case AppointmentStatus.InProgress:
      return heUi.appointments.statusInProgress;
    case AppointmentStatus.Completed:
      return heUi.appointments.statusCompleted;
    case AppointmentStatus.Cancelled:
      return heUi.appointments.statusCancelled;
    case AppointmentStatus.NoShow:
      return heUi.appointments.statusNoShow;
    case AppointmentStatus.Scheduled:
    default:
      return heUi.appointments.statusScheduled;
  }
}

function appointmentStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.Confirmed:
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case AppointmentStatus.InProgress:
      return "bg-blue-100 text-blue-900 border-blue-200";
    case AppointmentStatus.Completed:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
    case AppointmentStatus.Cancelled:
      return "bg-rose-100 text-rose-900 border-rose-200";
    case AppointmentStatus.NoShow:
      return "bg-orange-100 text-orange-900 border-orange-200";
    case AppointmentStatus.Scheduled:
    default:
      return "bg-sky-100 text-sky-900 border-sky-200";
  }
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

function formatAppointmentDateOnly(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function formatAppointmentTimeOnly(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", { timeStyle: "short" }).format(
      new Date(iso),
    );
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
  onApproveRequest,
  onApproveAndSendWhatsapp,
  onRejectRequest,
  onChangeStatus,
}: AppointmentListProps) {
  if (appointments.length === 0) {
    const isFilteredOut =
      totalAppointmentCount > 0 && appointments.length === 0;
    return (
      <EmptyState
        title={
          isFilteredOut
            ? heUi.filters.filterResultsEmpty
            : heUi.empty.lessonsListEmpty
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
        const pendingRequest = isPendingPublicRequest(appt);
        const approvedRequest = isApprovedPublicRequest(appt);
        const rejectedRequest = isRejectedPublicRequest(appt);

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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-base font-semibold leading-tight text-neutral-900 dark:text-neutral-100 sm:text-lg">
                      <Link
                        href={`/clients/${appt.clientId}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {clientNameById(clients, appt.clientId)}
                      </Link>
                    </h3>
                    {tomorrow ? (
                      <span
                        className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-900 dark:text-sky-100 sm:text-xs"
                        title={heUi.appointments.tomorrowBadgeTitle}
                      >
                        {heUi.appointments.tomorrowBadge}
                      </span>
                    ) : null}
                    {paid ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 sm:text-xs">
                        {heUi.appointments.paidBadge}
                      </span>
                    ) : null}
                    {debt ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100 sm:text-xs">
                        {heUi.appointments.unpaidBadge}
                      </span>
                    ) : null}
                    {pendingRequest ? (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-900 dark:bg-violet-900 dark:text-violet-100 sm:text-xs">
                        {heUi.appointments.pendingApprovalBadge}
                      </span>
                    ) : null}
                    {approvedRequest ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 sm:text-xs">
                        {heUi.appointments.approvedRequestBadge}
                      </span>
                    ) : null}
                    {rejectedRequest ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-900 dark:bg-rose-900 dark:text-rose-100 sm:text-xs">
                        {heUi.appointments.rejectedRequestBadge}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-1 text-xs sm:text-sm">
                    <p className="text-neutral-700 dark:text-neutral-300">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {heUi.appointments.listDateLabel}
                      </span>{" "}
                      {formatAppointmentDateOnly(appt.startAt)}
                    </p>
                    <p className="text-neutral-700 dark:text-neutral-300">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {heUi.appointments.listTimeLabel}
                      </span>{" "}
                      {formatAppointmentTimeOnly(appt.startAt)}
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {heUi.appointments.phonePrefix}
                      </span>
                      {clientPhoneById(clients, appt.clientId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300 sm:text-xs">
                      {heUi.appointments.statusPrefix}
                    </span>
                    <span
                      className={cn(
                        "rounded-lg border px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs",
                        appointmentStatusColor(appt.status)
                      )}
                    >
                      {appointmentStatusLabel(appt.status)}
                    </span>
                  </div>
                  {onChangeStatus && !pendingRequest && (
                    <div className="flex flex-wrap gap-1.5">
                      {appt.status !== AppointmentStatus.Confirmed && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(appt.id, AppointmentStatus.Confirmed)}
                          className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300 sm:px-2.5 sm:text-xs"
                        >
                          ✓ אשר
                        </button>
                      )}
                      {appt.status !== AppointmentStatus.Completed && appt.status !== AppointmentStatus.Cancelled && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(appt.id, AppointmentStatus.Completed)}
                          className="rounded-md bg-neutral-50 px-2 py-1 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 sm:px-2.5 sm:text-xs"
                        >
                          ✓ הושלם
                        </button>
                      )}
                      {appt.status !== AppointmentStatus.Cancelled && appt.status !== AppointmentStatus.Completed && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(appt.id, AppointmentStatus.Cancelled)}
                          className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 transition hover:bg-rose-100 dark:bg-rose-900 dark:text-rose-300 sm:px-2.5 sm:text-xs"
                        >
                          ✗ בטל
                        </button>
                      )}
                      {appt.status !== AppointmentStatus.NoShow && appt.status !== AppointmentStatus.Completed && appt.status !== AppointmentStatus.Cancelled && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(appt.id, AppointmentStatus.NoShow)}
                          className="rounded-md bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-700 transition hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-300 sm:px-2.5 sm:text-xs"
                        >
                          לא הגיע
                        </button>
                      )}
                    </div>
                  )}
                  <div className="grid gap-1 text-xs sm:text-sm">
                    <p className="text-neutral-600 dark:text-neutral-400">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {heUi.appointments.paymentPrefix}
                      </span>
                      {paymentStatusLabel(appt.paymentStatus)}
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {heUi.appointments.amountPrefix}
                      </span>
                      {formatIls(appt.amount ?? 0)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:shrink-0 sm:flex-col">
                  {pendingRequest && onApproveRequest ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onApproveRequest(appt.id)}
                    >
                      {heUi.appointments.approveRequest}
                    </Button>
                  ) : null}
                  {pendingRequest && onApproveAndSendWhatsapp ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onApproveAndSendWhatsapp(appt.id)}
                    >
                      {heUi.appointments.approveAndSendWhatsapp}
                    </Button>
                  ) : null}
                  {pendingRequest && onRejectRequest ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => onRejectRequest(appt.id)}
                    >
                      {heUi.appointments.rejectRequest}
                    </Button>
                  ) : null}
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
                <dl className="mt-3 grid gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-700 sm:mt-4 sm:grid-cols-2 sm:gap-x-6 sm:pt-4">
                  {preset.appointmentFields.map((def) => {
                    const raw = appt.customFields[def.key];
                    return (
                      <div key={def.key} className="min-w-0">
                        <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:text-xs">
                          {def.label}
                        </dt>
                        <dd className="mt-0.5 break-words text-xs text-neutral-900 dark:text-neutral-100 sm:text-sm">
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
