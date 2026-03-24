"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  appPageTitle,
  appTagline,
  getActiveVerticalPreset,
  heUi,
} from "@/config";
import {
  ConfirmDialog,
  EmptyState,
  LoadingState,
  ui,
  useToast,
} from "@/components/ui";
import { DEMO_SETTINGS, buildDemoDataset } from "@/core/demo/demoSeed";
import { isDemoModeActive, setDemoModeActive } from "@/core/demo/demoMode";
import {
  loadFirstRunOnboardingState,
  saveFirstRunOnboardingState,
} from "@/core/onboarding/firstRun";
import { PaymentStatus } from "@/core/types/appointment";
import { isPaidStatus } from "@/core/utils/insights";
import {
  filterAppointments,
  matchesClientSearch,
  sortAppointments,
  type AppointmentSort,
  type PaymentFilter,
} from "@/core/utils/appointmentFilters";
import type { AppointmentDateFilter } from "@/core/utils/dateRange";
import { DemoExportBar } from "@/features/demo/components/DemoExportBar";
import { ExportLessonsPanel } from "@/features/export/components/ExportLessonsPanel";
import { exportStudentsCsv } from "@/features/export/csvExport";
import { AppointmentFiltersBar } from "@/features/appointments/components/AppointmentFiltersBar";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { AppointmentList } from "@/features/appointments/components/AppointmentList";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { AvailabilitySettingsForm } from "@/features/booking/components/AvailabilitySettingsForm";
import { useAvailabilitySettings } from "@/features/booking/hooks/useAvailabilitySettings";
import { HomeQuickDashboard } from "@/features/dashboard/components/HomeQuickDashboard";
import { ClientForm } from "@/features/clients/components/ClientForm";
import { ClientList } from "@/features/clients/components/ClientList";
import { useClients } from "@/features/clients/hooks/useClients";
import type { NewClientInput } from "@/features/clients/hooks/useClients";
import {
  FirstRunOnboarding,
  ONBOARDING_ANCHORS,
} from "@/features/onboarding/components/FirstRunOnboarding";
import { BackupRestoreSection } from "@/features/settings/components/BackupRestoreSection";
import { SettingsPanel } from "@/features/settings/components/SettingsPanel";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { cn } from "@/lib/cn";

function togglePaymentStatus(current: PaymentStatus): PaymentStatus {
  return isPaidStatus(current) ? PaymentStatus.Unpaid : PaymentStatus.Paid;
}

