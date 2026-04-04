"use client";

import { heUi } from "@/config";
import { Button } from "@/components/ui/Button";
import { ui } from "@/components/ui/theme";
import { publicInstructorWhatsAppHref } from "@/lib/booking/publicBookingWhatsApp";
import { cn } from "@/lib/cn";

export interface PublicBookingSuccessPanelProps {
  instructorPhone: string;
  slotStart: string;
  slotEnd: string;
  onBookAnother: () => void;
}

export function PublicBookingSuccessPanel({
  instructorPhone,
  slotStart,
  slotEnd,
  onBookAnother,
}: PublicBookingSuccessPanelProps) {
  const wa = publicInstructorWhatsAppHref(instructorPhone, slotStart, slotEnd);

  return (
    <section
      className={cn(
        ui.formCard,
        "space-y-4 border-emerald-200/80 bg-emerald-50/90 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/40 sm:p-5",
      )}
      aria-live="polite"
    >
      <div>
        <h2 className="text-base font-semibold text-emerald-950 dark:text-emerald-100 sm:text-lg">
          {heUi.publicBooking.successTitle}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-100/90 sm:text-sm">
          {heUi.publicBooking.inlineSuccess}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl border-2 border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:from-emerald-700 hover:to-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:w-auto",
            )}
          >
            {heUi.publicBooking.whatsappConfirmButton}
          </a>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="w-full min-h-[2.75rem] text-xs sm:w-auto sm:text-sm"
          onClick={onBookAnother}
        >
          {heUi.publicBooking.bookAnotherButton}
        </Button>
      </div>
    </section>
  );
}
