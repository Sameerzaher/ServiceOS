import { AppointmentStatus, type AppointmentRecord } from "@/core/types/appointment";
import type { AvailabilitySettings, WeekdayKey } from "@/core/types/availability";

import { combineDateAndHHmmToIso, parseHHmm } from "./time";

export interface AvailableSlot {
  slotStart: string;
  slotEnd: string;
}

export interface GenerateAvailableSlotsInput {
  /** Local date in `YYYY-MM-DD` format. */
  date: string;
  availability: AvailabilitySettings;
  existingAppointments: readonly AppointmentRecord[];
  /** Optional deterministic "now" (for tests). */
  now?: Date;
}

function toWeekdayKey(date: Date): WeekdayKey {
  const day = date.getDay();
  switch (day) {
    case 0:
      return "sunday";
    case 1:
      return "monday";
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    default:
      return "saturday";
  }
}

function rangesOverlap(
  aStartMs: number,
  aEndMs: number,
  bStartMs: number,
  bEndMs: number,
): boolean {
  return aStartMs < bEndMs && bStartMs < aEndMs;
}

/**
 * Deterministically generates available booking slots for a date.
 * - Uses weekly availability window + slot duration
 * - Excludes past slots relative to `now`
 * - Excludes overlapping existing appointments
 */
export function generateAvailableSlots({
  date,
  availability,
  existingAppointments,
  now = new Date(),
}: GenerateAvailableSlotsInput): AvailableSlot[] {
  if (!availability.bookingEnabled) return [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return [];

  const targetDate = new Date(`${date}T00:00`);
  if (Number.isNaN(targetDate.getTime())) return [];

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const selectedStart = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  ).getTime();
  const dayOffset = Math.round((selectedStart - todayStart) / 86_400_000);
  if (dayOffset < 0 || dayOffset >= availability.daysAhead) return [];

  const weekday = toWeekdayKey(targetDate);
  const dayAvailability = availability.weeklyAvailability[weekday];
  if (!dayAvailability.enabled) return [];

  const start = parseHHmm(dayAvailability.startTime);
  const end = parseHHmm(dayAvailability.endTime);
  if (!start || !end) return [];
  if (end.totalMinutes <= start.totalMinutes) return [];

  const slotMinutes = Math.max(1, Math.trunc(availability.slotDurationMinutes));
  const nowMs = now.getTime();

  const activeAppointments = existingAppointments.filter(
    (appt) => appt.status !== AppointmentStatus.Cancelled,
  );

  const slots: AvailableSlot[] = [];
  for (
    let currentStartMinutes = start.totalMinutes;
    currentStartMinutes + slotMinutes <= end.totalMinutes;
    currentStartMinutes += slotMinutes
  ) {
    const startHHmm = `${String(Math.floor(currentStartMinutes / 60)).padStart(2, "0")}:${String(
      currentStartMinutes % 60,
    ).padStart(2, "0")}`;
    const endTotal = currentStartMinutes + slotMinutes;
    const endHHmm = `${String(Math.floor(endTotal / 60)).padStart(2, "0")}:${String(
      endTotal % 60,
    ).padStart(2, "0")}`;

    const slotStart = combineDateAndHHmmToIso(date, startHHmm);
    const slotEnd = combineDateAndHHmmToIso(date, endHHmm);
    if (!slotStart || !slotEnd) continue;

    const slotStartMs = new Date(slotStart).getTime();
    const slotEndMs = new Date(slotEnd).getTime();
    if (!Number.isFinite(slotStartMs) || !Number.isFinite(slotEndMs)) continue;
    if (slotStartMs < nowMs) continue;

    const overlapsExisting = activeAppointments.some((appt) => {
      const apptStartMs = new Date(appt.startAt).getTime();
      if (!Number.isFinite(apptStartMs)) return false;
      const endRaw = appt.customFields?.bookingSlotEnd;
      let apptEndMs: number;
      if (typeof endRaw === "string") {
        const t = new Date(endRaw.trim()).getTime();
        apptEndMs = Number.isFinite(t) ? t : apptStartMs + slotMinutes * 60_000;
      } else {
        apptEndMs = apptStartMs + slotMinutes * 60_000;
      }
      return rangesOverlap(slotStartMs, slotEndMs, apptStartMs, apptEndMs);
    });
    if (overlapsExisting) continue;

    slots.push({ slotStart, slotEnd });
  }

  return slots;
}

