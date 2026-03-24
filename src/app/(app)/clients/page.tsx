"use client";

import { useRouter } from "next/navigation";

import {
  appPageTitle,
  heUi,
} from "@/config";
import { LoadingState, ui } from "@/components/ui";
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

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={ui.pageSubtitle}>{preset.labels.students}</p>
      </header>

      <div className={ui.pageStack}>
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
