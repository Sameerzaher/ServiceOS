export enum BookingRequestStatus {
  Confirmed = "confirmed",
  Cancelled = "cancelled",
}

export type BookingRequestId = string;

export interface BookingRequest {
  id: BookingRequestId;
  fullName: string;
  phone: string;
  /** ISO 8601 instant when the request was created. */
  requestedAt: string;
  /** ISO 8601 start/end of the requested booking slot. */
  slotStart: string;
  slotEnd: string;
  notes: string;
  status: BookingRequestStatus;
}

