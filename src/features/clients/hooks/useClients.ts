"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";

import { heUi } from "@/config";
import type { Client, ClientId } from "@/core/types/client";
import { isSupabaseConfigured, useServiceStorage } from "@/core/storage";
import { createId } from "@/core/utils/ids";

export type NewClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;

export type ClientPatch = Partial<Omit<Client, "id" | "createdAt">>;

export interface UseClientsResult {
  clients: Client[];
  /** Clients sorted by `fullName` (Hebrew locale). */
  sortedClients: Client[];
  isReady: boolean;
  loadError: string | null;
  syncError: string | null;
  retryLoad: () => void;
  retrySync: () => void;
  addClient: (input: NewClientInput) => Client | null;
  updateClient: (id: ClientId, patch: ClientPatch) => void;
  deleteClient: (id: ClientId) => void;
  /** Replace entire list (demo seed / reset). */
  replaceClients: (next: Client[]) => void;
}

export function useClients(): UseClientsResult {
  const storage = useServiceStorage();
  const remote = isSupabaseConfigured();
  const skipPersistAfterRemoteLoadRef = useRef(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    void (async () => {
      try {
        const rows = await storage.loadClients();
        if (!cancelled) {
          setClients(rows);
          if (remote) skipPersistAfterRemoteLoadRef.current = true;
        }
      } catch (e) {
        console.error("[ServiceOS] useClients load", e);
        if (!cancelled) setLoadError(heUi.data.loadFailedTitle);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storage, loadKey, remote]);

  useEffect(() => {
    if (!isReady) return;
    if (remote && skipPersistAfterRemoteLoadRef.current) {
      skipPersistAfterRemoteLoadRef.current = false;
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await storage.persistClients(clients);
        if (cancelled) return;
        setSyncError(null);
        if (remote) {
          skipPersistAfterRemoteLoadRef.current = true;
          const rows = await storage.loadClients();
          if (!cancelled) setClients(rows);
        }
      } catch (e) {
        console.error("[ServiceOS] useClients persist", e);
        if (!cancelled) setSyncError(heUi.data.syncFailedTitle);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clients, isReady, remote, storage]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setIsReady(false);
    setLoadKey((k) => k + 1);
  }, []);

  const retrySync = useCallback(() => {
    setSyncError(null);
    void (async () => {
      try {
        await storage.persistClients(clients);
        setSyncError(null);
        if (remote) {
          skipPersistAfterRemoteLoadRef.current = true;
          const rows = await storage.loadClients();
          setClients(rows);
        }
      } catch (e) {
        console.error("[ServiceOS] useClients retrySync", e);
        setSyncError(heUi.data.syncFailedTitle);
      }
    });
  }, [clients, remote, storage]);

  function addClient(input: NewClientInput): Client | null {
    const id = createId();
    if (!id) return null;

    const now = new Date().toISOString();
    const client: Client = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };

    setClients((prev) => [...prev, client]);
    return client;
  }

  function updateClient(id: ClientId, patch: ClientPatch): void {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== id) return client;
        return {
          ...client,
          ...patch,
          id: client.id,
          createdAt: client.createdAt,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function deleteClient(id: ClientId): void {
    setClients((prev) => prev.filter((client) => client.id !== id));
  }

  function replaceClients(next: Client[]): void {
    setClients(next);
  }

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) =>
        a.fullName.localeCompare(b.fullName, "he", { sensitivity: "base" }),
      ),
    [clients],
  );

  return {
    clients,
    sortedClients,
    isReady,
    loadError,
    syncError,
    retryLoad,
    retrySync,
    addClient,
    updateClient,
    deleteClient,
    replaceClients,
  };
}
