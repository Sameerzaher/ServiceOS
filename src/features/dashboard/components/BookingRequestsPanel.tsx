"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { Button, EmptyState, LoadingState, ui } from "@/components/ui";

type BookingStatus = "pending" | "confirmed" | "cancelled";

interface BookingRequestRow {
  id: string;
  fullName: string;
  phone: string;
  pickupLocation: string;
  carType: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}

interface GetBookingsOk {
  ok: true;
  bookings?: unknown[];
}

interface ApiErr {
  ok: false;
  error: string;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseBookingRow(raw: unknown): BookingRequestRow | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : "";
  const fullName = typeof raw.fullName === "string" ? raw.fullName : "";
  const phone = typeof raw.phone === "string" ? raw.phone : "";
  const pickupLocation =
    typeof raw.pickupLocation === "string" ? raw.pickupLocation : "";
  const carType = typeof raw.carType === "string" ? raw.carType : "";
  const preferredDate =
    typeof raw.preferredDate === "string" ? raw.preferredDate : "";
  const preferredTime =
    typeof raw.preferredTime === "string" ? raw.preferredTime : "";
  const notes = typeof raw.notes === "string" ? raw.notes : "";
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : "";
  const status =
    raw.status === "pending" ||
    raw.status === "confirmed" ||
    raw.status === "cancelled"
      ? raw.status
      : null;
  if (!id || !fullName || !preferredDate || !preferredTime || !status || !createdAt) {
    return null;
  }
  return {
    id,
    fullName,
    phone,
    pickupLocation,
    carType,
    preferredDate,
    preferredTime,
    notes,
    status,
    createdAt,
  };
}

function formatDateTime(date: string, time: string): string {
  try {
    const iso = `${date}T${time}:00`;
    const parsed = new Date(iso);
    if (!Number.isFinite(parsed.getTime())) {
      return `${date} ${time}`;
    }
    return new Intl.DateTimeFormat("he-IL", { dateStyle: "medium", timeStyle: "short" }).format(
      parsed,
    );
  } catch {
    return `${date} ${time}`;
  }
}

function statusLabel(status: BookingStatus): string {
  if (status === "confirmed") return heUi.dashboard.bookingStatusConfirmed;
  if (status === "cancelled") return heUi.dashboard.bookingStatusCancelled;
  return heUi.dashboard.bookingStatusPending;
}

export function BookingRequestsPanel() {
  const [rows, setRows] = useState<BookingRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", { method: "GET" });
      const data = (await res.json()) as GetBookingsOk | ApiErr;
      if (!res.ok || data.ok !== true) {
        throw new Error(data.ok === false ? data.error : heUi.data.loadFailedTitle);
      }
      const next: BookingRequestRow[] = [];
      for (const row of data.bookings ?? []) {
        const parsed = parseBookingRow(row);
        if (parsed) next.push(parsed);
      }
      setRows(next);
    } catch (e) {
      console.error("[ServiceOS] booking requests load", e);
      setError(heUi.data.loadFailedTitle);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [rows],
  );

  async function updateStatus(id: string, status: BookingStatus): Promise<void> {
    setPendingIds((prev) => new Set(prev).add(id));
    const previous = rows;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || data.ok !== true) {
        throw new Error(data.error ?? heUi.data.syncFailedTitle);
      }
      await load();
    } catch (e) {
      console.error("[ServiceOS] booking requests update", e);
      setRows(previous);
      setError(heUi.data.syncFailedTitle);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <section className={ui.section}>
      <h2 className={ui.sectionHeading}>{heUi.dashboard.bookingRequestsTitle}</h2>
      {loading ? (
        <LoadingState message={heUi.dashboard.bookingRequestsLoading} />
      ) : error ? (
        <div className={ui.formCard}>
          <p className="text-sm text-red-600">{error}</p>
          <div className="mt-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
              {heUi.errors.tryAgain}
            </Button>
          </div>
        </div>
      ) : sortedRows.length === 0 ? (
        <EmptyState
          tone="muted"
          title={heUi.dashboard.bookingRequestsEmpty}
          className="py-8"
        />
      ) : (
        <ul className={ui.list}>
          {sortedRows.map((row) => {
            const busy = pendingIds.has(row.id);
            return (
              <li key={row.id} className={ui.listItem}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-neutral-900">
                      {heUi.dashboard.bookingRequesterName}: {row.fullName}
                    </p>
                    <p className="text-sm text-neutral-700">
                      {heUi.dashboard.bookingRequesterPhone}: {row.phone || "—"}
                    </p>
                    <p className="text-sm text-neutral-700">
                      {heUi.dashboard.bookingRequesterDateTime}:{" "}
                      {formatDateTime(row.preferredDate, row.preferredTime)}
                    </p>
                    <p className="text-sm text-neutral-700">
                      {heUi.dashboard.bookingRequesterStatus}: {statusLabel(row.status)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      disabled={busy || row.status === "confirmed"}
                      onClick={() => void updateStatus(row.id, "confirmed")}
                    >
                      {heUi.dashboard.bookingActionConfirm}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={busy || row.status === "cancelled"}
                      onClick={() => void updateStatus(row.id, "cancelled")}
                    >
                      {heUi.dashboard.bookingActionCancel}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
