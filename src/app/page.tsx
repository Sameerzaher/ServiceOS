"use client";

import { useMemo, useState } from "react";

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
import { exportLessonsCsv, exportStudentsCsv } from "@/features/export/csvExport";
import { AppointmentFiltersBar } from "@/features/appointments/components/AppointmentFiltersBar";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { AppointmentList } from "@/features/appointments/components/AppointmentList";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { RemindersPanel } from "@/features/dashboard/components/RemindersPanel";
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

  const onboardingPhase = useMemo((): "client" | "appointment" | null => {
    if (!dataReady) return null;
    if (sortedClients.length === 0) return "client";
    if (sortedAppointments.length === 0) return "appointment";
    return null;
  }, [dataReady, sortedClients.length, sortedAppointments.length]);

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  function handleConfirmDelete(): void {
    if (!confirm) return;
    if (confirm.kind === "client") {
      deleteAppointmentsForClient(confirm.id);
      deleteClient(confirm.id);
      if (editingClientId === confirm.id) setEditingClientId(null);
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
      addClient(data);
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
    toast(heUi.toast.demoLoaded);
  }

  function resetData(): void {
    replaceClients([]);
    replaceAppointments([]);
    setEditingClientId(null);
    setEditingAppointmentId(null);
    setAppointmentPrefillClientId(null);
    toast(heUi.toast.demoReset);
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

      <div className={ui.pageStack}>
        {onboardingPhase ? (
          <FirstRunOnboarding phase={onboardingPhase} />
        ) : null}

        {isStorageEmpty ? (
          <section className={ui.section}>
            <EmptyState
              tone="muted"
              title={heUi.demo.bannerTitle}
              description={heUi.demo.bannerDescription}
              className="border border-dashed border-neutral-300 bg-white py-8"
            />
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={loadDemo}
                className="rounded-lg bg-neutral-900 px-5 py-2.5 text-base font-medium text-white shadow-sm transition hover:bg-neutral-800"
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
            <DemoExportBar
              onLoadDemo={loadDemo}
              onReset={resetData}
              onExportStudents={() => {
                exportStudentsCsv(sortedClients);
                toast(heUi.toast.exportStudents);
              }}
              onExportLessons={() => {
                exportLessonsCsv(sortedAppointments, sortedClients);
                toast(heUi.toast.exportLessons);
              }}
            />
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
                }}
              />
            </>
          )}
        </section>

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>{heUi.sections.summary}</h2>
          {!dataReady ? (
            <LoadingState message={heUi.loading.summary} />
          ) : (
            <Dashboard
              appointments={sortedAppointments}
              clients={sortedClients}
              preset={preset}
              onTogglePaid={handleToggleAppointmentPaid}
            />
          )}
        </section>

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>{heUi.sections.reminders}</h2>
          {!dataReady ? (
            <LoadingState message={heUi.loading.default} />
          ) : (
            <RemindersPanel
              appointments={sortedAppointments}
              clients={sortedClients}
              reminderTemplate={settings.reminderTemplate}
              onCopied={() => toast(heUi.toast.reminderCopied)}
            />
          )}
        </section>

        <section
          id={ONBOARDING_ANCHORS.clientForm}
          className={cn(
            ui.section,
            onboardingPhase === "client" &&
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
            onboardingPhase === "appointment" &&
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
                addAppointment(data);
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
