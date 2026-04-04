"use client";

import { heUi } from "@/config";
import { EmptyState } from "@/components/ui/EmptyState";
import { ui } from "@/components/ui/theme";
import type { AvailableSlot } from "@/features/booking/utils/generateAvailableSlots";
import { cn } from "@/lib/cn";

export interface BookingSlotPickerProps {
  availableSlots: readonly AvailableSlot[];
  selectedSlotStart?: string | null;
  onSelect: (slot: AvailableSlot) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Disables all slot buttons (e.g. while submitting). */
  disabled?: boolean;
}

function formatTimeRange(startIso: string, endIso: string): string {
  try {
    const fmt = new Intl.DateTimeFormat("he-IL", { timeStyle: "short" });
    return `${fmt.format(new Date(startIso))} - ${fmt.format(new Date(endIso))}`;
  } catch {
    return `${startIso} - ${endIso}`;
  }
}

export function BookingSlotPicker({
  availableSlots,
  selectedSlotStart = null,
  onSelect,
  emptyTitle,
  emptyDescription = "בחרו תאריך אחר או נסו שוב בהמשך.",
  disabled = false,
}: BookingSlotPickerProps) {
  const title = emptyTitle ?? heUi.publicBooking.slotsEmptyShort;
  if (availableSlots.length === 0) {
    return (
      <EmptyState
        tone="muted"
        className="py-8"
        title={title}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 sm:text-sm">
        {heUi.publicBooking.slotHeading}
      </h3>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {availableSlots.map((slot) => {
          const selected = selectedSlotStart === slot.slotStart;
          return (
            <li key={slot.slotStart}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(slot)}
                aria-pressed={selected}
                className={cn(
                  ui.input,
                  "min-h-[2.5rem] justify-center text-center text-xs font-medium sm:min-h-[3rem] sm:text-sm",
                  disabled && "cursor-not-allowed opacity-50",
                  selected
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-white text-neutral-900 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
                )}
              >
                {formatTimeRange(slot.slotStart, slot.slotEnd)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

