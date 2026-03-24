"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui";
import { StorageProvider } from "@/core/storage";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <StorageProvider>
      <ToastProvider>{children}</ToastProvider>
    </StorageProvider>
  );
}
