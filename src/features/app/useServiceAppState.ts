"use client";

import { useEffect, useMemo, useState } from "react";

import { appPageTitle, heUi, resolveVerticalPresetFromSettings } from "@/config";
import { useToast } from "@/components/ui";
import { DEMO_SETTINGS, buildDemoDataset } from "@/core/demo/demoSeed";
import { isDemoModeActive, setDemoModeActive } from "@/core/demo/demoMode";
import {
  loadFirstRunOnboardingState,
  saveFirstRunOnboardingState,
} from "@/core/onboarding/firstRun";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import { isPaidStatus } from "@/core/utils/insights";
import {
  filterAppointments,
  matchesClientSearch,
  sortAppointments,
  type AppointmentSort,
  type PaymentFilter,
} from "@/core/utils/appointmentFilters";
import type { AppointmentDateFilter } from "@/core/utils/dateRange";
import type { AppointmentRecord } from "@/core/types/appointment";
import { buildWhatsAppHref } from "@/core/utils/whatsapp";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useAvailabilitySettings } from "@/features/booking/hooks/useAvailabilitySettings";
import { useClients } from "@/features/clients/hooks/useClients";
import type { NewClientInput } from "@/features/clients/hooks/useClients";
import { useSettings } from "@/features/settings/hooks/useSettings";

function togglePaymentStatus(current: PaymentStatus): PaymentStatus {
  return isPaidStatus(current) ? PaymentStatus.Unpaid : PaymentStatus.Paid;
}

function isPendingPublicApproval(customFields: Record<string, unknown>): boolean {
  return (
    customFields.bookingSource === "public" &&
    customFields.bookingApproval === "pending"
  );
}

function formatAppointmentDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function useServiceAppState() {
  const toast = useToast();
  const {
    settings,
    isReady: settingsReady,
    replaceSettings,
    loadError: settingsLoadError,
    syncError: settingsSyncError,
    retryLoad: retrySettingsLoad,
    retrySync: retrySettingsSync,
  } = useSettings();
  const preset = useMemo(
    () => resolveVerticalPresetFromSettings(settings),
    [settings],
  );
  const {
    settings: availabilitySettings,
    isReady: availabilityReady,
    updateSettings: updateAvailabilitySettings,
    resetSettings: resetAvailabilitySettings,
    loadError: availabilityLoadError,
    syncError: availabilitySyncError,
    retryLoad: retryAvailabilityLoad,
    retrySync: retryAvailabilitySync,
  } = useAvailabilitySettings();
  const {
    sortedClients,
    addClient,
    updateClient,
    deleteClient,
    replaceClients,
    isReady: clientsReady,
    loadError: clientsLoadError,
    syncError: clientsSyncError,
    retryLoad: retryClientsLoad,
    retrySync: retryClientsSync,
  } = useClients();
  const {
    sortedAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    deleteAppointmentsForClient,
    replaceAppointments,
    isReady: appointmentsReady,
    loadError: appointmentsLoadError,
    syncError: appointmentsSyncError,
    retryLoad: retryAppointmentsLoad,
    retrySync: retryAppointmentsSync,
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

  const dataReady =
    clientsReady &&
    appointmentsReady &&
    settingsReady &&
    availabilityReady;
  const hasDataLoadFailure =
    clientsLoadError != null ||
    appointmentsLoadError != null ||
    settingsLoadError != null ||
    availabilityLoadError != null;
  const isStorageEmpty =
    dataReady &&
    !hasDataLoadFailure &&
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
    sortedClients.length > 0 &&
    sortedAppointments.length > 0 &&
    remindersReviewed;
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
          (a) =>
            a.id === editingAppointmentId && a.clientId === deletedClientId,
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

  function handleApprovePublicBooking(id: string): void {
    const row = sortedAppointments.find((a) => a.id === id);
    if (!row) return;
    if (!isPendingPublicApproval(row.customFields)) return;
    updateAppointment(id, {
      // Keep DB-compatible lesson status; approval state is tracked in customFields.
      status: row.status,
      customFields: {
        ...row.customFields,
        bookingApproval: "approved",
      },
    });
    toast(heUi.toast.bookingApproved);
  }

  function handleApproveAndSendPublicBookingWhatsapp(id: string): void {
    const row = sortedAppointments.find((a) => a.id === id);
    if (!row) return;
    if (!isPendingPublicApproval(row.customFields)) return;
    updateAppointment(id, {
      // Keep DB-compatible lesson status; approval state is tracked in customFields.
      status: row.status,
      customFields: {
        ...row.customFields,
        bookingApproval: "approved",
      },
    });
    openApprovalWhatsapp(row);
    toast(heUi.toast.bookingApproved);
  }

  function handleRejectPublicBooking(id: string): void {
    const row = sortedAppointments.find((a) => a.id === id);
    if (!row) return;
    if (!isPendingPublicApproval(row.customFields)) return;
    updateAppointment(id, {
      status: AppointmentStatus.Cancelled,
      customFields: {
        ...row.customFields,
        bookingApproval: "rejected",
      },
    });
    toast(heUi.toast.bookingRejected);
  }

  function handleClientSubmit(data: NewClientInput): boolean {
    if (editingClientId) {
      updateClient(editingClientId, data);
      setEditingClientId(null);
      toast(heUi.toast.clientUpdated);
      return true;
    }
    const row = addClient(data);
    if (!row) {
      toast(heUi.toast.actionFailed, "error");
      return false;
    }
    toast(heUi.toast.clientCreated);
    return true;
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

  function handleRequestLoadDemo(): void {
    if (!dataReady) return;
    if (hasAnyData) {
      setDemoLoadOpen(true);
      return;
    }
    loadDemo();
  }

  function openApprovalWhatsapp(row: AppointmentRecord): void {
    const client = sortedClients.find((c) => c.id === row.clientId);
    if (!client) return;
    const baseHref = buildWhatsAppHref(client.phone);
    if (!baseHref) return;
    const message = heUi.appointments.approvalWhatsappText({
      name: client.fullName.trim() || "לקוח",
      dateTime: formatAppointmentDateTime(row.startAt),
    });
    const sep = baseHref.includes("?") ? "&" : "?";
    const href = `${baseHref}${sep}text=${encodeURIComponent(message)}`;
    if (typeof window !== "undefined") {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }

  return {
    preset,
    settings,
    settingsReady,
    replaceSettings,
    settingsLoadError,
    settingsSyncError,
    retrySettingsLoad,
    retrySettingsSync,
    availabilitySettings,
    updateAvailabilitySettings,
    resetAvailabilitySettings,
    availabilityReady,
    availabilityLoadError,
    availabilitySyncError,
    retryAvailabilityLoad,
    retryAvailabilitySync,
    sortedClients,
    addClient,
    updateClient,
    deleteClient,
    replaceClients,
    clientsReady,
    clientsLoadError,
    clientsSyncError,
    retryClientsLoad,
    retryClientsSync,
    sortedAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    deleteAppointmentsForClient,
    replaceAppointments,
    appointmentsReady,
    appointmentsLoadError,
    appointmentsSyncError,
    retryAppointmentsLoad,
    retryAppointmentsSync,
    hasDataLoadFailure,
    clientSearch,
    setClientSearch,
    dateFilter,
    setDateFilter,
    paymentFilter,
    setPaymentFilter,
    appointmentSort,
    setAppointmentSort,
    editingClientId,
    setEditingClientId,
    editingAppointmentId,
    setEditingAppointmentId,
    appointmentPrefillClientId,
    setAppointmentPrefillClientId,
    confirm,
    setConfirm,
    demoResetOpen,
    setDemoResetOpen,
    demoLoadOpen,
    setDemoLoadOpen,
    demoActive,
    setDemoActive,
    onboardingDismissed,
    setOnboardingDismissed,
    remindersReviewed,
    setRemindersReviewed,
    referenceDate,
    filteredClients,
    filteredAppointments,
    editingClient,
    editingAppointment,
    dataReady,
    isStorageEmpty,
    hasAnyData,
    displayTitle,
    onboardingCompleted,
    needsFirstClient,
    needsFirstAppointment,
    handleConfirmDelete,
    handleToggleAppointmentPaid,
    handleApprovePublicBooking,
    handleApproveAndSendPublicBookingWhatsapp,
    handleRejectPublicBooking,
    handleClientSubmit,
    loadDemo,
    resetData,
    handleRequestLoadDemo,
    handleConfirmDemoReset: () => {
      resetData();
      setDemoResetOpen(false);
    },
    handleConfirmDemoLoad: () => {
      setDemoLoadOpen(false);
      loadDemo();
    },
  };
}
