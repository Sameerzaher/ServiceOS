"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

import type { ServiceStorage } from "./types";
import { localStorageAdapter } from "./localStorageAdapter";

const StorageContext = createContext<ServiceStorage | null>(null);

export function StorageProvider({
  children,
  storage = localStorageAdapter,
}: {
  children: ReactNode;
  /** Inject mock or API-backed adapter in tests / future. */
  storage?: ServiceStorage;
}) {
  const value = useMemo(() => storage, [storage]);
  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
}

export function useServiceStorage(): ServiceStorage {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("useServiceStorage must be used within StorageProvider");
  }
  return ctx;
}
