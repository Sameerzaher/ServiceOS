"use client";

import { heUi } from "@/config";
import { EmptyState, ui } from "@/components/ui";
import type { AvailableSlot } from "@/features/booking/utils/generateAvailableSlots";

export interface BookingSlotPickerProps {
  availableSlots: readonly AvailableSlot[];
  selectedSlotStart?: string | null;
  onSelect: (slot: AvailableSlot) => void;
  emptyTitle?: string;
  emptyDescription?: string;
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
  emptyTitle = "אין כרגע שעות פנויות ביום הזה",
  emptyDescription = "בחרו תאריך אחר או נסו שוב בהמשך.",
}: BookingSlotPickerProps) {
  if (availableSlots.length === 0) {
    return (
      <EmptyState
        tone="muted"
        className="py-8"
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-900">
        {heUi.publicBooking.slotHeading}
      </h3>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {availableSlots.map((slot) => {
          const selected = selectedSlotStart === slot.slotStart;
          return (
            <li key={slot.slotStart}>
              <button
                type="button"
                onClick={() => onSelect(slot)}
                aria-pressed={selected}
                className={[
                  ui.input,
                  "min-h-[3rem] justify-center text-center font-medium",
                  selected
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-neutral-900 hover:bg-neutral-50",
                ].join(" ")}
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

