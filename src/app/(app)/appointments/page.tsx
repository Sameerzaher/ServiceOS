"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import {
  appPageTitle,
  heUi,
} from "@/config";
import {
  DataLoadErrorBanner,
  InlineLoading,
  ui,
  useToast,
} from "@/components/ui";
import { AppointmentFiltersBar } from "@/features/appointments/components/AppointmentFiltersBar";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { AppointmentList } from "@/features/appointments/components/AppointmentList";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { cn } from "@/lib/cn";
import { ONBOARDING_ANCHORS } from "@/features/onboarding/components/FirstRunOnboarding";

function AppointmentsPageContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const {
    preset,
    settings,
    sortedClients,
    sortedAppointments,
    appointmentsReady,
    appointmentsLoadError,
    appointmentsSyncError,
    retryAppointmentsLoad,
    retryAppointmentsSync,
    dateFilter,
    setDateFilter,
    paymentFilter,
    setPaymentFilter,
    appointmentSort,
    setAppointmentSort,
    filteredAppointments,
    editingAppointmentId,
    setEditingAppointmentId,
    appointmentPrefillClientId,
    setAppointmentPrefillClientId,
    editingAppointment,
    handleToggleAppointmentPaid,
    handleApprovePublicBooking,
    handleApproveAndSendPublicBookingWhatsapp,
    handleRejectPublicBooking,
    setConfirm,
    addAppointment,
    updateAppointment,
    needsFirstAppointment,
  } = useServiceApp();

  useEffect(() => {
    const raw = searchParams.get("prefillClient");
    if (raw) {
      setAppointmentPrefillClientId(raw);
      setEditingAppointmentId(null);
    }
  }, [searchParams, setAppointmentPrefillClientId, setEditingAppointmentId]);

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={ui.pageSubtitle}>{preset.labels.lessons}</p>
      </header>

      <div className={ui.pageStack}>
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
          <h2 className={ui.sectionHeading}>{preset.labels.lessons}</h2>
          {!appointmentsReady ? (
            <InlineLoading className="py-2" />
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
                onApproveRequest={handleApprovePublicBooking}
                onApproveAndSendWhatsapp={handleApproveAndSendPublicBookingWhatsapp}
                onRejectRequest={handleRejectPublicBooking}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <main className={ui.pageMain}>
          <div className="flex min-h-[40vh] items-center justify-center px-4">
            <InlineLoading />
          </div>
        </main>
      }
    >
      <AppointmentsPageContent />
    </Suspense>
  );
}
