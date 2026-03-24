"use client";

import { useRef, useState } from "react";

import { heUi } from "@/config";
import { Button, ConfirmDialog, ui, useToast } from "@/components/ui";
import {
  buildBackupPayload,
  downloadBackupFile,
  parseAndValidateBackup,
  type AppBackupPayload,
  type BackupErrorKey,
} from "@/core/backup";
import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import type { AppSettings } from "@/core/types/settings";
import { cn } from "@/lib/cn";

export interface BackupRestoreSectionProps {
  clients: readonly Client[];
  appointments: readonly AppointmentRecord[];
  settings: AppSettings;
  replaceClients: (next: Client[]) => void;
  replaceAppointments: (next: AppointmentRecord[]) => void;
  replaceSettings: (next: AppSettings) => void;
  onAfterRestore?: () => void;
}

function messageForBackupError(key: BackupErrorKey): string {
  return heUi.backup.errors[key];
}

export function BackupRestoreSection({
  clients,
  appointments,
  settings,
  replaceClients,
  replaceAppointments,
  replaceSettings,
  onAfterRestore,
}: BackupRestoreSectionProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<AppBackupPayload | null>(
    null,
  );

  function handleExport(): void {
    const payload = buildBackupPayload(clients, appointments, settings);
    downloadBackupFile(payload);
    toast(heUi.toast.backupExported);
  }

  function handleImportButtonClick(): void {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const parsed: unknown = JSON.parse(text);
        const result = parseAndValidateBackup(parsed);
        if (!result.ok) {
          toast(messageForBackupError(result.errorKey), "error");
          return;
        }
        setPendingPayload(result.data);
        setImportConfirmOpen(true);
      } catch {
        toast(heUi.backup.errors.parseJson, "error");
      } finally {
        input.value = "";
      }
    };
    reader.onerror = () => {
      toast(heUi.backup.errors.parseJson, "error");
      input.value = "";
    };
    reader.readAsText(file);
  }

  function handleConfirmRestore(): void {
    if (!pendingPayload) return;
    replaceClients(pendingPayload.clients);
    replaceAppointments(pendingPayload.appointments);
    replaceSettings(pendingPayload.settings);
    onAfterRestore?.();
    toast(heUi.toast.backupRestored);
    setPendingPayload(null);
    setImportConfirmOpen(false);
  }

  function handleCancelImport(): void {
    setImportConfirmOpen(false);
    setPendingPayload(null);
  }

  return (
    <>
      <ConfirmDialog
        open={importConfirmOpen}
        title={heUi.backup.importConfirmTitle}
        message={heUi.backup.importConfirmMessage}
        confirmLabel={heUi.backup.confirmRestore}
        confirmVariant="danger"
        onConfirm={handleConfirmRestore}
        onCancel={handleCancelImport}
      />

      <div
        className={cn(
          ui.formCard,
          "mt-6 space-y-4 border-t border-neutral-200 pt-6",
        )}
      >
        <div>
          <h3 className="text-base font-semibold text-neutral-900">
            {heUi.backup.sectionTitle}
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            {heUi.backup.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handleExport}>
            {heUi.backup.export}
          </Button>
          <Button type="button" variant="secondary" onClick={handleImportButtonClick}>
            {heUi.backup.import}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label={heUi.backup.import}
            onChange={handleFileChange}
          />
        </div>
        <p className="text-xs text-neutral-500">{heUi.backup.importHint}</p>
      </div>
    </>
  );
}
