"use client";

import {
  appPageTitle,
  getActiveVerticalPreset,
  heUi,
} from "@/config";
import { LoadingState, ui, useToast } from "@/components/ui";
import { setDemoModeActive } from "@/core/demo/demoMode";
import { BackupRestoreSection } from "@/features/settings/components/BackupRestoreSection";
import { SettingsPanel } from "@/features/settings/components/SettingsPanel";
import { useServiceApp } from "@/features/app/ServiceAppProvider";

export default function SettingsPage() {
  const toast = useToast();
  const preset = getActiveVerticalPreset();
  const {
    settings,
    settingsReady,
    replaceSettings,
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
