import Link from "next/link";

import { heUi } from "@/config";
import { Button, EmptyState, ui } from "@/components/ui";
import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client, ClientId } from "@/core/types/client";
import { getNextLesson } from "@/core/utils/clientSchedule";
import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
  type VerticalPreset,
} from "@/core/types/vertical";
import { cn } from "@/lib/cn";

export interface ClientListProps {
  clients: Client[];
  /** Total clients before search filter (for empty-search messaging). */
  totalClientCount?: number;
  preset: VerticalPreset;
  /** When provided, shows "next lesson" per client. */
  appointments?: readonly AppointmentRecord[];
  referenceDate?: Date;
  highlightedClientId?: string | null;
  onEdit?: (id: ClientId) => void;
  onRequestDelete?: (id: ClientId) => void;
  /** Opens add-lesson flow with this client pre-selected (e.g. scroll + prefill). */
  onAddLessonForClient?: (id: ClientId) => void;
}

function formatNextWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
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

export function ClientList({
  clients,
  totalClientCount = 0,
  preset,
  appointments,
  referenceDate,
  highlightedClientId,
  onEdit,
  onRequestDelete,
  onAddLessonForClient,
}: ClientListProps) {
  const ref = referenceDate ?? new Date();
  const studentsLabel = preset.labels.students;

  if (clients.length === 0) {
    const isFilteredOut = totalClientCount > 0;
    return (
      <EmptyState
        title={
          isFilteredOut
            ? heUi.filters.filterResultsEmpty
            : studentsLabel
            ? heUi.empty.clientsTitle(studentsLabel)
            : heUi.empty.clientsFallback
        }
        description={isFilteredOut ? undefined : heUi.empty.clientsDescription}
      />
    );
  }

  return (
    <ul className={ui.list}>
      {clients.map((client) => {
        const next =
          appointments && appointments.length > 0
            ? getNextLesson(client.id, appointments, ref)
            : null;
        return (
        <li key={client.id}>
          <article
            className={cn(
              ui.listItem,
              ui.cardHover,
              highlightedClientId === client.id &&
                "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-neutral-50",
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold leading-tight text-neutral-900">
                    {client.fullName}
                  </h3>
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
                  >
                    {heUi.list.profile}
                  </Link>
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  <span className="font-medium text-neutral-700">
                    {heUi.forms.phonePrefix}
                  </span>
                  {client.phone.trim() ? (
                    <a
                      href={`tel:${client.phone.replace(/\s/g, "")}`}
                      className="text-neutral-900 underline-offset-2 hover:underline"
                    >
                      {client.phone}
                    </a>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </p>
                {appointments && appointments.length > 0 ? (
                  <p className="mt-2 text-sm text-neutral-800">
                    <span className="font-semibold text-neutral-900">
                      {heUi.clientCard.nextLesson}:{" "}
                    </span>
                    {next ? (
                      <span className="text-neutral-800">
                        {formatNextWhen(next.startAt)}
                      </span>
                    ) : (
                      <span className="text-neutral-500">
                        {heUi.clientCard.noUpcoming}
                      </span>
                    )}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2.5 sm:gap-2 sm:shrink-0">
                {onEdit ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(client.id)}
                    aria-label={`${heUi.list.edit}: ${client.fullName}`}
                  >
                    {heUi.list.edit}
                  </Button>
                ) : null}
                {onAddLessonForClient ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onAddLessonForClient(client.id)}
                    aria-label={`${heUi.list.addLessonForClient} — ${client.fullName}`}
                  >
                    {heUi.list.addLessonForClient}
                  </Button>
                ) : null}
                {onRequestDelete ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => onRequestDelete(client.id)}
                    aria-label={`${heUi.list.delete}: ${client.fullName}`}
                  >
                    {heUi.list.delete}
                  </Button>
                ) : null}
              </div>
            </div>

            {preset.clientFields.length > 0 ? (
              <dl className="mt-4 grid gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-2 sm:gap-x-6">
                {preset.clientFields.map((def) => {
                  const raw = client.customFields[def.key];
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
