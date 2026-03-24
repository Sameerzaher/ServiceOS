"use client";

import { useMemo, useState } from "react";

import { heUi } from "@/config";
import { Button, EmptyState, ui } from "@/components/ui";
import { getTomorrowAppointments } from "@/core/reminders";
import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { applyReminderTemplate } from "@/core/utils/reminderTemplate";

export interface RemindersPanelProps {
  appointments: AppointmentRecord[];
  clients: Client[];
  reminderTemplate: string;
  onCopied?: () => void;
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

export function RemindersPanel({
  appointments,
  clients,
  reminderTemplate,
  onCopied,
}: RemindersPanelProps) {
  const tomorrowRows = useMemo(
    () => getTomorrowAppointments(appointments),
    [appointments],
  );
  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients],
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyMessage(appt: AppointmentRecord): Promise<void> {
    const name = clientById.get(appt.clientId)?.fullName ?? "";
    const time = formatTimeShort(appt.startAt);
    const text = applyReminderTemplate(reminderTemplate, name, time);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(appt.id);
      onCopied?.();
      window.setTimeout(() => setCopiedId((cur) => (cur === appt.id ? null : cur)), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold text-neutral-900 sm:text-lg">
        {heUi.reminders.title}
      </h3>
      <p className="mt-1 text-sm text-neutral-600">
        {heUi.settings.reminderTemplateHint}
      </p>

      {tomorrowRows.length === 0 ? (
        <EmptyState
          className="py-8 sm:py-10"
          tone="muted"
          title={heUi.reminders.empty}
        />
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {tomorrowRows.map((appt) => {
            const name = clientById.get(appt.clientId)?.fullName ?? "—";
            return (
              <li
                key={appt.id}
                className={`flex flex-col gap-2 ${ui.card} ${ui.cardPadding} sm:flex-row sm:items-center sm:justify-between`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900">{name}</p>
                  <p className="text-sm text-neutral-600">
                    {formatTimeShort(appt.startAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => void copyMessage(appt)}
                >
                  {copiedId === appt.id
                    ? heUi.reminders.copied
                    : heUi.reminders.copyWhatsapp}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
