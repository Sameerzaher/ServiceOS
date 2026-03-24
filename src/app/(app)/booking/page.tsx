"use client";

import Link from "next/link";

import { appPageTitle, heUi } from "@/config";
import { ui } from "@/components/ui";
import { AvailabilitySettingsForm } from "@/features/booking/components/AvailabilitySettingsForm";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { cn } from "@/lib/cn";

export default function BookingSettingsPage() {
  const {
    preset,
    settings,
    availabilitySettings,
    updateAvailabilitySettings,
    resetAvailabilitySettings,
  } = useServiceApp();

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={ui.pageSubtitle}>{heUi.settings.bookingTitle}</p>
      </header>

      <div className={cn(ui.pageStack, ui.section)}>
        <p className="text-sm text-neutral-600">{heUi.settings.bookingHint}</p>
        <Link
          href="/book"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 sm:w-fit"
        >
          {heUi.settings.bookingPublicLink}
        </Link>
        <AvailabilitySettingsForm
          settings={availabilitySettings}
          onChange={(next) => updateAvailabilitySettings(next)}
          onReset={resetAvailabilitySettings}
        />
      </div>
    </main>
  );
}
