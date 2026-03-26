"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  appPageTitle,
  heUi,
} from "@/config";
import {
  Button,
  DataLoadErrorBanner,
  LoadingState,
  Modal,
  ui,
} from "@/components/ui";
import { ClientForm } from "@/features/clients/components/ClientForm";
import { ClientList } from "@/features/clients/components/ClientList";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { cn } from "@/lib/cn";
import { ONBOARDING_ANCHORS } from "@/features/onboarding/components/FirstRunOnboarding";

export default function ClientsPage() {
  const router = useRouter();
  const {
    preset,
    settings,
    sortedClients,
    sortedAppointments,
    clientsReady,
    clientsLoadError,
    clientsSyncError,
    retryClientsLoad,
    retryClientsSync,
    clientSearch,
    setClientSearch,
    filteredClients,
    editingClientId,
    setEditingClientId,
    editingClient,
    referenceDate,
    handleClientSubmit,
    setConfirm,
    needsFirstClient,
  } = useServiceApp();

  const [addClientOpen, setAddClientOpen] = useState(false);

  useEffect(() => {
    if (needsFirstClient) setAddClientOpen(true);
  }, [needsFirstClient]);

  useEffect(() => {
    if (editingClientId !== null) setAddClientOpen(true);
  }, [editingClientId]);

  const clientModalOpen = addClientOpen || editingClientId !== null;

  function closeClientModal(): void {
    setAddClientOpen(false);
    setEditingClientId(null);
  }

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={ui.pageSubtitle}>{preset.labels.students}</p>
      </header>

      <div className={ui.pageStack}>
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
        <section
          id={ONBOARDING_ANCHORS.clientForm}
          className={cn(
            ui.section,
            needsFirstClient &&
              "scroll-mt-6 rounded-xl ring-2 ring-amber-400/90 ring-offset-2 ring-offset-neutral-50",
          )}
          aria-label={
            editingClientId
              ? preset.labels.editStudent
              : preset.labels.addStudent
          }
        >
          <div
            className={`${ui.card} ${ui.cardPadding} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4`}
          >
            <p className="text-sm leading-relaxed text-neutral-600 sm:max-w-md">
              {heUi.clientsPage.addClientTeaser}
            </p>
            <Button
              type="button"
              variant="primary"
              className="w-full shrink-0 sm:w-auto sm:min-w-[12rem]"
              onClick={() => setAddClientOpen(true)}
            >
              {preset.labels.addStudent}
            </Button>
          </div>
        </section>

        <Modal
          open={clientModalOpen}
          onClose={closeClientModal}
          title={
            editingClientId
              ? preset.labels.editStudent
              : preset.labels.addStudent
          }
          size="lg"
        >
          <ClientForm
            key={editingClientId ?? "new-client"}
            preset={preset}
            initialClient={editingClient}
            embedded
            onCancelEdit={closeClientModal}
            onSubmit={(data) => {
              if (handleClientSubmit(data)) closeClientModal();
            }}
          />
        </Modal>

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>{preset.labels.students}</h2>
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
                setEditingClientId(null);
                router.push(
                  `/appointments?prefillClient=${encodeURIComponent(id)}`,
                );
              }}
              onRequestDelete={(id) => setConfirm({ kind: "client", id })}
            />
          )}
        </section>
      </div>
    </main>
  );
}
