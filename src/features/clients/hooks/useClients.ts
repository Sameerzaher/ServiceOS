"use client";

import { useEffect, useMemo, useState } from "react";

import type { Client, ClientId } from "@/core/types/client";
import { useServiceStorage } from "@/core/storage";
import { createId } from "@/core/utils/ids";

export type NewClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;

export type ClientPatch = Partial<Omit<Client, "id" | "createdAt">>;

export interface UseClientsResult {
  clients: Client[];
  /** Clients sorted by `fullName` (Hebrew locale). */
  sortedClients: Client[];
  isReady: boolean;
  addClient: (input: NewClientInput) => Client | null;
  updateClient: (id: ClientId, patch: ClientPatch) => void;
  deleteClient: (id: ClientId) => void;
  /** Replace entire list (demo seed / reset). */
  replaceClients: (next: Client[]) => void;
}

export function useClients(): UseClientsResult {
  const storage = useServiceStorage();
  const [clients, setClients] = useState<Client[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setClients(storage.loadClients());
    setIsReady(true);
  }, [storage]);

  useEffect(() => {
    if (!isReady) return;
    storage.persistClients(clients);
  }, [clients, isReady, storage]);

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
    addClient,
    updateClient,
    deleteClient,
    replaceClients,
  };
}
