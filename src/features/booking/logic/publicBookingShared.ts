import { heUi } from "@/config";
import { AppointmentStatus, type AppointmentRecord } from "@/core/types/appointment";

export interface PublicBookingPayload {
  fullName: string;
  phone: string;
  notes: string;
  slotStart: string;
  slotEnd: string;
  /** Driving vertical: `pickupLocation` / `carType` in appointment custom fields. */
  pickupLocation: string;
  carType: string;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function rangesOverlap(
  aStartMs: number,
  aEndMs: number,
  bStartMs: number,
  bEndMs: number,
): boolean {
  return aStartMs < bEndMs && bStartMs < aEndMs;
}

/**
 * Same overlap heuristic as the legacy client flow: use the requested slot
 * duration as the implied end for existing appointments when comparing windows.
 */
export function bookingOverlapsExistingAppointments(
  slotStart: string,
  slotEnd: string,
  appointments: readonly Pick<
    AppointmentRecord,
    "startAt" | "status" | "customFields"
  >[],
): boolean {
  const slotStartMs = new Date(slotStart).getTime();
  const slotEndMs = new Date(slotEnd).getTime();
  if (!Number.isFinite(slotStartMs) || !Number.isFinite(slotEndMs)) return true;
  if (slotEndMs <= slotStartMs) return true;

  const slotDurationMs = slotEndMs - slotStartMs;

  return appointments.some((appt) => {
    if (appt.status === AppointmentStatus.Cancelled) return false;
    const apptStartMs = new Date(appt.startAt).getTime();
    if (!Number.isFinite(apptStartMs)) return false;
    const endRaw = appt.customFields?.bookingSlotEnd;
    let apptEndMs: number;
    if (typeof endRaw === "string") {
      const t = new Date(endRaw.trim()).getTime();
      apptEndMs = Number.isFinite(t) ? t : apptStartMs + slotDurationMs;
    } else {
      apptEndMs = apptStartMs + slotDurationMs;
    }
    return rangesOverlap(slotStartMs, slotEndMs, apptStartMs, apptEndMs);
  });
}

export function parsePublicBookingBody(raw: unknown):
  | { ok: true; data: PublicBookingPayload }
  | { ok: false; errorHe: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, errorHe: heUi.publicBooking.errInvalidPayload };
  }
  const o = raw as Record<string, unknown>;
  const fullName = typeof o.fullName === "string" ? o.fullName.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const notes = typeof o.notes === "string" ? o.notes.trim() : "";
  const slotStart = typeof o.slotStart === "string" ? o.slotStart.trim() : "";
  const slotEnd = typeof o.slotEnd === "string" ? o.slotEnd.trim() : "";
  const pickupLocation =
    typeof o.pickupLocation === "string" ? o.pickupLocation.trim() : "";
  const carType = typeof o.carType === "string" ? o.carType.trim() : "";

  if (!fullName) {
    return { ok: false, errorHe: heUi.publicBooking.errFullName };
  }
  if (!phone) {
    return { ok: false, errorHe: heUi.publicBooking.errPhone };
  }
  if (!slotStart || !slotEnd) {
    return { ok: false, errorHe: heUi.publicBooking.errSlotInvalid };
  }

  const slotStartMs = new Date(slotStart).getTime();
  const slotEndMs = new Date(slotEnd).getTime();
  if (!Number.isFinite(slotStartMs) || !Number.isFinite(slotEndMs)) {
    return { ok: false, errorHe: heUi.publicBooking.errSlotInvalid };
  }
  if (slotEndMs <= slotStartMs) {
    return { ok: false, errorHe: heUi.publicBooking.errSlotRange };
  }

  const nowMs = Date.now();
  if (slotStartMs < nowMs) {
    return { ok: false, errorHe: heUi.publicBooking.errSlotPast };
  }

  return {
    ok: true,
    data: {
      fullName,
      phone,
      notes,
      slotStart,
      slotEnd,
      pickupLocation,
      carType,
    },
  };
}

/**
 * Whole-day offset from "today" to the slot's calendar day (runtime local timezone).
 * Used by the public booking API; should match `generateAvailableSlots` date-window logic.
 */
export function localCalendarDayOffsetFromNow(
  slotStartMs: number,
  nowMs: number,
): number {
  const startOfDay = (ms: number) => {
    const d = new Date(ms);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  return Math.round(
    (startOfDay(slotStartMs) - startOfDay(nowMs)) / 86_400_000,
  );
}

/** `daysAhead` is the number of calendar days allowed starting today (today = offset 0). */
export function publicSlotOutsideBookingHorizon(
  slotStartMs: number,
  nowMs: number,
  daysAhead: number,
): boolean {
  const off = localCalendarDayOffsetFromNow(slotStartMs, nowMs);
  return off < 0 || off >= daysAhead;
}
