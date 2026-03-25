"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

import type { ServiceStorage } from "@/core/types/serviceStorage";

import { createServiceStorage } from "./createServiceStorage";

const StorageContext = createContext<ServiceStorage | null>(null);

export function StorageProvider({
  children,
  storage: storageProp,
}: {
  children: ReactNode;
  /** Inject mock or alternate adapter in tests. */
  storage?: ServiceStorage;
}) {
  const storage = useMemo(
    () => storageProp ?? createServiceStorage(),
    [storageProp],
  );

  return (
    <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>
  );
}

export function useServiceStorage(): ServiceStorage {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("useServiceStorage must be used within StorageProvider");
  }
  return ctx;
}
