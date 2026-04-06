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
  /** Branded slot buttons for specific public demos (e.g. Hilai Nails). */
  tone?: "default" | "hilai";
  /** Overrides default slot section heading (e.g. warmer copy for Hilai). */
  slotHeadingOverride?: string;
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
  tone = "default",
  slotHeadingOverride,
}: BookingSlotPickerProps) {
  const title = emptyTitle ?? heUi.publicBooking.slotsEmptyShort;
  const slotHeadingText = slotHeadingOverride ?? heUi.publicBooking.slotHeading;
  if (availableSlots.length === 0) {
    return (
      <EmptyState
        tone="muted"
        className={cn(
          "py-10",
          tone === "hilai" &&
            "border-rose-100/50 bg-gradient-to-b from-rose-50/50 to-white/90 shadow-[0_4px_24px_-12px_rgba(200,150,165,0.15)] ring-rose-100/20",
        )}
        title={title}
        description={emptyDescription}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-transparent p-0 sm:p-0",
        tone === "hilai" && "border-stone-200/40 bg-stone-50/30 p-4 sm:p-5",
      )}
    >
      <div
        className={cn(
          tone === "hilai" ? "space-y-4" : "space-y-2.5 sm:space-y-3",
        )}
      >
        <h3
          className={cn(
            tone === "hilai"
              ? "text-sm font-medium text-stone-600 sm:text-[15px]"
              : "text-xs font-semibold text-neutral-900 dark:text-neutral-100 sm:text-sm",
          )}
        >
          {slotHeadingText}
        </h3>
        <ul
          className={cn(
            "grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3",
            tone === "hilai" && "gap-3",
          )}
        >
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
                    "min-h-[2.65rem] justify-center rounded-2xl text-center text-xs font-medium sm:min-h-[3rem] sm:text-sm",
                    disabled && "cursor-not-allowed opacity-50",
                    tone === "hilai"
                      ? selected
                        ? "border-transparent bg-gradient-to-br from-[#e8a0b3] via-[#d4a5c9] to-[#c4b5d4] text-white shadow-[0_10px_28px_-14px_rgba(180,120,150,0.55)] ring-1 ring-white/30"
                        : "border-stone-200/70 bg-white text-stone-700 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.06)] hover:border-rose-200/80 hover:bg-rose-50/50 hover:shadow-[0_8px_20px_-12px_rgba(200,150,165,0.2)] dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                      : selected
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
    </div>
  );
}

