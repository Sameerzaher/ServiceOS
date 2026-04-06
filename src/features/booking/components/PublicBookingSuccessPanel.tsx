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
  /** Softer branded success card for Hilai Nails demo. */
  variant?: "default" | "hilai";
}

export function PublicBookingSuccessPanel({
  instructorPhone,
  slotStart,
  slotEnd,
  onBookAnother,
  variant = "default",
}: PublicBookingSuccessPanelProps) {
  const wa = publicInstructorWhatsAppHref(instructorPhone, slotStart, slotEnd);
  const isHilai = variant === "hilai";

  return (
    <section
      className={cn(
        ui.formCard,
        "space-y-4 p-4 sm:p-5",
        isHilai
          ? "border-rose-200/50 bg-gradient-to-br from-[#fff9fb] via-white to-[#faf5ff] shadow-[0_20px_50px_-28px_rgba(170,130,150,0.25)] dark:border-rose-900/40 dark:from-rose-950/40 dark:to-stone-950/40"
          : "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-800/60 dark:bg-emerald-950/40",
      )}
      aria-live="polite"
    >
      <div>
        <h2
          className={cn(
            "text-base font-semibold sm:text-lg",
            isHilai
              ? "text-stone-800 dark:text-rose-50"
              : "text-emerald-950 dark:text-emerald-100",
          )}
        >
          {heUi.publicBooking.successTitle}
        </h2>
        <p
          className={cn(
            "mt-2 text-xs leading-relaxed sm:text-sm",
            isHilai
              ? "text-stone-600 dark:text-stone-300"
              : "text-emerald-900/90 dark:text-emerald-100/90",
          )}
        >
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
              "inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl border-2 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto",
              isHilai
                ? "border-rose-300/80 bg-gradient-to-r from-[#e8a0b3] via-[#d4a5c9] to-[#c4b5d4] shadow-[0_12px_32px_-16px_rgba(160,110,140,0.45)] hover:brightness-[1.04] focus-visible:outline-rose-400/60"
                : "border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-900/20 hover:from-emerald-700 hover:to-emerald-800 focus-visible:outline-emerald-700",
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
