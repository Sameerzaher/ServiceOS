"use client";

import { useRouter } from "next/navigation";

import { appTagline, heUi } from "@/config";
import {
  DataLoadErrorBanner,
  EmptyState,
  LoadingState,
  ui,
  useToast,
} from "@/components/ui";
import { DemoExportBar } from "@/features/demo/components/DemoExportBar";
import { ExportLessonsPanel } from "@/features/export/components/ExportLessonsPanel";
import { exportStudentsCsv } from "@/features/export/csvExport";
import { HomeQuickDashboard } from "@/features/dashboard/components/HomeQuickDashboard";
import { saveFirstRunOnboardingState } from "@/core/onboarding/firstRun";
import {
  FirstRunOnboarding,
  ONBOARDING_ANCHORS,
} from "@/features/onboarding/components/FirstRunOnboarding";
import { useServiceApp } from "@/features/app/ServiceAppProvider";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const {
    preset,
    settings,
    sortedClients,
    sortedAppointments,
    dataReady,
    isStorageEmpty,
    demoActive,
    handleRequestLoadDemo,
    setDemoResetOpen,
    onboardingDismissed,
    remindersReviewed,
    setRemindersReviewed,
    setOnboardingDismissed,
    displayTitle,
    clientsLoadError,
    clientsSyncError,
    retryClientsLoad,
    retryClientsSync,
    appointmentsLoadError,
    appointmentsSyncError,
    retryAppointmentsLoad,
    retryAppointmentsSync,
    settingsLoadError,
    settingsSyncError,
    retrySettingsLoad,
    retrySettingsSync,
    availabilityLoadError,
    availabilitySyncError,
    retryAvailabilityLoad,
    retryAvailabilitySync,
  } = useServiceApp();

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={ui.pageSubtitle}>{appTagline(preset)}</p>
      </header>

      <div className={ui.pageStack}>
        <div className="flex flex-col gap-3">
          {clientsLoadError ? (
            <DataLoadErrorBanner
              title={clientsLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retryClientsLoad}
            />
          ) : null}
          {clientsSyncError ? (
            <DataLoadErrorBanner
              title={clientsSyncError}
              description={heUi.data.syncFailedHint}
              onRetry={retryClientsSync}
            />
          ) : null}
          {appointmentsLoadError ? (
            <DataLoadErrorBanner
              title={appointmentsLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retryAppointmentsLoad}
            />
          ) : null}
          {appointmentsSyncError ? (
            <DataLoadErrorBanner
              title={appointmentsSyncError}
              description={heUi.data.syncFailedHint}
              onRetry={retryAppointmentsSync}
            />
          ) : null}
          {settingsLoadError ? (
            <DataLoadErrorBanner
              title={settingsLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retrySettingsLoad}
            />
          ) : null}
          {settingsSyncError ? (
            <DataLoadErrorBanner
              title={settingsSyncError}
              description={heUi.data.syncFailedHint}
              onRetry={retrySettingsSync}
            />
          ) : null}
          {availabilityLoadError ? (
            <DataLoadErrorBanner
              title={availabilityLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retryAvailabilityLoad}
            />
          ) : null}
          {availabilitySyncError ? (
            <DataLoadErrorBanner
              title={availabilitySyncError}
              description={heUi.data.syncFailedHint}
              onRetry={retryAvailabilitySync}
            />
          ) : null}
        </div>
        {demoActive ? (
          <section className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-violet-900">
                  {heUi.demo.activeBadge}
                </p>
                <p className="text-sm text-violet-900/90">
                  {heUi.demo.activeDescription}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="inline-flex min-h-[2.5rem] items-center justify-center rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-900 transition hover:bg-violet-100"
                  onClick={handleRequestLoadDemo}
                >
                  {heUi.demo.reloadDemo}
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-[2.5rem] items-center justify-center rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-900 transition hover:bg-violet-100"
                  onClick={() => setDemoResetOpen(true)}
                >
                  {heUi.demo.returnToEmpty}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {!onboardingDismissed ? (
          <FirstRunOnboarding
            hasClient={sortedClients.length > 0}
            hasAppointment={sortedAppointments.length > 0}
            remindersReviewed={remindersReviewed}
            onMarkRemindersReviewed={() => {
              const next = { dismissed: false, remindersReviewed: true };
              saveFirstRunOnboardingState(next);
              setRemindersReviewed(true);
            }}
            onDismiss={() => {
              const next = { dismissed: true, remindersReviewed };
              saveFirstRunOnboardingState(next);
              setOnboardingDismissed(true);
            }}
          />
        ) : null}

        {isStorageEmpty ? (
          <section className={ui.section}>
            <EmptyState
              tone="muted"
              title={heUi.demo.bannerTitle}
              description={heUi.demo.bannerDescription}
              className="border border-dashed border-neutral-300 bg-white py-8"
            />
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={handleRequestLoadDemo}
                className="min-h-[2.75rem] rounded-lg bg-neutral-900 px-6 py-2.5 text-base font-medium text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.99]"
              >
                {heUi.demo.load}
              </button>
            </div>
          </section>
        ) : null}

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>{heUi.sections.demo}</h2>
          {!dataReady ? (
            <LoadingState message={heUi.loading.default} />
          ) : (
            <div className="space-y-4">
              <DemoExportBar
                onLoadDemo={handleRequestLoadDemo}
                onRequestReset={() => setDemoResetOpen(true)}
                onExportStudents={() => {
                  if (sortedClients.length === 0) {
                    toast(heUi.export.noStudentsToExport, "error");
                    return;
                  }
                  exportStudentsCsv(sortedClients);
                  toast(heUi.toast.exportStudents);
                }}
              />
              <ExportLessonsPanel
                appointments={sortedAppointments}
                clients={sortedClients}
              />
            </div>
          )}
        </section>

        <section id={ONBOARDING_ANCHORS.summary} className={ui.section}>
          <h2 className={ui.sectionHeading}>{heUi.sections.summary}</h2>
          {!dataReady ? (
            <LoadingState message={heUi.loading.summary} />
          ) : (
            <HomeQuickDashboard
              appointments={sortedAppointments}
              clients={sortedClients}
              lessonLabelPlural={preset.labels.lessons}
              reminderTemplate={settings.reminderTemplate}
              businessName={settings.businessName}
              businessPhone={settings.businessPhone}
              onReminderCopied={() => toast(heUi.toast.reminderCopied)}
              onQuickAddClient={() => {
                router.push("/clients");
              }}
              onQuickAddAppointment={() => {
                router.push("/appointments");
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
