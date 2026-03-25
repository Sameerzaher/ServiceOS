"use client";

import { appPageTitle, heUi } from "@/config";
import {
  DataLoadErrorBanner,
  LoadingState,
  ui,
  useToast,
} from "@/components/ui";
import { setDemoModeActive } from "@/core/demo/demoMode";
import { BackupRestoreSection } from "@/features/settings/components/BackupRestoreSection";
import { SettingsPanel } from "@/features/settings/components/SettingsPanel";
import { useServiceApp } from "@/features/app/ServiceAppProvider";

export default function SettingsPage() {
  const toast = useToast();
  const {
    preset,
    settings,
    settingsReady,
    replaceSettings,
    settingsLoadError,
    settingsSyncError,
    retrySettingsLoad,
    retrySettingsSync,
    clientsLoadError,
    clientsSyncError,
    retryClientsLoad,
    retryClientsSync,
    appointmentsLoadError,
    appointmentsSyncError,
    retryAppointmentsLoad,
    retryAppointmentsSync,
    sortedClients,
    sortedAppointments,
    replaceClients,
    replaceAppointments,
    setEditingClientId,
    setEditingAppointmentId,
    setAppointmentPrefillClientId,
    setDemoActive,
  } = useServiceApp();

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={ui.pageSubtitle}>{heUi.sections.settings}</p>
      </header>

      <div className={ui.pageStack}>
        <div className="flex flex-col gap-3">
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
        </div>
        <section className={ui.section}>
          {!settingsReady ? (
            <LoadingState message={heUi.loading.default} />
          ) : (
            <>
              <SettingsPanel
                settings={settings}
                onSave={(next) => {
                  replaceSettings(next);
                  toast(heUi.toast.settingsSaved);
                }}
              />
              <BackupRestoreSection
                clients={sortedClients}
                appointments={sortedAppointments}
                settings={settings}
                replaceClients={replaceClients}
                replaceAppointments={replaceAppointments}
                replaceSettings={replaceSettings}
                onAfterRestore={() => {
                  setEditingClientId(null);
                  setEditingAppointmentId(null);
                  setAppointmentPrefillClientId(null);
                  setDemoModeActive(false);
                  setDemoActive(false);
                }}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
