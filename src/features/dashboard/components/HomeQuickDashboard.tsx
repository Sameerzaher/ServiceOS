"use client";

import Link from "next/link";
import { useMemo } from "react";

import { heUi } from "@/config";
import { Button, EmptyState, ui } from "@/components/ui";
import { getTomorrowAppointments, isLocalCalendarDay } from "@/core/reminders";
import { PaymentStatus, type AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { RemindersPanel } from "@/features/dashboard/components/RemindersPanel";

export interface HomeQuickDashboardProps {
  appointments: AppointmentRecord[];
  clients: Client[];
  lessonLabelPlural: string;
  reminderTemplate: string;
  businessName?: string;
  businessPhone?: string;
  onReminderCopied?: () => void;
  onQuickAddClient: () => void;
  onQuickAddAppointment: () => void;
}

function formatTimeShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", { timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

function clientName(clients: Client[], id: string): string {
  return clients.find((c) => c.id === id)?.fullName ?? "—";
}

export function HomeQuickDashboard({
  appointments,
  clients,
  lessonLabelPlural,
  reminderTemplate,
  businessName = "",
  businessPhone = "",
  onReminderCopied,
  onQuickAddClient,
  onQuickAddAppointment,
}: HomeQuickDashboardProps) {
  const reference = useMemo(() => new Date(), []);

  const { todayRows, tomorrowCount, unpaidCount } = useMemo(() => {
    const today = appointments
      .filter((a) => isLocalCalendarDay(a.startAt, reference))
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
    const tomorrow = getTomorrowAppointments(appointments, reference);
    const unpaid = appointments.filter(
      (a) => a.paymentStatus === PaymentStatus.Unpaid,
    );
    return {
      todayRows: today,
      tomorrowCount: tomorrow.length,
      unpaidCount: unpaid.length,
    };
  }, [appointments, reference]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-medium text-neutral-800">
          {heUi.dashboard.quickActionsTitle}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" variant="primary" onClick={onQuickAddClient}>
            {heUi.dashboard.quickAddClient}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onQuickAddAppointment}
          >
            {heUi.dashboard.quickAddAppointment}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={ui.statCard}>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {heUi.dashboard.kpiToday}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-neutral-900">
            {todayRows.length}
          </p>
        </div>
        <div className={ui.statCard}>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {heUi.dashboard.kpiTomorrow}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-neutral-900">
            {tomorrowCount}
          </p>
        </div>
        <div className={ui.statCard}>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {heUi.dashboard.kpiUnpaid}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-amber-800">
            {unpaidCount}
          </p>
        </div>
        <div className={ui.statCard}>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {heUi.dashboard.kpiClients}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-neutral-900">
            {clients.length}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-neutral-900 sm:text-lg">
          {heUi.dashboard.todaySectionTitle(lessonLabelPlural)}
        </h3>
        {todayRows.length === 0 ? (
          <EmptyState
            tone="muted"
            className="py-8"
            title={heUi.dashboard.emptyTodayTitle(lessonLabelPlural)}
            description={heUi.dashboard.emptyTodayDescription}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {todayRows.map((appt) => (
              <li
                key={appt.id}
                className={`${ui.card} ${ui.cardPadding} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}
              >
                <Link
                  href={`/clients/${appt.clientId}`}
                  className="font-medium text-neutral-900 underline-offset-2 hover:underline"
                >
                  {clientName(clients, appt.clientId)}
                </Link>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <span>{formatTimeShort(appt.startAt)}</span>
                  {appt.paymentStatus === PaymentStatus.Unpaid ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                      {heUi.dashboard.unpaidBadge}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-neutral-900 sm:text-lg">
          {heUi.dashboard.remindersSectionTitle}
        </h3>
        <RemindersPanel
          appointments={appointments}
          clients={clients}
          reminderTemplate={reminderTemplate}
          businessName={businessName}
          businessPhone={businessPhone}
          onCopied={onReminderCopied}
        />
      </section>
    </div>
  );
}

