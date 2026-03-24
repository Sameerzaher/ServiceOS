"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui";
import { StorageProvider, StorageBootstrapNotifier } from "@/core/storage";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <StorageProvider>
        <StorageBootstrapNotifier />
        {children}
      </StorageProvider>
    </ToastProvider>
  );
}
