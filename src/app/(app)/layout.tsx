"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { AppDialogs } from "@/features/app/AppDialogs";
import { DashboardTeacherProvider } from "@/features/app/DashboardTeacherContext";
import { ServiceAppProvider } from "@/features/app/ServiceAppProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardTeacherProvider>
      <ServiceAppProvider>
        <AppShell>
          <AppDialogs />
          {children}
        </AppShell>
      </ServiceAppProvider>
    </DashboardTeacherProvider>
  );
}
