"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { AppDialogs } from "@/features/app/AppDialogs";
import { ServiceAppProvider } from "@/features/app/ServiceAppProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ServiceAppProvider>
      <AppShell>
        <AppDialogs />
        {children}
      </AppShell>
    </ServiceAppProvider>
  );
}
