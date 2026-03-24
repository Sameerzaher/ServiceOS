"use client";

import { useEffect } from "react";

import { heUi } from "@/config";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = heUi.dialog.confirm,
  cancelLabel = heUi.dialog.cancel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/40"
        aria-label={heUi.dialog.backdropClose}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-neutral-200 bg-white p-5 shadow-lg",
        )}
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-neutral-900"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
