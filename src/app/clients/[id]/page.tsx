"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { getActiveVerticalPreset, heUi, paymentStatusLabel } from "@/config";
import { LoadingState, ui } from "@/components/ui";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useClients } from "@/features/clients/hooks/useClients";
import type { AppointmentRecord } from "@/core/types/appointment";
import { formatIls } from "@/core/utils/currency";
import { getLastLesson } from "@/core/utils/clientSchedule";
import {
  sumClientDebt,
  sumClientPaid,
} from "@/core/utils/insights";
import { buildWhatsAppHref } from "@/core/utils/whatsapp";
import { cn } from "@/lib/cn";
import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
} from "@/core/types/vertical";

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

export default function ClientProfilePage() {
  const params = useParams();
  const segment = params.id;
  const id =
    typeof segment === "string"
      ? segment
      : Array.isArray(segment)
        ? (segment[0] ?? "")
        : "";
  const preset = getActiveVerticalPreset();
  const { sortedClients, isReady: clientsReady } = useClients();
  const { sortedAppointments, isReady: appointmentsReady } = useAppointments();

  const client = useMemo(
    () => sortedClients.find((c) => c.id === id),
    [sortedClients, id],
  );

  const clientAppointments = useMemo((): AppointmentRecord[] => {
    if (!id) return [];
    return sortedAppointments.filter((a) => a.clientId === id);
  }, [sortedAppointments, id]);

  const { paidTotal, debtTotal } = useMemo(() => {
    if (!id) {
      return { paidTotal: 0, debtTotal: 0 };
    }
    return {
      paidTotal: sumClientPaid(sortedAppointments, id),
      debtTotal: sumClientDebt(sortedAppointments, id),
    };
  }, [id, sortedAppointments]);

  const lessonCount = clientAppointments.length;

  const lastLesson = useMemo(() => {
    if (!id) return null;
    return getLastLesson(id, sortedAppointments);
  }, [id, sortedAppointments]);

  if (!clientsReady || !appointmentsReady) {
    return (
      <main className={ui.pageMain}>
        <LoadingState message={heUi.loading.default} />
      </main>
    );
  }

  if (!client) {
    return (
      <main className={ui.pageMain}>
        <p className="text-base text-neutral-800">{heUi.clientProfile.notFound}</p>
        <p className="mt-4">
          <Link
            href="/"
            className="font-medium text-neutral-900 underline-offset-2 hover:underline"
          >
            {heUi.clientProfile.back}
          </Link>
        </p>
      </main>
    );
  }

  const whatsappHref = buildWhatsAppHref(client.phone);

  return (
    <main className={ui.pageMain}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
        >
          ← {heUi.clientProfile.back}
        </Link>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            {heUi.clientProfile.openWhatsapp}
          </a>
        ) : null}
      </div>

      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{client.fullName}</h1>
        <p className={ui.pageSubtitle}>
          <span className="font-medium text-neutral-700">
            {heUi.forms.phonePrefix}
          </span>
          {client.phone.trim() ? client.phone : "—"}
        </p>
      </header>

      <div className={ui.pageStack}>
        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>{heUi.forms.notes}</h2>
          <p className="rounded-xl border border-neutral-200/90 bg-white p-4 text-neutral-800 shadow-sm">
            {client.notes.trim() ? client.notes : "—"}
          </p>
        </section>

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>
            {heUi.clientProfile.lastLesson}
          </h2>
          <p className="rounded-xl border border-neutral-200/90 bg-white p-4 text-neutral-800 shadow-sm">
            {lastLesson ? formatStartAt(lastLesson.startAt) : heUi.clientProfile.noLastLesson}
          </p>
        </section>

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>
            {heUi.clientProfile.paymentSummaryTitle}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className={ui.statCard}>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {heUi.clientProfile.lessonsTotal}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">
                {lessonCount}
              </p>
            </div>
            <div className={ui.statCard}>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {heUi.clientProfile.paidTotal}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-900">
                {formatIls(paidTotal)}
              </p>
            </div>
            <div
              className={cn(
                ui.statCard,
                "border-2 border-amber-500 bg-amber-50 shadow-md sm:col-span-1",
              )}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-amber-950">
                {heUi.clientProfile.debtTitle}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-amber-950">
                {formatIls(debtTotal)}
              </p>
            </div>
          </div>
        </section>

        {preset.clientFields.length > 0 ? (
          <section className={ui.section}>
            <h2 className={ui.sectionHeading}>
              {heUi.clientProfile.detailsTitle}
            </h2>
            <dl className="grid gap-3 rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:grid-cols-2">
              {preset.clientFields.map((def) => {
                const raw = client.customFields[def.key];
                return (
                  <div key={def.key}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      {def.label}
                    </dt>
                    <dd className="mt-0.5 text-sm text-neutral-900">
                      {formatCustomValue(def, raw)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ) : null}

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>
            {heUi.clientProfile.appointmentsTitle}
          </h2>
          {clientAppointments.length === 0 ? (
            <p className="text-sm text-neutral-600">{heUi.empty.appointmentsDescription}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {[...clientAppointments]
                .sort(
                  (a, b) =>
                    new Date(b.startAt).getTime() -
                    new Date(a.startAt).getTime(),
                )
                .map((appt) => (
                  <li
                    key={appt.id}
                    className={`${ui.card} ${ui.cardPadding} flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between`}
                  >
                    <span className="text-sm text-neutral-800">
                      {formatStartAt(appt.startAt)}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                      <span>{paymentStatusLabel(appt.paymentStatus)}</span>
                      <span>{formatIls(appt.amount ?? 0)}</span>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