export default function HomePage() {
  const preset = getActiveVerticalPreset();
  const toast = useToast();
  const { settings, isReady: settingsReady, replaceSettings } = useSettings();
  const {
    settings: availabilitySettings,
    updateSettings: updateAvailabilitySettings,
    resetSettings: resetAvailabilitySettings,
  } = useAvailabilitySettings();
  const {
    sortedClients,
    addClient,
    updateClient,
    deleteClient,
    replaceClients,
    isReady: clientsReady,
  } = useClients();
  const {
    sortedAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    deleteAppointmentsForClient,
    replaceAppointments,
    isReady: appointmentsReady,
  } = useAppointments();

  const [clientSearch, setClientSearch] = useState("");
  const [dateFilter, setDateFilter] =
    useState<AppointmentDateFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [appointmentSort, setAppointmentSort] =
    useState<AppointmentSort>("date");
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [appointmentPrefillClientId, setAppointmentPrefillClientId] =
    useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    null | { kind: "client" | "appointment"; id: string }
  >(null);
  const [demoResetOpen, setDemoResetOpen] = useState(false);
  const [demoLoadOpen, setDemoLoadOpen] = useState(false);
  const [demoActive, setDemoActive] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [remindersReviewed, setRemindersReviewed] = useState(false);

  const referenceDate = useMemo(() => new Date(), []);

  const filteredClients = useMemo(
    () => sortedClients.filter((c) => matchesClientSearch(c, clientSearch)),
    [sortedClients, clientSearch],
  );

  const clientMap = useMemo(
    () => new Map(sortedClients.map((c) => [c.id, c])),
    [sortedClients],
  );

  const filteredAppointments = useMemo(() => {
    const base = filterAppointments(sortedAppointments, {
      dateFilter,
      paymentFilter,
    });
    return sortAppointments(base, appointmentSort, clientMap);
  }, [
    sortedAppointments,
    dateFilter,
    paymentFilter,
    appointmentSort,
    clientMap,
  ]);

  const editingClient = editingClientId
    ? sortedClients.find((c) => c.id === editingClientId) ?? null
    : null;

  const editingAppointment = editingAppointmentId
    ? sortedAppointments.find((a) => a.id === editingAppointmentId) ?? null
    : null;

  const dataReady = clientsReady && appointmentsReady && settingsReady;
  const isStorageEmpty =
    dataReady &&
    sortedClients.length === 0 &&
    sortedAppointments.length === 0;
  const hasAnyData =
    sortedClients.length > 0 || sortedAppointments.length > 0;

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  useEffect(() => {
    setDemoActive(isDemoModeActive());
    const onboarding = loadFirstRunOnboardingState();
    setOnboardingDismissed(onboarding.dismissed);
    setRemindersReviewed(onboarding.remindersReviewed);
  }, []);

  const onboardingCompleted =
    sortedClients.length > 0 && sortedAppointments.length > 0 && remindersReviewed;
  const needsFirstClient = sortedClients.length === 0;
  const needsFirstAppointment = sortedAppointments.length === 0;

  useEffect(() => {
    if (!dataReady) return;
    if (!onboardingDismissed && onboardingCompleted) {
      const next = { dismissed: true, remindersReviewed: true };
      saveFirstRunOnboardingState(next);
      setOnboardingDismissed(true);
    }
  }, [dataReady, onboardingDismissed, onboardingCompleted]);

  useEffect(() => {
    if (!dataReady) return;
    if (!hasAnyData && demoActive) {
      setDemoModeActive(false);
      setDemoActive(false);
    }
  }, [dataReady, hasAnyData, demoActive]);

  function handleConfirmDelete(): void {
    if (!confirm) return;
    if (confirm.kind === "client") {
      const deletedClientId = confirm.id;
      deleteAppointmentsForClient(confirm.id);
      deleteClient(confirm.id);
      if (editingClientId === confirm.id) setEditingClientId(null);
      if (
        editingAppointmentId &&
        sortedAppointments.some(
          (a) => a.id === editingAppointmentId && a.clientId === deletedClientId,
        )
      ) {
        setEditingAppointmentId(null);
      }
      if (appointmentPrefillClientId === deletedClientId) {
        setAppointmentPrefillClientId(null);
      }
      toast(heUi.toast.clientDeleted);
    } else {
      deleteAppointment(confirm.id);
      if (editingAppointmentId === confirm.id) {
        setEditingAppointmentId(null);
      }
      toast(heUi.toast.lessonDeleted);
    }
    setConfirm(null);
  }

  function handleToggleAppointmentPaid(id: string): void {
    const row = sortedAppointments.find((a) => a.id === id);
    if (!row) return;
    updateAppointment(id, {
      paymentStatus: togglePaymentStatus(row.paymentStatus),
    });
    toast(heUi.toast.paymentToggled);
  }

  function handleClientSubmit(data: NewClientInput): void {
    if (editingClientId) {
      updateClient(editingClientId, data);
      setEditingClientId(null);
      toast(heUi.toast.clientUpdated);
    } else {
      const row = addClient(data);
      if (!row) {
        toast(heUi.toast.actionFailed, "error");
        return;
      }
      toast(heUi.toast.clientCreated);
    }
  }

  function loadDemo(): void {
    const { clients, appointments } = buildDemoDataset();
    replaceClients(clients);
    replaceAppointments(appointments);
    replaceSettings(DEMO_SETTINGS);
    setEditingClientId(null);
    setEditingAppointmentId(null);
    setAppointmentPrefillClientId(null);
    setDemoModeActive(true);
    setDemoActive(true);
    toast(heUi.toast.demoLoaded);
  }

  function resetData(): void {
    replaceClients([]);
    replaceAppointments([]);
    setEditingClientId(null);
    setEditingAppointmentId(null);
    setAppointmentPrefillClientId(null);
    setDemoModeActive(false);
    setDemoActive(false);
    toast(heUi.toast.demoReset);
  }

  function handleConfirmDemoReset(): void {
    resetData();
    setDemoResetOpen(false);
  }

  function handleRequestLoadDemo(): void {
    if (!dataReady) return;
    if (hasAnyData) {
      setDemoLoadOpen(true);
      return;
    }
    loadDemo();
  }

  function handleConfirmDemoLoad(): void {
    setDemoLoadOpen(false);
    loadDemo();
  }

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={ui.pageSubtitle}>{appTagline(preset)}</p>
      </header>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === "client"
            ? heUi.dialog.deleteClientTitle
            : heUi.dialog.deleteAppointmentTitle
        }
        message={
          confirm?.kind === "client"
            ? heUi.dialog.deleteClientMessage
            : heUi.dialog.deleteAppointmentMessage
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={demoResetOpen}
        title={heUi.dialog.resetDemoTitle}
        message={heUi.dialog.resetDemoMessage}
        confirmLabel={heUi.dialog.confirm}
        confirmVariant="danger"
        onConfirm={handleConfirmDemoReset}
        onCancel={() => setDemoResetOpen(false)}
      />

      <ConfirmDialog
        open={demoLoadOpen}
        title={heUi.dialog.loadDemoTitle}
        message={heUi.dialog.loadDemoMessage}
        confirmLabel={heUi.demo.load}
        confirmVariant="primary"
        onConfirm={handleConfirmDemoLoad}
        onCancel={() => setDemoLoadOpen(false)}
      />

      <div className={ui.pageStack}>
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

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>{heUi.sections.settings}</h2>
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
              <div className={cn(ui.formCard, "space-y-4")}>
                <h3 className="text-base font-semibold text-neutral-900 sm:text-lg">
                  {heUi.settings.bookingTitle}
                </h3>
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
                setEditingClientId(null);
                window.requestAnimationFrame(() => {
                  document
                    .getElementById(ONBOARDING_ANCHORS.clientForm)
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                });
              }}
              onQuickAddAppointment={() => {
                setEditingAppointmentId(null);
                setAppointmentPrefillClientId(null);
                window.requestAnimationFrame(() => {
                  document
                    .getElementById(ONBOARDING_ANCHORS.lessonForm)
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                });
              }}
            />
          )}
        </section>

        <section
          id={ONBOARDING_ANCHORS.clientForm}
          className={cn(
            ui.section,
            needsFirstClient &&
              "scroll-mt-6 rounded-xl ring-2 ring-amber-400/90 ring-offset-2 ring-offset-neutral-50",
          )}
        >
          <h2 className={ui.sectionHeading}>
            {editingClientId
              ? preset.labels.editStudent
              : preset.labels.addStudent}
          </h2>
          <ClientForm
            key={editingClientId ?? "new-client"}
            preset={preset}
            initialClient={editingClient}
            onCancelEdit={() => setEditingClientId(null)}
            onSubmit={handleClientSubmit}
          />
        </section>

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>
            {preset.labels.students}
          </h2>
          <div className="mb-4">
            <label htmlFor="client-search" className="sr-only">
              {heUi.forms.searchClients}
            </label>
            <input
              id="client-search"
              type="search"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder={heUi.forms.searchClients}
              className={ui.input}
              autoComplete="off"
            />
          </div>
          {!clientsReady ? (
            <LoadingState message={heUi.loading.students} />
          ) : (
            <ClientList
              clients={filteredClients}
              totalClientCount={sortedClients.length}
              preset={preset}
              appointments={sortedAppointments}
              referenceDate={referenceDate}
              highlightedClientId={editingClientId}
              onEdit={(id) => setEditingClientId(id)}
              onAddLessonForClient={(id) => {
                setAppointmentPrefillClientId(id);
                setEditingAppointmentId(null);
                window.requestAnimationFrame(() => {
                  document
                    .getElementById(ONBOARDING_ANCHORS.lessonForm)
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                });
              }}
              onRequestDelete={(id) =>
                setConfirm({ kind: "client", id })
              }
            />
          )}
        </section>

        <section
          id={ONBOARDING_ANCHORS.lessonForm}
          className={cn(
            ui.section,
            needsFirstAppointment &&
              "scroll-mt-6 rounded-xl ring-2 ring-amber-400/90 ring-offset-2 ring-offset-neutral-50",
          )}
        >
          <h2 className={ui.sectionHeading}>
            {editingAppointmentId
              ? heUi.forms.editLesson
              : preset.labels.addLesson}
          </h2>
          <AppointmentForm
            key={editingAppointmentId ?? "new-appointment"}
            preset={preset}
            clients={sortedClients}
            initialAppointment={editingAppointment}
            defaultAmount={settings.defaultLessonPrice}
            defaultLessonDurationMinutes={
              settings.defaultLessonDurationMinutes
            }
            prefillClientId={appointmentPrefillClientId}
            onCancelEdit={() => {
              setEditingAppointmentId(null);
              setAppointmentPrefillClientId(null);
            }}
            onSubmit={(data) => {
              if (editingAppointmentId) {
                updateAppointment(editingAppointmentId, data);
                setEditingAppointmentId(null);
                toast(heUi.toast.lessonUpdated);
              } else {
                const row = addAppointment(data);
                if (!row) {
                  toast(heUi.toast.actionFailed, "error");
                  return;
                }
                setAppointmentPrefillClientId(null);
                toast(heUi.toast.lessonCreated);
              }
            }}
          />
        </section>

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>
            {preset.labels.lessons}
          </h2>
          {!appointmentsReady ? (
            <LoadingState message={heUi.loading.lessons} />
          ) : (
            <>
              <AppointmentFiltersBar
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                paymentFilter={paymentFilter}
                onPaymentFilterChange={setPaymentFilter}
                sort={appointmentSort}
                onSortChange={setAppointmentSort}
                className="mb-4"
              />
              <AppointmentList
                appointments={filteredAppointments}
                totalAppointmentCount={sortedAppointments.length}
                clients={sortedClients}
                preset={preset}
                highlightedAppointmentId={editingAppointmentId}
                onRequestDelete={(id) =>
                  setConfirm({ kind: "appointment", id })
                }
                onEdit={(id) => {
                  setEditingAppointmentId(id);
                  setAppointmentPrefillClientId(null);
                }}
                onTogglePaid={handleToggleAppointmentPaid}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
