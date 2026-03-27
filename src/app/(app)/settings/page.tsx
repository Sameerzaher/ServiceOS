"use client";

import { useEffect, useRef } from "react";

import { appPageTitle, heUi } from "@/config";
import {
  DataLoadErrorBanner,
  InlineLoading,
  ui,
  useToast,
} from "@/components/ui";
import { setDemoModeActive } from "@/core/demo/demoMode";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import { BackupRestoreSection } from "@/features/settings/components/BackupRestoreSection";
import { SettingsPanel } from "@/features/settings/components/SettingsPanel";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";

type SettingsApiShape = {
  businessName: string;
  teacherName: string;
  phone: string;
  defaultLessonDuration: number;
  bookingEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  bufferBetweenLessons: number;
};

type SettingsApiResponse =
  | { ok: true; settings: SettingsApiShape }
  | { ok: false; error: string };

export default function SettingsPage() {
  const toast = useToast();
  const dashboardTeacherId = useDashboardTeacherId();
  const {
    preset,
    settings,
    settingsReady,
    replaceSettings,
    availabilitySettings,
    updateAvailabilitySettings,
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
  const initializedFromApiRef = useRef(false);

  useEffect(() => {
    if (initializedFromApiRef.current) return;
    initializedFromApiRef.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/settings", { method: "GET" });
        const data = (await res.json()) as SettingsApiResponse;
        if (!res.ok || data.ok !== true) return;
        if (cancelled) return;
        replaceSettings({
          ...settings,
          businessName: data.settings.businessName,
          teacherName: data.settings.teacherName,
          businessPhone: data.settings.phone,
          defaultLessonDurationMinutes: data.settings.defaultLessonDuration,
          lessonBufferMinutes: data.settings.bufferBetweenLessons,
          workingHoursStart: data.settings.workingHoursStart,
          workingHoursEnd: data.settings.workingHoursEnd,
        });
        updateAvailabilitySettings({
          ...availabilitySettings,
          bookingEnabled: data.settings.bookingEnabled,
        });
      } catch (e) {
        console.error("[ServiceOS] settings page load", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    dashboardTeacherId,
    replaceSettings,
    settings,
    updateAvailabilitySettings,
    availabilitySettings,
  ]);

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
            <InlineLoading className="py-4" />
          ) : (
            <>
              <SettingsPanel
                settings={settings}
                availabilitySettings={availabilitySettings}
                onSave={async (next, nextAvailability) => {
                  const payload: SettingsApiShape = {
                    businessName: next.businessName,
                    teacherName: next.teacherName,
                    phone: next.businessPhone,
                    defaultLessonDuration: next.defaultLessonDurationMinutes,
                    bookingEnabled: nextAvailability.bookingEnabled,
                    workingHoursStart: next.workingHoursStart,
                    workingHoursEnd: next.workingHoursEnd,
                    bufferBetweenLessons: next.lessonBufferMinutes,
                  };
                  try {
                    const res = await fetch("/api/settings", {
                      method: "PUT",
                      headers: mergeTeacherScopeHeaders(dashboardTeacherId, {
                        "Content-Type": "application/json",
                      }),
                      body: JSON.stringify(payload),
                    });
                    const data = (await res.json()) as SettingsApiResponse;
                    if (!res.ok || data.ok !== true) {
                      toast(
                        data.ok === false ? data.error : heUi.data.syncFailedTitle,
                        "error",
                      );
                      return false;
                    }
                    replaceSettings(next);
                    updateAvailabilitySettings(nextAvailability);
                    toast(heUi.toast.settingsSaved);
                    return true;
                  } catch (e) {
                    console.error("[ServiceOS] settings page save", e);
                    toast(heUi.data.syncFailedTitle, "error");
                    return false;
                  }
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
